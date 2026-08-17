import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  BookOpen,
  BrainCircuit,
  ChevronDown,
  FileText,
  Globe,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PieChart,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react-native';
import { buildConditionedPrompt } from './src/services/curriculum/CurriculumService';

type Language = 'EN' | 'NE';
type ScreenState = 'onboarding' | 'main';
type TabState = 'home' | 'learn' | 'progress';
type SubjectId = 'math' | 'science' | 'english' | 'nepali' | 'social' | 'computer';
type QuizStatus = 'idle' | 'correct' | 'wrong';

interface UserProfile {
  name: string;
  grade: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isPending?: boolean;
  imageUri?: string;
  attachmentName?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface GenerationRef {
  requestId: string;
  sessionId: string;
  messageId: string;
  useMathFormat: boolean;
  useCasualFormat: boolean;
}

interface SubjectFocus {
  id: SubjectId;
  title: string;
  promptHint: string;
  plannerLabel: string;
  keywords: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface PlanStep {
  title: string;
  detail: string;
}

const STORAGE_KEYS = {
  user: '@pathsala_user',
  lang: '@pathsala_lang',
  sessions: '@pathsala_sessions',
  modelFolderUri: '@pathsala_model_folder_uri',
  modelPath: '@pathsala_model_path',
  modelFileName: '@pathsala_model_file_name',
};

const logoSource = require('./assets/logo.png');

const sanitizeMessage = (value: unknown): Message | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<Message>;
  if (typeof candidate.id !== 'string') {
    return null;
  }

  return {
    id: candidate.id,
    text: typeof candidate.text === 'string' ? candidate.text : '',
    isUser: Boolean(candidate.isUser),
    isPending: Boolean(candidate.isPending),
    imageUri: typeof candidate.imageUri === 'string' && candidate.imageUri.trim() ? candidate.imageUri : undefined,
    attachmentName:
      typeof candidate.attachmentName === 'string' && candidate.attachmentName.trim() ? candidate.attachmentName : undefined,
  };
};

const sanitizeSession = (value: unknown): ChatSession | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<ChatSession>;
  if (typeof candidate.id !== 'string') {
    return null;
  }

  const messages = Array.isArray(candidate.messages)
    ? candidate.messages.map(sanitizeMessage).filter((item): item is Message => item !== null)
    : [];

  return {
    id: candidate.id,
    title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title : 'Chat',
    messages,
    updatedAt: typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : Date.now(),
  };
};

const sanitizeSessions = (value: unknown): ChatSession[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(sanitizeSession).filter((item): item is ChatSession => item !== null);
};

const copy = {
  EN: {
    appName: 'Guru',
    greeting: 'Hi',
    subtitle: 'Your offline AI tutor',
    startPrompt: 'What do you want to learn today?',
    askPlaceholder: 'Ask Guru...',
    nameLabel: 'Enter your name',
    classLabel: 'Choose your class',
    continueLabel: 'Continue',
    historyLabel: 'Chats',
    newChatLabel: 'New chat',
    homeLabel: 'Home',
    learnLabel: 'Learn',
    progressLabel: 'Progress',
    logoutLabel: 'Log out',
    stopLabel: 'Stop',
    thinkingLabel: 'Answering...',
    responseStopped: 'Response stopped.',
    responseEmpty: 'Guru is starting the local model. Please wait a moment.',
    dashboardTitle: 'Learning Dashboard',
    dashboardText: 'Everything stays on your phone, and the LiteRT-LM model runs locally when available.',
    modelReady: 'LiteRT-LM local engine active',
    modelMissing: 'LiteRT-LM model missing. App is running in demo mode.',
    modelFailed: 'LiteRT-LM initialization failed. App is running in demo mode.',
    refreshModel: 'Refresh model scan',
    askQuestionTitle: 'Ask by subject',
    askQuestionText: 'Switch the subject focus and get answers matched to your class.',
    progressTitle: 'Track growth',
    progressText: 'See streaks, quick revision, and your next study steps.',
    subjectLabel: 'Subject focus',
    streakTitle: 'Daily streak',
    streakText: 'learning days in a row',
    focusTitle: 'Class-aware tutoring',
    focusText: 'Guru changes tone and depth for each class level, from gentle basics to serious exam prep.',
    keyTakeaway: 'Key takeaway',
    termsTitle: 'Important terms',
    plannerTitle: 'Study planner',
    plannerText: "Today's simple revision steps",
    quizTitle: 'Quick quiz',
    nextQuiz: 'New quiz',
    correctLabel: 'Nice work!',
    wrongLabel: 'Almost there',
    yourClass: 'Your class',
    currentTopic: 'Current focus',
    modelPathLabel: 'Model path',
    noChats: 'No recent chats',
  },
  NE: {
    appName: 'Guru',
    greeting: 'Namaste',
    subtitle: 'Tapai ko offline AI tutor',
    startPrompt: 'Aaja kun subject padhne?',
    askPlaceholder: 'Guru lai sodhnuhos...',
    nameLabel: 'Afno naam lekhnu hos',
    classLabel: 'Class channuhos',
    continueLabel: 'Agadi badhnuhos',
    historyLabel: 'Chats',
    newChatLabel: 'Naya chat',
    homeLabel: 'Ghar',
    learnLabel: 'Sikne',
    progressLabel: 'Pragati',
    logoutLabel: 'Log out',
    stopLabel: 'Roknuhos',
    thinkingLabel: 'Jawaf taiyar gardai...',
    responseStopped: 'Jawaf rokiyo.',
    responseEmpty: 'Guru local model start gardai cha. Kehi seconds wait garnuhos.',
    dashboardTitle: 'Learning Dashboard',
    dashboardText: 'Tutor history phone mai bascha ra model bhetiye pachi local LiteRT-LM bata chalcha.',
    modelReady: 'LiteRT-LM local engine active',
    modelMissing: 'LiteRT-LM model bhetiyena. App demo mode ma chaldaicha.',
    modelFailed: 'LiteRT-LM start bhayena. App demo mode ma chaldaicha.',
    refreshModel: 'Model scan feri garnuhos',
    askQuestionTitle: 'Subject anusar sodhnuhos',
    askQuestionText: 'Subject badalera afno class anusar ko jawaf paunuhos.',
    progressTitle: 'Pragati hernuhos',
    progressText: 'Streak, quick revision, ra aarko padhai ko yojana hernuhos.',
    subjectLabel: 'Haal ko subject',
    streakTitle: 'Dainik streak',
    streakText: 'din lagatar sikai',
    focusTitle: 'Class-anusar tutoring',
    focusText: 'Sano class ma naram ra sajilo, thulo class ma badi focused ra serious tutoring.',
    keyTakeaway: 'Mukhya kura',
    termsTitle: 'Mahatwapurna terms',
    plannerTitle: 'Study planner',
    plannerText: 'Aaja ko sajilo revision yojana',
    quizTitle: 'Quick quiz',
    nextQuiz: 'Arko quiz',
    correctLabel: 'Ramro!',
    wrongLabel: 'Feri ek choti heraun',
    yourClass: 'Tapai ko class',
    currentTopic: 'Haal ko focus',
    modelPathLabel: 'Model path',
    noChats: 'Recent chats chainan',
  },
} as const;

const gradeOptions = ['4', '5', '6', '7', '8', '9', '10'];

const generateId = () => Math.random().toString(36).slice(2, 10);
const toNativePath = (path: string) => (path.startsWith('file://') ? path.replace('file://', '') : path);
const toCheckPath = (path: string) => (/^[a-z]+:\/\//i.test(path) ? path : `file://${path}`);
const MODEL_FILE_PATTERNS = ['.litertlm', '.litertlm.bin'];
const TEXT_FILE_EXTENSIONS = ['txt', 'md', 'csv', 'json', 'xml', 'log', 'rtf'];
const MAX_ATTACHED_FILE_CHARS = 24000;
const MAX_ATTACHED_FILE_PROMPT_CHARS = 12000;
const FILE_ANALYSIS_STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'answer', 'based', 'below', 'between', 'could', 'detail', 'explain', 'file',
  'from', 'give', 'into', 'latest', 'main', 'make', 'more', 'need', 'only', 'once', 'please', 'prompt', 'question',
  'read', 'same', 'show', 'summary', 'tell', 'text', 'that', 'their', 'them', 'then', 'there', 'these', 'this',
  'those', 'what', 'when', 'where', 'which', 'with', 'would', 'your',
]);
const { StorageAccessFramework } = FileSystem;

const getStaticModelCandidates = () => {
  const fileNames = [
    'model.litertlm',
    'model.litertlm.bin',
    'model (1).litertlm',
    'model(1).litertlm',
  ];

  const directories = [
    toNativePath(getAppPrivateModelDirectory()),
    '/storage/emulated/0/Android/data/com.anonymous.pathsala/files',
    '/sdcard/Android/data/com.anonymous.pathsala/files',
    '/storage/self/primary/Android/data/com.anonymous.pathsala/files',
    '/storage/emulated/0/Download',
    '/sdcard/Download',
    '/storage/self/primary/Download',
    '/storage/emulated/0/Documents',
    '/sdcard/Documents',
    '/storage/self/primary/Documents',
    '/storage/emulated/0/Downloads',
    '/sdcard/Downloads',
    '/storage/self/primary/Downloads',
  ];

  const candidates = [
    ...directories.flatMap((directory) => fileNames.map((fileName) => `${directory}/${fileName}`)),
    ...fileNames.map((fileName) => `${FileSystem.documentDirectory}${fileName}`),
    ...fileNames.map((fileName) => `${FileSystem.cacheDirectory}${fileName}`),
  ];

  return [...new Set(candidates.filter(Boolean))].map((path) => ({
    checkPath: toCheckPath(path),
    nativePath: toNativePath(path),
  }));
};

const getModelCandidates = async () => {
  const staticCandidates = getStaticModelCandidates();
  const dynamicCandidates: Array<{ checkPath: string; nativePath: string }> = [];
  const seenPaths = new Set(staticCandidates.map((candidate) => candidate.nativePath));

  const directories = [
    toNativePath(getAppPrivateModelDirectory()),
    '/storage/emulated/0/Android/data/com.anonymous.pathsala/files',
    '/sdcard/Android/data/com.anonymous.pathsala/files',
    '/storage/self/primary/Android/data/com.anonymous.pathsala/files',
    '/storage/emulated/0/Download',
    '/sdcard/Download',
    '/storage/self/primary/Download',
    '/storage/emulated/0/Documents',
    '/sdcard/Documents',
    '/storage/self/primary/Documents',
    '/storage/emulated/0/Downloads',
    '/sdcard/Downloads',
    '/storage/self/primary/Downloads',
  ];

  for (const directory of directories) {
    try {
      const entries = await FileSystem.readDirectoryAsync(toCheckPath(directory));
      for (const entry of entries) {
        const normalizedEntry = entry.toLowerCase();
        if (!MODEL_FILE_PATTERNS.some((suffix) => normalizedEntry.endsWith(suffix))) {
          continue;
        }

        const fullPath = `${directory}/${entry}`;
        const nativePath = toNativePath(fullPath);
        if (seenPaths.has(nativePath)) {
          continue;
        }

        seenPaths.add(nativePath);
        dynamicCandidates.push({
          checkPath: toCheckPath(fullPath),
          nativePath,
        });
      }
    } catch (_) {
    }
  }

  return [...staticCandidates, ...dynamicCandidates];
};

const getAppPrivateModelDirectory = () => {
  const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  return `${baseDirectory}pathsala-models/`;
};

const isAppPrivateModelPath = (path: string) => {
  const normalizedPath = toNativePath(path);
  const privateDirectories = [FileSystem.documentDirectory, FileSystem.cacheDirectory]
    .filter(Boolean)
    .map((directory) => toNativePath(directory as string));

  return privateDirectories.some((directory) => normalizedPath.startsWith(directory));
};

const stageModelIntoAppStorage = async (sourcePath: string, preferredFileName?: string) => {
  if (isAppPrivateModelPath(sourcePath)) {
    return sourcePath;
  }

  const modelDirectory = getAppPrivateModelDirectory();
  const modelFileName = preferredFileName ?? sourcePath.split('/').pop() ?? 'model.litertlm';
  const stagedPath = `${modelDirectory}${modelFileName}`;

  try {
    const stagedInfo = await FileSystem.getInfoAsync(stagedPath);
    if (stagedInfo.exists && (stagedInfo.size ?? 0) > 0) {
      return toNativePath(stagedPath);
    }

    await FileSystem.makeDirectoryAsync(modelDirectory, { intermediates: true });
    await FileSystem.copyAsync({
      from: toCheckPath(sourcePath),
      to: stagedPath,
    });

    const copiedInfo = await FileSystem.getInfoAsync(stagedPath);
    if (copiedInfo.exists && (copiedInfo.size ?? 0) > 0) {
      return toNativePath(stagedPath);
    }
  } catch (error) {
    console.error('Failed to stage LiteRT-LM model locally:', error);
  }

  return null;
};

const getModelFileNameFromUri = (uri: string) => {
  const decoded = decodeURIComponent(uri);
  const parts = decoded.split(/[\\/]/);
  return parts[parts.length - 1] ?? '';
};

