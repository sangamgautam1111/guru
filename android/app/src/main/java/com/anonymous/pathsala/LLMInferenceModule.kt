package com.anonymous.pathsala

import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.InputData
import com.google.ai.edge.litertlm.LogSeverity
import com.google.ai.edge.litertlm.ResponseCallback
import com.google.ai.edge.litertlm.SamplerConfig
import com.google.ai.edge.litertlm.Session
import com.google.ai.edge.litertlm.SessionConfig
import java.io.File
import java.util.concurrent.CancellationException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

// PathSala - Offline AI Tutor Native Bridge
// Built for low-connectivity regions (Nepal) using Google AI Edge LiteRT-LM & Gemma 4.
//
// This Kotlin React Native module acts as the low-level JNI wrapper around LiteRT-LM.
// It manages model loading into RAM, dynamic token allocation based on device memory,
// thread-safe streaming generation, and real-time loop detection for 4-bit quantized models.

class LLMInferenceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // Volatile engine references to handle thread safety across React Native background workers
    @Volatile private var engine: Engine? = null
    @Volatile private var loadedModelPath: String? = null
    @Volatile private var activeSession: Session? = null
    @Volatile private var activeRequestId: String? = null
    
    // Dedicated single-thread worker queue so heavy C++ inference calls don't freeze the Android UI thread
    private val worker: ExecutorService = Executors.newSingleThreadExecutor()
    private val tag = "LLMInferenceModule"
    private val isNativeGenerating = AtomicBoolean(false)

    companion object {
        private const val chunkEvent = "LiteRTResponseChunk"
        private const val doneEvent = "LiteRTResponseDone"
        private const val errorEvent = "LiteRTResponseError"
        private const val maxHistoryMessages = 8 // Window size for context to prevent memory spill on low-RAM phones
    }

    override fun getName(): String = "LLMInferenceModule"

    /**
     * Dynamically calculates max token context budget based on device RAM.
     * Rural budget devices in Nepal (e.g. 4GB RAM Oppo A18) get a 1024 token limit to prevent Out-Of-Memory (OOM) crashes,
     * while higher-end devices (8GB+ RAM) get up to 2048 tokens.
     */
    private fun getMaxModelTokens(): Int {
        val activityManager = reactApplicationContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
        val memInfo = android.app.ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memInfo)
        val totalRamGb = memInfo.totalMem / (1024L * 1024L * 1024L)
        return when {
            totalRamGb >= 8 -> 2048
            totalRamGb >= 6 -> 1536
            else -> 1024 // Safe budget for 3GB/4GB Android devices
        }
    }

    /**
     * Safely teardown active inference session and C++ LiteRT engine handles.
     */
    private fun closeSession() {
        try {
            activeSession?.cancelProcess()
        } catch (error: Exception) {
            Log.w(tag, "Failed to cancel active LiteRT-LM session", error)
        }

        try {
            activeSession?.close()
        } catch (error: Exception) {
            Log.w(tag, "Failed to close active LiteRT-LM session", error)
        } finally {
            activeSession = null
            activeRequestId = null
            isNativeGenerating.set(false)
        }

        try {
            engine?.close()
        } catch (error: Exception) {
            Log.w(tag, "Failed to close LiteRT-LM engine", error)
        } finally {
            engine = null
            loadedModelPath = null
        }
    }

    private fun emitGenerationEvent(eventName: String, requestId: String, text: String? = null, error: String? = null) {
        if (!reactApplicationContext.hasActiveReactInstance()) {
            return
        }

        val payload = Arguments.createMap().apply {
            putString("requestId", requestId)
            text?.let { putString("text", it) }
            error?.let { putString("error", it) }
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, payload)
    }

    private fun buildSystemInstruction(language: String, isMathRequest: Boolean): String {
        val languageRule = if (language.equals("NE", ignoreCase = true)) {
            "Answer only in Nepali script. Do not switch to English unless the user explicitly asks for English."
        } else {
            "Answer only in English. Never answer in Nepali, even if the question includes Nepali words or script. Translate internally and reply in English only."
        }

        return if (isMathRequest) """
You are PathSala, a clear and careful math tutor for school students in Nepal.

$languageRule

For every math or numerical answer:
- Use the previous chat messages to understand follow-up words like "this", "that", "same", "again", or "why".
- If the latest question is new and complete, solve that latest question directly.
- Solve only the latest question.
- Give the final answer near the top.
- Then explain with short numbered steps.
- Keep the explanation text on the same line as 1. 2. or 3.
- Put each equation on its own line.
- Use Check: at most once.
- Keep the numbers from the question exactly correct.
- Never say "wait", "let me recheck", or reveal hidden thinking.
- Do not repeat lines, headings, or closing phrases.
- Do not ask for the question if the question is already present.
- Do not stop in the middle of the solution.
- When useful, end with one short follow-up offer, like asking if the student wants another example or a Nepali/English explanation.
""".trimIndent() else """
You are PathSala, a helpful school tutor for students in Nepal.

$languageRule

General style:
- Sound like a kind human teacher.
- If the student asks your name, answer exactly: "My name is PathSala."
- For greetings or casual chat, reply in 1 or 2 plain sentences only.
- For a new clear question, answer that new question directly instead of continuing the previous one.
- Use earlier chat to understand the topic, pronouns, and follow-ups like "this", "that", "same", "again", "why", "how", or "in Nepali".
- If the latest message is a follow-up, continue the same topic naturally without asking the student to repeat it.
- Write with proper spacing and complete sentences.
- Do not repeat the same sentence, clause, or closing line.
- Do not start with labels like "Answer", "Response", or "Explanation".
- For educational questions, end with one short helpful follow-up question or offer.
- Do not add a follow-up question for greetings, name questions, or very short casual chat.

For science, social studies, and computer questions:
- Answer the exact question first.
- Use 2 or 3 short paragraphs.
- Keep the information correct and school-level.
- Do not use headings or bullets unless the user asks for notes.

For language and grammar questions:
- Give the exact answer on the first line.
- Then add only 1 or 2 short explanation lines.
""".trimIndent()
    }

    /**
     * Precision-tuned sampling parameters per domain:
     * - Math requests use ultra-low temperature (0.08) and small Top-K (4) for precise, deterministic step calculations.
     * - Nepali & English general queries use temperature 0.18 for natural teacher-like conversational flow without hallucinating.
     */
    private fun createSamplerConfig(language: String, isMathRequest: Boolean): SamplerConfig {
        return when {
            isMathRequest -> SamplerConfig(
                topK = 4,
                topP = 0.85,
                temperature = 0.08,
                seed = 1,
            )

            language.equals("NE", ignoreCase = true) -> SamplerConfig(
                topK = 20,
                topP = 0.9,
                temperature = 0.18,
                seed = 1,
            )

            else -> SamplerConfig(
                topK = 18,
                topP = 0.9,
                temperature = 0.18,
                seed = 1,
            )
        }
    }

    /**
     * LiteRT-LM streaming callbacks can sometimes output cumulative or overlapping string chunks.
     * This function detects character-level overlaps and merges incoming tokens seamlessly.
     */
    private fun mergeChunk(currentText: String, nextChunk: String): String {
        if (nextChunk.isBlank()) return currentText
        if (currentText.isBlank()) return nextChunk
        if (nextChunk.startsWith(currentText)) return nextChunk
        if (currentText.endsWith(nextChunk)) return currentText

        val maxOverlap = minOf(currentText.length, nextChunk.length)
        for (overlapSize in maxOverlap downTo 8) {
            if (currentText.takeLast(overlapSize) == nextChunk.take(overlapSize)) {
                return currentText + nextChunk.drop(overlapSize)
            }
        }

        return currentText + nextChunk
    }

    private fun buildEffectivePrompt(prompt: String, language: String, isMathRequest: Boolean, history: ReadableArray): String {
        val conversation = createPromptWithHistory(prompt, history)
        return listOf(
            buildSystemInstruction(language, isMathRequest),
            "Use the conversation below as memory. The latest User message is the main question. Earlier messages are context only, unless the latest message is clearly a follow-up.",
            conversation,
            "Assistant:"
        ).joinToString("\n\n").trim()
    }

    /**
     * Cleans up unwanted markdown artifacts, duplicate headings, or redundant "Check:" lines before showing the user.
     */
    private fun sanitizeFinalOutput(text: String, isMathRequest: Boolean): String {
        val trimmed = text.trim()
        if (trimmed.isBlank()) {
            return trimmed
        }

        val lines = trimmed.lines()
        val cleanedLines = mutableListOf<String>()
        var checkSeen = false
        var previousNormalized = ""

        for (line in lines) {
            val normalized = line.trim().lowercase()

            if (isMathRequest && normalized == "check:") {
                if (checkSeen) {
                    continue
                }
                checkSeen = true
            }

            if (normalized.isNotBlank() && normalized == previousNormalized) {
                continue
            }

            cleanedLines += line.trimEnd()
            if (normalized.isNotBlank()) {
                previousNormalized = normalized
            }
        }

        return cleanedLines.joinToString("\n")
            .replace(Regex("\n{3,}"), "\n\n")
            .replace(Regex("^(?:#\\s*)?(?:answer|response|reply|explanation)\\s*:?\\s*", RegexOption.IGNORE_CASE), "")
            .trim()
    }

    /**
     * Loop Guard Algorithm:
     * 4-bit INT4 quantized LLMs running locally can occasionally enter infinite repetition loops
     * when generating long explanations. This algorithm inspects token n-grams in real-time
     * and forcibly halts generation if a phrase repeats >= 5 times, preventing battery drain and UI lockups.
     */
    private fun hasRunawayRepetition(text: String): Boolean {
        if (text.length < 700) {
            return false
        }

        val normalizedLines = text
            .lowercase()
            .lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }

        if (normalizedLines.size >= 5) {
            val lastLine = normalizedLines.last()
            if (lastLine.length >= 18 && normalizedLines.takeLast(5).all { it == lastLine }) {
                return true
            }
        }

        val normalizedWords = text
            .lowercase()
            .replace(Regex("[^\\p{L}\\p{N}\\s]"), " ")
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }

        if (normalizedWords.size < 40) {
            return false
        }

        for (phraseSize in 2..8) {
            val repeatsNeeded = if (phraseSize <= 3) 6 else 5
            val requiredWords = phraseSize * repeatsNeeded
            if (normalizedWords.size < requiredWords) {
                continue
            }

            val suffix = normalizedWords.takeLast(phraseSize)
            val phraseText = suffix.joinToString(" ")
            if (phraseText.length < 12) {
                continue
            }

            var repeats = 1
            while (repeats < repeatsNeeded) {
                val start = normalizedWords.size - phraseSize * (repeats + 1)
                if (start < 0) {
                    break
                }

                val candidate = normalizedWords.subList(start, start + phraseSize)
                if (candidate == suffix) {
                    repeats += 1
                } else {
                    break
                }
            }

            if (repeats >= repeatsNeeded) {
                return true
            }
        }

        return false
    }

    private fun createPromptWithHistory(prompt: String, history: ReadableArray): String {
        val trimmedPrompt = prompt.trim()
        if (history.size() == 0) {
            return "User: $trimmedPrompt"
        }

        val parts = mutableListOf<String>()
        val startIndex = maxOf(0, history.size() - maxHistoryMessages)

        for (index in startIndex until history.size()) {
            val item = history.getMap(index) ?: continue
            val text = item.getString("text")?.trim().orEmpty()
            if (text.isBlank()) {
                continue
            }

            val isUser = item.getBoolean("isUser")
            parts += if (isUser) "User: $text" else "Assistant: $text"
        }

        parts += "User: $trimmedPrompt"
        return parts.joinToString("\n")
    }

    private fun ensureNativeLibraryLoaded() {
        try {
            System.loadLibrary("litertlm_jni")
        } catch (error: UnsatisfiedLinkError) {
            Log.d(tag, "LiteRT-LM native library already loaded or unavailable", error)
        }
    }

    @ReactMethod
    fun initModel(modelPath: String, promise: Promise) {
        worker.execute {
            try {
                val resolvedPath = if (modelPath.startsWith("file://")) {
                    Uri.parse(modelPath).path
                } else {
                    modelPath
                }

                if (resolvedPath.isNullOrBlank()) {
                    promise.reject("MODEL_ERROR", "Invalid LiteRT-LM model path: $modelPath")
                    return@execute
                }

                val modelFile = File(resolvedPath)
                if (!modelFile.exists()) {
                    promise.reject("MODEL_ERROR", "Offline LiteRT-LM model not found at path: $resolvedPath")
                    return@execute
                }

                closeSession()
                ensureNativeLibraryLoaded()
                Engine.setNativeMinLogSeverity(LogSeverity.ERROR)

                val maxTokens = getMaxModelTokens()
                Log.d(tag, "Creating LiteRT-LM Engine with direct Session API, maxTokens=$maxTokens")

                val engineConfig = EngineConfig(
                    modelPath = resolvedPath,
                    backend = Backend.CPU(),
                    maxNumTokens = maxTokens,
                    cacheDir = reactApplicationContext.cacheDir.absolutePath,
                )

                val nextEngine = Engine(engineConfig)
                nextEngine.initialize()

                val verifySession = nextEngine.createSession(
                    SessionConfig(SamplerConfig(topK = 1, topP = 0.9, temperature = 0.1, seed = 1))
                )
                verifySession.close()

                engine = nextEngine
                loadedModelPath = resolvedPath

                promise.resolve(true)
            } catch (error: Exception) {
                Log.e(tag, "Failed to initialize LiteRT-LM inference", error)
                closeSession()
                promise.reject("INIT_ERROR", error.message, error)
            }
        }
    }

    @ReactMethod
    fun isModelLoaded(promise: Promise) {
        promise.resolve(engine != null && !loadedModelPath.isNullOrBlank())
    }

    @ReactMethod
    fun generateResponse(
        prompt: String,
        language: String,
        isMathRequest: Boolean,
        history: ReadableArray,
        requestId: String,
        imagePathOrBase64: String,
        promise: Promise
    ) {
        worker.execute {
            if (!isNativeGenerating.compareAndSet(false, true)) {
                promise.reject("GENERATION_BUSY", "A generation is already in progress. Please wait.")
                return@execute
            }

            val activeEngine = engine
            if (activeEngine == null) {
                isNativeGenerating.set(false)
                promise.reject("NOT_INITIALIZED", "LiteRT-LM engine is not initialized yet.")
                return@execute
            }

            var localSession: Session? = null

            try {
                if (imagePathOrBase64.isNotBlank()) {
                    throw IllegalStateException("Image input is disabled in this build. Please attach a text file or type the question.")
                }

                val effectivePrompt = buildEffectivePrompt(prompt, language, isMathRequest, history)
                val responseBuilder = StringBuilder()
                val loopGuardTriggered = AtomicBoolean(false)
                val completionLatch = CountDownLatch(1)
                val completionHandled = AtomicBoolean(false)
                var callbackError: Throwable? = null

                localSession = activeEngine.createSession(
                    SessionConfig(createSamplerConfig(language, isMathRequest))
                )
                activeSession = localSession
                activeRequestId = requestId

                fun finishSuccess(finalText: String) {
                    if (completionHandled.compareAndSet(false, true)) {
                        val sanitizedText = sanitizeFinalOutput(finalText, isMathRequest)
                        emitGenerationEvent(doneEvent, requestId, sanitizedText)
                        completionLatch.countDown()
                    }
                }

                fun finishError(throwable: Throwable) {
                    if (completionHandled.compareAndSet(false, true)) {
                        callbackError = throwable
                        emitGenerationEvent(errorEvent, requestId, error = throwable.message ?: "LiteRT-LM generation failed.")
                        completionLatch.countDown()
                    }
                }

                val callback = object : ResponseCallback {
                    override fun onNext(response: String) {
                        if (completionHandled.get() || response.isBlank()) {
                            return
                        }

                        synchronized(responseBuilder) {
                            val mergedText = mergeChunk(responseBuilder.toString(), response)

                            if (hasRunawayRepetition(mergedText)) {
                                val stableText = responseBuilder.toString().ifBlank { mergedText }.trim()
                                loopGuardTriggered.set(true)
                                responseBuilder.clear()
                                responseBuilder.append(stableText)
                                emitGenerationEvent(chunkEvent, requestId, stableText)
                                try {
                                    localSession?.cancelProcess()
                                } catch (error: Exception) {
                                    Log.w(tag, "Loop guard cancel failed", error)
                                }
                                finishSuccess(stableText)
                                return
                            }

                            responseBuilder.clear()
                            responseBuilder.append(mergedText)
                            emitGenerationEvent(chunkEvent, requestId, mergedText)
                        }
                    }

                    override fun onDone() {
                        val finalText = synchronized(responseBuilder) { responseBuilder.toString() }
                        finishSuccess(finalText)
                    }

                    override fun onError(throwable: Throwable) {
                        if (loopGuardTriggered.get()) {
                            finishSuccess(synchronized(responseBuilder) { responseBuilder.toString() })
                            return
                        }
                        finishError(throwable)
                    }
                }

                localSession.generateContentStream(
                    listOf(InputData.Text(effectivePrompt)),
                    callback
                )

                if (!completionLatch.await(10, TimeUnit.MINUTES)) {
                    localSession.cancelProcess()
                    throw IllegalStateException("LiteRT-LM response timed out.")
                }

                callbackError?.let { throw it }

                val finalText = synchronized(responseBuilder) { responseBuilder.toString().trim() }
                promise.resolve(sanitizeFinalOutput(finalText, isMathRequest))
            } catch (error: Throwable) {
                Log.e(tag, "Error generating LiteRT-LM response", error)
                emitGenerationEvent(errorEvent, requestId, error = error.message ?: "LiteRT-LM generation failed.")
                if (error is CancellationException) {
                    promise.reject("INFERENCE_CANCELED", error.message ?: "Generation canceled.", error)
                } else {
                    promise.reject("INFERENCE_ERROR", error.message, error)
                }
            } finally {
                if (activeRequestId == requestId) {
                    activeRequestId = null
                    activeSession = null
                }

                try {
                    localSession?.close()
                } catch (closeError: Exception) {
                    Log.w(tag, "Failed to close temporary LiteRT-LM session", closeError)
                }

                isNativeGenerating.set(false)
            }
        }
    }

    @ReactMethod
    fun cancelGeneration(promise: Promise) {
        val currentSession = activeSession
        if (currentSession == null || activeRequestId == null) {
            promise.resolve(false)
            return
        }

        try {
            currentSession.cancelProcess()
        } catch (error: Exception) {
            Log.w(tag, "cancelGeneration() threw because generation may have already finished", error)
        }

        promise.resolve(true)
    }

    override fun invalidate() {
        worker.shutdown()
        try {
            worker.awaitTermination(3, TimeUnit.SECONDS)
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
        }
        closeSession()
        super.invalidate()
    }
}
