package com.anonymous.pathsala

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class ModelDownloadService : Service() {

    companion object {
        private const val TAG = "ModelDownloadService"
        const val CHANNEL_ID = "guru_ai_model_downloads"
        const val CHANNEL_NAME = "Guru Offline AI Downloads"
        const val NOTIFICATION_ID = 4040

        const val ACTION_START = "com.anonymous.pathsala.ACTION_START_DOWNLOAD"
        const val ACTION_STOP = "com.anonymous.pathsala.ACTION_STOP_DOWNLOAD"
        const val ACTION_UPDATE_PROGRESS = "com.anonymous.pathsala.ACTION_UPDATE_PROGRESS"
        const val ACTION_COMPLETE = "com.anonymous.pathsala.ACTION_COMPLETE_DOWNLOAD"
        const val ACTION_ERROR = "com.anonymous.pathsala.ACTION_ERROR_DOWNLOAD"

        const val EXTRA_MODEL_NAME = "extra_model_name"
        const val EXTRA_PERCENTAGE = "extra_percentage"
        const val EXTRA_SPEED = "extra_speed"
        const val EXTRA_ETA = "extra_eta"
        const val EXTRA_DOWNLOADED_MB = "extra_downloaded_mb"
        const val EXTRA_TOTAL_MB = "extra_total_mb"
        const val EXTRA_ERROR_MSG = "extra_error_msg"

        @Volatile
        var isServiceRunning = false
            private set

        fun start(context: Context) {
            try {
                val intent = Intent(context, ModelDownloadService::class.java).apply {
                    action = ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start ModelDownloadService: ${e.message}", e)
            }
        }

        fun updateProgress(
            context: Context,
            modelName: String,
            percentage: Int,
            speed: String,
            eta: String,
            downloadedMb: Long,
            totalMb: Long
        ) {
            try {
                val intent = Intent(context, ModelDownloadService::class.java).apply {
                    action = ACTION_UPDATE_PROGRESS
                    putExtra(EXTRA_MODEL_NAME, modelName)
                    putExtra(EXTRA_PERCENTAGE, percentage)
                    putExtra(EXTRA_SPEED, speed)
                    putExtra(EXTRA_ETA, eta)
                    putExtra(EXTRA_DOWNLOADED_MB, downloadedMb)
                    putExtra(EXTRA_TOTAL_MB, totalMb)
                }
                context.startService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update progress in ModelDownloadService: ${e.message}", e)
            }
        }

        fun complete(context: Context) {
            try {
                val intent = Intent(context, ModelDownloadService::class.java).apply {
                    action = ACTION_COMPLETE
                }
                context.startService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to complete ModelDownloadService: ${e.message}", e)
            }
        }

        fun error(context: Context, errorMsg: String) {
            try {
                val intent = Intent(context, ModelDownloadService::class.java).apply {
                    action = ACTION_ERROR
                    putExtra(EXTRA_ERROR_MSG, errorMsg)
                }
                context.startService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to error ModelDownloadService: ${e.message}", e)
            }
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, ModelDownloadService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to stop ModelDownloadService: ${e.message}", e)
            }
        }
    }

    private var notificationManager: NotificationManager? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        createNotificationChannel()

        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Guru:ModelDownloadWakeLock")?.apply {
                acquire(30 * 60 * 1000L)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not acquire WakeLock: ${e.message}")
        }
        isServiceRunning = true
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val initialNotification = buildNotification(
                    title = "Model is downloading (0%)",
                    text = "Initializing offline AI engines...",
                    percentage = 0,
                    isOngoing = true
                )
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(
                        NOTIFICATION_ID,
                        initialNotification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                    )
                } else {
                    startForeground(NOTIFICATION_ID, initialNotification)
                }
            }
            ACTION_UPDATE_PROGRESS -> {
                val modelName = intent.getStringExtra(EXTRA_MODEL_NAME) ?: "AI Model"
                val pct = intent.getIntExtra(EXTRA_PERCENTAGE, 0)
                val speed = intent.getStringExtra(EXTRA_SPEED) ?: "0 MB/s"
                val eta = intent.getStringExtra(EXTRA_ETA) ?: "--"
                val downloadedMb = intent.getLongExtra(EXTRA_DOWNLOADED_MB, 0L)
                val totalMb = intent.getLongExtra(EXTRA_TOTAL_MB, 2751L)

                val notif = buildNotification(
                    title = "Model is downloading $pct%",
                    text = "$modelName • $speed (ETA: $eta)",
                    subText = "$downloadedMb MB / $totalMb MB",
                    percentage = pct,
                    isOngoing = true
                )
                notificationManager?.notify(NOTIFICATION_ID, notif)
            }
            ACTION_COMPLETE -> {
                val notif = buildNotification(
                    title = "✅ Guru Offline AI Models Ready",
                    text = "All 3 offline AI models downloaded and verified (100%).",
                    subText = "Ready to learn offline",
                    percentage = 100,
                    isOngoing = false
                )
                notificationManager?.notify(NOTIFICATION_ID, notif)
                releaseWakeLock()
                stopForeground(STOP_FOREGROUND_DETACH)
                stopSelf()
            }
            ACTION_ERROR -> {
                val errorMsg = intent.getStringExtra(EXTRA_ERROR_MSG) ?: "Download failed"
                val notif = buildNotification(
                    title = "❌ AI Model Download Paused",
                    text = errorMsg,
                    percentage = 0,
                    isOngoing = false
                )
                notificationManager?.notify(NOTIFICATION_ID, notif)
                releaseWakeLock()
                stopForeground(STOP_FOREGROUND_DETACH)
                stopSelf()
            }
            ACTION_STOP -> {
                releaseWakeLock()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live download progress for Guru Offline AI engines"
                setShowBadge(false)
                enableVibration(false)
                enableLights(false)
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        title: String,
        text: String,
        subText: String? = null,
        percentage: Int = 0,
        isOngoing: Boolean = true
    ) = NotificationCompat.Builder(this, CHANNEL_ID).apply {
        setContentTitle(title)
        setContentText(text)
        if (!subText.isNullOrBlank()) {
            setSubText(subText)
        }
        setSmallIcon(android.R.drawable.stat_sys_download)
        setOngoing(isOngoing)
        setOnlyAlertOnce(true)
        setAutoCancel(!isOngoing)
        setCategory(NotificationCompat.CATEGORY_PROGRESS)
        setPriority(NotificationCompat.PRIORITY_LOW)

        if (percentage in 0..100 && isOngoing) {
            setProgress(100, percentage, false)
        } else {
            setProgress(0, 0, false)
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        if (launchIntent != null) {
            val pendingIntent = PendingIntent.getActivity(
                this@ModelDownloadService,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )
            setContentIntent(pendingIntent)
        }
    }.build()

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error releasing WakeLock: ${e.message}")
        }
    }

    override fun onDestroy() {
        releaseWakeLock()
        isServiceRunning = false
        super.onDestroy()
    }
}