const findModelFileInDirectory = async (directoryUri: string) => {
  const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
  const modelEntry = entries.find((entry) => {
    const normalizedName = getModelFileNameFromUri(entry).toLowerCase();
    return MODEL_FILE_PATTERNS.some((suffix) => normalizedName.endsWith(suffix));
  });

  if (!modelEntry) {
    return null;
  }

  return {
    modelEntry,
    fileName: getModelFileNameFromUri(modelEntry) || 'model.litertlm',
  };
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripReasoningPrefix = (text: string) => {
  let next = text.trim();

  next = next.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  next = next.replace(/^\s*(analysis|thinking|thought process)\s*:\s*[\s\S]*?(?=(final answer|answer|uttar)\s*:)/i, '').trim();

  return next;
};

const formatModelText = (text: string) => {
  const pathSalaToken = '__PATHSALA_BRAND__';
  let cleaned = stripReasoningPrefix(text);

  cleaned = cleaned.replace(/\u2581/g, ' ');
  cleaned = cleaned
    .replace(/\bpaath\s*\.?\s*sala\b/gi, pathSalaToken)
    .replace(/\bpath\s*\.?\s*sala\b/gi, pathSalaToken);

  cleaned = cleaned.replace(/\$\$([^$]+)\$\$/g, ' $1 ');
  cleaned = cleaned.replace(/\$([^$]+)\$/g, '$1');
  cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, ' $1 ');
  cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, '$1');

  let previous = '';
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
  }

  cleaned = cleaned
    .replace(/\\dfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\tfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\[([^\]]+)\]\s*\{([^{}]+)\}/g, '$1-root($2)')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'integral from $1 to $2 of')
    .replace(/\\int/g, 'integral of')
    .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'sum from $1 to $2 of')
    .replace(/\\sum/g, 'sum of')
    .replace(/\\lim_\{([^{}]+)\}/g, 'limit as $1 of')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\theta/g, 'theta')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\delta/g, 'delta')
    .replace(/\\infty/g, 'infinity')
    .replace(/\\pm/g, '+/-')
    .replace(/\\mp/g, '-/+')
    .replace(/Ã—/g, ' x ')
    .replace(/Ã·/g, ' / ')
    .replace(/â‰¤/g, '<=')
    .replace(/â‰¥/g, '>=')
    .replace(/â‰ /g, '!=')
    .replace(/âˆ’/g, '-')
    .replace(/âˆš/g, 'sqrt')
    .replace(/\\times/g, ' x ')
    .replace(/\\div/g, ' / ')
    .replace(/\\cdot/g, ' * ')
    .replace(/\\leq?/g, '<=')
    .replace(/\\geq?/g, '>=')
    .replace(/\\neq/g, '!=')
    .replace(/\\approx/g, 'approx')
    .replace(/\\pi/g, 'pi')
    .replace(/\\left\s*[([{|]/g, '(')
    .replace(/\\right\s*[)\]}|]/g, ')')
    .replace(/\\[{}]/g, '')
    .replace(/\^\{([^{}]+)\}/g, '^($1)')
    .replace(/_\{([^{}]+)\}/g, '_($1)')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
    .replace(/\\boxed\{([^{}]+)\}/g, '[ $1 ]')
    .replace(/\\therefore/g, 'therefore')
    .replace(/\\because/g, 'because')
    .replace(/\\rightarrow/g, '->')
    .replace(/\\Rightarrow/g, '=>')
    .replace(/\\implies/g, '=>')
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '    ')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\\\/g, '\n')
    .replace(/\\begin\{[^}]+\}/g, '')
    .replace(/\\end\{[^}]+\}/g, '')
    .replace(/\\item/g, '- ')
    .replace(/\\[a-zA-Z]{3,}/g, ' ')
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^\s*#{1,6}\s*(.+)$/gm, '# $1')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .replace(/([.!?à¥¤])(?=[A-Za-z\u0900-\u097F])/g, '$1 ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Tidy the common spacing glitches we see from compact local models.

  // Keep step and answer labels from sticking to the previous sentence.
  cleaned = cleaned.replace(/([^\s\n])(Step\s*\d+|Answer\s*:?)/gi, '$1\n\n$2');

  // Make labels like "Step1" read naturally.
  cleaned = cleaned.replace(/(?:^|\n)(Step)\s*([0-9]+(?:\.[0-9]+)?)(?:\s*:|\s*\.)?/gi, '\n$1 $2: ');

  // Keep answer labels consistent.
  cleaned = cleaned.replace(/(?:^|\n)(Answer)(?!\w)/gi, '\n\nAnswer: ');

  // Separate numbered points when the model glues them to words.
  cleaned = cleaned.replace(/([a-zA-Z\u0900-\u097F])(\d{1,2})([A-Z\u0900-\u097F])/g, '$1\n\n$2. $3');

  // Add the missing dot for numbered lines.
  cleaned = cleaned.replace(/(?:^|\n)\s*(\d{1,2})([A-Z\u0900-\u097F])/gm, '\n$1. $2');

  // Move numbered points onto their own lines after punctuation.
  cleaned = cleaned.replace(/([:;.!?\u0964])\s*(\d{1,2}\.)/g, '$1\n\n$2 ');
  cleaned = cleaned.replace(/([a-zA-Z\u0900-\u097F])(\d{1,2}\.)/g, '$1\n\n$2 ');
  cleaned = cleaned.replace(/(\d{1,2}\.)\s*(?=[A-Za-z\u0900-\u097F])/g, '$1 ');

  // Put bullet points on a clean new line.
  cleaned = cleaned.replace(/([:;.!?\u0964])\s*[*â€¢]\s*(?=[A-Za-z\u0900-\u097F])/g, '$1\n\n- ');
  cleaned = cleaned.replace(/([:;.!?\u0964])\s*-\s+(?=[A-Za-z\u0900-\u097F])/g, '$1\n\n- ');

  // Give headings and explanations breathing room after a colon.
  cleaned = cleaned.replace(/:(?=[A-Z\u0900-\u097F])/g, ':\n\n');

  // Split words that arrive joined across sentence boundaries.
  cleaned = cleaned.replace(/([a-z\u0900-\u097F]{3,})([A-Z])/g, '$1 $2');

  // Keep bracketed expressions from touching the next word.
  cleaned = cleaned.replace(/([)\]])([A-Za-z\u0900-\u097F])/g, '$1 $2');

  // Normalize em dash spacing.
  cleaned = cleaned.replace(/\u2014/g, ' \u2014 ');

  // Run punctuation spacing once more after the structural cleanup.
  cleaned = cleaned.replace(/([.!?\u0964])(?=[A-Za-z\u0900-\u097F])/g, '$1 ');

  // Normalize bullet markers before rendering.
  cleaned = cleaned.replace(/^\s*[-*\u2022]\s+/gm, '- ');
  cleaned = cleaned.replace(/(?:^|\n)\s*\*\s+/gm, '- ');
  cleaned = cleaned.replace(/[ \t]+\*(?=\s|$)/g, ' ');

  // Finish with simple whitespace cleanup.
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  cleaned = cleaned.replace(new RegExp(pathSalaToken, 'g'), 'Guru');
  cleaned = cleaned
    .replace(/^(?:#\s*)?(?:answer|reply|response)\s*:?\s*/i, '')
    .replace(/^(?:#\s*)?(?:explanation)\s*:?\s*/i, '');

  // Keep paragraph spacing readable in the chat bubble.
  const paragraphs = cleaned.split(/\n\n+/);
  cleaned = paragraphs.map((p) => p.trim()).filter((p) => p.length > 0).join('\n\n');

  const sentenceParts = cleaned
    .split(/(?<=[.!?\u0964])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const exactSentenceCounts = new Map<string, number>();
  const prefixCounts = new Map<string, number>();
  const filteredSentences: string[] = [];

  for (const sentence of sentenceParts) {
    const normalized = sentence
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      continue;
    }

    const exactCount = exactSentenceCounts.get(normalized) ?? 0;
    if (exactCount >= 1) {
      continue;
    }

    const prefix = normalized.split(' ').slice(0, 4).join(' ');
    const prefixCount = prefixCounts.get(prefix) ?? 0;
    if (prefix.split(' ').length >= 3 && prefixCount >= 2) {
      continue;
    }

    exactSentenceCounts.set(normalized, exactCount + 1);
    prefixCounts.set(prefix, prefixCount + 1);
    filteredSentences.push(sentence);
  }

  if (filteredSentences.length > 0) {
    cleaned = filteredSentences.join('\n\n');
  }

  return cleaned.replace(new RegExp(pathSalaToken, 'g'), 'Guru');
};

const gradeNumber = (grade?: string) => {
  const parsed = Number(grade ?? '');
  return Number.isFinite(parsed) ? parsed : 4;
};

const getSubjectCatalog = (grade: string, language: Language): SubjectFocus[] => {
  const currentGrade = gradeNumber(grade);
  const isJunior = currentGrade <= 5;
  const isMiddle = currentGrade >= 6 && currentGrade <= 8;

  return [
    {
      id: 'science',
      title: language === 'NE' ? 'Bigyan' : 'Science',
      promptHint:
        language === 'NE'
          ? isJunior
            ? 'biruwa, janawar, urja, ra sajilo science ideas'
            : isMiddle
              ? 'physics, chemistry, biology, experiment, ra explanation'
              : 'science concepts, numericals, diagrams, and exam-focused revision'
          : isJunior
            ? 'plants, animals, energy, and easy science ideas'
            : isMiddle
              ? 'physics, chemistry, biology, experiments, and explanations'
              : 'science concepts, numericals, diagrams, and exam-focused revision',
      plannerLabel: currentGrade >= 9 ? 'Concept + formula + exam check' : 'Concept + example + revision',
      keywords: ['science', 'plant', 'animal', 'energy', 'force', 'cell', 'biology', 'chemistry', 'physics', 'bigyan', 'photosynthesis'],
    },
    {
      id: 'nepali',
      title: language === 'NE' ? 'Nepali' : 'Nepali',
      promptHint:
        language === 'NE'
          ? isJunior
            ? 'padhan, saral lekhan, artha, ra basic byakaran'
            : isMiddle
              ? 'byakaran, pathan, lekhan, artha, ra byakhya'
              : 'byakaran, sahitya, byakhya, and exam-style writing'
          : isJunior
            ? 'reading, simple writing, meaning, and basic grammar'
            : isMiddle
              ? 'grammar, reading, writing, meaning, and explanation'
              : 'grammar, literature, explanation, and exam-style writing',
      plannerLabel: currentGrade >= 9 ? 'Path + byakhya + writing practice' : 'Words + meaning + writing practice',
      keywords: ['nepali', 'byakaran', 'shabda', 'artha', 'nibandha', 'gadhya', 'padhya', 'byakhya'],
    },
    {
      id: 'english',
      title: language === 'NE' ? 'English' : 'English',
      promptHint:
        language === 'NE'
          ? isJunior
            ? 'simple words, reading, sentence making, and confidence'
            : isMiddle
              ? 'grammar, paragraph writing, tense, and comprehension'
              : 'grammar accuracy, writing structure, speaking confidence, and exam prep'
          : isJunior
            ? 'simple words, reading, sentence making, and confidence'
            : isMiddle
              ? 'grammar, paragraph writing, tense, and comprehension'
              : 'grammar accuracy, writing structure, speaking confidence, and exam prep',
      plannerLabel: currentGrade >= 9 ? 'Grammar + writing + speaking check' : 'Grammar + reading + sentence practice',
      keywords: ['english', 'grammar', 'tense', 'essay', 'paragraph', 'comprehension', 'vocabulary', 'sentence'],
    },
    {
      id: 'math',
      title: language === 'NE' ? 'Ganit' : 'Math',
      promptHint:
        language === 'NE'
          ? isJunior
            ? 'jod, ghataw, guna, bhaag, bhinna, ra word problems'
            : isMiddle
              ? 'algebra, ratio, percentage, geometry, ra worked examples'
              : 'algebra, mensuration, statistics, and exam-style problem solving'
          : isJunior
            ? 'addition, subtraction, multiplication, division, fractions, and word problems'
            : isMiddle
              ? 'algebra, ratio, percentage, geometry, and worked examples'
              : 'algebra, mensuration, statistics, and exam-style problem solving',
      plannerLabel: currentGrade >= 9 ? 'Rule + example + exam practice' : 'Rule + worked example + practice',
      keywords: ['math', 'algebra', 'geometry', 'fraction', 'equation', 'ratio', 'percent', 'ganit', 'bhinna'],
    },
    {
      id: 'social',
      title: language === 'NE' ? 'Samajik' : 'Social Studies',
      promptHint:
        language === 'NE'
          ? isJunior
            ? 'Nepal ko chinari, map, samudaya, ra sajilo itihaas'
            : isMiddle
              ? 'history, geography, civics, and Nepal context'
              : 'history, civics, governance, and cause-effect exam revision'
          : isJunior
            ? 'Nepal facts, maps, community, and easy history'
            : isMiddle
              ? 'history, geography, civics, and Nepal context'
              : 'history, civics, governance, and cause-effect exam revision',
      plannerLabel: currentGrade >= 9 ? 'Fact + reason + civics link' : 'Fact + reason + real-life link',
      keywords: ['social', 'history', 'geography', 'civics', 'nepal', 'society', 'map', 'government', 'samajik', 'itihaas'],
    },
    {
      id: 'computer',
      title: language === 'NE' ? 'Computer' : 'Computer',
      promptHint:
        language === 'NE'
          ? isJunior
            ? 'computer parts, files, typing, and safe internet habits'
            : isMiddle
              ? 'hardware, software, internet, logic, and simple coding ideas'
              : 'computer concepts, coding logic, internet safety, and practical problem solving'
          : isJunior
            ? 'computer parts, files, typing, and safe internet habits'
            : isMiddle
              ? 'hardware, software, internet, logic, and simple coding ideas'
              : 'computer concepts, coding logic, internet safety, and practical problem solving',
      plannerLabel: currentGrade >= 9 ? 'Concept + tool + practice task' : 'Idea + real device example + practice',
      keywords: ['computer', 'hardware', 'software', 'file', 'internet', 'program', 'coding', 'algorithm'],
    },
  ];
};

const detectSubjectId = (sessions: ChatSession[], subjects: SubjectFocus[]): SubjectId => {
  const haystack = sessions
    .slice(0, 3)
    .flatMap((session) => [session.title ?? '', ...(session.messages ?? []).slice(-4).map((message) => message.text ?? '')])
    .join(' ')
    .toLowerCase();

  for (const subject of subjects) {
    if (subject.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      return subject.id;
    }
  }

  return subjects[0]?.id ?? 'science';
};

const getToneInstruction = (grade: string) => {
  const currentGrade = gradeNumber(grade);
  if (currentGrade <= 5) {
    return 'Use a very friendly tone, simple words, short steps, and cheerful encouragement.';
  }
  if (currentGrade <= 8) {
    return 'Use a balanced tone with clear explanations and one good example when helpful.';
  }
  return 'Use a focused, serious, exam-aware tone while still being supportive and respectful.';
};

const isMathQuestion = (text: string) => {
  const lower = text.toLowerCase();
  const mathPatterns = [
    'solve', 'equation', 'factor', 'simplify', 'calculate', 'find the value',
    'derivative', 'integral', 'differentiate', 'integrate', 'limit',
    'x =', 'y =', 'x^2', 'x^3', 'quadratic', 'polynomial', 'linear',
    'algebra', 'geometry', 'trigonometry', 'triangle', 'circle', 'area',
    'perimeter', 'volume', 'surface area', 'angle', 'prove', 'proof',
    'ratio', 'proportion', 'percentage', 'fraction', 'decimal',
    'matrix', 'determinant', 'vector', 'probability', 'statistics',
    'mean', 'median', 'mode', 'standard deviation', 'variance',
    'logarithm', 'exponent', 'root', 'sqrt', 'square root',
    '+', '-', '*', '/', '=', '^', 'sum', 'product',
    'ganit', 'bhinna', 'samasya', 'hal', 'guna', 'bhaag',
  ];
  return mathPatterns.some((pattern) => lower.includes(pattern)) || /\d+\s*[+\-*/^=]\s*\d+/.test(text);
};

const isNumericalQuestion = (text: string) => {
  const lower = text.toLowerCase();
  const numericalPatterns = [
    'calculate',
    'find the value',
    'find the answer',
    'determine',
    'compute',
    'solve for',
    'what is',
    'how many',
    'how much',
    'numerical',
    'word problem',
    'opt math',
    'applied math',
    'ratio',
    'proportion',
    'percentage',
    'fraction',
    'decimal',
    'average',
    'mean',
    'speed',
    'velocity',
    'distance',
    'time',
    'force',
    'mass',
    'weight',
    'density',
    'pressure',
    'energy',
    'power',
    'work',
    'area',
    'perimeter',
    'volume',
    'interest',
    'profit',
    'loss',
    'cost',
    'age',
    'temperature',
    'salary',
    'marks',
    'money',
    'current',
    'voltage',
    'resistance',
  ];

  return numericalPatterns.some((pattern) => lower.includes(pattern)) && /\d/.test(text);
};

const nepaliDigitMap: Record<string, string> = {
  'à¥¦': '0',
  'à¥§': '1',
  'à¥¨': '2',
  'à¥©': '3',
  'à¥ª': '4',
  'à¥«': '5',
  'à¥¬': '6',
  'à¥­': '7',
  'à¥®': '8',
  'à¥¯': '9',
};

const normalizeDigits = (value: string) => value.replace(/[à¥¦-à¥¯]/g, (digit) => nepaliDigitMap[digit] ?? digit);

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return '';
  }
  if (Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }
  return value.toFixed(4).replace(/\.?0+$/, '');
};

const hasNepaliScript = (value: string) => /[\u0900-\u097F]/.test(value);

const isMathFollowUpPrompt = (question: string) => {
  const normalized = normalizeDigits(question).toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return false;
  }

  const followUpPatterns = [
    /\b(this|that|it|same|again|continue|next|previous|above|below|too|also)\b/,
    /\b(use|try|apply)\s+(the\s+)?same\s+method\b/,
    /\bsolve\s+(this|it|next)\b/,
    /\bfactor(?:ize|ise)?\s+(this|it)\b/,
    /\bexplain\s+(this|it)\b/,
    /\b(show|tell)\s+me\s+(the\s+)?(process|steps|method)\b/,
    /\bhow\s+(did|do)\s+you\s+(find|get)\s+(it|this|that)\b/,
    /\bwhat about\b/,
  ];

  if (followUpPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const hasFreshMathContent =
    /\b[xyz]\b/i.test(normalized) ||
    /\d/.test(normalized) ||
    /[=+\-*/^]/.test(normalized) ||
    /\b(?:factor|factorize|factorise|solve|simplify|evaluate|find)\b/.test(normalized);

  return !hasFreshMathContent && normalized.split(' ').length <= 6;
};

const extractNamedValue = (text: string, names: string[]) => {
  const joined = names.map(escapeRegex).join('|');
  const match = text.match(new RegExp(`\\b(?:${joined})\\b\\s*(?:is|=|:)?\\s*(-?\\d+(?:\\.\\d+)?)`, 'i'));
  return match ? Number(match[1]) : null;
};

const buildSimpleProportionReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).replace(/\s+/g, ' ').trim();
  const match = input.match(/\bx\s*\/\s*(-?\d+(?:\.\d+)?)\s*=\s*x\s*\/\s*(-?\d+(?:\.\d+)?)\b/i);
  if (!match) {
    return null;
  }

  const leftDivisor = Number(match[1]);
  const rightDivisor = Number(match[2]);
  if (!Number.isFinite(leftDivisor) || !Number.isFinite(rightDivisor) || Math.abs(leftDivisor) < 1e-9 || Math.abs(rightDivisor) < 1e-9) {
    return null;
  }

  const equation = `x / ${formatNumber(leftDivisor)} = x / ${formatNumber(rightDivisor)}`;
  if (Math.abs(leftDivisor - rightDivisor) < 1e-9) {
    if (language === 'NE') {
      return [
        `Yo equation ma x ko anek maan hunchha.`,
        ``,
        `Yesari bujhna sakincha:`,
        ``,
        `1. Start with the equation:`,
        equation,
        ``,
        `2. Dubai side same chha, tyasaile junai x rakhda pani equation milchha.`,
        ``,
        `Conclusion:`,
        `Any real value of x works.`,
      ].join('\n');
    }

    return [
      `This equation is true for every value of x.`,
      ``,
      `Here is how we see it:`,
      ``,
      `1. Start with the equation:`,
      equation,
      ``,
      `2. Both sides are already identical, so any real value of x satisfies it.`,
      ``,
      `Conclusion:`,
      `Any real value of x works.`,
    ].join('\n');
  }

  const multiplier = leftDivisor * rightDivisor;
  const leftCoefficient = rightDivisor;
  const rightCoefficient = leftDivisor;
  const coefficientDifference = rightCoefficient - leftCoefficient;

  if (language === 'NE') {
    return [
      `x ko maan 0 ho.`,
      ``,
      `Yesari hal garinchha:`,
      ``,
      `1. Start with the equation:`,
      equation,
      ``,
      `2. Dubai side ${formatNumber(multiplier)} le multiply gara:`,
      `${formatNumber(leftCoefficient)}x = ${formatNumber(rightCoefficient)}x`,
      ``,
      `3. Euta side ma x ko sabai term lyau:`,
      `${formatNumber(coefficientDifference)}x = 0`,
      ``,
      `4. Solve gara:`,
      `x = 0`,
      ``,
      `Check:`,
      `0 / ${formatNumber(leftDivisor)} = 0 / ${formatNumber(rightDivisor)}`,
    ].join('\n');
  }

  return [
    `The value of x is 0.`,
    ``,
    `Here is how we find it:`,
    ``,
    `1. Start with the equation:`,
    equation,
    ``,
    `2. Multiply both sides by ${formatNumber(multiplier)}:`,
    `${formatNumber(leftCoefficient)}x = ${formatNumber(rightCoefficient)}x`,
    ``,
    `3. Move all x terms to one side:`,
    `${formatNumber(coefficientDifference)}x = 0`,
    ``,
    `4. Solve:`,
    `x = 0`,
    ``,
    `Check:`,
    `0 / ${formatNumber(leftDivisor)} = 0 / ${formatNumber(rightDivisor)}`,
  ].join('\n');
};

const buildFactorizationReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).toLowerCase();
  if (!/\bfactor(?:ize|ise)?\b/.test(input)) {
    return null;
  }

  const compact = input.replace(/\s+/g, '').replace(/²/g, '^2');

  const quadraticMatch = compact.match(/x\^?2([+-])(\d+)x([+-])(\d+)/i);
  if (quadraticMatch) {
    const middle = Number(quadraticMatch[2]) * (quadraticMatch[1] === '-' ? -1 : 1);
    const constant = Number(quadraticMatch[4]) * (quadraticMatch[3] === '-' ? -1 : 1);

    const pairs: Array<[number, number]> = [];
    if (constant === 0) {
      pairs.push([0, middle]);
    } else {
      for (let factor = 1; factor <= Math.abs(constant); factor += 1) {
        if (Math.abs(constant) % factor !== 0) continue;
        const quotient = constant / factor;
        pairs.push([factor, quotient], [-factor, -quotient], [quotient, factor], [-quotient, -factor]);
      }
    }

    const foundPair = pairs.find(([first, second]) => first + second === middle && first * second === constant);
    if (foundPair) {
      const [first, second] = foundPair;
      const formatFactor = (value: number) => {
        if (value === 0) return 'x';
        if (value > 0) return `(x + ${formatNumber(value)})`;
        return `(x - ${formatNumber(Math.abs(value))})`;
      };
      const factorized = valueTupleToFactor(first, second, formatFactor);

      if (language === 'NE') {
        return [
          `Factorized form ${factorized} ho.`,
          ``,
          `Yesari hal garinchha:`,
          ``,
          `1. Testo dui ota number khoja jasko गुणनफल ${formatNumber(constant)} ra योगफल ${formatNumber(middle)} hunchha.`,
          ``,
          `2. Tyo number haru ${formatNumber(first)} ra ${formatNumber(second)} hun.`,
          ``,
          `3. Tesaile factorized form ${factorized} ho.`,
        ].join('\n');
      }

      return [
        `The factorized form is ${factorized}.`,
        ``,
        `Here is how we find it:`,
        ``,
        `1. Find two numbers whose product is ${formatNumber(constant)} and whose sum is ${formatNumber(middle)}.`,
        ``,
        `2. Those numbers are ${formatNumber(first)} and ${formatNumber(second)}.`,
        ``,
        `3. So the factorized form is ${factorized}.`,
      ].join('\n');
    }
  }

  const differenceOfSquaresMatch = compact.match(/x\^?2-(\d+)(?!x)/i);
  if (differenceOfSquaresMatch) {
    const constant = Number(differenceOfSquaresMatch[1]);
    const root = Math.sqrt(constant);
    if (Number.isFinite(root) && Math.abs(root - Math.round(root)) < 1e-9) {
      const exactRoot = Math.round(root);
      const factorized = `(x - ${formatNumber(exactRoot)})(x + ${formatNumber(exactRoot)})`;

      if (language === 'NE') {
        return [
          `Factorized form ${factorized} ho.`,
          ``,
          `Yesari hal garinchha:`,
          ``,
          `1. Yo difference of squares ho: x^2 - ${formatNumber(constant)} = x^2 - ${formatNumber(exactRoot)}^2.`,
          ``,
          `2. Formula use gara: a^2 - b^2 = (a - b)(a + b).`,
          ``,
          `3. Tesaile factorized form ${factorized} ho.`,
        ].join('\n');
      }

      return [
        `The factorized form is ${factorized}.`,
        ``,
        `Here is how we find it:`,
        ``,
        `1. Recognize that x^2 - ${formatNumber(constant)} = x^2 - ${formatNumber(exactRoot)}^2.`,
        ``,
        `2. Use the identity a^2 - b^2 = (a - b)(a + b).`,
        ``,
        `3. So the factorized form is ${factorized}.`,
      ].join('\n');
    }
  }

  return null;
};

const valueTupleToFactor = (
  first: number,
  second: number,
  formatFactor: (value: number) => string
) => {
  if (first === 0) {
    return `x${formatFactor(second)}`;
  }
  if (second === 0) {
    return `x${formatFactor(first)}`;
  }
  return `${formatFactor(first)}${formatFactor(second)}`;
};

const buildLinearEquationReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).replace(/\s+/g, ' ').trim();
  const patterns: Array<{
    regex: RegExp;
    solve: (match: RegExpMatchArray) => {
      value: number;
      equation: string;
      check: string[];
      lines: string[];
    } | null;
  }> = [
    {
      regex: /\bx\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/i,
      solve: (match) => {
        const op = match[1];
        const operand = Number(match[2]);
        const target = Number(match[3]);
        if (!Number.isFinite(operand) || !Number.isFinite(target)) return null;

        if (op === '+') {
          const value = target - operand;
          return {
            value,
            equation: `x + ${formatNumber(operand)} = ${formatNumber(target)}`,
            check: [
              `${formatNumber(value)} + ${formatNumber(operand)} = ${formatNumber(target)}`,
            ],
            lines: [
              `1. Start with the equation:`,
              `x + ${formatNumber(operand)} = ${formatNumber(target)}`,
              ``,
              `2. Subtract ${formatNumber(operand)} from both sides:`,
              `x + ${formatNumber(operand)} - ${formatNumber(operand)} = ${formatNumber(target)} - ${formatNumber(operand)}`,
              ``,
              `3. Simplify:`,
              `x = ${formatNumber(value)}`,
            ],
          };
        }

        if (op === '-') {
          const value = target + operand;
          return {
            value,
            equation: `x - ${formatNumber(operand)} = ${formatNumber(target)}`,
            check: [
              `${formatNumber(value)} - ${formatNumber(operand)} = ${formatNumber(target)}`,
            ],
            lines: [
              `1. Start with the equation:`,
              `x - ${formatNumber(operand)} = ${formatNumber(target)}`,
              ``,
              `2. Add ${formatNumber(operand)} to both sides:`,
              `x - ${formatNumber(operand)} + ${formatNumber(operand)} = ${formatNumber(target)} + ${formatNumber(operand)}`,
              ``,
              `3. Simplify:`,
              `x = ${formatNumber(value)}`,
            ],
          };
        }

        if (op === '*') {
          if (Math.abs(operand) < 1e-9) return null;
          const value = target / operand;
          return {
            value,
            equation: `x * ${formatNumber(operand)} = ${formatNumber(target)}`,
            check: [
              `${formatNumber(value)} * ${formatNumber(operand)} = ${formatNumber(target)}`,
            ],
            lines: [
              `1. Start with the equation:`,
              `x * ${formatNumber(operand)} = ${formatNumber(target)}`,
              ``,
              `2. Divide both sides by ${formatNumber(operand)}:`,
              `(x * ${formatNumber(operand)}) / ${formatNumber(operand)} = ${formatNumber(target)} / ${formatNumber(operand)}`,
              ``,
              `3. Simplify:`,
              `x = ${formatNumber(value)}`,
            ],
          };
        }

        if (Math.abs(operand) < 1e-9) return null;
        const value = target * operand;
        return {
          value,
          equation: `x / ${formatNumber(operand)} = ${formatNumber(target)}`,
          check: [
            `${formatNumber(value)} / ${formatNumber(operand)} = ${formatNumber(target)}`,
          ],
          lines: [
            `1. Start with the equation:`,
            `x / ${formatNumber(operand)} = ${formatNumber(target)}`,
            ``,
            `2. Multiply both sides by ${formatNumber(operand)}:`,
            `(x / ${formatNumber(operand)}) * ${formatNumber(operand)} = ${formatNumber(target)} * ${formatNumber(operand)}`,
            ``,
            `3. Simplify:`,
            `x = ${formatNumber(value)}`,
          ],
        };
      },
    },
    {
      regex: /(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*x\s*=\s*(-?\d+(?:\.\d+)?)/i,
      solve: (match) => {
        const left = Number(match[1]);
        const op = match[2];
        const target = Number(match[3]);
        if (!Number.isFinite(left) || !Number.isFinite(target)) return null;

        if (op === '+') {
          const value = target - left;
          return {
            value,
            equation: `${formatNumber(left)} + x = ${formatNumber(target)}`,
            check: [
              `${formatNumber(left)} + ${formatNumber(value)} = ${formatNumber(target)}`,
            ],
            lines: [
              `1. Start with the equation:`,
              `${formatNumber(left)} + x = ${formatNumber(target)}`,
              ``,
              `2. Subtract ${formatNumber(left)} from both sides:`,
              `${formatNumber(left)} + x - ${formatNumber(left)} = ${formatNumber(target)} - ${formatNumber(left)}`,
              ``,
              `3. Simplify:`,
              `x = ${formatNumber(value)}`,
            ],
          };
        }

        if (op === '-') {
          const value = left - target;
          return {
            value,
            equation: `${formatNumber(left)} - x = ${formatNumber(target)}`,
            check: [
              `${formatNumber(left)} - ${formatNumber(value)} = ${formatNumber(target)}`,
            ],
            lines: [
              `1. Start with the equation:`,
              `${formatNumber(left)} - x = ${formatNumber(target)}`,
              ``,
              `2. Rearrange to isolate x:`,
              `${formatNumber(left)} - ${formatNumber(target)} = x`,
              ``,
              `3. Simplify:`,
              `x = ${formatNumber(value)}`,
            ],
          };
        }

        if (op === '*') {
          if (Math.abs(left) < 1e-9) return null;
          const value = target / left;
          return {
            value,
            equation: `${formatNumber(left)} * x = ${formatNumber(target)}`,
            check: [
              `${formatNumber(left)} * ${formatNumber(value)} = ${formatNumber(target)}`,
            ],
            lines: [
              `1. Start with the equation:`,
              `${formatNumber(left)} * x = ${formatNumber(target)}`,
              ``,
              `2. Divide both sides by ${formatNumber(left)}:`,
              `(${formatNumber(left)} * x) / ${formatNumber(left)} = ${formatNumber(target)} / ${formatNumber(left)}`,
              ``,
              `3. Simplify:`,
              `x = ${formatNumber(value)}`,
            ],
          };
        }

        if (Math.abs(target) < 1e-9) return null;
        const value = left / target;
        return {
          value,
          equation: `${formatNumber(left)} / x = ${formatNumber(target)}`,
          check: [
            `${formatNumber(left)} / ${formatNumber(value)} = ${formatNumber(target)}`,
          ],
          lines: [
            `1. Start with the equation:`,
            `${formatNumber(left)} / x = ${formatNumber(target)}`,
            ``,
            `2. Multiply both sides by x and divide by ${formatNumber(target)}:`,
            `${formatNumber(left)} = ${formatNumber(target)} * x`,
            ``,
            `3. Simplify:`,
            `x = ${formatNumber(value)}`,
          ],
        };
      },
    },
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern.regex);
    if (!match) {
      continue;
    }

    const solved = pattern.solve(match);
    if (!solved) {
      continue;
    }

    if (language === 'NE') {
      return [
        `x ko maan ${formatNumber(solved.value)} ho.`,
        ``,
        `Yesari hal garinchha:`,
        ``,
        ...solved.lines,
        ``,
        `Check:`,
        ...solved.check,
      ].join('\n');
    }

    return [
      `The value of x is ${formatNumber(solved.value)}.`,
      ``,
      `Let's solve it step by step:`,
      ``,
      ...solved.lines,
      ``,
      `Check:`,
      ...solved.check,
    ].join('\n');
  }

  return null;
};

const buildArithmeticReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).replace(/Ã—/g, '*').replace(/Ã·/g, '/');
  const match = input.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  let result = 0;
  let action = '';
  if (operator === '+') {
    result = left + right;
    action = `Add ${formatNumber(left)} and ${formatNumber(right)}`;
  } else if (operator === '-') {
    result = left - right;
    action = `Subtract ${formatNumber(right)} from ${formatNumber(left)}`;
  } else if (operator === '*') {
    result = left * right;
    action = `Multiply ${formatNumber(left)} by ${formatNumber(right)}`;
  } else {
    if (Math.abs(right) < 1e-9) {
      return null;
    }
    result = left / right;
    action = `Divide ${formatNumber(left)} by ${formatNumber(right)}`;
  }

  if (language === 'NE') {
    return [
      `à¤‰à¤¤à¥à¤¤à¤° ${formatNumber(result)} à¤¹à¥‹.`,
      ``,
      `Yesari garinchha:`,
      ``,
      `1. ${action}.`,
      ``,
      `2. ${formatNumber(left)} ${operator} ${formatNumber(right)} = ${formatNumber(result)}`,
    ].join('\n');
  }

  return [
    `The answer is ${formatNumber(result)}.`,
    ``,
    `Here is how we find it:`,
    ``,
    `1. ${action}.`,
    ``,
    `2. ${formatNumber(left)} ${operator} ${formatNumber(right)} = ${formatNumber(result)}`,
  ].join('\n');
};

const buildPercentageReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).replace(/,/g, '').replace(/\s+/g, ' ').trim();
  const lower = input.toLowerCase();

  const percentageMatch =
    lower.match(/(-?\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(-?\d+(?:\.\d+)?)/i) ??
    lower.match(/(-?\d+(?:\.\d+)?)\s*percent\s*(?:of)\s*(-?\d+(?:\.\d+)?)/i) ??
    lower.match(/what\s+is\s+(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)\s*(-?\d+(?:\.\d+)?)/i);

  if (!percentageMatch) {
    return null;
  }

  const percent = Number(percentageMatch[1]);
  const whole = Number(percentageMatch[2]);
  if (!Number.isFinite(percent) || !Number.isFinite(whole)) {
    return null;
  }

  const decimal = percent / 100;
  const answer = whole * decimal;

  if (language === 'NE') {
    return [
      `${formatNumber(whole)} ko ${formatNumber(percent)}% = ${formatNumber(answer)} ho.`,
      ``,
      `Yesari hal garinchha:`,
      ``,
      `1. Percentage lai decimal ma badlau:`,
      `${formatNumber(percent)}% = ${formatNumber(percent)} / 100 = ${formatNumber(decimal)}`,
      ``,
      `2. Tyo decimal lai given number sanga multiply gara:`,
      `${formatNumber(decimal)} x ${formatNumber(whole)} = ${formatNumber(answer)}`,
      ``,
      `Check:`,
      `${formatNumber(percent)} / 100 x ${formatNumber(whole)} = ${formatNumber(answer)}`,
    ].join('\n');
  }

  return [
    `${formatNumber(percent)}% of ${formatNumber(whole)} is ${formatNumber(answer)}.`,
    ``,
    `Here is how we find it:`,
    ``,
    `1. Convert the percentage to a decimal:`,
    `${formatNumber(percent)}% = ${formatNumber(percent)} / 100 = ${formatNumber(decimal)}`,
    ``,
    `2. Multiply the decimal by the whole number:`,
    `${formatNumber(decimal)} x ${formatNumber(whole)} = ${formatNumber(answer)}`,
    ``,
    `Check:`,
    `${formatNumber(percent)} / 100 x ${formatNumber(whole)} = ${formatNumber(answer)}`,
  ].join('\n');
};

const buildPythagorasReply = (question: string, language: Language) => {
  const input = normalizeDigits(question);
  const lower = input.toLowerCase();

  const hypotenuse = extractNamedValue(lower, ['hypotenuse', 'h']);
  const perpendicular = extractNamedValue(lower, ['perpendicular', 'height', 'p']);
  const base = extractNamedValue(lower, ['base', 'b']);

  const wantsBase = /\bfind\s+base\b|\bbase\b.*\bfind\b/i.test(lower) || (base == null && hypotenuse != null && perpendicular != null);
  const wantsPerpendicular =
    /\bfind\s+perpendicular\b|\bperpendicular\b.*\bfind\b|\bfind\s+height\b|\bheight\b.*\bfind\b/i.test(lower) ||
    (perpendicular == null && hypotenuse != null && base != null);
  const wantsHypotenuse = /\bfind\s+hypotenuse\b|\bhypotenuse\b.*\bfind\b/i.test(lower) || (hypotenuse == null && perpendicular != null && base != null);

  const squareRootIfPerfect = (value: number) => {
    const root = Math.sqrt(value);
    if (!Number.isFinite(root)) return null;
    return Math.abs(root - Math.round(root)) < 1e-9 ? Math.round(root) : root;
  };

  if (wantsBase && hypotenuse != null && perpendicular != null) {
    const difference = hypotenuse * hypotenuse - perpendicular * perpendicular;
    if (difference <= 0) return null;
    const result = squareRootIfPerfect(difference);
    if (result == null) return null;
    const resultText = formatNumber(result);

    if (language === 'NE') {
      return [
        `Base ${resultText} ho.`,
        ``,
        `Yesari hal garinchha:`,
        ``,
        `1. Pythagoras ko niyam use garau:`,
        `hypotenuse^2 = perpendicular^2 + base^2`,
        ``,
        `2. Maan rakhau:`,
        `${formatNumber(hypotenuse)}^2 = ${formatNumber(perpendicular)}^2 + base^2`,
        ``,
        `3. Square garau:`,
        `${formatNumber(hypotenuse * hypotenuse)} = ${formatNumber(perpendicular * perpendicular)} + base^2`,
        ``,
        `4. Base^2 nikaalau:`,
        `${formatNumber(hypotenuse * hypotenuse)} - ${formatNumber(perpendicular * perpendicular)} = base^2`,
        `${formatNumber(difference)} = base^2`,
        ``,
        `5. Square root linu:`,
        `base = ${resultText}`,
        ``,
        `Check:`,
        `${formatNumber(perpendicular * perpendicular)} + ${formatNumber(result * result)} = ${formatNumber(hypotenuse * hypotenuse)}`,
      ].join('\n');
    }

    return [
      `The base is ${resultText}.`,
      ``,
      `Let's solve it step by step:`,
      ``,
      `1. Use the Pythagoras formula:`,
      `hypotenuse^2 = perpendicular^2 + base^2`,
      ``,
      `2. Substitute the values:`,
      `${formatNumber(hypotenuse)}^2 = ${formatNumber(perpendicular)}^2 + base^2`,
      ``,
      `3. Square the known sides:`,
      `${formatNumber(hypotenuse * hypotenuse)} = ${formatNumber(perpendicular * perpendicular)} + base^2`,
      ``,
      `4. Rearrange to find base^2:`,
      `${formatNumber(hypotenuse * hypotenuse)} - ${formatNumber(perpendicular * perpendicular)} = base^2`,
      `${formatNumber(difference)} = base^2`,
      ``,
      `5. Take the square root:`,
      `base = ${resultText}`,
      ``,
      `Check:`,
      `${formatNumber(perpendicular)}^2 + ${formatNumber(result)}^2 = ${formatNumber(hypotenuse)}^2`,
      `${formatNumber(perpendicular * perpendicular)} + ${formatNumber(result * result)} = ${formatNumber(hypotenuse * hypotenuse)}`,
    ].join('\n');
  }

  if (wantsPerpendicular && hypotenuse != null && base != null) {
    const difference = hypotenuse * hypotenuse - base * base;
    if (difference <= 0) return null;
    const result = squareRootIfPerfect(difference);
    if (result == null) return null;
    const resultText = formatNumber(result);

    if (language === 'NE') {
      return [
        `Perpendicular ${resultText} ho.`,
        ``,
        `Yesari hal garinchha:`,
        ``,
        `1. Pythagoras ko niyam use garau:`,
        `hypotenuse^2 = perpendicular^2 + base^2`,
        ``,
        `2. Maan rakhau:`,
        `${formatNumber(hypotenuse)}^2 = perpendicular^2 + ${formatNumber(base)}^2`,
        ``,
        `3. Square garau:`,
        `${formatNumber(hypotenuse * hypotenuse)} = perpendicular^2 + ${formatNumber(base * base)}`,
        ``,
        `4. Perpendicular^2 nikaalau:`,
        `${formatNumber(hypotenuse * hypotenuse)} - ${formatNumber(base * base)} = perpendicular^2`,
        `${formatNumber(difference)} = perpendicular^2`,
        ``,
        `5. Square root linu:`,
        `perpendicular = ${resultText}`,
        ``,
        `Check:`,
        `${formatNumber(result)}^2 + ${formatNumber(base)}^2 = ${formatNumber(hypotenuse)}^2`,
        `${formatNumber(result * result)} + ${formatNumber(base * base)} = ${formatNumber(hypotenuse * hypotenuse)}`,
      ].join('\n');
    }

    return [
      `The perpendicular is ${resultText}.`,
      ``,
      `Let's solve it step by step:`,
      ``,
      `1. Use the Pythagoras formula:`,
      `hypotenuse^2 = perpendicular^2 + base^2`,
      ``,
      `2. Substitute the values:`,
      `${formatNumber(hypotenuse)}^2 = perpendicular^2 + ${formatNumber(base)}^2`,
      ``,
      `3. Square the known sides:`,
      `${formatNumber(hypotenuse * hypotenuse)} = perpendicular^2 + ${formatNumber(base * base)}`,
      ``,
      `4. Rearrange to find perpendicular^2:`,
      `${formatNumber(hypotenuse * hypotenuse)} - ${formatNumber(base * base)} = perpendicular^2`,
      `${formatNumber(difference)} = perpendicular^2`,
      ``,
      `5. Take the square root:`,
      `perpendicular = ${resultText}`,
      ``,
      `Check:`,
      `${formatNumber(result)}^2 + ${formatNumber(base)}^2 = ${formatNumber(hypotenuse)}^2`,
      `${formatNumber(result * result)} + ${formatNumber(base * base)} = ${formatNumber(hypotenuse * hypotenuse)}`,
    ].join('\n');
  }

  if (wantsHypotenuse && perpendicular != null && base != null) {
    const total = perpendicular * perpendicular + base * base;
    const result = squareRootIfPerfect(total);
    if (result == null) return null;
    const resultText = formatNumber(result);

    if (language === 'NE') {
      return [
        `Hypotenuse ${resultText} ho.`,
        ``,
        `Yesari hal garinchha:`,
        ``,
        `1. Pythagoras ko niyam use garau:`,
        `hypotenuse^2 = perpendicular^2 + base^2`,
        ``,
        `2. Maan rakhau:`,
        `hypotenuse^2 = ${formatNumber(perpendicular)}^2 + ${formatNumber(base)}^2`,
        ``,
        `3. Square ra add garau:`,
        `hypotenuse^2 = ${formatNumber(perpendicular * perpendicular)} + ${formatNumber(base * base)}`,
        `hypotenuse^2 = ${formatNumber(total)}`,
        ``,
        `4. Square root linu:`,
        `hypotenuse = ${resultText}`,
        ``,
        `Check:`,
        `${formatNumber(perpendicular)}^2 + ${formatNumber(base)}^2 = ${formatNumber(result)}^2`,
        `${formatNumber(perpendicular * perpendicular)} + ${formatNumber(base * base)} = ${formatNumber(result * result)}`,
      ].join('\n');
    }

    return [
      `The hypotenuse is ${resultText}.`,
      ``,
      `Let's solve it step by step:`,
      ``,
      `1. Use the Pythagoras formula:`,
      `hypotenuse^2 = perpendicular^2 + base^2`,
      ``,
      `2. Substitute the values:`,
      `hypotenuse^2 = ${formatNumber(perpendicular)}^2 + ${formatNumber(base)}^2`,
      ``,
      `3. Square and add:`,
      `hypotenuse^2 = ${formatNumber(perpendicular * perpendicular)} + ${formatNumber(base * base)}`,
      `hypotenuse^2 = ${formatNumber(total)}`,
      ``,
      `4. Take the square root:`,
      `hypotenuse = ${resultText}`,
      ``,
      `Check:`,
      `${formatNumber(perpendicular)}^2 + ${formatNumber(base)}^2 = ${formatNumber(result)}^2`,
      `${formatNumber(perpendicular * perpendicular)} + ${formatNumber(base * base)} = ${formatNumber(result * result)}`,
    ].join('\n');
  }

  return null;
};

const buildUnitCostReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).replace(/,/g, '').replace(/\s+/g, ' ').trim();
  const lower = input.toLowerCase();

  if (!/\b(cost|price)\b/.test(lower) || !/\bfind\b/.test(lower)) {
    return null;
  }

  const quantityMatches = [...lower.matchAll(/\b(?:cost|price)\s+of\s+(\d+(?:\.\d+)?)\s*([a-z]+)/g)];
  if (quantityMatches.length < 2) {
    return null;
  }

  const givenQuantity = Number(quantityMatches[0][1]);
  const targetQuantity = Number(quantityMatches[1][1]);
  const unitLabel = quantityMatches[0][2] || quantityMatches[1][2] || 'unit';
  const costMatch =
    lower.match(/\bcost\s+of\s+\d+(?:\.\d+)?\s*[a-z]+\s+.*?\b(?:is|=)\s*(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i) ??
    lower.match(/\b(?:is|=)\s*(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i) ??
    lower.match(/\b(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i);

  if (!costMatch) {
    return null;
  }

  const givenCost = Number(costMatch[1]);
  if (!Number.isFinite(givenQuantity) || !Number.isFinite(targetQuantity) || !Number.isFinite(givenCost) || givenQuantity <= 0) {
    return null;
  }

  const unitCost = givenCost / givenQuantity;
  const totalCost = unitCost * targetQuantity;

  if (language === 'NE') {
    return [
      `${formatNumber(targetQuantity)} ${unitLabel} ko lagat Rs ${formatNumber(totalCost)} ho.`,
      ``,
      `à¤¯à¤¸à¤°à¥€ à¤—à¤°à¥à¤›à¥Œà¤‚:`,
      ``,
      `1. 1 ${unitLabel} ko lagat nikalau:`,
      `Rs ${formatNumber(givenCost)} / ${formatNumber(givenQuantity)} ${unitLabel} = Rs ${formatNumber(unitCost)} per ${unitLabel}`,
      ``,
      `2. Aba ${formatNumber(targetQuantity)} ${unitLabel} ko lagat nikalau:`,
      `Rs ${formatNumber(unitCost)} x ${formatNumber(targetQuantity)} = Rs ${formatNumber(totalCost)}`,
      ``,
      `Check:`,
      `${formatNumber(targetQuantity)} x ${formatNumber(unitCost)} = ${formatNumber(totalCost)}`,
    ].join('\n');
  }

  return [
    `The cost of ${formatNumber(targetQuantity)} ${unitLabel} is Rs ${formatNumber(totalCost)}.`,
    ``,
    `Here is how we find it:`,
    ``,
    `1. Find the cost of 1 ${unitLabel}:`,
    `Rs ${formatNumber(givenCost)} / ${formatNumber(givenQuantity)} ${unitLabel} = Rs ${formatNumber(unitCost)} per ${unitLabel}`,
    ``,
    `2. Multiply by ${formatNumber(targetQuantity)} ${unitLabel}:`,
    `Rs ${formatNumber(unitCost)} x ${formatNumber(targetQuantity)} = Rs ${formatNumber(totalCost)}`,
    ``,
    `Check:`,
    `${formatNumber(targetQuantity)} x ${formatNumber(unitCost)} = ${formatNumber(totalCost)}`,
  ].join('\n');
};

const buildBetterUnitCostReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).replace(/,/g, '').replace(/\s+/g, ' ').trim();
  const lower = input.toLowerCase();

  if (!/\b(cost|price)\b/.test(lower) || !/\bfind\b/.test(lower)) {
    return null;
  }

  const buildThingLabel = (quantity: number, unit: string, item?: string) => {
    const parts = [formatNumber(quantity), unit.trim()];
    if (item?.trim()) {
      parts.push(item.trim());
    }
    return parts.join(' ');
  };

  const targetMatch =
    lower.match(/\bfind\s+(?:the\s+)?(?:total\s+)?(?:cost|price)\s+of\s+(\d+(?:\.\d+)?)\s*([a-z]+)(?:\s+([a-z]+))?/i) ??
    lower.match(/\bhow\s+much\s+(?:is|does)\s+(\d+(?:\.\d+)?)\s*([a-z]+)(?:\s+([a-z]+))?\s+(?:cost|price)\b/i);

  if (!targetMatch) {
    return null;
  }

  const givenPatterns = [
    /\b(?:if|when)\s+(\d+(?:\.\d+)?)\s*([a-z]+)(?:\s+([a-z]+))?\s+(?:cost|price)\s+(?:is|=)\s*(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i,
    /\b(?:if|when)\s+(?:the\s+)?(?:cost|price)\s+of\s+(\d+(?:\.\d+)?)\s*([a-z]+)(?:\s+([a-z]+))?\s+(?:is|=)\s*(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i,
    /\b(?:cost|price)\s+of\s+(\d+(?:\.\d+)?)\s*([a-z]+)(?:\s+([a-z]+))?.*?\b(?:is|=)\s*(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i,
    /\b(\d+(?:\.\d+)?)\s*([a-z]+)(?:\s+([a-z]+))?\s+(?:cost|price)\s+(?:is|=)\s*(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i,
  ];

  const givenMatch = givenPatterns
    .map((pattern) => lower.match(pattern))
    .find((match): match is RegExpMatchArray => Boolean(match));

  if (!givenMatch) {
    return null;
  }

  const givenQuantity = Number(givenMatch[1]);
  const givenUnit = (givenMatch[2] || targetMatch[2] || 'unit').toLowerCase();
  const givenItem = (givenMatch[3] ?? '').toLowerCase();
  const givenCost = Number(givenMatch[4]);
  const targetQuantity = Number(targetMatch[1]);
  const targetUnit = (targetMatch[2] || givenUnit || 'unit').toLowerCase();
  const targetItem = (targetMatch[3] ?? '').toLowerCase();

  if (
    !Number.isFinite(givenQuantity) ||
    !Number.isFinite(targetQuantity) ||
    !Number.isFinite(givenCost) ||
    givenQuantity <= 0 ||
    targetQuantity <= 0
  ) {
    return null;
  }

  if (givenUnit !== targetUnit) {
    return null;
  }

  const itemLabel = targetItem || givenItem;
  const unitCost = givenCost / givenQuantity;
  const totalCost = unitCost * targetQuantity;
  const givenLabel = buildThingLabel(givenQuantity, givenUnit, itemLabel);
  const targetLabel = buildThingLabel(targetQuantity, targetUnit, itemLabel);

  if (language === 'NE') {
    return [
      `${targetLabel} ko lagat Rs ${formatNumber(totalCost)} ho.`,
      ``,
      `Yesari garinchha:`,
      ``,
      `1. ${givenLabel} bata 1 ${givenUnit} ko lagat nikalau:`,
      `Rs ${formatNumber(givenCost)} / ${formatNumber(givenQuantity)} = Rs ${formatNumber(unitCost)} per ${givenUnit}`,
      ``,
      `2. Aba ${targetLabel} ko lagat nikalau:`,
      `Rs ${formatNumber(unitCost)} x ${formatNumber(targetQuantity)} = Rs ${formatNumber(totalCost)}`,
      ``,
      `Check:`,
      `${formatNumber(targetQuantity)} x ${formatNumber(unitCost)} = ${formatNumber(totalCost)}`,
    ].join('\n');
  }

  return [
    `The cost of ${targetLabel} is Rs ${formatNumber(totalCost)}.`,
    ``,
    `Here is how we find it:`,
    ``,
    `1. Find the cost of 1 ${givenUnit}:`,
    `Rs ${formatNumber(givenCost)} / ${formatNumber(givenQuantity)} = Rs ${formatNumber(unitCost)} per ${givenUnit}`,
    ``,
    `2. Multiply by ${formatNumber(targetQuantity)}:`,
    `Rs ${formatNumber(unitCost)} x ${formatNumber(targetQuantity)} = Rs ${formatNumber(totalCost)}`,
    ``,
    `Check:`,
    `${formatNumber(targetQuantity)} x ${formatNumber(unitCost)} = ${formatNumber(totalCost)}`,
  ].join('\n');
};

const buildDeterministicMathReply = (question: string, language: Language, subject: SubjectFocus) => {
  const trimmed = question.trim();
  if (!trimmed) {
    return null;
  }

  const isMathLike = subject.id === 'math' || isMathQuestion(trimmed) || isNumericalQuestion(trimmed);
  if (!isMathLike) {
    return null;
  }

  return (
    buildPercentageReply(trimmed, language) ??
    buildBetterUnitCostReply(trimmed, language) ??
    buildUnitCostReply(trimmed, language) ??
    buildPythagorasReply(trimmed, language) ??
    buildFactorizationReply(trimmed, language) ??
    buildSimpleProportionReply(trimmed, language) ??
    buildLinearEquationReply(trimmed, language) ??
    buildArithmeticReply(trimmed, language)
  );
};

const buildScienceConceptReply = (question: string, language: Language) => {
  const input = normalizeDigits(question).toLowerCase();

  if (/\binertia\b|जडत्व/.test(input)) {
    if (language === 'NE') {
      return [
        `जडत्व भनेको वस्तुले आफ्नो अवस्था बदल्न नचाहने गुण हो।`,
        ``,
        `# मुख्य कुरा`,
        `यदि वस्तु रोकिएको छ भने त्यो रोकिएकै रहन खोज्छ।`,
        `यदि वस्तु चलिरहेको छ भने त्यो सोही दिशामा चलिरहन खोज्छ।`,
        ``,
        `# उदाहरण`,
        `बस अचानक रोकिँदा मानिस अगाडि ढल्किनु जडत्वकै कारण हो।`,
        ``,
        `छोटोमा, जडत्व भनेको गति वा विश्रामको अवस्थामा परिवर्तनलाई विरोध गर्ने गुण हो।`,
      ].join('\n');
    }

    return [
      `Inertia is the tendency of an object to resist changes in its state of motion.`,
      ``,
      `# Key idea`,
      `An object at rest tends to stay at rest.`,
      `An object in motion tends to keep moving in the same direction and speed.`,
      ``,
      `# Example`,
      `When a bus stops suddenly, your body moves forward because it was already in motion.`,
      ``,
      `In short, inertia is the resistance to a change in motion.`,
    ].join('\n');
  }

  if (/\bgravity\b|गुरुत्व/.test(input)) {
    if (language === 'NE') {
      return [
        `गुरुत्वाकर्षण भनेको वस्तुहरूलाई एक-अर्कातिर तान्ने प्राकृतिक बल हो।`,
        ``,
        `# मुख्य कुरा`,
        `पृथ्वीले हामीलाई आफ्नो केन्द्रतिर तान्छ, त्यसैले हामी जमिनमा उभिन सक्छौँ।`,
        `त्यसैले माथि फालेको वस्तु फेरि तल झर्छ।`,
        ``,
        `# उदाहरण`,
        `बल तल खस्नु, पानी तल बग्नु, र चन्द्रमा पृथ्वीको वरिपरि घुमिरहनु गुरुत्वाकर्षणका उदाहरण हुन्।`,
      ].join('\n');
    }

    return [
      `Gravity is the force that pulls objects with mass toward each other.`,
      ``,
      `# Key idea`,
      `Earth's gravity pulls us toward the ground, so we can stand and walk.`,
      `It is also why things fall when you drop them.`,
      ``,
      `# Examples`,
      `Apples fall from a tree.`,
      `The Moon stays in orbit around Earth.`,
    ].join('\n');
  }

  if (/\bphotosynthesis\b|प्रकाश\s*संश्लेषण|prakaash/.test(input)) {
    if (language === 'NE') {
      return [
        `प्रकाश संश्लेषण भनेको बिरुवाले सूर्यको प्रकाश प्रयोग गरेर आफ्नो खाना बनाउने प्रक्रिया हो।`,
        ``,
        `# मुख्य कुरा`,
        `यस प्रक्रियामा बिरुवाले पानी र कार्बन डाइअक्साइड प्रयोग गर्छ।`,
        `यसबाट ग्लुकोज बनाइन्छ र अक्सिजन बाहिर निकालिन्छ।`,
        ``,
        `# किन महत्त्वपूर्ण छ`,
        `यसले बिरुवालाई खाना दिन्छ र हामीलाई सास फेर्न अक्सिजन उपलब्ध गराउँछ।`,
      ].join('\n');
    }

    return [
      `Photosynthesis is the process by which plants make their own food using sunlight.`,
      ``,
      `# Key idea`,
      `Plants use sunlight, water, and carbon dioxide to make glucose.`,
      `During this process, they also release oxygen.`,
      ``,
      `# Why it matters`,
      `It helps plants grow and gives living things the oxygen they need.`,
    ].join('\n');
  }

  if ((/\bforce\b|बल/.test(input) && !/\d/.test(input) && !/\bwork\b/.test(input))) {
    if (language === 'NE') {
      return [
        `बल भनेको कुनै वस्तुलाई धकेल्ने वा तान्ने क्रिया हो।`,
        ``,
        `# मुख्य कुरा`,
        `बलले वस्तुको गति, दिशा, वा आकार परिवर्तन गर्न सक्छ।`,
        ``,
        `# उदाहरण`,
        `ढोका धकेल्नु वा डोरी तान्नु बलका उदाहरण हुन्।`,
      ].join('\n');
    }

    return [
      `Force is a push or a pull acting on an object.`,
      ``,
      `# Key idea`,
      `A force can change an object's speed, direction, or shape.`,
      ``,
      `# Examples`,
      `Pushing a door and pulling a rope are both examples of force.`,
    ].join('\n');
  }

  return null;
};

const buildDeterministicStudyReply = (question: string, language: Language, subject: SubjectFocus) => {
  return null;
};

const extractQuestionKeywords = (question: string) => {
  return [...new Set(
    normalizeDigits(question)
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !FILE_ANALYSIS_STOP_WORDS.has(word))
  )].slice(0, 8);
};

const buildTextAttachmentContext = (question: string, fileName: string, content: string) => {
  const cleaned = content
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  if (!cleaned) {
    return `Attached text file: ${fileName}`;
  }

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const paragraphs = cleaned
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const keywords = extractQuestionKeywords(question);
  const title = lines.find((line) => line.length >= 3 && line.length <= 120) ?? fileName;
  const headingCandidates = [...new Set(
    lines.filter((line) => line.length >= 3 && line.length <= 80 && !/[.!?]$/.test(line))
  )].slice(0, 6);

  const conclusionParagraphs = paragraphs.filter((paragraph) =>
    /(conclusion|summary|overall|therefore|finally|in conclusion|in summary|result|findings|निष्कर्ष|सारांश)/i.test(paragraph)
  );

  const relevantParagraphs = keywords.length
    ? paragraphs.filter((paragraph) => {
        const lower = paragraph.toLowerCase();
        return keywords.some((keyword) => lower.includes(keyword));
      })
    : [];

  const selectedParagraphs: string[] = [];
  const pushUniqueParagraph = (paragraph?: string) => {
    if (!paragraph) return;
    const normalized = paragraph.trim();
    if (!normalized) return;
    if (!selectedParagraphs.includes(normalized)) {
      selectedParagraphs.push(normalized);
    }
  };

  paragraphs.slice(0, 2).forEach(pushUniqueParagraph);
  relevantParagraphs.slice(0, 4).forEach(pushUniqueParagraph);
  conclusionParagraphs.slice(0, 2).forEach(pushUniqueParagraph);
  paragraphs.slice(-2).forEach(pushUniqueParagraph);

  let excerptBlock = selectedParagraphs.join('\n\n').slice(0, MAX_ATTACHED_FILE_PROMPT_CHARS);
  if (!excerptBlock) {
    excerptBlock = cleaned.slice(0, MAX_ATTACHED_FILE_PROMPT_CHARS);
  }

  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  return [
    `Attached text file: ${fileName}`,
    `Approx size: ${lines.length} lines, ${wordCount} words.`,
    title ? `Likely title: ${title}` : '',
    headingCandidates.length ? `Likely section headings: ${headingCandidates.join(' | ')}` : '',
    keywords.length ? `Student focus from prompt: ${keywords.join(', ')}` : '',
    conclusionParagraphs[0] ? `Likely conclusion:\n${conclusionParagraphs[0]}` : '',
    `Use the following extracted file content directly when answering:`,
    excerptBlock,
  ]
    .filter(Boolean)
    .join('\n\n');
};

const buildTextAttachmentQuestion = (question: string, fileName: string, content: string) => {
  return [
    'A text file is attached below.',
    '***',
    buildTextAttachmentContext(question, fileName, content),
    '***',
    `Student request: ${question}`,
    'CRITICAL: DO NOT just repeat or return the raw text. You MUST format your response properly.',
    '1. First, explain what the text is about in a short summary.',
    '2. Then, list the key points using bullet points.',
    '3. Finally, if the student asked a specific question, answer it clearly based on the file.',
    'Do not ask the student to attach or resend the file again.',
  ].join('\n');
};

const buildModelPrompt = (
  question: string,
  language: Language,
  grade: string,
  subject: SubjectFocus,
  hasAttachment: boolean
) => {
  // Uses local CDC curriculum matching to inject grade-specific guidelines (Grade 9 vs Grade 10 SEE)
  // and relevant syllabus formulas/definitions without exceeding mobile memory budgets.
  const { conditionedPrompt } = buildConditionedPrompt({
    question,
    grade,
    subjectId: subject?.id,
    language,
    hasAttachment,
  });

  return conditionedPrompt;
};

const getLatestAssistantMessage = (sessions: ChatSession[]) => {
  for (const session of sessions) {
    const message = [...(session.messages ?? [])]
      .reverse()
      .find((item) => !item.isUser && !item.isPending && typeof item.text === 'string' && item.text.trim());
    if (message) {
      return message.text ?? '';
    }
  }

  return '';
};

const getLatestAssistantMessageFromMessages = (messages: Message[]) => {
  const message = [...(messages ?? [])]
    .reverse()
    .find((item) => !item.isUser && !item.isPending && typeof item.text === 'string' && item.text.trim());
  return message?.text ?? '';
};

const normalizeSingleLine = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeQuizQuestionKey = (value: string) =>
  normalizeSingleLine(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const getQuizContextKey = (language: Language, grade: string, subject: SubjectFocus) =>
  `${language}:${grade}:${subject.id}`;

const normalizeTutorTextBase = (text: string) => {
  const pathSalaToken = '__PATHSALA_BRAND__';
  let cleaned = stripReasoningPrefix(text)
    .replace(/\r/g, '\n')
    .replace(/\u2581/g, ' ')
    .replace(/\bpaath\s*\.?\s*sala\b/gi, pathSalaToken)
    .replace(/\bpath\s*\.?\s*sala\b/gi, pathSalaToken)
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\\item/g, '- ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  cleaned = cleaned
    .replace(/([.!?।])(?=[A-Za-z\u0900-\u097F])/g, '$1 ')
    .replace(/([a-z\u0900-\u097F])([A-Z])/g, '$1 $2')
    .replace(/([)\]])([A-Za-z\u0900-\u097F])/g, '$1 $2')
    .replace(/\n(\d+\.)\s*\n+/g, '\n$1 ')
    .replace(/([^\n])\n(\d+\.)/g, '$1\n\n$2 ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return cleaned.replace(new RegExp(pathSalaToken, 'g'), 'Guru');
};

const collapseAdjacentDuplicateLines = (text: string) => {
  const deduped: string[] = [];
  let previousNormalized = '';

  for (const line of text.split('\n')) {
    const normalized = normalizeSingleLine(line).toLowerCase();
    if (normalized && normalized === previousNormalized) {
      continue;
    }

    deduped.push(line.trimEnd());
    previousNormalized = normalized;
  }

  return deduped.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const collapseAdjacentDuplicateSentences = (text: string) => {
  const parts = text
    .split(/(?<=[.!?।])\s+|\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const filtered: string[] = [];
  let previousNormalized = '';

  for (const part of parts) {
    const normalized = normalizeSingleLine(part).toLowerCase();
    if (normalized && normalized === previousNormalized) {
      continue;
    }

    filtered.push(part);
    previousNormalized = normalized;
  }

  return filtered.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
};

const hasRepeatingTail = (text: string) => {
  const lines = text
    .split('\n')
    .map((line) => normalizeSingleLine(line).toLowerCase())
    .filter(Boolean);

  if (lines.length < 3) {
    return false;
  }

  const last = lines[lines.length - 1];
  return last.length > 12 && lines.slice(-3).every((line) => line === last);
};

const isGeneralFollowUpPrompt = (question: string) => {
  const normalized = normalizeDigits(question)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return false;
  }

  const followUpPatterns = [
    /\b(this|that|it|same|again|continue|next|previous|above|below|too|also)\b/,
    /\b(explain more|more detail|more details|more clearly|in simple words|in nepali|in english)\b/,
    /\b(another example|one more example|why is that|how so|what about)\b/,
    /^\s*(and|also|then|now|okay|ok)\b/,
  ];

  return followUpPatterns.some((pattern) => pattern.test(normalized));
};

const formatStudyResponseForDisplay = (text: string, subject: SubjectFocus) => {
  let cleaned = normalizeTutorTextBase(text)
    .replace(/^(?:#\s*)?(?:answer|response|reply|explanation)\s*:?\s*/i, '')
    .replace(/\n\s*(?:#\s*)?(?:answer|response|reply|explanation)\s*:?\s*/gi, '\n')
    .replace(/\b([A-Za-z\u0900-\u097F]{3,})\b(?:\s+\1){3,}/gi, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (subject.id === 'science') {
    cleaned = cleaned
      .replace(/^\s*#{1,6}\s*.*$/gm, '')
      .replace(/^\s*-\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  cleaned = collapseAdjacentDuplicateLines(cleaned);
  cleaned = collapseAdjacentDuplicateSentences(cleaned);

  return cleaned;
};

const hasUsableAssistantText = (text: string, uiCopy: (typeof copy)['EN']) => {
  const normalized = normalizeSingleLine(text).toLowerCase();
  if (!normalized) {
    return false;
  }

  const blocked = [
    normalizeSingleLine(uiCopy.thinkingLabel).toLowerCase(),
    normalizeSingleLine(uiCopy.responseEmpty).toLowerCase(),
    normalizeSingleLine(uiCopy.responseStopped).toLowerCase(),
  ];

  return !blocked.includes(normalized);
};

const isCasualPrompt = (question: string) => {
  const normalized = normalizeDigits(question)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s?!.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return false;
  }

  const casualPatterns = [
    /\b(hi|hello|hey|namaste|good morning|good evening)\b/,
    /\b(how are you|how r you|how do you do)\b/,
    /\b(what is your name|whats your name|who are you|tell me your name)\b/,
    /\b(thank you|thanks|ok thanks|bye|goodbye|see you)\b/,
    /\b(help me|can you help me)\b(?!.*\b(?:solve|explain|what is|define|difference|grammar|math|science|computer|social|nepali|english)\b)/,
  ];

  return casualPatterns.some((pattern) => pattern.test(normalized));
};

const getFirstNonEmptyLine = (value: string) =>
  value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)[0] ?? '';

const extractLabeledBlock = (text: string, label: string) => {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*${label}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:Question|Working|Step \\d+|Answer|Check|Key takeaway|Final answer)\\s*:|$)`,
    'i'
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? '';
};

const isStructuredMathResponse = (text: string) =>
  /(?:^|\n)\s*(Question|Working|Step \d+|Answer|Check|Key takeaway|Final answer)\s*:/i.test(text) ||
  isMathQuestion(text) ||
  isNumericalQuestion(text);

const extractMathTakeaway = (cleanText: string) => {
  if (!cleanText) {
    return '';
  }

  const explicitTakeaway = extractLabeledBlock(cleanText, 'Key takeaway');
  if (explicitTakeaway) {
    const firstLine = getFirstNonEmptyLine(explicitTakeaway);
    if (firstLine) {
      return normalizeSingleLine(firstLine);
    }
  }

  const answerBlock = extractLabeledBlock(cleanText, 'Answer') || extractLabeledBlock(cleanText, 'Final answer');
  if (answerBlock) {
    const firstLine = getFirstNonEmptyLine(answerBlock);
    if (firstLine) {
      return normalizeSingleLine(firstLine);
    }
  }

  const connectorMatch = cleanText.match(/(?:therefore|so|hence|thus)[,:]?\s*([^\n.?!]+)/i);
  if (connectorMatch?.[1]?.trim()) {
    return normalizeSingleLine(connectorMatch[1]);
  }

  const lines = cleanText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const answerLine =
    [...lines].reverse().find((line) => {
      if (/^(question|working|step \d+|answer|check|key takeaway|final answer)\s*:/i.test(line)) {
        return false;
      }
      return /(?:=|=>|â†’|Ã·|Ã—|sqrt|x\^|y\^)/.test(line) || /\b(?:x|y|z)\s*=/.test(line) || /\d/.test(line);
    }) ?? '';

  if (answerLine) {
    return normalizeSingleLine(answerLine);
  }

  return normalizeSingleLine(lines[0] ?? cleanText);
};

const extractKeySentence = (text: string) => {
  const cleanText = formatModelText(text);
  if (!cleanText) {
    return '';
  }

  if (isStructuredMathResponse(cleanText)) {
    const mathTakeaway = extractMathTakeaway(cleanText);
    if (mathTakeaway) {
      return mathTakeaway;
    }
  }

  const takeawayMatch = cleanText.match(/key\s*takeaway\s*:\s*(.+)/i);
  if (takeawayMatch && takeawayMatch[1].trim()) {
    return takeawayMatch[1].trim();
  }

  const finalAnswerMatch = cleanText.match(/final\s*answer\s*:\s*(.+)/i);
  if (finalAnswerMatch && finalAnswerMatch[1].trim()) {
    return finalAnswerMatch[1].trim();
  }

  const answerMatch = cleanText.match(/(?:therefore|so|hence|thus)[,:]?\s*(.+?)(?:\.|$)/i);
  if (answerMatch && answerMatch[1].trim().length > 10) {
    return answerMatch[1].trim();
  }

  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return sentences[0] ?? cleanText;
};

const extractImportantTerms = (text: string, subject: SubjectFocus) => {
  const cleanText = formatModelText(text);
  const lower = cleanText.toLowerCase();
  const keywordMatches = subject.keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  const mathTakeaway = isStructuredMathResponse(cleanText) ? extractMathTakeaway(cleanText) : '';
  const takeawayWords =
    (mathTakeaway || extractKeySentence(cleanText))
      .match(/[A-Za-z][A-Za-z'-]{4,}|[\u0900-\u097F]{3,}/g)
      ?.map((term) => term.trim()) ?? [];
  const textWords =
    cleanText
      .match(/[A-Za-z][A-Za-z'-]{5,}|[\u0900-\u097F]{4,}/g)
      ?.map((term) => term.trim()) ?? [];

  const stopWords = new Set([
    'answer',
    'question',
    'because',
    'about',
    'their',
    'there',
    'while',
    'would',
    'should',
    'could',
    'student',
    'class',
    'subject',
    'today',
    'thing',
    'these',
    'those',
    'using',
    'this',
    'that',
    'with',
    'from',
  ]);

  return [...new Set([...keywordMatches, ...takeawayWords, ...textWords])]
    .map((term) => term.trim())
    .filter((term) => term.length > 2)
    .filter((term) => !stopWords.has(term.toLowerCase()))
    .slice(0, 6);
};

const formatCasualResponseForDisplay = (text: string) => {
  return normalizeTutorTextBase(text)
    .replace(/^(?:#\s*)?(?:answer|reply|response)\s*:?\s*/i, '')
    .replace(/\n\s*(?:#\s*)?(?:answer|reply|response)\s*:?\s*/gi, '\n')
    .replace(/^(?:#\s*)?(?:example|examples|explanation)\s*:?\s*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const calculateDailyStreak = (sessions: ChatSession[]) => {
  const dateKeys = [...new Set(sessions.map((session) => new Date(session.updatedAt).toDateString()))].sort(
    (left, right) => new Date(right).getTime() - new Date(left).getTime()
  );

  if (dateKeys.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < dateKeys.length; index += 1) {
    const previous = new Date(dateKeys[index - 1]);
    const current = new Date(dateKeys[index]);
    const diffDays = Math.round((previous.getTime() - current.getTime()) / 86400000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const buildQuizQuestion = (language: Language, grade: string, subject: SubjectFocus, version: number): QuizQuestion => {
  const currentGrade = gradeNumber(grade);
  const isJunior = currentGrade <= 5;
  const isMiddle = currentGrade >= 6 && currentGrade <= 8;
  const pickQuestion = (questions: QuizQuestion[]) => questions[version % questions.length];

  switch (subject.id) {
    case 'math':
      return pickQuestion(
        isJunior
          ? [
              {
                question: language === 'NE' ? '24 lai 6 le bhaag garda kati?' : 'What is 24 divided by 6?',
                options: ['2', '3', '4', '6'],
                correctIndex: 2,
                explanation: language === 'NE' ? '24 / 6 = 4 hunchha.' : '24 / 6 = 4.',
              },
              {
                question: language === 'NE' ? '7 + 8 kati ho?' : 'What is 7 + 8?',
                options: ['13', '14', '15', '16'],
                correctIndex: 2,
                explanation: language === 'NE' ? '7 ra 8 jodda 15 hunchha.' : '7 + 8 = 15.',
              },
            ]
          : isMiddle
            ? [
                {
                  question: language === 'NE' ? 'x + 7 = 15 bhaye x kati?' : 'If x + 7 = 15, what is x?',
                  options: ['6', '7', '8', '9'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? '15 bata 7 ghatada x = 8 hunchha.' : 'Subtract 7 from 15, so x = 8.',
                },
                {
                  question: language === 'NE' ? '3/4 ko decimal value kati ho?' : 'What is 3/4 as a decimal?',
                  options: ['0.25', '0.5', '0.75', '1.25'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? '3 / 4 = 0.75 hunchha.' : '3 / 4 = 0.75.',
                },
              ]
            : [
                {
                  question: language === 'NE' ? '15% of 200 kati ho?' : 'What is 15% of 200?',
                  options: ['20', '25', '30', '35'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? '10% = 20 ra 5% = 10, jodda 30 hunchha.' : '10% is 20 and 5% is 10, so the total is 30.',
                },
                {
                  question: language === 'NE' ? '2x = 18 bhaye x kati?' : 'If 2x = 18, what is x?',
                  options: ['6', '7', '8', '9'],
                  correctIndex: 3,
                  explanation: language === 'NE' ? '18 lai 2 le bhaag garda x = 9 hunchha.' : 'Divide 18 by 2, so x = 9.',
                },
              ]
      );
    case 'science':
      return pickQuestion(
        isJunior
          ? [
              {
                question: language === 'NE' ? 'Biruwale khana banauna kun energy use garchha?' : 'What energy do plants use to make food?',
                options: language === 'NE' ? ['Hawa', 'Sunlight', 'Mato', 'Dhunga'] : ['Air', 'Sunlight', 'Soil', 'Stone'],
                correctIndex: 1,
                explanation: language === 'NE' ? 'Plants use sunlight for photosynthesis.' : 'Plants use sunlight for photosynthesis.',
              },
              {
                question: language === 'NE' ? 'Manche le swas lina kun gas chahinchha?' : 'Which gas do humans need to breathe?',
                options: language === 'NE' ? ['Hydrogen', 'Oxygen', 'Nitrogen', 'Helium'] : ['Hydrogen', 'Oxygen', 'Nitrogen', 'Helium'],
                correctIndex: 1,
                explanation: language === 'NE' ? 'Swas lina oxygen chahinchha.' : 'Humans need oxygen to breathe.',
              },
            ]
          : isMiddle
            ? [
                {
                  question: language === 'NE' ? 'Pani umlida kun state ma janchha?' : 'When water boils, what state does it become?',
                  options: ['Solid', 'Liquid', 'Gas', 'Ice'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? 'Boiling le water lai gas ma badalchha.' : 'Boiling turns water into gas.',
                },
                {
                  question: language === 'NE' ? 'Kun organ le ragat pump garchha?' : 'Which organ pumps blood in the body?',
                  options: language === 'NE' ? ['Liver', 'Lungs', 'Heart', 'Kidney'] : ['Liver', 'Lungs', 'Heart', 'Kidney'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? 'Heart le ragat pump garchha.' : 'The heart pumps blood.',
                },
              ]
            : [
                {
                  question: language === 'NE' ? 'Acid ra base reaction bata ke banna sakchha?' : 'What can form when an acid reacts with a base?',
                  options: ['Salt and water', 'Only gas', 'Only metal', 'Ice'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Neutralization reaction le salt ra water dina sakchha.' : 'Neutralization can produce salt and water.',
                },
                {
                  question: language === 'NE' ? 'Force ko SI unit kun ho?' : 'What is the SI unit of force?',
                  options: ['Joule', 'Newton', 'Watt', 'Pascal'],
                  correctIndex: 1,
                  explanation: language === 'NE' ? 'Force ko SI unit Newton ho.' : 'The SI unit of force is Newton.',
                },
              ]
      );
    case 'english':
      return pickQuestion(
        isJunior
          ? [
              {
                question: language === 'NE' ? '"This is ___ book." ma sahi word kun ho?' : 'Choose the correct word: "This is ___ book."',
                options: ['I', 'me', 'my', 'mine'],
                correctIndex: 2,
                explanation: language === 'NE' ? 'Possessive adjective "my" thik ho.' : 'The possessive adjective "my" is correct.',
              },
              {
                question: language === 'NE' ? '"They ___ happy." ma sahi word kun ho?' : 'Choose the correct word: "They ___ happy."',
                options: ['is', 'am', 'are', 'be'],
                correctIndex: 2,
                explanation: language === 'NE' ? '"They" sanga "are" use hunchha.' : 'Use "are" with "they".',
              },
            ]
          : isMiddle
            ? [
                {
                  question: language === 'NE' ? '"She ___ to school every day." ma sahi word kun ho?' : 'Choose the correct word: "She ___ to school every day."',
                  options: ['go', 'goes', 'going', 'gone'],
                  correctIndex: 1,
                  explanation: language === 'NE' ? '"goes" third-person singular simple present ho.' : '"goes" matches third-person singular in the simple present.',
                },
                {
                  question: language === 'NE' ? 'Synonym of "happy" kun ho?' : 'Which is a synonym of "happy"?',
                  options: ['sad', 'angry', 'joyful', 'tired'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? '"joyful" ko artha "happy" sanga milchha.' : '"Joyful" is a synonym of "happy".',
                },
              ]
            : [
                {
                  question: language === 'NE' ? '"If he ___ hard, he will pass." ma sahi word kun ho?' : 'Choose the correct word: "If he ___ hard, he will pass."',
                  options: ['study', 'studies', 'studied', 'studying'],
                  correctIndex: 1,
                  explanation: language === 'NE' ? 'Singular subject sanga "studies" use hunchha.' : 'Use "studies" with a singular subject here.',
                },
                {
                  question: language === 'NE' ? 'Passive voice ma subject ko opposite role ke hunchha?' : 'In passive voice, what takes the action role opposite to the subject?',
                  options: ['Object', 'Adverb', 'Tense', 'Comma'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Passive voice bujhda object ko role mahatwapurna hunchha.' : 'The object role matters when understanding passive voice.',
                },
              ]
      );
    case 'nepali':
      return pickQuestion(
        isJunior
          ? [
              {
                question: language === 'NE' ? '"Pustakalaya" ko artha ke ho?' : 'What does "pustakalaya" mean?',
                options: language === 'NE' ? ['Ghar', 'School', 'Library', 'Mandir'] : ['House', 'School', 'Library', 'Temple'],
                correctIndex: 2,
                explanation: language === 'NE' ? '"Pustakalaya" bhaneko library ho.' : '"Pustakalaya" means library.',
              },
              {
                question: language === 'NE' ? '"Aama" kun prakarko shabda ho?' : 'What kind of word is "Aama"?',
                options: language === 'NE' ? ['Naam', 'Kriyapad', 'Visheshan', 'Sankhya'] : ['Noun', 'Verb', 'Adjective', 'Number'],
                correctIndex: 0,
                explanation: language === 'NE' ? '"Aama" euta naam ho.' : '"Aama" is a noun.',
              },
            ]
          : isMiddle
            ? [
                {
                  question: language === 'NE' ? 'Vakya ma kriyapad kun ho? "Ram kitab padhchha."' : 'In the sentence "Ram reads a book," which is the verb?',
                  options: language === 'NE' ? ['Ram', 'kitab', 'padhchha', 'kunai pani hoina'] : ['Ram', 'book', 'reads', 'none'],
                  correctIndex: 2,
                  explanation: language === 'NE' ? '"padhchha" le kaam dekhauchha, tesaile yo kriyapad ho.' : '"reads" shows the action, so it is the verb.',
                },
                {
                  question: language === 'NE' ? '"Ramro" kun prakarko shabda ho?' : 'What kind of word is "Ramro"?',
                  options: language === 'NE' ? ['Visheshan', 'Naam', 'Sarbanam', 'Kriyapad'] : ['Adjective', 'Noun', 'Pronoun', 'Verb'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? '"Ramro" le gun batanchha, tesaile yo visheshan ho.' : '"Ramro" describes quality, so it is an adjective.',
                },
              ]
            : [
                {
                  question: language === 'NE' ? 'Nibandha lekhda sabai bhanda pahila ke clear huna parchha?' : 'When writing an essay, what should be clear first?',
                  options: language === 'NE' ? ['Mukhyabishaya', 'Page color', 'Pen brand', 'Date matra'] : ['Main topic', 'Page color', 'Pen brand', 'Only the date'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Ramro nibandha ko lagi mukhyabishaya clear huna parchha.' : 'A good essay begins with a clear main topic.',
                },
                {
                  question: language === 'NE' ? 'Byakhya lekhda ke kura ma dhyan dinu parchha?' : 'What matters most while writing an explanation?',
                  options: language === 'NE' ? ['Spashtata', 'Pen color', 'Margin matra', 'Speed matra'] : ['Clarity', 'Pen color', 'Only margin', 'Only speed'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Byakhya ma spashtata sabai bhanda mahatwapurna hunchha.' : 'Clarity matters most in an explanation.',
                },
              ]
      );
    case 'social':
      return pickQuestion(
        isJunior
          ? [
              {
                question: language === 'NE' ? 'Nepal ko capital kun ho?' : 'What is the capital of Nepal?',
                options: ['Pokhara', 'Lalitpur', 'Kathmandu', 'Dharan'],
                correctIndex: 2,
                explanation: language === 'NE' ? 'Nepal ko capital Kathmandu ho.' : 'Kathmandu is the capital of Nepal.',
              },
              {
                question: language === 'NE' ? 'Hamro desh ko naam ke ho?' : 'What is the name of our country?',
                options: ['India', 'Bhutan', 'Nepal', 'China'],
                correctIndex: 2,
                explanation: language === 'NE' ? 'Hamro desh Nepal ho.' : 'Our country is Nepal.',
              },
            ]
          : isMiddle
            ? [
                {
                  question: language === 'NE' ? 'Map ma north kun direction ma hunchha?' : 'On a standard map, where is north?',
                  options: language === 'NE' ? ['Tal', 'Mathi', 'Dahine', 'Baye'] : ['Bottom', 'Top', 'Right', 'Left'],
                  correctIndex: 1,
                  explanation: language === 'NE' ? 'Sadharan map ma north mathi dekhaiyeko hunchha.' : 'On a standard map, north is shown at the top.',
                },
                {
                  question: language === 'NE' ? 'Nagarik ko euta jimmewari ke ho?' : 'What is one duty of a citizen?',
                  options: language === 'NE' ? ['Jimmewari sahit sahabhagi hune', 'Kehi nagarne', 'Sadhai rule todne', 'Arulai rokne'] : ['Participate responsibly', 'Do nothing', 'Always break rules', 'Stop others only'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Ramro nagarik le jimmewari sahit bhag linchha.' : 'A good citizen participates responsibly.',
                },
              ]
            : [
                {
                  question: language === 'NE' ? 'Loktantra ma nagarik ko ke bhumika hunchha?' : 'What is a citizen expected to do in a democracy?',
                  options: language === 'NE' ? ['Kehi nagarne', 'Jimmewari sahit bhag line', 'Matra herne', 'Sadhai chup basne'] : ['Do nothing', 'Participate responsibly', 'Only watch', 'Always stay silent'],
                  correctIndex: 1,
                  explanation: language === 'NE' ? 'Loktantra ma nagarik ko jimmewari sahit sahabhagi huna jaruri chha.' : 'Democracy depends on responsible citizen participation.',
                },
                {
                  question: language === 'NE' ? 'Samvidhan ko mukhya kaam ke ho?' : 'What is a constitution mainly for?',
                  options: language === 'NE' ? ['Desh ko mool niyam batauna', 'Mausam badalna', 'Paisa chapna', 'Exam janchna'] : ['Set the basic rules of the country', 'Change the weather', 'Print money', 'Check exams'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Samvidhan le desh ko mool niyam ra dhancha batanchha.' : 'A constitution sets the basic rules and structure of a country.',
                },
              ]
      );
    case 'computer':
      return pickQuestion(
        isJunior
          ? [
              {
                question: language === 'NE' ? 'Keyboard kun type ko device ho?' : 'What kind of device is a keyboard?',
                options: ['Input', 'Output', 'Storage', 'Network'],
                correctIndex: 0,
                explanation: language === 'NE' ? 'Keyboard input device ho.' : 'A keyboard is an input device.',
              },
              {
                question: language === 'NE' ? 'Mouse le ke garna madat garchha?' : 'What does a mouse help you do?',
                options: language === 'NE' ? ['Tap and point', 'Cook food', 'Print book', 'Charge battery only'] : ['Point and click', 'Cook food', 'Print a book', 'Only charge a battery'],
                correctIndex: 0,
                explanation: language === 'NE' ? 'Mouse le point ra click garna madat garchha.' : 'A mouse helps you point and click.',
              },
            ]
          : isMiddle
            ? [
                {
                  question: language === 'NE' ? 'CPU ko full form ke ho?' : 'What does CPU stand for?',
                  options: ['Central Process Unit', 'Central Processing Unit', 'Computer Power Unit', 'Core Program Unit'],
                  correctIndex: 1,
                  explanation: language === 'NE' ? 'CPU bhaneko Central Processing Unit ho.' : 'CPU stands for Central Processing Unit.',
                },
                {
                  question: language === 'NE' ? 'Browser ko prayog ke ko lagi hunchha?' : 'What is a browser used for?',
                  options: language === 'NE' ? ['Internet herna', 'Kapda dhuna', 'Photo silna', 'Pankha chalna'] : ['Using the internet', 'Washing clothes', 'Sewing photos', 'Running a fan'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Browser internet herna ra websites kholna use hunchha.' : 'A browser is used to open websites and browse the internet.',
                },
              ]
            : [
                {
                  question: language === 'NE' ? 'Kun chai programming language ho?' : 'Which one is a programming language?',
                  options: ['Python', 'Monitor', 'Keyboard', 'Folder'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Python euta programming language ho.' : 'Python is a programming language.',
                },
                {
                  question: language === 'NE' ? 'Algorithm ko best short meaning ke ho?' : 'What is the best short meaning of an algorithm?',
                  options: language === 'NE' ? ['Step-by-step method', 'Computer ko color', 'Screen ko size', 'Battery ko type'] : ['A step-by-step method', 'The color of a computer', 'The size of a screen', 'The type of a battery'],
                  correctIndex: 0,
                  explanation: language === 'NE' ? 'Algorithm bhaneko step-by-step solution ho.' : 'An algorithm is a step-by-step way to solve a problem.',
                },
              ]
      );
    default:
      return {
        question: language === 'NE' ? 'Aaja ko topic ko euta key fact ke ho?' : 'What is one key fact from todayÃ¢â‚¬â„¢s topic?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: language === 'NE' ? 'Aaja padhda euta key fact yaad rakhnu sabai bhanda important ho.' : 'Remembering one key fact from today is a great start.',
      };
  }
};

const buildQuizGenerationPrompt = (
  language: Language,
  grade: string,
  subject: SubjectFocus,
  recentQuestions: string[]
) => {
  const subjectTitle = subject.title;
  const languageRule =
    language === 'NE'
      ? 'Write everything only in Nepali script.'
      : 'Write everything only in English.';
  const uniquenessRule =
    recentQuestions.length > 0
      ? `Do not repeat these previous quiz questions: ${recentQuestions.join(' | ')}`
      : 'Make the quiz feel fresh and not like a repeated question.';
  const mathRule =
    subject.id === 'math'
      ? 'For math, use exact numbers, keep the arithmetic correct, and avoid trick wording.'
      : `Make it a clear ${subjectTitle} question for grade ${grade}.`;

  return [
    `Create one fresh multiple-choice quiz for grade ${grade} in ${subjectTitle}.`,
    languageRule,
    mathRule,
    uniquenessRule,
    'Return only these 7 lines and nothing else:',
    'Question: ...',
    'A) ...',
    'B) ...',
    'C) ...',
    'D) ...',
    'Correct: A or B or C or D',
    'Explanation: ...',
    'Rules: keep it short, school-level, and make exactly one choice correct.',
  ].join('\n');
};

const parseGeneratedQuiz = (rawText: string): QuizQuestion | null => {
  const cleaned = stripReasoningPrefix(rawText)
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<QuizQuestion>;
    if (typeof parsed.question !== 'string' || !parsed.question.trim()) {
      return null;
    }

    if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
      return null;
    }

    const options = parsed.options
      .map((option) => (typeof option === 'string' ? option.trim() : ''))
      .filter(Boolean);

    if (options.length !== 4) {
      return null;
    }

    const correctIndex = Number(parsed.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      return null;
    }

    const explanation =
      typeof parsed.explanation === 'string' && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : 'Review the question once more and compare the choices carefully.';

    return {
      question: parsed.question.trim(),
      options,
      correctIndex,
      explanation,
    };
  } catch (_) {
    const normalized = cleaned
      .replace(/\r/g, '')
      .replace(/^\s*[-*]\s*/gm, '')
      .trim();

    const questionMatch = normalized.match(/Question:\s*(.+)/i);
    const optionMatches = [...normalized.matchAll(/^(A|B|C|D)[).:\-]\s*(.+)$/gim)];
    const correctMatch = normalized.match(/Correct:\s*([ABCD])/i);
    const explanationMatch = normalized.match(/Explanation:\s*(.+)/i);

    if (!questionMatch || optionMatches.length !== 4 || !correctMatch) {
      return null;
    }

    const optionMap = new Map<string, string>();
    for (const match of optionMatches) {
      const letter = match[1].toUpperCase();
      const text = match[2].trim();
      if (text) {
        optionMap.set(letter, text);
      }
    }

    const orderedLetters = ['A', 'B', 'C', 'D'] as const;
    const options = orderedLetters.map((letter) => optionMap.get(letter) ?? '').filter(Boolean);
    if (options.length !== 4) {
      return null;
    }

    const correctLetter = correctMatch[1].toUpperCase();
    const correctIndex = orderedLetters.indexOf(correctLetter as (typeof orderedLetters)[number]);
    if (correctIndex < 0) {
      return null;
    }

    return {
      question: questionMatch[1].trim(),
      options,
      correctIndex,
      explanation:
        explanationMatch?.[1]?.trim() ||
        'Review the question once more and compare the choices carefully.',
    };
  }
};
const buildStudyPlan = (language: Language, grade: string, subject: SubjectFocus): PlanStep[] => {
  const currentGrade = gradeNumber(grade);
  const isJunior = currentGrade <= 5;
  const isMiddle = currentGrade >= 6 && currentGrade <= 8;

  switch (subject.id) {
    case 'math':
      return [
        {
          title: language === 'NE' ? 'Rule chito hera' : 'Check the rule',
          detail:
            language === 'NE'
              ? isJunior
                ? 'Aaja ko chapter ko euta basic rule 1 minute ma hera.'
                : isMiddle
                  ? 'Main formula ya step 2 minute ma revise gara.'
                  : 'Important formula ra shortcut lai exam style ma revise gara.'
              : isJunior
                ? "Revise one basic rule from today's chapter in one minute."
                : isMiddle
                  ? 'Revise the main formula or method in two minutes.'
                  : 'Revise the important formulas and shortcuts in exam style.',
        },
        {
          title: language === 'NE' ? 'Euta example bujha' : 'Understand one example',
          detail:
            language === 'NE'
              ? 'Solved example herera kina step bhayo bhanera bujha.'
              : 'Read one solved example and notice why each step happens.',
        },
        {
          title: language === 'NE' ? 'Afai practice gara' : 'Practice by yourself',
          detail:
            language === 'NE'
              ? 'Tyastai type ko 1 question afai solve gara.'
              : 'Solve one similar problem on your own.',
        },
      ];
    case 'science':
      return [
        {
          title: language === 'NE' ? 'Main concept samjha' : 'Recall the concept',
          detail:
            language === 'NE'
              ? isJunior
                ? 'Concept lai 2 line ma simple bhasha ma samjha.'
                : isMiddle
                  ? 'Concept, process, ra euta example note gara.'
                  : 'Concept, cause-effect, ra possible exam point note gara.'
              : isJunior
                ? 'Explain the concept in two simple lines.'
                : isMiddle
                  ? 'Note the concept, the process, and one example.'
                  : 'Note the concept, cause-effect link, and one exam point.',
        },
        {
          title: language === 'NE' ? 'Real-life example joda' : 'Add one real-life example',
          detail:
            language === 'NE'
              ? 'Yo idea jindagi ma kahaan dekhna sakinchha bhanera socha.'
              : 'Think of one place you can see this idea in real life.',
        },
        {
          title: language === 'NE' ? 'Quick recap' : 'Quick recap',
          detail:
            language === 'NE'
              ? 'Key words ra process ekchoti feri hera.'
              : 'Review the key words and process once more.',
        },
      ];
    case 'english':
    case 'nepali':
      return [
        {
          title: language === 'NE' ? 'Key words tipa' : 'Pick key words',
          detail:
            language === 'NE'
              ? 'Aaja padheko 3 words wa phrase ra tesko meaning note gara.'
              : "Note 3 useful words or phrases from today's lesson with their meanings.",
        },
        {
          title: language === 'NE' ? 'Sentence bana' : 'Make a sentence',
          detail:
            language === 'NE'
              ? isJunior
                ? 'Euta naya word use garera sajilo sentence bana.'
                : isMiddle
                  ? 'Naya word use garera ramro sentence lekha.'
                  : 'Naya word ya idea use garera stronger sentence wa line lekha.'
              : isJunior
                ? 'Use one new word in a simple sentence.'
                : isMiddle
                  ? 'Use one new word in a strong sentence.'
                  : 'Use a new word or idea in a stronger sentence or line.',
        },
        {
          title: language === 'NE' ? 'Read aloud once' : 'Read aloud once',
          detail:
            language === 'NE'
              ? 'Choto paragraph ekpatak thulo swor ma padha.'
              : 'Read one short paragraph aloud once.',
        },
      ];
    case 'social':
      return [
        {
          title: language === 'NE' ? 'Fact samjha' : 'Recall the fact',
          detail:
            language === 'NE'
              ? 'Aaja ko main fact wa topic 2 line ma samjha.'
              : "Recall today's main fact or topic in two lines.",
        },
        {
          title: language === 'NE' ? 'Reason joda' : 'Add the reason',
          detail:
            language === 'NE'
              ? currentGrade >= 9
                ? 'Yo kura kina mahatwapurna chha bhanera exam style ma socha.'
                : 'Yo kura kina hunchha wa kina mahatwapurna chha bhanera socha.'
              : currentGrade >= 9
                ? 'Think about why it matters in exam-style language.'
                : 'Think about why it happens or why it matters.',
        },
        {
          title: language === 'NE' ? 'Nepal sanga joda' : 'Connect it to Nepal',
          detail:
            language === 'NE'
              ? 'Yo topic Nepal ko context ma kata milchha bhanera hera.'
              : 'Connect the topic to one Nepal context example.',
        },
      ];
    case 'computer':
      return [
        {
          title: language === 'NE' ? 'Device wa idea chin' : 'Identify the idea',
          detail:
            language === 'NE'
              ? isJunior
                ? 'Aaja sikeko device wa tool ko naam ra kaam yaad gara.'
                : 'Aaja sikeko tool, concept, wa shortcut ko kaam yaad gara.'
              : isJunior
                ? 'Remember the device name and what it does.'
                : 'Remember the tool, concept, or shortcut and what it does.',
        },
        {
          title: language === 'NE' ? 'Real example hera' : 'Use a real example',
          detail:
            language === 'NE'
              ? 'Phone, laptop, wa internet ma yo kura kahaan dekhchhau bhanera socha.'
              : 'Think of where you see this on a phone, laptop, or internet app.',
        },
        {
          title: language === 'NE' ? 'Safe practice gara' : 'Do one safe practice task',
          detail:
            language === 'NE'
              ? currentGrade >= 9
                ? 'Euta small logic, coding, wa digital task practice gara.'
                : 'Euta safe digital task, file kaam, wa typing practice gara.'
              : currentGrade >= 9
                ? 'Practice one small logic, coding, or digital task.'
                : 'Practice one safe digital task, file step, or typing task.',
        },
      ];
    default:
      return [
        {
          title: language === 'NE' ? 'Main idea samjha' : 'Recall the main idea',
          detail:
            language === 'NE'
              ? `Aaja ko ${subject.title} ko main idea 2 line ma samjha.`
              : `Recall today's main ${subject.title} idea in two short lines.`,
        },
        {
          title: language === 'NE' ? 'Real example khoja' : 'Find one real example',
          detail:
            language === 'NE'
              ? 'Yo concept ko euta real-life example socha.'
              : 'Think of one real-life example of this concept.',
        },
        {
          title: language === 'NE' ? 'Short revision' : 'Short revision',
          detail:
            language === 'NE'
              ? '2 minute ma key terms feri hera.'
              : 'Spend two minutes revising the key terms.',
        },
      ];
  }
};
export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [language, setLanguage] = useState<Language>('EN');
  const [screen, setScreen] = useState<ScreenState>('onboarding');
  const [activeTab, setActiveTab] = useState<TabState>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelStatus, setModelStatus] = useState('Initializing LiteRT-LM...');
  const [isModelReady, setIsModelReady] = useState(false);
  const [resolvedModelPath, setResolvedModelPath] = useState<string | null>(null);
  const [selectedModelFolderUri, setSelectedModelFolderUri] = useState<string | null>(null);
  const [isModelSetupBusy, setIsModelSetupBusy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('science');
  const [quizVersion, setQuizVersion] = useState(0);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion | null>(null);
  const [isQuizRefreshing, setIsQuizRefreshing] = useState(false);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const chatListRef = useRef<FlatList>(null);
  const sessionsRef = useRef<ChatSession[]>([]);
  const activeGenerationRef = useRef<GenerationRef | null>(null);
  const activeSubjectRef = useRef<SubjectFocus | null>(null);
  const quizQuestionHistoryRef = useRef<Record<string, string[]>>({});
  const modelReadyRef = useRef(false);
  const resolvedModelPathRef = useRef<string | null>(null);
  const modelBindingPromiseRef = useRef<Promise<boolean> | null>(null);
  const ui = copy[language];
  const subjects = useMemo(() => getSubjectCatalog(user?.grade ?? grade ?? '4', language), [user?.grade, grade, language]);
  const detectedSubjectId = useMemo(() => detectSubjectId(sessions, subjects), [sessions, subjects]);
  const activeSubject =
    subjects.find((subject) => subject.id === selectedSubjectId) ??
    subjects.find((subject) => subject.id === detectedSubjectId) ??
    subjects[0];
  const latestAssistantMessage = useMemo(() => {
    const activeSessionMessages = sessions.find((session) => session.id === activeSessionId)?.messages ?? [];
    return getLatestAssistantMessageFromMessages(activeSessionMessages) || getLatestAssistantMessage(sessions);
  }, [sessions, activeSessionId]);
  const dailyStreak = useMemo(() => calculateDailyStreak(sessions), [sessions]);
  const defaultQuiz = useMemo(
    () => buildQuizQuestion(language, user?.grade ?? grade ?? '4', activeSubject, quizVersion),
    [language, user?.grade, grade, activeSubject, quizVersion]
  );
  const quiz = generatedQuiz ?? defaultQuiz;
  const studyPlan = useMemo(
    () => buildStudyPlan(language, user?.grade ?? grade ?? '4', activeSubject),
    [language, user?.grade, grade, activeSubject]
  );
  const hasBoundModel = isModelReady && Boolean(resolvedModelPath);

  useEffect(() => {
    void bootApp();
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    activeSubjectRef.current = activeSubject;
  }, [activeSubject]);

  useEffect(() => {
    modelReadyRef.current = isModelReady;
  }, [isModelReady]);

  useEffect(() => {
    resolvedModelPathRef.current = resolvedModelPath;
  }, [resolvedModelPath]);

  useEffect(() => {
    setSelectedSubjectId((current) => (subjects.some((subject) => subject.id === current) ? current : detectedSubjectId));
  }, [subjects, detectedSubjectId]);

  useEffect(() => {
    setSelectedQuizIndex(null);
    setQuizStatus('idle');
  }, [quizVersion, activeSubject.id, language, user?.grade]);

  useEffect(() => {
    setGeneratedQuiz(null);
  }, [activeSubject.id, language, user?.grade]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const chunkSubscription = DeviceEventEmitter.addListener('LiteRTResponseChunk', (event: { requestId?: string; text?: string }) => {
      const activeGeneration = activeGenerationRef.current;
      if (!activeGeneration || event.requestId !== activeGeneration.requestId) {
        return;
      }

      const partialText = String(event.text ?? '');
      const currentSubject = activeSubjectRef.current ?? activeSubject;
      const formattedPartial = activeGeneration.useMathFormat
        ? formatMathResponseForDisplay(partialText)
        : activeGeneration.useCasualFormat
          ? formatCasualResponseForDisplay(partialText)
          : formatStudyResponseForDisplay(partialText, currentSubject);

      void setAssistantMessage(
        activeGeneration.sessionId,
        activeGeneration.messageId,
        formattedPartial,
        true,
        false
      );
    });

    const errorSubscription = DeviceEventEmitter.addListener('LiteRTResponseError', (event: { requestId?: string; error?: string }) => {
      const activeGeneration = activeGenerationRef.current;
      if (!activeGeneration || event.requestId !== activeGeneration.requestId) {
        return;
      }

      console.error('LiteRT stream error:', event.error ?? 'Unknown LiteRT-LM streaming error.');
    });

    return () => {
      chunkSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  /**
   * Binds the local LiteRT-LM (.litertlm / .bin) model into memory.
   * If the model file is outside private app storage (e.g. in /sdcard/Download),
   * it gets staged into the app's private document directory first to avoid Android SCOPED STORAGE permission blocks.
   */
  const bindModelPath = async (sourcePath: string, displaySource = sourcePath, preferredFileName?: string) => {
    if (Platform.OS === 'android' && !isAppPrivateModelPath(sourcePath)) {
      setModelStatus(`Copying LiteRT-LM model into app storage from ${displaySource}`);
    }

    const stagedPath = Platform.OS === 'android' ? await stageModelIntoAppStorage(sourcePath, preferredFileName) : sourcePath;
    if (!stagedPath) {
      return null;
    }

    setResolvedModelPath(stagedPath);
    resolvedModelPathRef.current = stagedPath;

    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
      setModelStatus(`Binding LiteRT-LM model from ${displaySource}`);

      // Warm start retry loop: Cold-starting a 1.2GB model on budget phones (e.g. 4GB RAM) can take 2-3s.
      let lastError: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await NativeModules.LLMInferenceModule.initModel(stagedPath);
          modelReadyRef.current = true;
          setIsModelReady(true);
          setModelStatus(`${copy.EN.modelReady} Loaded ${stagedPath}`);
          lastError = null;
          break;
        } catch (error: any) {
          lastError = error;
          console.warn(`initModel attempt ${attempt} failed:`, error?.message ?? error);
          if (attempt < 2) {
            setModelStatus('First init attempt failed, retrying...');
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }

      if (lastError) {
        // If both attempts fail, clear the staged copy before the next setup attempt.
        // That keeps the next bind from reusing a bad partial file.
        try {
          const checkPath = stagedPath.startsWith('/') ? `file://${stagedPath}` : stagedPath;
          const info = await FileSystem.getInfoAsync(checkPath);
          if (info.exists) {
            await FileSystem.deleteAsync(checkPath, { idempotent: true });
            console.warn('Deleted potentially corrupted staged model file:', stagedPath);
          }
        } catch (_) {}
        throw lastError;
      }
    }

    return stagedPath;
  };

  const persistModelSelection = async (folderUri: string | null, stagedPath: string, fileName: string) => {
    const updates: [string, string][] = [
      [STORAGE_KEYS.modelPath, stagedPath],
      [STORAGE_KEYS.modelFileName, fileName],
    ];

    if (folderUri) {
      updates.push([STORAGE_KEYS.modelFolderUri, folderUri]);
      setSelectedModelFolderUri(folderUri);
    }

    await AsyncStorage.multiSet(updates);
  };

  const bindNativeModelPath = async (
    rawPath: string,
    displaySource = rawPath,
    fileName = rawPath.split('/').pop() || 'model.litertlm',
    folderUri: string | null = null
  ) => {
    if (Platform.OS !== 'android' || !NativeModules.LLMInferenceModule) {
      setModelStatus('Native LiteRT-LM bridge unavailable. Demo mode active.');
      return false;
    }

    const cleanedPath = rawPath.trim().replace(/^["']|["']$/g, '').replace(/^file:\/\//i, '');
    if (!cleanedPath) {
      setModelStatus('Invalid model path.');
      return false;
    }

    if (modelReadyRef.current && resolvedModelPathRef.current === cleanedPath) {
      const isNativeLoaded = NativeModules.LLMInferenceModule.isModelLoaded
        ? Boolean(await NativeModules.LLMInferenceModule.isModelLoaded())
        : true;

      if (isNativeLoaded) {
        setIsModelReady(true);
        setResolvedModelPath(cleanedPath);
        setModelStatus(`${copy.EN.modelReady} Loaded ${cleanedPath}`);
        await persistModelSelection(folderUri, cleanedPath, fileName);
        return true;
      }

      modelReadyRef.current = false;
      setIsModelReady(false);
    }

    if (modelBindingPromiseRef.current) {
      setModelStatus('Model setup is already running. Please wait.');
      return modelBindingPromiseRef.current;
    }

    const bindingTask = (async () => {
      try {
        if (!modelReadyRef.current) {
          setIsModelReady(false);
        }
        resolvedModelPathRef.current = cleanedPath;
        setResolvedModelPath(cleanedPath);
        setModelStatus(`Binding LiteRT-LM model from ${displaySource}`);
        await NativeModules.LLMInferenceModule.initModel(cleanedPath);
        modelReadyRef.current = true;
        resolvedModelPathRef.current = cleanedPath;
        setIsModelReady(true);
        setResolvedModelPath(cleanedPath);
        setModelStatus(`${copy.EN.modelReady} Loaded ${cleanedPath}`);
        await persistModelSelection(folderUri, cleanedPath, fileName);
        return true;
      } catch (error) {
        console.error('Native model binding failed:', error);
        if (!modelReadyRef.current) {
          setIsModelReady(false);
          setResolvedModelPath(null);
          resolvedModelPathRef.current = null;
        }
        setModelStatus('Could not bind model from that path. Check the exact path and storage permission.');
        return false;
      } finally {
        modelBindingPromiseRef.current = null;
      }
    })();

    modelBindingPromiseRef.current = bindingTask;
    return bindingTask;
  };

  const ensureNativeModelReady = async (
    modelPath = resolvedModelPathRef.current ?? resolvedModelPath,
    forceRebind = false
  ) => {
    if (Platform.OS !== 'android' || !NativeModules.LLMInferenceModule || !modelPath) {
      return false;
    }

    if (!forceRebind && modelReadyRef.current && (resolvedModelPathRef.current ?? resolvedModelPath) === modelPath) {
      return true;
    }

    if (modelBindingPromiseRef.current) {
      return modelBindingPromiseRef.current;
    }

    // Only trust the quick loaded check during normal startup.
    // A full rebind is safer after a failed generation.
    if (!forceRebind) {
      try {
        const isNativeLoaded = NativeModules.LLMInferenceModule.isModelLoaded
          ? Boolean(await NativeModules.LLMInferenceModule.isModelLoaded())
          : modelReadyRef.current;

        if (isNativeLoaded) {
          modelReadyRef.current = true;
          resolvedModelPathRef.current = modelPath;
          setIsModelReady(true);
          setResolvedModelPath(modelPath);
          return true;
        }
      } catch (error) {
        console.warn('Native model readiness check failed, rebinding model.', error);
      }
    }

    setModelStatus(
      forceRebind
        ? 'Restarting LiteRT-LM engine from the selected model folder...'
        : 'Starting LiteRT-LM engine from the selected model folder...'
    );
    modelReadyRef.current = false;
    setIsModelReady(false);
    const fileName = modelPath.split('/').pop() || 'model.litertlm';
    return bindNativeModelPath(modelPath, fileName, fileName, selectedModelFolderUri);
  };

  const bindLocatedModel = async (
    sourcePath: string,
    displaySource: string,
    fileName = sourcePath.split('/').pop() || 'model.litertlm',
    folderUri: string | null = null
  ) => {
    if (!modelReadyRef.current) {
      setIsModelReady(false);
    }

    // First copy the model into app storage, then bind it from there.
    try {
      const stagedPath = await bindModelPath(sourcePath, displaySource, fileName);
      if (stagedPath) {
        await persistModelSelection(folderUri, stagedPath, fileName);
        return true;
      }
    } catch (stageError: any) {
      console.warn('Staged model binding failed, trying direct native path:', stageError?.message);
    }

    // If the source is already a real file path, try it directly as a fallback.
    const nativePath = sourcePath.startsWith('file://') ? sourcePath.replace('file://', '') : sourcePath;
    if (nativePath.startsWith('/') && !nativePath.startsWith('content://')) {
      try {
        setModelStatus('Retrying model load from direct path...');
        const didBind = await bindNativeModelPath(nativePath, displaySource, fileName, folderUri);
        return didBind;
      } catch (directError: any) {
        console.warn('Direct native path binding also failed:', directError?.message);
      }
    }

    setModelStatus('Could not load the model file. Please ensure it is a valid LiteRT model.');
    return false;
  };

  const restoreSavedModelBinding = async () => {
    const [[, storedFolderUri], [, storedPath], [, storedFileName]] = await AsyncStorage.multiGet([
      STORAGE_KEYS.modelFolderUri,
      STORAGE_KEYS.modelPath,
      STORAGE_KEYS.modelFileName,
    ]);

    if (storedFolderUri) {
      setSelectedModelFolderUri(storedFolderUri);
    }

    const preferredFileName = storedFileName || 'model.litertlm';

    if (storedPath) {
      setModelStatus(`Restoring LiteRT-LM model from ${preferredFileName}`);
      const restoredRawPath = await bindNativeModelPath(storedPath, preferredFileName, preferredFileName, storedFolderUri ?? null);
      if (restoredRawPath) {
        return true;
      }

      await AsyncStorage.removeItem(STORAGE_KEYS.modelPath);
    }

    if (storedFolderUri) {
      try {
        setModelStatus('Checking the previously selected model folder...');
        const locatedModel = await findModelFileInDirectory(storedFolderUri);
        if (locatedModel) {
          const reboundPath = await bindModelPath(locatedModel.modelEntry, locatedModel.fileName, locatedModel.fileName);
          if (reboundPath) {
            await persistModelSelection(storedFolderUri, reboundPath, locatedModel.fileName);
            return true;
          }
        } else {
          setModelStatus('The saved model folder is still connected, but no LiteRT model was found inside it.');
        }
      } catch (error) {
        console.error('Failed to restore saved model folder:', error);
        setModelStatus('The previously selected model folder is no longer accessible. Please choose the folder again.');
      }
    }

    return false;
  };

  const bootApp = async () => {
    try {
      const storedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.lang);
      if (storedLanguage === 'EN' || storedLanguage === 'NE') {
        setLanguage(storedLanguage);
      }

      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setScreen('main');
      }

      const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
      if (storedSessions) {
        try {
          const parsedSessions = sanitizeSessions(JSON.parse(storedSessions));
          setSessions(parsedSessions);
        } catch (error) {
          console.warn('Stored sessions were unreadable, starting fresh.', error);
          await AsyncStorage.removeItem(STORAGE_KEYS.sessions);
          setSessions([]);
        }
      }

      if (!modelReadyRef.current) {
        setIsModelReady(false);
        setResolvedModelPath(null);
        resolvedModelPathRef.current = null;
      }
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
        const restored = await restoreSavedModelBinding();
        if (!restored) {
          setModelStatus('Choose model folder to load LiteRT-LM on this device.');
        }
      } else {
        setModelStatus('Native LiteRT-LM bridge unavailable. Demo mode active.');
      }
    } catch (error) {
      console.error('Boot failed:', error);
      if (!modelReadyRef.current) {
        setIsModelReady(false);
      }
      setModelStatus('Startup failed. Demo mode active.');
    } finally {
      setIsBooting(false);
    }
  };

  const chooseModelFolder = async () => {
    try {
      if (Platform.OS !== 'android') {
        setModelStatus('Model folder selection is available on Android only.');
        return;
      }

      setIsModelSetupBusy(true);
      setModelStatus('Opening folder picker. This may take time on low-spec devices; please wait.');

      try {
        const initialUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
        const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
        if (!permission.granted || !permission.directoryUri) {
          setModelStatus('Please choose the folder that contains model.litertlm.');
          return;
        }

        setSelectedModelFolderUri(permission.directoryUri);
        setModelStatus('Scanning selected folder for LiteRT model...');
        const locatedModel = await findModelFileInDirectory(permission.directoryUri);

        if (!locatedModel) {
          setModelStatus('No model.litertlm file was found in the selected folder. Make sure the folder contains a .litertlm file.');
          return;
        }

        setModelStatus(`Found ${locatedModel.fileName}. Loading model, please wait...`);
        const success = await bindLocatedModel(locatedModel.modelEntry, locatedModel.fileName, locatedModel.fileName, permission.directoryUri);
        if (!success && !modelReadyRef.current) {
          setModelStatus('Model file found but could not be loaded. Try selecting the folder again or use a different model file.');
        }
      } catch (error: any) {
        console.error('LiteRT init failed after folder pick:', error);
        const detail = error?.message ?? '';
        setModelStatus(
          detail.includes('MODEL_ERROR') || detail.includes('not found')
            ? 'Model file not found at the expected path. Please re-select the folder.'
            : detail.includes('INIT_ERROR')
              ? `Model could not initialize: ${detail.replace(/.*INIT_ERROR[:\s]*/i, '').slice(0, 120)}`
              : 'Could not load the model. Please try selecting the folder again.'
        );
      }
    } catch (error) {
      console.error('Model folder picker failed:', error);
      setModelStatus('Could not open the model folder picker.');
    } finally {
      setIsModelSetupBusy(false);
    }
  };

  const persistSessions = async (nextSessions: ChatSession[]) => {
    const sanitizedSessions = sanitizeSessions(nextSessions);
    sessionsRef.current = sanitizedSessions;
    setSessions(sanitizedSessions);
    await AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sanitizedSessions));
  };

  const switchLanguage = async () => {
    const nextLanguage: Language = language === 'EN' ? 'NE' : 'EN';
    setLanguage(nextLanguage);
    await AsyncStorage.setItem(STORAGE_KEYS.lang, nextLanguage);
  };

  const registerUser = async () => {
    if (!name.trim() || !grade) return;
    const nextUser = { name: name.trim(), grade };
    setUser(nextUser);
    setScreen('main');
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
  };

  const logoutUser = () => {
    Alert.alert('Log out', 'Clear your local session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([STORAGE_KEYS.user, STORAGE_KEYS.sessions]);
          setUser(null);
          setSessions([]);
          setActiveSessionId(null);
          setScreen('onboarding');
        },
      },
    ]);
  };

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeMessages = activeSession?.messages ?? [];

  const createNewChat = () => {
    setActiveSessionId(null);
    setSidebarOpen(false);
    setActiveTab('learn');
  };

  const removeSession = (sessionId: string) => {
    Alert.alert('Delete chat', 'Remove this local conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const nextSessions = sessions.filter((session) => session.id !== sessionId);
          if (activeSessionId === sessionId) {
            setActiveSessionId(null);
          }
          await persistSessions(nextSessions);
        },
      },
    ]);
  };

  const buildAttachmentFallbackReply = (question: string, fileName: string, fileContent: string) => {
    const cleaned = normalizeAttachmentText(fileContent);
    if (!cleaned) {
      return null;
    }

    const paragraphs = cleaned
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const lines = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const keywords = extractQuestionKeywords(question);
    const relevantParagraphs = keywords.length
      ? paragraphs.filter((paragraph) => {
          const lower = paragraph.toLowerCase();
          return keywords.some((keyword) => lower.includes(keyword));
        })
      : [];

    const conclusionParagraph =
      paragraphs.find((paragraph) =>
        /(conclusion|summary|overall|therefore|finally|in conclusion|in summary|result|findings|निष्कर्ष|सारांश)/i.test(paragraph)
      ) ?? '';

    const title = lines[0] ?? fileName;
    const mainParagraph = relevantParagraphs[0] ?? paragraphs[0] ?? '';
    const supportParagraph = relevantParagraphs[1] ?? paragraphs[1] ?? '';
    const isSummaryRequest = /\b(summary|summarize|main idea|conclusion|overview|gist|explain this file|read this file)\b/i.test(
      question.toLowerCase()
    );

    if (language === 'NE') {
      const parts = [
        `${fileName} bhanne file ko main kura yo ho:`,
        mainParagraph || title,
      ];
      if (supportParagraph && supportParagraph !== mainParagraph) {
        parts.push('', supportParagraph);
      }
      if (conclusionParagraph && conclusionParagraph !== mainParagraph && conclusionParagraph !== supportParagraph) {
        parts.push('', `Niskarsa: ${conclusionParagraph}`);
      }
      return parts.join('\n');
    }

    if (isSummaryRequest || !relevantParagraphs.length) {
      const parts = [
        `I read ${fileName}. Here is the main idea:`,
        mainParagraph || title,
      ];
      if (supportParagraph && supportParagraph !== mainParagraph) {
        parts.push('', `Another important point: ${supportParagraph}`);
      }
      if (conclusionParagraph && conclusionParagraph !== mainParagraph && conclusionParagraph !== supportParagraph) {
        parts.push('', `Conclusion: ${conclusionParagraph}`);
      }
      return parts.join('\n');
    }

    const parts = [
      `Based on ${fileName}:`,
      mainParagraph || title,
    ];
    if (supportParagraph && supportParagraph !== mainParagraph) {
      parts.push('', supportParagraph);
    }
    if (conclusionParagraph && conclusionParagraph !== mainParagraph && conclusionParagraph !== supportParagraph) {
      parts.push('', `Conclusion: ${conclusionParagraph}`);
    }
    return parts.join('\n');
  };

  const buildFallbackReply = (input: string, attachmentName?: string | null, attachmentContent?: string | null) => {
    if (attachmentContent) {
      const attachmentFallback = buildAttachmentFallbackReply(input, attachmentName ?? 'attachment.txt', attachmentContent);
      if (attachmentFallback) {
        return attachmentFallback;
      }
    }

    const deterministicMath = buildDeterministicMathReply(input, language, activeSubject);
    if (deterministicMath) {
      return formatDeterministicMathResponseStable(deterministicMath);
    }

    const normalizedInput = normalizeSingleLine(input).toLowerCase();
    if (/^(hi|hello|hey|namaste|namaskar)\b/.test(normalizedInput)) {
      return language === 'NE'
        ? 'Namaste! Ma Guru ho. Tapai ko study question sodhnuhos, ma sajilo tarikale help garchu.'
        : "Hi! I'm Guru. Ask me any study question, and I'll help clearly.";
    }

    if (/your name|what.*name|who are you/.test(normalizedInput)) {
      return language === 'NE'
        ? 'Mero naam Guru ho. Ma tapai ko study helper ho.'
        : 'My name is Guru. I am your study helper.';
    }

    return language === 'NE'
      ? modelReadyRef.current
        ? 'Model le jawaf dina sakena. Feri ek choti try garnuhos.'
        : 'Local model load hudai cha. Kehi seconds wait garnuhos; yedi esto nai bhayo bhane model folder feri choose garnuhos.'
      : modelReadyRef.current
        ? 'The model could not generate a response. Please try again.'
        : 'The local model is loading. Please wait a moment; if this keeps happening, choose the model folder again.';
  };

  const shouldRetryGeneratedResponse = (
    rawText: string,
    question: string,
    useMathFormat: boolean,
    useCasualFormat: boolean,
    subject: SubjectFocus,
    hasAttachment: boolean
  ) => {
    const formatted = useMathFormat
      ? formatMathResponseForDisplay(rawText)
      : useCasualFormat
        ? formatCasualResponseForDisplay(rawText)
        : formatStudyResponseForDisplay(rawText, subject);

    const normalized = normalizeSingleLine(formatted).toLowerCase();

    if (!normalized) {
      return true;
    }

    if (/please provide the question/.test(normalized) && question.trim()) {
      return true;
    }

    if (
      hasAttachment &&
      /(please provide the image|need the image|cannot see the image|upload.*image|share.*image|attach.*file|upload.*file|send.*file|provide.*file)/.test(
        normalized
      )
    ) {
      return true;
    }

    if (hasRepeatingTail(formatted)) {
      return true;
    }

    if (/\b([a-z\u0900-\u097F]{4,})\b(?:\s+\1){3,}/i.test(normalized)) {
      return true;
    }

    if (!useMathFormat && subject.id === 'science' && (normalized.includes('is a concept') || formatted.length < 60)) {
      return true;
    }

    if (useMathFormat && (normalized.includes('x = x') || normalized.includes('check: check:'))) {
      return true;
    }

    return false;
  };

  const buildRetryPrompt = (question: string, _useMathFormat: boolean, _subject: SubjectFocus, _hasAttachment: boolean) => {
    return question.trim();
  };

  const formatMathResponseForDisplay = (text: string) => {
    let cleaned = normalizeTutorTextBase(text);

    const stitchedDigitLines: string[] = [];
    for (const rawLine of cleaned.split('\n')) {
      const trimmedLine = rawLine.trim();
      if (/^\d+$/.test(trimmedLine) && stitchedDigitLines.length > 0) {
        const previousLine = stitchedDigitLines[stitchedDigitLines.length - 1];
        const previousTrimmed = previousLine.trimEnd();
        if (/^\d+$/.test(previousTrimmed.trim()) || /\b(?:is|are|equals?)\s+\d?$|=\s*\d?$/.test(previousTrimmed)) {
          stitchedDigitLines[stitchedDigitLines.length - 1] = `${previousTrimmed}${trimmedLine}`;
          continue;
        }
      }
      stitchedDigitLines.push(rawLine);
    }
    cleaned = stitchedDigitLines.join('\n');

    cleaned = cleaned
      .replace(/(\b(?:is|=)\s*\d)\s*\n\s*(\d+)\.\s*(Here is how we find it:)/gi, '$1$2.\n\n$3')
      .replace(/(The value of .*?[.!?])\s+(Here is how we find it:)/i, '$1\n\n$2')
      .replace(/(Here is how we find it:)\s*(\d+\.)/i, '$1\n\n$2')
      .replace(/([:.!?])\s*(?=(Here is how|To solve|We start|Start with|Let'?s check|Check|Answer|Final answer|Step\s*\d+))/gi, '$1\n\n')
      .replace(/([A-Za-z\u0900-\u097F])(?=(Answer:|Check:|Step\s*\d+:))/g, '$1\n\n')
      .replace(/:(?=\s*[A-Za-z0-9(]+\s*[+\-=])/g, ':\n\n')
      .replace(/([A-Za-z\u0900-\u097F])(\d)/g, '$1 $2')
      .replace(/(\d)([A-Za-z\u0900-\u097F])/g, '$1 $2')
      .replace(/([=+\-*/])(?=[A-Za-z0-9(])/g, ' $1 ')
      .replace(/(?<=[A-Za-z0-9)])([=+\-*/])(?=[A-Za-z0-9(])/g, ' $1 ')
      .replace(/([A-Za-z0-9)\]])\+([A-Za-z0-9(])/g, '$1 + $2')
      .replace(/([A-Za-z0-9)\]])-([A-Za-z0-9(])/g, '$1 - $2')
      .replace(/([A-Za-z0-9)\]])=([A-Za-z0-9(])/g, '$1 = $2')
      .replace(/([A-Za-z0-9)\]])\*([A-Za-z0-9(])/g, '$1 * $2')
      .replace(/\n(\d+\.)\s*\n+/g, '\n$1 ')
      .replace(/(^|\n)(\d+\.)\s*(?=\S)/g, '$1$2 ')
      .replace(/([^\n])\n(\d+\.)/g, '$1\n\n$2')
      .replace(/(\d+\.)\s+(?=\d+\.)/g, '$1\n')
      .replace(/(Check:)\s*(?=\S)/gi, '\n\n$1\n')
      .replace(/(Final answer:|Answer:)\s*(?=\S)/gi, '\n\n$1 ')
      .replace(/(^|\n)(\d{2,})\.\s*(Here is how we find it:)/gi, '$1$2.\n\n$3')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    const repairedFalseSteps: string[] = [];
    for (const rawLine of cleaned.split('\n')) {
      const trimmedLine = rawLine.trim();
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
      const previousIndex = repairedFalseSteps.length - 1;
      const previousLine = previousIndex >= 0 ? repairedFalseSteps[previousIndex].trimEnd() : '';

      if (numberedMatch && previousLine && !/^\d+\.\s/.test(previousLine.trim())) {
        const [, numberText, remainderText] = numberedMatch;
        const previousLooksIncomplete = /(?:\b(?:and|or|plus|minus|times|divide|divided by|multiply|multiplied by|is|are|equals?|of|root|sqrt)\b|[=(+\-x*/])$/i.test(
          previousLine.trim()
        );

        if (previousLooksIncomplete) {
          repairedFalseSteps[previousIndex] = `${previousLine} ${numberText}.`.replace(/[ \t]{2,}/g, ' ').trimEnd();

          if (/^(?:Here is how|Write|Now|Then|The |We |Check\b|Let'?s|So\b|Therefore\b|Thus\b|Hence\b)/i.test(remainderText)) {
            repairedFalseSteps.push('');
            repairedFalseSteps.push(remainderText);
          } else if (remainderText) {
            repairedFalseSteps[previousIndex] = `${repairedFalseSteps[previousIndex]} ${remainderText}`.replace(/[ \t]{2,}/g, ' ');
          }
          continue;
        }
      }

      repairedFalseSteps.push(rawLine);
    }

    cleaned = repairedFalseSteps.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    const dedupedLines: string[] = [];
    let lastNormalized = '';
    let duplicateCount = 0;
    let checkHeaderSeen = false;

    for (const line of cleaned.split('\n')) {
      const normalized = normalizeSingleLine(line).toLowerCase();

      if (!normalized) {
        if (dedupedLines[dedupedLines.length - 1] !== '') {
          dedupedLines.push('');
        }
        continue;
      }

      if (normalized === lastNormalized) {
        duplicateCount += 1;
        if (duplicateCount >= 1) {
          continue;
        }
      } else {
        lastNormalized = normalized;
        duplicateCount = 0;
      }

      if (normalized === 'check:') {
        if (checkHeaderSeen) {
          continue;
        }
        checkHeaderSeen = true;
      }

      dedupedLines.push(line.trimEnd());
    }

    cleaned = dedupedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
  };

const formatDeterministicMathResponse = (text: string) => {
  const hasNepali = /[\u0900-\u097F]/.test(text);
  const finalHeading = hasNepali ? '# उत्तर' : '# Final answer';
  const stepsHeading = hasNepali ? '# चरणहरू' : '# Steps';
  const checkHeading = hasNepali ? '# जाँच' : '# Check';

  let cleaned = text
      .replace(/([^\n])(\d+\.\s+[A-Z\u0900-\u097F])/g, '$1\n\n$2')
      .replace(/([=)])(\d+\.\s+[A-Z\u0900-\u097F])/g, '$1\n\n$2')
      .replace(/(Check:)\s*(?=\S)/gi, '$1\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  if (!/^#\s+/m.test(cleaned)) {
    cleaned = `${finalHeading}\n${cleaned}`;
  }

  cleaned = cleaned
    .replace(/(^|\n)(Here is how we find it:|Let's solve it step by step:|Yesari hal garinchha:|यसरी गर्छौँ:)/i, `$1\n${stepsHeading}\n$2`)
    .replace(/(^|\n)(Check:)/i, `$1\n${checkHeading}\n$2`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
};

const formatDeterministicMathResponseStable = (text: string) => {
  const hasNepali = /[\u0900-\u097F]/.test(text);
  const finalHeading = hasNepali ? '# à¤‰à¤¤à¥à¤¤à¤°' : '# Final answer';
  const stepsHeading = hasNepali ? '# à¤šà¤°à¤£à¤¹à¤°à¥‚' : '# Steps';
  const checkHeading = hasNepali ? '# à¤œà¤¾à¤à¤š' : '# Check';

  const rawLines = text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter(Boolean);

  const answerLines: string[] = [];
  const stepLines: string[] = [];
  const checkLines: string[] = [];
  let section: 'answer' | 'steps' | 'check' = 'answer';

  for (const line of rawLines) {
    if (/^(Here is how we find it:|Let's solve it step by step:|Yesari hal garinchha:|à¤¯à¤¸à¤°à¥€ à¤—à¤°à¥à¤›à¥Œà¤:)/i.test(line)) {
      section = 'steps';
      continue;
    }

    if (/^Check:?$/i.test(line)) {
      section = 'check';
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      section = 'steps';
      stepLines.push(line);
      continue;
    }

    if (section === 'check') {
      checkLines.push(line);
    } else if (section === 'steps') {
      stepLines.push(line);
    } else {
      answerLines.push(line);
    }
  }

  const sections: string[] = [];

  if (answerLines.length > 0) {
    sections.push(finalHeading, ...answerLines);
  }

  if (stepLines.length > 0) {
    sections.push('', stepsHeading, ...stepLines);
  }

  if (checkLines.length > 0) {
    sections.push('', checkHeading, ...checkLines);
  }

  return sections.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

  const setAssistantMessage = async (
    sessionId: string,
    messageId: string,
    text: string,
    isPending = false,
    shouldPersist = true
  ) => {
    const nextSessions = sessionsRef.current.map((session) => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        updatedAt: Date.now(),
        messages: session.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text,
                isPending,
              }
            : message
        ),
      };
    });
    const sortedSessions = nextSessions.sort((a, b) => b.updatedAt - a.updatedAt);

    if (shouldPersist) {
      await persistSessions(sortedSessions);
      return;
    }

    sessionsRef.current = sortedSessions;
    setSessions(sortedSessions);
  };

  const getAssistantMessageText = (sessionId: string, messageId: string) => {
    return (
      sessionsRef.current
        .find((session) => session.id === sessionId)
        ?.messages.find((message) => message.id === messageId)?.text ?? ''
    );
  };

  const getConversationHistory = (sessionId: string, pendingMessageId: string, limit = 8) => {
    const history = sessionsRef.current.find((session) => session.id === sessionId)?.messages ?? [];

    return history
      .filter((message) => !message.isPending && message.id !== pendingMessageId)
      .slice(-limit)
      .map((message) => ({
        text: message.text,
        isUser: message.isUser,
      }));
  };

  const cancelGeneration = async () => {
    if (!isGenerating || !NativeModules.LLMInferenceModule?.cancelGeneration) {
      return;
    }

    try {
      await NativeModules.LLMInferenceModule.cancelGeneration();
    } catch (error) {
      console.error('Failed to cancel LiteRT inference:', error);
    }
  };

  const refreshQuiz = async () => {
    setSelectedQuizIndex(null);
    setQuizStatus('idle');

    const canUseNativeModel = modelReadyRef.current && Boolean(resolvedModelPathRef.current) && Platform.OS === 'android' && NativeModules.LLMInferenceModule;

    if (!canUseNativeModel || isQuizRefreshing) {
      setGeneratedQuiz(null);
      setQuizVersion((current) => current + 1);
      return;
    }

    setIsQuizRefreshing(true);

    const currentGrade = user?.grade ?? grade ?? '4';
    const contextKey = getQuizContextKey(language, currentGrade, activeSubject);
    const currentQuizQuestion = normalizeQuizQuestionKey(quiz.question);
    const seenQuestions = [
      ...(quizQuestionHistoryRef.current[contextKey] ?? []),
      ...(currentQuizQuestion ? [currentQuizQuestion] : []),
    ];

    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const recentQuestions = seenQuestions.slice(-8);
        const rawQuiz = String(
          (await NativeModules.LLMInferenceModule.generateResponse(
            buildQuizGenerationPrompt(language, currentGrade, activeSubject, recentQuestions),
            language,
            false,
            [],
            generateId(),
            ''
          )) || ''
        );

        const parsedQuiz = parseGeneratedQuiz(rawQuiz);
        if (!parsedQuiz) {
          continue;
        }

        const normalizedQuestion = normalizeQuizQuestionKey(parsedQuiz.question);
        if (!normalizedQuestion || seenQuestions.includes(normalizedQuestion)) {
          continue;
        }

        quizQuestionHistoryRef.current[contextKey] = [...seenQuestions, normalizedQuestion].slice(-20);
        setGeneratedQuiz(parsedQuiz);
        return;
      }

      setGeneratedQuiz(null);
      setQuizVersion((current) => current + 1);
    } catch (error) {
      console.error('Quiz generation failed:', error);
      setGeneratedQuiz(null);
      setQuizVersion((current) => current + 1);
    } finally {
      setIsQuizRefreshing(false);
    }
  };

  const readTextFile = async (uri: string) => {
    return FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  };

  const normalizeAttachmentText = (content: string) => {
    return content
      .replace(/\u0000/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  };

  const openTextFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.name ?? 'attachment.txt';
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : '';
      const mimeType = asset.mimeType?.toLowerCase() ?? '';

      const looksTextLike =
        TEXT_FILE_EXTENSIONS.includes(extension) ||
        mimeType.startsWith('text/') ||
        ['application/json', 'application/xml'].includes(mimeType);

      if (!looksTextLike) {
        Alert.alert('Unsupported file', 'Please choose a text file like .txt, .md, .csv, .json, or .xml.');
        return;
      }

      const rawContent = await readTextFile(asset.uri);
      const normalizedContent = normalizeAttachmentText(rawContent);

      if (!normalizedContent) {
        Alert.alert('Empty file', 'That file is empty. Please choose a text file with content.');
        return;
      }

      const limitedContent = normalizedContent.slice(0, MAX_ATTACHED_FILE_CHARS);
      setAttachedFileName(fileName);
      setAttachedFileContent(limitedContent);
      setModelMenuOpen(false);
    } catch (error) {
      console.error('Failed to open text file picker:', error);
      Alert.alert('File picker error', 'Could not open the text file picker. Please try again.');
    }
  };

  const sendPrompt = async () => {
    const input = prompt.trim();
    if ((!input && !attachedFileContent) || isGenerating) return;

    const currentAttachmentName = attachedFileName;
    const currentAttachmentContent = attachedFileContent;
    setPrompt('');
    setAttachedFileName(null);
    setAttachedFileContent(null);
    setActiveTab('learn');
    setIsGenerating(true);

    const displayText = input || (currentAttachmentName ? `Summarize ${currentAttachmentName}` : 'Summarize the attached text file.');
    const hasAttachment = currentAttachmentContent !== null;
    const questionWithAttachment = currentAttachmentContent
      ? buildTextAttachmentQuestion(displayText, currentAttachmentName ?? 'attachment.txt', currentAttachmentContent)
      : displayText;
    const userMessage: Message = {
      id: generateId(),
      text: displayText,
      isUser: true,
      attachmentName: currentAttachmentName ?? undefined,
    };
    const pendingAssistantId = generateId();
    const pendingAssistantMessage: Message = {
      id: pendingAssistantId,
      text: ui.thinkingLabel,
      isUser: false,
      isPending: true,
    };
    const sessionId = activeSessionId ?? generateId();
    const requestId = generateId();

    let nextSessions = [...sessionsRef.current];
    const existingIndex = nextSessions.findIndex((session) => session.id === sessionId);

    if (existingIndex === -1) {
      nextSessions.unshift({
        id: sessionId,
        title: displayText.length > 28 ? `${displayText.slice(0, 28)}...` : displayText,
        messages: [userMessage, pendingAssistantMessage],
        updatedAt: Date.now(),
      });
      setActiveSessionId(sessionId);
    } else {
      const session = nextSessions[existingIndex];
      const updated = {
        ...session,
        messages: [...session.messages, userMessage, pendingAssistantMessage],
        updatedAt: Date.now(),
      };
      nextSessions.splice(existingIndex, 1);
      nextSessions.unshift(updated);
    }

    const useMathFormat =
      activeSubject.id === 'math' || isMathQuestion(displayText) || isNumericalQuestion(displayText);
    const useCasualFormat = !useMathFormat && !hasAttachment && isCasualPrompt(displayText);
    const shouldUseHistory = !hasAttachment;

    await persistSessions(nextSessions);
    activeGenerationRef.current = {
      requestId,
      sessionId,
      messageId: pendingAssistantId,
      useMathFormat,
      useCasualFormat,
    };

    const deterministicMathReply =
      useMathFormat && !currentAttachmentContent ? buildDeterministicMathReply(displayText, language, activeSubject) : null;
    const deterministicStudyReply =
      !useMathFormat && !currentAttachmentContent ? buildDeterministicStudyReply(displayText, language, activeSubject) : null;

    if (deterministicMathReply) {
      const finalText = formatDeterministicMathResponseStable(deterministicMathReply);
      await setAssistantMessage(sessionId, pendingAssistantId, finalText || ui.responseEmpty, false);
      activeGenerationRef.current = null;
      setIsGenerating(false);
      return;
    }

    if (deterministicStudyReply) {
      const finalText = formatModelText(deterministicStudyReply);
      await setAssistantMessage(sessionId, pendingAssistantId, finalText || ui.responseEmpty, false);
      activeGenerationRef.current = null;
      setIsGenerating(false);
      return;
    }

    try {
      const nativeModelPath = resolvedModelPathRef.current ?? resolvedModelPath;
      const canAttemptNativeModel =
        Boolean(nativeModelPath) &&
        Platform.OS === 'android' &&
        Boolean(NativeModules.LLMInferenceModule);

      if (canAttemptNativeModel) {
        // Before generating, make sure the native engine is ready.
        if (!modelReadyRef.current && nativeModelPath) {
          const didRebind = await ensureNativeModelReady(nativeModelPath, true);
          if (!didRebind) {
            throw new Error('MODEL_REBIND_FAILED');
          }
        }

        const modelHistory = shouldUseHistory ? getConversationHistory(sessionId, pendingAssistantId, useMathFormat ? 6 : 8) : [];

        const modelPrompt = buildModelPrompt(
          questionWithAttachment,
          language,
          user?.grade ?? grade ?? '4',
          activeSubject,
          hasAttachment
        );

        const formatForDisplay = (rawText: string) =>
          useMathFormat
            ? formatMathResponseForDisplay(rawText)
            : useCasualFormat
              ? formatCasualResponseForDisplay(rawText)
              : formatStudyResponseForDisplay(rawText, activeSubject);

        const getBestKnownText = () => {
          const currentText = getAssistantMessageText(sessionId, pendingAssistantId);
          if (hasUsableAssistantText(currentText, ui)) {
            return currentText;
          }
          return '';
        };

        const runModelRequest = async (
          nextPrompt: string,
          nextHistory: Array<{ text: string; isUser: boolean }>,
          nextRequestId: string
        ) => {
          return String(
            (await NativeModules.LLMInferenceModule.generateResponse(
              nextPrompt,
              language,
              useMathFormat,
              nextHistory,
              nextRequestId,
              ''
            )) || ''
          );
        };

        let rawFinal = await runModelRequest(modelPrompt, modelHistory, requestId);
        let finalText = formatForDisplay(rawFinal);

        if (shouldRetryGeneratedResponse(rawFinal, displayText, useMathFormat, useCasualFormat, activeSubject, hasAttachment)) {
          const retryRequestId = generateId();
          activeGenerationRef.current = {
            requestId: retryRequestId,
            sessionId,
            messageId: pendingAssistantId,
            useMathFormat,
            useCasualFormat,
          };

          await setAssistantMessage(sessionId, pendingAssistantId, ui.thinkingLabel, true, false);

          const retryRaw = await runModelRequest(
            buildRetryPrompt(questionWithAttachment, useMathFormat, activeSubject, hasAttachment),
            modelHistory,
            retryRequestId
          );
          if (!shouldRetryGeneratedResponse(retryRaw, displayText, useMathFormat, useCasualFormat, activeSubject, hasAttachment)) {
            rawFinal = retryRaw;
            finalText = formatForDisplay(retryRaw);
          } else if (hasUsableAssistantText(formatForDisplay(retryRaw), ui)) {
            rawFinal = retryRaw;
            finalText = formatForDisplay(retryRaw);
          }
        }

        if (!hasUsableAssistantText(finalText, ui)) {
          const bestKnownText = getBestKnownText();
          if (bestKnownText) {
            finalText = bestKnownText;
          }
        }

        // If all attempts return empty, rebuild the engine once and try again.
        if (!hasUsableAssistantText(finalText, ui) && nativeModelPath) {
          console.warn('All generation attempts returned empty - full engine restart');
          modelReadyRef.current = false;
          setIsModelReady(false);

          // Restart the engine so the next request starts cleanly.
          const didRebind = await ensureNativeModelReady(nativeModelPath, true);
          if (didRebind) {
            try {
              // Give native cleanup a moment to settle.
              await new Promise((r) => setTimeout(r, 300));
              const rebindRequestId = generateId();
              activeGenerationRef.current = { requestId: rebindRequestId, sessionId, messageId: pendingAssistantId, useMathFormat, useCasualFormat };
              const rebindRaw = await runModelRequest(modelPrompt, modelHistory, rebindRequestId);
              const rebindText = formatForDisplay(rebindRaw);
              if (hasUsableAssistantText(rebindText, ui)) {
                finalText = rebindText;
              }
            } catch (rebindError) {
              console.warn('Full engine restart retry also failed:', rebindError);
            }
          }
        }

        await setAssistantMessage(
          sessionId,
          pendingAssistantId,
          hasUsableAssistantText(finalText, ui)
            ? finalText
            : buildFallbackReply(displayText, currentAttachmentName, currentAttachmentContent),
          false
        );

        activeGenerationRef.current = null;
        return;
      }

      await setAssistantMessage(
        sessionId,
        pendingAssistantId,
        buildFallbackReply(displayText, currentAttachmentName, currentAttachmentContent),
        false
      );
    } catch (error) {
      console.error('LiteRT-LM request failed:', error);
      const errorCode =
        typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
      const errorMessage =
        typeof error === 'object' && error && 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';

      if (errorCode === 'INFERENCE_CANCELED') {
        const partialText = getAssistantMessageText(sessionId, pendingAssistantId);
        await setAssistantMessage(
          sessionId,
          pendingAssistantId,
          partialText || ui.responseStopped,
          false
        );
      } else {
        const partialText = getAssistantMessageText(sessionId, pendingAssistantId);
        if (hasUsableAssistantText(partialText, ui)) {
          await setAssistantMessage(sessionId, pendingAssistantId, partialText, false);
        } else {
          // After a native error, wait briefly before trying a clean rebind.
          // Some devices recover only after the engine is created again.
          let recoveredText = '';
          try {
            await new Promise((r) => setTimeout(r, 500));
            const recoveryModelPath = resolvedModelPathRef.current ?? resolvedModelPath;
            if (recoveryModelPath && Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
              const didRebind = await ensureNativeModelReady(recoveryModelPath, true);
              if (didRebind) {
                const recoveryRequestId = generateId();
                activeGenerationRef.current = {
                  requestId: recoveryRequestId,
                  sessionId,
                  messageId: pendingAssistantId,
                  useMathFormat,
                  useCasualFormat,
                };
                const recoveryPrompt = buildRetryPrompt(questionWithAttachment, useMathFormat, activeSubject, hasAttachment);
                const recoveryRaw = String(
                  (await NativeModules.LLMInferenceModule.generateResponse(
                    recoveryPrompt,
                    language,
                    useMathFormat,
                    modelHistory,
                    recoveryRequestId,
                    ''
                  )) || ''
                );
                const recoveryFormatted = useMathFormat
                  ? formatMathResponseForDisplay(recoveryRaw)
                  : useCasualFormat
                    ? formatCasualResponseForDisplay(recoveryRaw)
                    : formatStudyResponseForDisplay(recoveryRaw, activeSubject);
                if (hasUsableAssistantText(recoveryFormatted, ui)) {
                  recoveredText = recoveryFormatted;
                }
              }
            }
          } catch (_retryErr) {
            console.warn('Recovery retry also failed:', _retryErr);
          }
          await setAssistantMessage(
            sessionId,
            pendingAssistantId,
            recoveredText || buildFallbackReply(displayText, currentAttachmentName, currentAttachmentContent),
            false
          );
        }
      }
    } finally {
      activeGenerationRef.current = null;
      setIsGenerating(false);
    }
  };

  const renderHighlightedText = (text: string, isUserMessage = false) => {
    if (isUserMessage) {
      return <Text style={styles.userBubbleText}>{text}</Text>;
    }

    const numberedItemRegex = /^(\d{1,2})\.\s+/;
    const bulletRegex = /^-\s+/;
    const headingRegex = /^(#{1,3})\s+(.+)$/;
    const lines = text.split('\n');
    return (
      <View>
        {lines.map((line, lineIndex) => {
          const trimmed = line.trim();
          if (!trimmed) return <View key={`space-${lineIndex}`} style={{ height: 8 }} />;

          const headingMatch = trimmed.match(headingRegex);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2].trim();
            const fontSize = level === 1 ? 18 : level === 2 ? 16 : 15;
            return (
              <Text
                key={`hd-${lineIndex}`}
                style={[
                  styles.botBubbleText,
                  {
                    fontWeight: '800',
                    fontSize,
                    color: '#1f2937',
                    marginTop: lineIndex > 0 ? 8 : 2,
                    marginBottom: 2,
                  },
                ]}
              >
                {headingText}
              </Text>
            );
          }

          const numMatch = trimmed.match(numberedItemRegex);
          if (numMatch) {
            return (
              <Text key={`nl-${lineIndex}`} style={[styles.botBubbleText, { marginTop: 4, paddingLeft: 4 }]}>
                <Text style={{ fontWeight: '700' }}>{numMatch[0]}</Text>
                {trimmed.slice(numMatch[0].length)}
              </Text>
            );
          }

          if (bulletRegex.test(trimmed)) {
            return (
              <Text key={`bl-${lineIndex}`} style={[styles.botBubbleText, { marginTop: 2, paddingLeft: 4 }]}>
                {'\u2022  '}{trimmed.slice(2)}
              </Text>
            );
          }

          return (
            <Text key={`ln-${lineIndex}`} style={[styles.botBubbleText, { marginTop: lineIndex > 0 ? 2 : 0 }]}>
              {trimmed}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderSubjectChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
      {subjects.map((subject) => {
        const selected = subject.id === activeSubject.id;
        return (
          <TouchableOpacity
            key={subject.id}
            style={[styles.subjectChip, selected && styles.subjectChipActive]}
            onPress={() => setSelectedSubjectId(subject.id)}
          >
            <Text style={[styles.subjectChipText, selected && styles.subjectChipTextActive]}>{subject.title}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderBoot = () => (
    <SafeAreaView style={styles.centerScreen}>
      <Image source={logoSource} style={styles.bootLogo} />
      <ActivityIndicator size="large" color="#1a73e8" />
      <Text style={styles.bootTitle}>{modelStatus}</Text>
      <Text style={styles.bootSubtitle}>Google AI Edge LiteRT-LM</Text>
    </SafeAreaView>
  );
  const renderOnboarding = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.onboardingScroll}>
          <View style={styles.brandBlock}>
            <Image source={logoSource} style={styles.brandLogo} />
            <Text style={styles.appTitle}>{ui.appName}</Text>
            <Text style={styles.appSubtitle}>{ui.subtitle}</Text>
          </View>

          <View style={styles.formBlock}>
            <Text style={styles.label}>{ui.nameLabel}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} autoCorrect={false} />

            <Text style={styles.label}>{ui.classLabel}</Text>
            <View style={styles.gradeGrid}>
              {gradeOptions.map((option) => {
                const selected = option === grade;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.gradePill, selected && styles.gradePillActive]}
                    onPress={() => setGrade(option)}
                  >
                    <Text style={[styles.gradeText, selected && styles.gradeTextActive]}>{`Class ${option}`}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!name.trim() || !grade) && styles.primaryButtonDisabled]}
              disabled={!name.trim() || !grade}
              onPress={registerUser}
            >
              <Text style={styles.primaryButtonText}>{ui.continueLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.languageButton} onPress={switchLanguage}>
              <Globe size={18} color="#1a73e8" />
              <Text style={styles.languageButtonText}>{language === 'EN' ? 'Switch to NE' : 'Switch to EN'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.screenScroll}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.homeHeaderTitle}>{ui.appName}</Text>
          <Text style={styles.homeHeaderSubtitle}>{language === 'EN' ? 'English mode' : 'à¤¨à¥‡à¤ªà¤¾à¤²à¥€ mode'}</Text>
        </View>
        <TouchableOpacity style={styles.homeLanguageButton} onPress={switchLanguage}>
          <Globe size={18} color='#1a73e8' />
          <Text style={styles.homeLanguageButtonText}>{language === 'EN' ? 'NE' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{`${ui.greeting}, ${user?.name ?? 'Student'}`}</Text>
      <Text style={styles.sectionBody}>{ui.startPrompt}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>{ui.yourClass}</Text>
          <Text style={styles.heroEyebrow}>{`Class ${user?.grade ?? grade ?? '4'}`}</Text>
        </View>
        <Text style={styles.heroTitle}>{ui.askQuestionTitle}</Text>
        <Text style={styles.heroText}>{ui.askQuestionText}</Text>
        <Text style={styles.subjectLabel}>{ui.subjectLabel}</Text>
        {renderSubjectChips()}
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <BrainCircuit size={18} color={hasBoundModel ? '#1a73e8' : '#b06000'} />
          <Text style={[styles.statusBadgeText, { color: hasBoundModel ? '#1a73e8' : '#b06000' }]}>{hasBoundModel ? ui.modelReady : ui.modelMissing}</Text>
        </View>
        <Text style={styles.statusBody}>{modelStatus}</Text>
        {isModelSetupBusy && (
          <View style={styles.modelSetupBusyRow}>
            <ActivityIndicator size='small' color='#1a73e8' />
            <Text style={styles.modelSetupBusyText}>Model setup is running. Please wait on low-spec devices.</Text>
          </View>
        )}
        <View style={styles.statusActionsRow}>
          <TouchableOpacity style={styles.refreshButton} onPress={() => void chooseModelFolder()} disabled={isModelSetupBusy}>
            <Text style={styles.refreshButtonText}>Choose model folder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButtonSecondary} onPress={() => void bootApp()} disabled={isModelSetupBusy}>
            <Text style={styles.refreshButtonSecondaryText}>{ui.refreshModel}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.modelSetupHint}>Choose the folder that contains model.litertlm. This may take time on low-spec phones; please wait.</Text>
      </View>

      <View style={styles.dualCardRow}>
        <View style={[styles.miniCard, styles.streakCard]}>
          <Text style={styles.miniCardLabel}>{ui.streakTitle}</Text>
          <Text style={styles.miniCardValue}>{dailyStreak}</Text>
          <Text style={styles.miniCardText}>{ui.streakText}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardLabel}>{ui.currentTopic}</Text>
          <Text style={styles.miniCardValueSmall}>{activeSubject.title}</Text>
          <Text style={styles.miniCardText}>{activeSubject.promptHint}</Text>
        </View>
      </View>

      <View style={styles.focusCard}>
        <Text style={styles.focusTitle}>{ui.focusTitle}</Text>
        <Text style={styles.focusText}>{ui.focusText}</Text>
      </View>

      <TouchableOpacity style={styles.actionCard} onPress={createNewChat}>
        <MessageSquare size={22} color='#1a73e8' />
        <View style={styles.actionCardCopy}>
          <Text style={styles.actionCardTitle}>{ui.askQuestionTitle}</Text>
          <Text style={styles.actionCardText}>{activeSubject.promptHint}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('progress')}>
        <PieChart size={22} color='#1a73e8' />
        <View style={styles.actionCardCopy}>
          <Text style={styles.actionCardTitle}>{ui.progressTitle}</Text>
          <Text style={styles.actionCardText}>{ui.progressText}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
  const renderLearn = () => (
    <View style={styles.container}>
      <View style={styles.learnHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSidebarOpen(true)}>
          <Menu size={22} color='#202124' />
        </TouchableOpacity>
        <Text style={styles.learnHeaderTitle}>{ui.appName}</Text>
        <View style={styles.learnHeaderActions}>
          <TouchableOpacity style={styles.iconButton} onPress={switchLanguage}>
            <Globe size={20} color='#202124' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={createNewChat}>
            <Plus size={22} color='#202124' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.learnSubjectBar}>
        <Text style={styles.learnSubjectLabel}>{ui.subjectLabel}</Text>
        {renderSubjectChips()}
      </View>

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {activeMessages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.emptyChatState}>
            <Image source={logoSource} style={styles.emptyChatLogo} />
            <Text style={styles.emptyChatTitle}>{`${ui.greeting} ${user?.name ?? ''}`.trim()}</Text>
            <Text style={styles.emptyChatText}>{activeSubject.promptHint}</Text>
          </ScrollView>
        ) : (
          <FlatList
            ref={chatListRef}
            data={activeMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={item.isUser ? styles.userBubble : styles.botRow}>
                {!item.isUser && <Image source={logoSource} style={styles.botAvatar} />}
                <View style={item.isUser ? styles.userBubbleInner : styles.botBubbleInner}>
                  {item.imageUri && (
                    <Image source={{ uri: item.imageUri }} style={styles.chatImagePreview} resizeMode='cover' />
                  )}
                  {item.attachmentName && (
                    <View style={styles.attachmentPill}>
                      <Text style={styles.attachmentPillText}>{item.attachmentName}</Text>
                    </View>
                  )}
                  {item.isPending ? (
                    <View style={styles.pendingRow}>
                      <ActivityIndicator size='small' color='#1a73e8' />
                      <Text style={styles.pendingText}>{item.text || ui.thinkingLabel}</Text>
                    </View>
                  ) : (
                    renderHighlightedText(item.text, item.isUser)
                  )}
                </View>
              </View>
            )}
          />
        )}

        {attachedFileName && (
          <View style={styles.imagePreviewStrip}>
            <View style={styles.attachmentStripChip}>
              <Text style={styles.attachmentStripText} numberOfLines={1}>
                {attachedFileName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.imagePreviewRemove}
              onPress={() => {
                setAttachedFileName(null);
                setAttachedFileContent(null);
              }}
            >
              <X size={16} color='#ffffff' />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.composeArea}>
          {hasBoundModel && (
            <View style={styles.composeMetaRow}>
              <TouchableOpacity
                style={styles.modelSelectChip}
                activeOpacity={0.85}
                onPress={() => setModelMenuOpen((current) => !current)}
              >
                <Text style={styles.modelSelectChipText} numberOfLines={1}>
                  {MODEL_LABEL}
                </Text>
                <ChevronDown size={14} color='#5f6368' />
              </TouchableOpacity>
            </View>
          )}

          {hasBoundModel && modelMenuOpen && (
            <View style={styles.modelMenuSheet}>
              <TouchableOpacity style={styles.modelMenuItem} activeOpacity={0.9} onPress={() => setModelMenuOpen(false)}>
                <Text style={styles.modelMenuItemTitle}>{MODEL_LABEL}</Text>
                <Text style={styles.modelMenuItemText}>Successfully bound on-device model</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.composeBar}>
            <TouchableOpacity
              style={styles.composeIcon}
              onPress={() => {
                setModelMenuOpen(false);
                void openTextFilePicker();
              }}
            >
              <FileText size={20} color='#5f6368' />
            </TouchableOpacity>
            <TextInput
              style={styles.composeInput}
              value={prompt}
              onChangeText={setPrompt}
              placeholder={ui.askPlaceholder}
              placeholderTextColor='#80868b'
              multiline
              onFocus={() => setModelMenuOpen(false)}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                isGenerating ? styles.stopButton : (!prompt.trim() && !attachedFileContent) ? styles.sendButtonDisabled : null,
              ]}
              onPress={isGenerating ? cancelGeneration : sendPrompt}
              disabled={!isGenerating && !prompt.trim() && !attachedFileContent}
            >
              {isGenerating ? (
                <Text style={styles.stopButtonText}>{ui.stopLabel}</Text>
              ) : (
                <Send size={18} color={(prompt.trim() || attachedFileContent) ? '#1a73e8' : '#bfc3c8'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {sidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sidebarPanel}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>{ui.historyLabel}</Text>
              <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                <X size={20} color='#202124' />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sidebarAction} onPress={createNewChat}>
              <Plus size={18} color='#202124' />
              <Text style={styles.sidebarActionText}>{ui.newChatLabel}</Text>
            </TouchableOpacity>

            <ScrollView style={styles.sidebarList}>
              {sessions.length === 0 && <Text style={styles.emptySidebarText}>{ui.noChats}</Text>}
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sidebarItem, session.id === activeSessionId && styles.sidebarItemActive]}
                  onPress={() => {
                    setActiveSessionId(session.id);
                    setSidebarOpen(false);
                  }}
                >
                  <MessageSquare size={16} color='#5f6368' />
                  <Text style={styles.sidebarItemText} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <TouchableOpacity onPress={() => removeSession(session.id)}>
                    <Trash2 size={16} color='#d93025' />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
  const renderQuizCard = () => (
    <View style={styles.progressCard}>
      <Text style={styles.progressCardTitle}>{ui.quizTitle}</Text>
      <Text style={styles.progressCardText}>{quiz.question}</Text>
      <View style={styles.quizOptions}>
        {quiz.options.map((option, index) => {
          const selected = selectedQuizIndex === index;
          const correct = quizStatus !== 'idle' && index === quiz.correctIndex;
          const wrong = quizStatus === 'wrong' && selected && index !== quiz.correctIndex;
          return (
            <TouchableOpacity
              key={`${option}-${index}`}
              style={[styles.quizOption, selected && styles.quizOptionSelected, correct && styles.quizOptionCorrect, wrong && styles.quizOptionWrong]}
              onPress={() => {
                setSelectedQuizIndex(index);
                setQuizStatus(index === quiz.correctIndex ? 'correct' : 'wrong');
              }}
            >
              <Text style={styles.quizOptionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {quizStatus !== 'idle' && (
        <View style={[styles.quizFeedback, quizStatus === 'correct' ? styles.quizFeedbackCorrect : styles.quizFeedbackWrong]}>
          <Text style={styles.quizFeedbackTitle}>{quizStatus === 'correct' ? ui.correctLabel : ui.wrongLabel}</Text>
          <Text style={styles.quizFeedbackText}>{quiz.explanation}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.refreshButton, isQuizRefreshing && { opacity: 0.7 }]}
        onPress={refreshQuiz}
        disabled={isQuizRefreshing}
      >
        <Text style={styles.refreshButtonText}>{isQuizRefreshing ? ui.thinkingLabel : ui.nextQuiz}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgress = () => (
    <ScrollView contentContainerStyle={styles.screenScroll}>
      <Text style={styles.sectionTitle}>{ui.dashboardTitle}</Text>
      <Text style={styles.sectionBody}>{ui.dashboardText}</Text>

      <View style={styles.progressCard}>
        <BookOpen size={22} color='#1a73e8' />
        <Text style={styles.progressCardTitle}>{`Saved chats: ${sessions.length}`}</Text>
        <Text style={styles.progressCardText}>{hasBoundModel ? ui.modelReady : modelStatus}</Text>
        {!!resolvedModelPath && <Text style={styles.progressPathText}>{`${ui.modelPathLabel}: ${resolvedModelPath}`}</Text>}
      </View>

      <View style={styles.dualCardRow}>
        <View style={[styles.miniCard, styles.streakCard]}>
          <Text style={styles.miniCardLabel}>{ui.streakTitle}</Text>
          <Text style={styles.miniCardValue}>{dailyStreak}</Text>
          <Text style={styles.miniCardText}>{ui.streakText}</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardLabel}>{ui.currentTopic}</Text>
          <Text style={styles.miniCardValueSmall}>{activeSubject.title}</Text>
          <Text style={styles.miniCardText}>{activeSubject.plannerLabel}</Text>
        </View>
      </View>

      {renderQuizCard()}

      <View style={styles.progressCard}>
        <Text style={styles.progressCardTitle}>{ui.plannerTitle}</Text>
        <Text style={styles.progressCardText}>{ui.plannerText}</Text>
        <View style={styles.planList}>
          {studyPlan.map((step, index) => (
            <View key={`${step.title}-${index}`} style={styles.planItem}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.planCopy}>
                <Text style={styles.planTitle}>{step.title}</Text>
                <Text style={styles.planDetail}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logoutUser}>
        <LogOut size={18} color='#d93025' />
        <Text style={styles.logoutButtonText}>{ui.logoutLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  if (isBooting) return renderBoot();
  if (screen === 'onboarding') return renderOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'learn' && renderLearn()}
        {activeTab === 'progress' && renderProgress()}
      </View>

      <View style={styles.bottomTabs}>
        {[
          { id: 'home', label: ui.homeLabel, icon: Home },
          { id: 'learn', label: ui.learnLabel, icon: MessageSquare },
          { id: 'progress', label: ui.progressLabel, icon: PieChart },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <TouchableOpacity key={item.id} style={styles.bottomTab} onPress={() => setActiveTab(item.id as TabState)}>
              <Icon size={20} color={active ? '#1a73e8' : '#5f6368'} />
              <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  bootLogo: {
    width: 84,
    height: 84,
    marginBottom: 20,
  },
  bootTitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#202124',
    fontWeight: '600',
    textAlign: 'center',
  },
  bootSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#80868b',
  },
  onboardingScroll: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandLogo: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#202124',
  },
  appSubtitle: {
    fontSize: 15,
    color: '#5f6368',
    marginTop: 6,
  },
  formBlock: {
    gap: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
    marginTop: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#202124',
    backgroundColor: '#f8fafc',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gradePill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d8dde3',
    backgroundColor: '#ffffff',
  },
  gradePillActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  gradeText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  gradeTextActive: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  languageButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  languageButtonText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  screenScroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingTop: Platform.OS === 'android' ? 6 : 0,
  },
  homeHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202124',
  },
  homeHeaderSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#5f6368',
  },
  homeLanguageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#d8e7ff',
  },
  homeLanguageButtonText: {
    color: '#1a73e8',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202124',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f6368',
    marginTop: 8,
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#eff5ff',
    borderWidth: 1,
    borderColor: '#d8e7ff',
    gap: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#405261',
  },
  subjectLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5f6368',
    marginTop: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 12,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8dde3',
  },
  subjectChipActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#405261',
  },
  subjectChipTextActive: {
    color: '#ffffff',
  },
  statusCard: {
    borderWidth: 1,
    borderColor: '#e3e8ef',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  statusBody: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#5f6368',
  },
  statusActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e8f0fe',
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a73e8',
  },
  refreshButtonSecondary: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f3f4',
  },
  refreshButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
  },
  modelSetupBusyRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelSetupBusyText: {
    flex: 1,
    fontSize: 12,
    color: '#5f6368',
  },
  modelSetupHint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: '#80868b',
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3e8ef',
    gap: 6,
  },
  streakCard: {
    backgroundColor: '#fff9ea',
    borderColor: '#f8d978',
  },
  miniCardLabel: {
    fontSize: 12,
    color: '#5f6368',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  miniCardValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#202124',
  },
  miniCardValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  miniCardText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5f6368',
  },
  focusCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#f7f9fc',
    borderWidth: 1,
    borderColor: '#e5ebf2',
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  focusText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#5f6368',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e3e8ef',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    backgroundColor: '#ffffff',
  },
  actionCardCopy: {
    flex: 1,
    marginLeft: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  actionCardText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5f6368',
    marginTop: 4,
  },
  learnHeader: {
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  learnHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  learnHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  learnSubjectBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
    gap: 8,
  },
  learnSubjectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f6368',
    textTransform: 'uppercase',
  },
  learnInsightWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  learnTermsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyChatState: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyChatLogo: {
    width: 58,
    height: 58,
    marginBottom: 18,
  },
  emptyChatTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202124',
  },
  emptyChatText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5f6368',
    textAlign: 'center',
    marginTop: 10,
  },
  chatList: {
    padding: 16,
    paddingBottom: 32,
  },
  userBubble: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userBubbleInner: {
    maxWidth: '84%',
    backgroundColor: '#e8f0fe',
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubbleText: {
    color: '#202124',
    fontSize: 15,
    lineHeight: 22,
  },
  botRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  botAvatar: {
    width: 28,
    height: 28,
    marginRight: 10,
    marginTop: 2,
  },
  botBubbleInner: {
    flex: 1,
    maxWidth: '88%',
    backgroundColor: '#f6f8fb',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  botBubbleText: {
    color: '#202124',
    fontSize: 15,
    lineHeight: 22,
  },
  inlineHighlight: {
    backgroundColor: '#fff0a8',
    color: '#202124',
    fontWeight: '700',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingText: {
    color: '#5f6368',
    fontSize: 14,
    fontStyle: 'italic',
  },
  composeArea: {
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
    backgroundColor: '#ffffff',
    paddingTop: 8,
  },
  composeMetaRow: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  modelSelectChip: {
    maxWidth: '86%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f4f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modelSelectChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#202124',
  },
  modelMenuSheet: {
    marginHorizontal: 14,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6ebf1',
    overflow: 'hidden',
    elevation: 6,
  },
  modelMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modelMenuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  modelMenuItemText: {
    marginTop: 3,
    fontSize: 12,
    color: '#5f6368',
  },
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  composeIcon: {
    padding: 10,
  },
  imageMenuOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  imageMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  imageMenuSheet: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e6ebf1',
    overflow: 'hidden',
    elevation: 8,
  },
  imageMenuAction: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  imageMenuActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202124',
  },
  imageMenuActionText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#5f6368',
  },
  composeInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 24,
    backgroundColor: '#f0f4f9',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#202124',
    fontSize: 15,
  },
  sendButton: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#eef4ff',
  },
  sendButtonDisabled: {
    backgroundColor: '#f2f4f7',
  },
  stopButton: {
    backgroundColor: '#fde8e7',
    paddingHorizontal: 14,
  },
  stopButtonText: {
    color: '#d93025',
    fontSize: 12,
    fontWeight: '700',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    zIndex: 999,
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sidebarPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 290,
    backgroundColor: '#ffffff',
    paddingTop: 18,
    elevation: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  sidebarAction: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#f6f8fb',
    borderWidth: 1,
    borderColor: '#e3e8ef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarActionText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
  },
  sidebarList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptySidebarText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#80868b',
    fontSize: 14,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
  },
  sidebarItemActive: {
    backgroundColor: '#e8f0fe',
  },
  sidebarItemText: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    color: '#202124',
  },
  progressCard: {
    borderWidth: 1,
    borderColor: '#e3e8ef',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
  },
  progressCardText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5f6368',
  },
  progressPathText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#80868b',
  },
  highlightCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#fff8c7',
    borderWidth: 1,
    borderColor: '#f4df72',
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7a5b00',
    textTransform: 'uppercase',
  },
  highlightText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#4f3f00',
    fontWeight: '600',
  },
  termWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  termChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff6d6',
  },
  termChipText: {
    fontSize: 13,
    color: '#7a5b00',
    fontWeight: '700',
  },
  quizOptions: {
    gap: 10,
  },
  quizOption: {
    borderWidth: 1,
    borderColor: '#d8dde3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  quizOptionSelected: {
    borderColor: '#1a73e8',
    backgroundColor: '#eef5ff',
  },
  quizOptionCorrect: {
    borderColor: '#1f9d55',
    backgroundColor: '#ebfff3',
  },
  quizOptionWrong: {
    borderColor: '#d93025',
    backgroundColor: '#fff1f0',
  },
  quizOptionText: {
    fontSize: 14,
    color: '#202124',
    lineHeight: 20,
  },
  quizFeedback: {
    borderRadius: 14,
    padding: 14,
  },
  quizFeedbackCorrect: {
    backgroundColor: '#ebfff3',
  },
  quizFeedbackWrong: {
    backgroundColor: '#fff6d6',
  },
  quizFeedbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#202124',
  },
  quizFeedbackText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#405261',
  },
  planList: {
    gap: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planBadgeText: {
    color: '#1a73e8',
    fontWeight: '800',
    fontSize: 13,
  },
  planCopy: {
    flex: 1,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  planDetail: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: '#5f6368',
  },
  logoutButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d93025',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: '#d93025',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 20,
    marginBottom: Platform.OS === 'android' ? 16 : 0,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabText: {
    marginTop: 4,
    fontSize: 12,
    color: '#5f6368',
    fontWeight: '500',
  },
  bottomTabTextActive: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  chatImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#e3e8ef',
  },
  attachmentPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 999,
    backgroundColor: '#eef4ff',
  },
  attachmentPillText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '600',
  },
  imagePreviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f6f8fb',
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
  },
  attachmentStripChip: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#eef4ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachmentStripText: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '600',
  },
  imagePreviewRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d93025',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    marginTop: -48,
  },
});


const MODEL_LABEL = 'Google AI Edge LiteRT Gemma 4 finetuned';
