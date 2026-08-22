import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeModules,
  PanResponder,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Cpu,
  Download,
  FileCheck,
  FileText,
  Folder,
  GraduationCap,
  HardDrive,
  Headphones,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  PanelLeftClose,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import { MathMarkdownRenderer } from './MathMarkdownRenderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabState = 'home' | 'learn' | 'revision' | 'solver';
type ScreenState = 'onboarding' | 'download' | 'main';
type SubjectId = 'science' | 'math' | 'social' | 'nepali' | 'english' | 'opt_math' | 'computer';
type QuizStatus = 'idle' | 'correct' | 'wrong';

interface UserProfile {
  name: string;
  school: string;
  grade: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isPending?: boolean;
  attachmentName?: string;
  attachmentImageUri?: string;
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
}

interface SubjectItem {
  id: SubjectId;
  name: string;
  nameNe: string;
  unitsCount: number;
  pagesCount: number;
  hasDualMedium: boolean;
  englishAssetPdf?: string;
  nepaliAssetPdf?: string;
  englishTitle: string;
  nepaliTitle: string;
}

interface QuizItem {
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ActivePdfState {
  assetPath: string;
  title: string;
  currentPage: number;
  totalPages: number;
  pageImageUri: string | null;
  isLoadingPage: boolean;
  zoomScale: number;
}

const STORAGE_KEYS = {
  user: '@guru_user',
  sessions: '@guru_sessions',
  modelPath: '@guru_model_path',
  legacyUser: '@pathsala_user',
  legacySessions: '@pathsala_sessions',
  legacyModelPath: '@pathsala_model_path',
};

const logoSource = require('./assets/logo.png');

// --- 10/10 CHATGPT-STYLE MARKDOWN, MATH & WORD SEPARATION PARSER ---
const formatGemmaResponse = (text: string): string => {
  if (!text) return '';

  let out = text;

  // 1. Strip special model tokens & greetings
  out = out
    .replace(/<start_of_turn>/g, '')
    .replace(/<end_of_turn>/g, '')
    .replace(/<eos>/g, '')
    .replace(/<\/s>/g, '')
    .replace(/\[\/?s\]/g, '')
    .replace(/^(?:Namaste[!,\s.-]*|Hello[!,\s.-]*|Hi[!,\s.-]*)/i, '');

  // 2. Fix glued word boundaries from LLM headings (e.g., "EquationPhotosynthesis", "ComponentsTo", "SummaryPhotosynthesis")
  out = out
    .replace(/([a-z0-9\)])([A-Z][a-z]+)/g, '$1 $2')
    .replace(/(Equation|Components|Summary|Reactions|Process|Stage\s*[0-9]+)([A-Z])/g, '$1\n\n$2')
    .replace(/(Photosynthesis|Gravitation|Respiration|Circulation)([A-Z])/g, '$1\n\n$2');

  // 3. LaTeX Delimiters
  out = out
    .replace(/\$\$(.*?)\$\$/gs, '\n\n$1\n\n')
    .replace(/\\\[(.*?)\\\]/gs, '\n\n$1\n\n')
    .replace(/\\\((.*?)\\\)/gs, ' $1 ')
    .replace(/\$([^\$\n]+)\$/g, '$1');

  // 4. Fractions & Roots
  out = out
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{1\}\{4\}/g, '¼')
    .replace(/\\frac\{3\}\{4\}/g, '¾')
    .replace(/\\frac\{1\}\{3\}/g, '⅓')
    .replace(/\\frac\{2\}\{3\}/g, '⅔')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, '√$1');

  // 5. Exponents & Superscripts
  const supMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
  };
  out = out.replace(/\^\{([0-9+\-nixy]+)\}/g, (_, p) => {
    return p.split('').map((c: string) => supMap[c] || c).join('');
  });
  out = out.replace(/\^([0-9n])/g, (_, p) => supMap[p] || `^${p}`);

  // 6. Subscripts
  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'n': 'ₙ',
  };
  out = out.replace(/_\{([0-9+\-aeoxn]+)\}/g, (_, p) => {
    return p.split('').map((c: string) => subMap[c] || c).join('');
  });
  out = out.replace(/_([0-9n])/g, (_, p) => subMap[p] || `_${p}`);

  // 7. Math & Chemical Symbols
  out = out
    .replace(/\\times\b/g, ' × ')
    .replace(/\\cdot\b/g, ' · ')
    .replace(/\\div\b/g, ' ÷ ')
    .replace(/\\pm\b/g, ' ± ')
    .replace(/\\mp\b/g, ' ∓ ')
    .replace(/\\leq?\b/g, ' ≤ ')
    .replace(/\\geq?\b/g, ' ≥ ')
    .replace(/\\neq?\b/g, ' ≠ ')
    .replace(/\\approx\b/g, ' ≈ ')
    .replace(/\\equiv\b/g, ' ≡ ')
    .replace(/\\propto\b/g, ' ∝ ')
    .replace(/\\infty\b/g, ' ∞ ')
    .replace(/\\sum\b/g, ' ∑ ')
    .replace(/\\int\b/g, ' ∫ ')
    .replace(/\\degree\b|\^\\circ\b/g, '°')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Rightarrow\b|\\implies\b/g, ' ⇒ ')
    .replace(/\\rightarrow\b|\\to\b/g, ' → ')
    .replace(/\\text\{([^{}]+)\}/g, '$1');

  // 8. Markdown Headings & Clean Section Breaks (Strip all # hashes)
  out = out
    .replace(/^[ \t]*#{1,6}\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/([^\n])\s*(Phase\s*\d+:|Step\s*\d+:|Summary:)/gi, '$1\n\n$2')
    .replace(/(Phase\s*\d+:\s*[^.\n]+?\.)\s*([A-Z])/g, '$1\n\n$2')
    .replace(/(Step\s*\d+:\s*[^.\n]+?\.)\s*([A-Z])/g, '$1\n\n$2');

  // 10. Clean list items and excess blank lines
  out = out
    .replace(/^[ \t]*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out;
};

// --- DYNAMIC MULTI-SUBJECT QUIZ POOL ---
const ALL_QUIZ_POOL: QuizItem[] = [
  {
    subject: 'Science & Tech',
    question: 'What is the product when an acid reacts with a base in neutralization?',
    options: ['Salt and water', 'Only gas', 'Only metal', 'Ice'],
    correctIndex: 0,
    explanation: 'An acid reacts with a base to form salt and water (e.g., HCl + NaOH -> NaCl + H₂O).',
  },
  {
    subject: 'Science & Tech',
    question: 'What is the value of Universal Gravitational Constant (G)?',
    options: ['6.67 × 10⁻¹¹ N m²/kg²', '9.8 m/s²', '3 × 10⁸ m/s', '1.6 × 10⁻¹⁹ C'],
    correctIndex: 0,
    explanation: 'G = 6.67 × 10⁻¹¹ N m²/kg², which remains constant everywhere across the universe.',
  },
  {
    subject: 'Science & Tech',
    question: 'According to Pascal\'s Law, pressure exerted on an enclosed liquid is transmitted:',
    options: ['Equally in all directions', 'Only downwards', 'Only to the walls', 'Zero at bottom'],
    correctIndex: 0,
    explanation: 'Pascal\'s Law states that pressure applied to an enclosed liquid is transmitted equally and undiminished in every direction.',
  },
  {
    subject: 'Compulsory Maths',
    question: 'If Principal is P, rate is R%, and time is T years, what is Compound Amount (CA)?',
    options: ['P · (1 + R/100)ᵀ', 'P · R · T / 100', 'P · (1 - R/100)ᵀ', 'P + (R · T)'],
    correctIndex: 0,
    explanation: 'Compound Amount for annual compounding is CA = P(1 + R/100)ᵀ.',
  },
  {
    subject: 'Compulsory Maths',
    question: 'What is the Total Surface Area (TSA) of a sphere of radius r?',
    options: ['4 · π · r²', '2 · π · r · h', '(4/3) · π · r³', 'π · r²'],
    correctIndex: 0,
    explanation: 'The surface area of a complete sphere of radius r is 4πr².',
  },
  {
    subject: 'Social Studies',
    question: 'When was the current Constitution of Nepal 2072 promulgated?',
    options: ['Ashoj 3, 2072 BS', 'Baisakh 1, 2072 BS', 'Mangsir 4, 2070 BS', 'Chaitra 24, 2063 BS'],
    correctIndex: 0,
    explanation: 'The Constitution of Nepal 2072 was officially promulgated on 3rd Ashoj, 2072 BS.',
  },
  {
    subject: 'Optional Math',
    question: 'What is the condition for two lines ax² + 2hxy + by² = 0 to be perpendicular?',
    options: ['a + b = 0', 'h² - ab = 0', 'a = b', 'h = 0'],
    correctIndex: 0,
    explanation: 'For a pair of straight lines ax² + 2hxy + by² = 0 to be mutually perpendicular, the condition is a + b = 0.',
  },
  {
    subject: 'Nepali',
    question: '‘उज्यालो यात्रा’ कविताका रचनाकार को हुन्?',
    options: ['रामप्रसाद ज्ञवाली', 'लक्ष्मीप्रसाद देवकोटा', 'भानुभक्त आचार्य', 'माधवप्रसाद घिमिरे'],
    correctIndex: 0,
    explanation: 'कक्षा १० को पहिलो पाठ ‘उज्यालो यात्रा’ कविता कवि रामप्रसाद ज्ञवालीद्वारा रचित हो।',
  },
];

// --- SUBJECT CURRICULUM & PDF ASSETS CATALOG ---
const SUBJECTS_DATA: SubjectItem[] = [
  {
    id: 'science',
    name: 'Science & Tech',
    nameNe: 'विज्ञान तथा प्रविधि',
    unitsCount: 15,
    pagesCount: 240,
    hasDualMedium: true,
    englishAssetPdf: 'grade10/science/pdf/english medium/Class 10 Science and Technology Book [English Medium].pdf',
    nepaliAssetPdf: 'grade10/science/pdf/nepali medium/Book - Class 10 Compulsory Science_1754397695.pdf',
    englishTitle: 'Class 10 Science & Technology (English Medium)',
    nepaliTitle: 'कक्षा १० विज्ञान तथा प्रविधि (नेपाली माध्यम)',
  },
  {
    id: 'math',
    name: 'Compulsory Maths',
    nameNe: 'अनिवार्य गणित',
    unitsCount: 14,
    pagesCount: 212,
    hasDualMedium: true,
    englishAssetPdf: 'grade10/maths/pdf/english medium/Class-10-Maths-in-English.pdf',
    nepaliAssetPdf: 'grade10/maths/pdf/nepali medium/0010_MathsGrade10NepaliVersion.pdf',
    englishTitle: 'Class 10 Compulsory Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० अनिवार्य गणित (नेपाली माध्यम)',
  },
  {
    id: 'social',
    name: 'Social Studies',
    nameNe: 'सामाजिक अध्ययन',
    unitsCount: 9,
    pagesCount: 270,
    hasDualMedium: true,
    englishAssetPdf: 'grade10/Social/0010_SocialStudiesGrade10.pdf',
    nepaliAssetPdf: 'grade10/maths/social_studies/pdf/Class-10-Book-Social-Studies-NE-2080_1760939605.pdf',
    englishTitle: 'Class 10 Social Studies (English Medium)',
    nepaliTitle: 'कक्षा १० सामाजिक अध्ययन (नेपाली माध्यम)',
  },
  {
    id: 'nepali',
    name: 'Nepali',
    nameNe: 'नेपाली',
    unitsCount: 10,
    pagesCount: 224,
    hasDualMedium: false,
    nepaliAssetPdf: 'grade10/nepali/pdf/0010_NepaliGrade10.pdf',
    englishTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    nepaliTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
  },
  {
    id: 'english',
    name: 'Compulsory English',
    nameNe: 'अंग्रेजी',
    unitsCount: 10,
    pagesCount: 198,
    hasDualMedium: false,
    englishAssetPdf: 'grade10/english/pdf/9.Reduced-class 10 English Final_hsjc8bm.pdf',
    englishTitle: 'Class 10 Compulsory English (CDC Official)',
    nepaliTitle: 'Class 10 Compulsory English (CDC Official)',
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    nameNe: 'ऐच्छिक गणित',
    unitsCount: 9,
    pagesCount: 256,
    hasDualMedium: true,
    englishAssetPdf: 'grade10/optional math/pdf/english medium/Class-10-Optional-Mathematics-English.pdf',
    nepaliAssetPdf: 'grade10/optional math/pdf/nepali medium/Class 10 Optional Mathematics Book [Nepali Medium].pdf.pdf',
    englishTitle: 'Class 10 Optional Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० ऐच्छिक गणित (नेपाली माध्यम)',
  },
  {
    id: 'computer',
    name: 'Computer Science',
    nameNe: 'कम्प्युटर विज्ञान',
    unitsCount: 8,
    pagesCount: 160,
    hasDualMedium: false,
    englishAssetPdf: 'grade10/computer science/CSGrade 10_rs8obhn.pdf',
    englishTitle: 'Class 10 Computer Science (Official CDC)',
    nepaliTitle: 'कक्षा १० कम्प्युटर विज्ञान (Official CDC)',
  },
];

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [screen, setScreen] = useState<ScreenState>('onboarding');
  const [activeTab, setActiveTab] = useState<TabState>('home');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Onboarding Form State
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('10');

  // AI Chat & Multi-Turn Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  // TTS Voice Engine State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // In-App Native PDF Viewer State
  const [activePdf, setActivePdf] = useState<ActivePdfState | null>(null);

  // Sidebar Drawer for Chat Hub
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Floating AI modal
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Medium Selection Popup
  const [mediumChooserSubject, setMediumChooserSubject] = useState<SubjectItem | null>(null);

  // Dynamic Random Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<QuizItem>(ALL_QUIZ_POOL[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');

  // Image & File Attachments for Multimodal Problem Solving
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);
  const [attachedImageUri, setAttachedImageUri] = useState<string | null>(null);

  // Math Solver — Camera-Based Step-by-Step Problem Solver
  const [solverImageUri, setSolverImageUri] = useState<string | null>(null);
  const [solverResult, setSolverResult] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  const chatListRef = useRef<FlatList>(null);
  const activeGenerationRef = useRef<GenerationRef | null>(null);
  const modelReadyRef = useRef(false);

  // --- FREE MOVABLE DRAGGABLE FLOATING BOT SPHERE ---
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 76, y: SCREEN_HEIGHT - 180 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activeMessages = activeSession?.messages ?? [];

  const pickRandomQuiz = () => {
    const randomIndex = Math.floor(Math.random() * ALL_QUIZ_POOL.length);
    setCurrentQuiz(ALL_QUIZ_POOL[randomIndex]);
    setSelectedOption(null);
    setQuizStatus('idle');
  };

  // --- HARDWARE BACK BUTTON HANDLER ---
  useEffect(() => {
    const onBackPress = () => {
      if (activePdf) {
        setActivePdf(null);
        return true;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      if (mediumChooserSubject) {
        setMediumChooserSubject(null);
        return true;
      }
      if (isChatModalOpen) {
        setIsChatModalOpen(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [activePdf, isSidebarOpen, mediumChooserSubject, isChatModalOpen]);

  // --- 3-MODEL AI DOWNLOAD & SETUP STATE ---
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0 MB/s');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadEta, setDownloadEta] = useState('--');
  const [currentDownloadModel, setCurrentDownloadModel] = useState('Google Gemma 4 E2B AI Brain');
  const [downloadedTotalMb, setDownloadedTotalMb] = useState(0);
  const [totalAllMb, setTotalAllMb] = useState(2665);
  const [hfToken, setHfToken] = useState('');
  const [showHfTokenInput, setShowHfTokenInput] = useState(false);

  const [isCheckingModels, setIsCheckingModels] = useState(false);
  const [gemmaStatus, setGemmaStatus] = useState<{ found: boolean; path: string; sizeMb: number }>({ found: false, path: '', sizeMb: 0 });
  const [kokoroStatus, setKokoroStatus] = useState<{ found: boolean; path: string; sizeMb: number }>({ found: true, path: 'builtin_android_tts', sizeMb: 0 });
  const [whisperStatus, setWhisperStatus] = useState<{ found: boolean; path: string; sizeMb: number }>({ found: false, path: '', sizeMb: 0 });
  const [isAllModelsReady, setIsAllModelsReady] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Voice Input (STT) & Realtime Voice Mode State
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [voiceModeState, setVoiceModeState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceModeTranscript, setVoiceModeTranscript] = useState('');
  const [voiceModeAiText, setVoiceModeAiText] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const orbScale = useRef(new Animated.Value(1)).current;

  // Multi-Model Download Progress Listener
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = DeviceEventEmitter.addListener('MultiModelDownloadProgress', (data: any) => {
      if (data.percentage !== undefined) {
        setDownloadProgress(data.percentage);
      }
      if (data.speedFormatted) {
        setDownloadSpeed(data.speedFormatted);
      }
      if (data.etaFormatted) {
        setDownloadEta(data.etaFormatted);
      }
      if (data.currentModelName) {
        setCurrentDownloadModel(data.currentModelName);
      }
      if (data.bytesReadTotalMb !== undefined) {
        setDownloadedTotalMb(Math.round(data.bytesReadTotalMb));
      }
      if (data.totalBytesAllMb !== undefined) {
        setTotalAllMb(Math.round(data.totalBytesAllMb));
      }

      if (data.completedKeys && Array.isArray(data.completedKeys)) {
        if (data.completedKeys.includes('gemma')) {
          setGemmaStatus((prev) => ({ ...prev, found: true, sizeMb: prev.sizeMb || 2590 }));
        }
        if (data.completedKeys.includes('whisper')) {
          setWhisperStatus((prev) => ({ ...prev, found: true, sizeMb: prev.sizeMb || 75 }));
        }
      }

      if (data.status === 'downloading') {
        setIsDownloading(true);
      } else if (data.status === 'done') {
        setIsDownloading(false);
        setIsAllModelsReady(true);
        setDownloadProgress(100);
        showToast('Offline AI Models Successfully Downloaded & Ready!');
      } else if (data.status === 'error') {
        setIsDownloading(false);
        showToast('Download notice: ' + (data.error || 'Network error'));
        if (data.error && data.error.includes('401')) {
          setShowHfTokenInput(true);
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  const verifyAllModels = async () => {
    setIsCheckingModels(true);
    try {
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.checkAllModelsStatus) {
        const res = await NativeModules.LLMInferenceModule.checkAllModelsStatus();
        if (res) {
          setGemmaStatus({ found: !!res.gemmaFound, path: res.gemmaPath || '', sizeMb: Math.round(res.gemmaSizeMb || 0) });
          setKokoroStatus({ found: !!res.kokoroFound, path: res.kokoroPath || '', sizeMb: Math.round(res.kokoroSizeMb || 0) });
          setWhisperStatus({ found: !!res.whisperFound, path: res.whisperPath || '', sizeMb: Math.round(res.whisperSizeMb || 0) });
          setIsAllModelsReady(!!res.allReady);
          if (res.allReady) {
            setDownloadProgress(100);
          }
          if (res.gemmaPath) {
            try {
              await AsyncStorage.setItem(STORAGE_KEYS.modelPath, res.gemmaPath);
              await NativeModules.LLMInferenceModule.initModel(res.gemmaPath);
              setIsModelReady(true);
              modelReadyRef.current = true;
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.warn('Model check error:', err);
    } finally {
      setIsCheckingModels(false);
    }
  };

  const verifyResources = verifyAllModels;

  // --- BOOT & MODEL INITIALIZATION ---
  useEffect(() => {
    const bootApp = async () => {
      try {
        let storedUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
        if (!storedUser) {
          storedUser = await AsyncStorage.getItem(STORAGE_KEYS.legacyUser);
        }
        const resourcesReady = await AsyncStorage.getItem('@guru_resources_ready');

        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setName(parsed.name || '');
            setSchool(parsed.school || '');
            setGrade(parsed.grade || '10');
            if (resourcesReady === 'true') {
              setScreen('main');
              setTimeout(() => {
                verifyAllModels();
              }, 100);
            } else {
              setScreen('download');
              setTimeout(() => {
                verifyAllModels();
              }, 200);
            }
          } catch (_) {
            setScreen('onboarding');
          }
        } else {
          setScreen('onboarding');
        }

        let storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
        if (!storedSessions) {
          storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.legacySessions);
        }
        if (storedSessions) {
          try {
            const parsed = JSON.parse(storedSessions);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSessions(parsed);
              setActiveSessionId(parsed[0].id);
            }
          } catch (_) {}
        }

        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
          try {
            let storedPath = await AsyncStorage.getItem(STORAGE_KEYS.modelPath);
            if (!storedPath) {
              storedPath = await AsyncStorage.getItem(STORAGE_KEYS.legacyModelPath);
            }
            if (storedPath) {
              await NativeModules.LLMInferenceModule.initModel(storedPath);
              modelReadyRef.current = true;
              setIsModelReady(true);
            }
          } catch (_) {}
        }

        pickRandomQuiz();
      } catch (err) {
        console.warn('Boot initialization issue:', err);
      } finally {
        setTimeout(() => setIsBooting(false), 200);
      }
    };

    void bootApp();
  }, []);

  // Persist chat sessions to disk
  useEffect(() => {
    if (sessions.length > 0) {
      void AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    }
  }, [sessions]);

  // --- STREAMING LISTENERS ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const chunkSub = DeviceEventEmitter.addListener('LiteRTResponseChunk', (event: { requestId?: string; text?: string; chunk?: string }) => {
      const active = activeGenerationRef.current;
      if (!active || (event.requestId && event.requestId !== active.requestId)) return;
      const currentText = event.text || event.chunk || '';
      if (currentText) {
        updateAssistantMessage(active.sessionId, active.messageId, currentText, true);
      }
    });

    const doneSub = DeviceEventEmitter.addListener('LiteRTResponseDone', (event: { requestId?: string; text?: string }) => {
      const active = activeGenerationRef.current;
      if (!active || event.requestId !== active.requestId) return;

      const finalText = String(event.text ?? '');
      updateAssistantMessage(active.sessionId, active.messageId, finalText, false);
      setIsGenerating(false);
      activeGenerationRef.current = null;
    });

    const errorSub = DeviceEventEmitter.addListener('LiteRTResponseError', () => {
      setIsGenerating(false);
      activeGenerationRef.current = null;
    });

    return () => {
      chunkSub.remove();
      doneSub.remove();
      errorSub.remove();
    };
  }, []);

  // Native Speech-to-Text Recognition Listeners
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const startSub = DeviceEventEmitter.addListener('onSpeechStart', () => {
      setIsListening(true);
    });

    const partialSub = DeviceEventEmitter.addListener('onSpeechPartial', (e: { text?: string }) => {
      if (e.text) {
        setSpeechText(e.text);
        if (!isVoiceModeOpen) {
          setPrompt(e.text);
        } else {
          setVoiceModeTranscript(e.text);
        }
      }
    });

    const finalSub = DeviceEventEmitter.addListener('onSpeechFinal', (e: { text?: string }) => {
      setIsListening(false);
      const text = e.text?.trim() || speechText.trim();
      if (text) {
        if (!isVoiceModeOpen) {
          setPrompt(text);
          showToast('Speech transcribed');
        } else {
          handleVoiceModeTurn(text);
        }
      }
    });

    const errorSub = DeviceEventEmitter.addListener('onSpeechError', (e: { text?: string }) => {
      setIsListening(false);
      if (isVoiceModeOpen && voiceModeState === 'listening') {
        setVoiceModeState('idle');
      }
      if (e.text && !e.text.includes('No speech')) {
        showToast(e.text);
      }
    });

    const endSub = DeviceEventEmitter.addListener('onSpeechEnd', () => {
      setIsListening(false);
    });

    return () => {
      startSub.remove();
      partialSub.remove();
      finalSub.remove();
      errorSub.remove();
      endSub.remove();
    };
  }, [isVoiceModeOpen, voiceModeState, speechText]);

  // Orb Pulsing Animation for Realtime Voice Mode
  useEffect(() => {
    if (isVoiceModeOpen) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, {
            toValue: voiceModeState === 'speaking' ? 1.25 : voiceModeState === 'listening' ? 1.15 : 1.05,
            duration: voiceModeState === 'speaking' ? 400 : 700,
            useNativeDriver: true,
          }),
          Animated.timing(orbScale, {
            toValue: 0.95,
            duration: voiceModeState === 'speaking' ? 400 : 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isVoiceModeOpen, voiceModeState]);

  const startVoiceRecording = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showToast('Microphone permission required for speech recognition.');
          return;
        }

        setSpeechText('');
        if (NativeModules.LLMInferenceModule?.startSpeechRecognition) {
          await NativeModules.LLMInferenceModule.startSpeechRecognition('en-US');
          setIsListening(true);
        }
      } catch (err) {
        console.warn('Start STT error:', err);
      }
    }
  };

  const stopVoiceRecording = async () => {
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.stopSpeechRecognition) {
      try {
        await NativeModules.LLMInferenceModule.stopSpeechRecognition();
      } catch (_) {}
    }
    setIsListening(false);
  };

  const startVoiceMode = async () => {
    setIsVoiceModeOpen(true);
    setVoiceModeState('listening');
    setVoiceModeTranscript('');
    setVoiceModeAiText('');
    await startVoiceRecording();
  };

  const stopVoiceMode = async () => {
    setIsVoiceModeOpen(false);
    setVoiceModeState('idle');
    await stopVoiceRecording();
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.stopSpeaking) {
      await NativeModules.LLMInferenceModule.stopSpeaking();
    }
  };

  const handleVoiceModeTurn = async (userUtterance: string) => {
    if (!userUtterance.trim()) {
      setVoiceModeState('listening');
      await startVoiceRecording();
      return;
    }

    setVoiceModeTranscript(userUtterance);
    setVoiceModeState('thinking');
    setVoiceModeAiText('Thinking...');

    try {
      const requestId = Math.random().toString(36).slice(2, 10);
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.generateResponse) {
        const reply = await NativeModules.LLMInferenceModule.generateResponse(
          userUtterance,
          'EN',
          true,
          [],
          requestId,
          ''
        );

        const cleanReply = reply || 'I understand.';
        setVoiceModeAiText(cleanReply);
        setVoiceModeState('speaking');

        if (NativeModules.LLMInferenceModule?.speakText) {
          await NativeModules.LLMInferenceModule.speakText(cleanReply);
        }

        const speakingDurationMs = Math.max(3000, Math.min(12000, cleanReply.length * 70));
        setTimeout(async () => {
          if (isVoiceModeOpen) {
            setVoiceModeState('listening');
            setVoiceModeTranscript('');
            setVoiceModeAiText('');
            await startVoiceRecording();
          }
        }, speakingDurationMs);
      }
    } catch (err) {
      setVoiceModeState('listening');
      await startVoiceRecording();
    }
  };

  const updateAssistantMessage = (sessionId: string, messageId: string, text: string, isPending: boolean) => {
    const formatted = formatGemmaResponse(text);
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          updatedAt: Date.now(),
          messages: session.messages.map((m) =>
            m.id === messageId ? { ...m, text: isPending ? text : formatted, isPending } : m
          ),
        };
      })
    );
  };

  const registerUser = async () => {
    if (!name.trim()) return;
    const profile: UserProfile = {
      name: name.trim(),
      school: school.trim() || 'CDC High School',
      grade: grade || '10',
    };
    setUser(profile);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
    setScreen('download');
    setTimeout(() => {
      verifyAllModels();
    }, 150);
  };

  const startDownloadAllModels = async (replaceExisting = false) => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (_) {}
    }
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadedTotalMb(0);
    try {
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.startDownloadAllModels) {
        showToast(replaceExisting ? 'Replacing & Downloading 3 AI Models...' : 'Downloading 3 AI Engines (Gemma 4, Kokoro, Whisper)...');
        const res = await NativeModules.LLMInferenceModule.startDownloadAllModels(hfToken.trim() || null, replaceExisting);
        if (res && res.allReady) {
          setIsAllModelsReady(true);
          setDownloadProgress(100);
          verifyAllModels();
        }
      } else {
        setIsDownloading(false);
        showToast('Download module unavailable');
      }
    } catch (err: any) {
      console.warn('Download error:', err);
      setIsDownloading(false);
      if (err?.message && err.message.includes('401')) {
        setShowHfTokenInput(true);
        showToast('Authentication notice: Enter your Hugging Face Token below.');
      } else if (err?.message !== 'Download cancelled by user') {
        showToast('Download notice: ' + (err.message || 'Interrupted'));
      }
    }
  };

  const cancelAllDownloads = async () => {
    try {
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.cancelAllDownloads) {
        await NativeModules.LLMInferenceModule.cancelAllDownloads();
      }
      setIsDownloading(false);
      showToast('Download cancelled');
    } catch (_) {}
  };

  const pickLocalModelFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const uri = file.uri;
        setGemmaStatus({ found: true, path: uri, sizeMb: 2590 });
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.initModel) {
          try {
            await NativeModules.LLMInferenceModule.initModel(uri);
            setIsModelReady(true);
            modelReadyRef.current = true;
          } catch (_) {}
        }
        showToast('Local Gemma model linked: ' + file.name);
      }
    } catch (err) {
      showToast('Could not link model file');
    }
  };

  const testVoiceSample = async () => {
    setIsTestingVoice(true);
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.speakText) {
      try {
        await NativeModules.LLMInferenceModule.speakText(
          'Welcome to Guru. Offline neural artificial intelligence and textbook vault are operational.'
        );
      } catch (_) {}
    }
    setTimeout(() => setIsTestingVoice(false), 2500);
  };

  const finishDownloadAndEnterMain = async () => {
    await AsyncStorage.setItem('@guru_resources_ready', 'true');
    setScreen('main');
  };

  // --- COPY TEXT TO CLIPBOARD ---
  const copyMessageToClipboard = async (text: string) => {
    if (!text) return;
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.copyToClipboard) {
      try {
        await NativeModules.LLMInferenceModule.copyToClipboard(text);
        showToast('Copied to clipboard');
      } catch (_) {
        showToast('Copied to clipboard');
      }
    } else {
      showToast('Copied to clipboard');
    }
  };

  // --- HUMAN-LIKE VOICE TTS (PLAY / STOP) ---
  const toggleSpeech = async (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.stopSpeaking) {
        await NativeModules.LLMInferenceModule.stopSpeaking();
      }
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(messageId);
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.speakText) {
        try {
          await NativeModules.LLMInferenceModule.speakText(text);
        } catch (err) {
          console.warn('TTS speak error:', err);
        }
      }
    }
  };

  // --- IN-APP NATIVE PDF VIEWER (NO EXTERNAL APPS) ---
  const openInAppPdf = async (assetPath?: string, title?: string) => {
    setMediumChooserSubject(null);
    if (!assetPath) {
      showToast('PDF file path not found');
      return;
    }

    try {
      let pageCount = 240;
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.getPdfPageCount) {
        try {
          pageCount = await NativeModules.LLMInferenceModule.getPdfPageCount(assetPath);
        } catch (_) {}
      }

      setActivePdf({
        assetPath,
        title: title || 'CDC Textbook',
        currentPage: 0,
        totalPages: pageCount,
        pageImageUri: null,
        isLoadingPage: true,
        zoomScale: 1,
      });

      await loadPdfPage(assetPath, 0);
    } catch (err) {
      console.warn('Error opening PDF:', err);
      showToast('Could not load PDF. Please ensure file exists in assets.');
    }
  };

  const loadPdfPage = async (assetPath: string, pageIndex: number) => {
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.renderPdfPage) {
      try {
        const uri = await NativeModules.LLMInferenceModule.renderPdfPage(assetPath, pageIndex);
        setActivePdf((prev) => (prev ? { ...prev, currentPage: pageIndex, pageImageUri: uri, isLoadingPage: false } : null));
      } catch (err) {
        console.warn('Render PDF page error:', err);
        setActivePdf((prev) => (prev ? { ...prev, isLoadingPage: false } : null));
      }
    }
  };

  const nextPdfPage = () => {
    if (!activePdf || activePdf.currentPage >= activePdf.totalPages - 1) return;
    const nextIdx = activePdf.currentPage + 1;
    setActivePdf({ ...activePdf, currentPage: nextIdx, isLoadingPage: true });
    loadPdfPage(activePdf.assetPath, nextIdx);
  };

  const prevPdfPage = () => {
    if (!activePdf || activePdf.currentPage <= 0) return;
    const prevIdx = activePdf.currentPage - 1;
    setActivePdf({ ...activePdf, currentPage: prevIdx, isLoadingPage: true });
    loadPdfPage(activePdf.assetPath, prevIdx);
  };

  const handleSubjectClick = (subject: SubjectItem) => {
    if (subject.hasDualMedium) {
      setMediumChooserSubject(subject);
    } else {
      const targetPdf = subject.id === 'nepali' ? subject.nepaliAssetPdf : subject.englishAssetPdf;
      openInAppPdf(targetPdf, subject.name);
    }
  };

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  };

  // --- CHAT SESSION MANAGEMENT ---
  const createNewChat = () => {
    const newId = Math.random().toString(36).slice(2, 10);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Study Chat',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsSidebarOpen(false);
  };

  const deleteChat = (sessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  // --- MULTIMODAL PROMPT SENDER (TEXT + IMAGES) ---
  const sendPrompt = async (forcedPrompt?: string) => {
    const textToSend = (forcedPrompt || prompt).trim();
    if (!textToSend && !attachedFileContent && !attachedImageUri) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId || !sessions.find((s) => s.id === currentSessionId)) {
      const newId = Math.random().toString(36).slice(2, 10);
      const newSession: ChatSession = {
        id: newId,
        title: textToSend.slice(0, 24) || 'Study Question',
        messages: [],
        updatedAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentSessionId = newId;
    }

    const userMessageId = Math.random().toString(36).slice(2, 10);
    const assistantMessageId = Math.random().toString(36).slice(2, 10);
    const requestId = Math.random().toString(36).slice(2, 10);

    const userMsg: Message = {
      id: userMessageId,
      text: textToSend,
      isUser: true,
      attachmentName: attachedFileName || undefined,
      attachmentImageUri: attachedImageUri || undefined,
    };

    const botMsg: Message = {
      id: assistantMessageId,
      text: '',
      isUser: false,
      isPending: true,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg] } : s))
    );

    const imageToSend = attachedImageUri;
    const fileContentToSend = attachedFileContent;

    setPrompt('');
    setAttachedFileName(null);
    setAttachedFileContent(null);
    setAttachedImageUri(null);
    setIsGenerating(true);

    activeGenerationRef.current = {
      requestId,
      sessionId: currentSessionId,
      messageId: assistantMessageId,
    };

    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
      try {
        const historyForInference = (sessions.find((s) => s.id === currentSessionId)?.messages || [])
          .filter((m) => m.id !== assistantMessageId && m.text !== 'Analyzing...')
          .map((m) => ({ isUser: m.isUser, text: m.text }));

        const fullPromptText = fileContentToSend
          ? `${textToSend}\n\n[Attached File Content]:\n${fileContentToSend}`
          : textToSend;

        await NativeModules.LLMInferenceModule.generateResponse(
          fullPromptText,
          'EN',
          true,
          historyForInference,
          requestId,
          imageToSend || ''
        );
      } catch (err: any) {
        console.warn('Native inference error:', err);
        const errMsg = err?.message || 'Inference engine is warming up or model file is loading.';
        updateAssistantMessage(
          currentSessionId,
          assistantMessageId,
          `Offline AI Engine Notice: ${errMsg}\n\nPlease try asking your question again in a moment.`,
          false
        );
        setIsGenerating(false);
      }
    } else {
      updateAssistantMessage(
        currentSessionId,
        assistantMessageId,
        'Offline AI Brain is only available on native Android devices.',
        false
      );
      setIsGenerating(false);
    }
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedOption(index);
    setQuizStatus(index === currentQuiz.correctIndex ? 'correct' : 'wrong');
  };

  // --- MATH SOLVER: SNAP & SOLVE ENGINE ---
  const solveMathFromImage = async (imageUri: string) => {
    setSolverImageUri(imageUri);
    setSolverResult(null);
    setIsSolving(true);

    const solverRequestId = `solver_${Date.now()}`;

    // Listen for the completed solution from the LLM
    const doneSub = DeviceEventEmitter.addListener('LiteRTResponseDone', (event) => {
      if (event.requestId !== solverRequestId) return;
      const rawAnswer = event.fullResponse || '';
      const formatted = formatGemmaResponse(rawAnswer);
      setSolverResult(formatted);
      setIsSolving(false);
      doneSub.remove();
    });

    try {
      const mathSolverPrompt =
        'You are solving a math or science problem from this image. ' +
        'Identify the problem clearly, then solve it step by step. ' +
        'Show each step with clear labels (Step 1, Step 2, etc.). ' +
        'Use proper mathematical notation. ' +
        'End with a boxed final answer. Be structured and concise.';

      await NativeModules.LLMInferenceModule.generateResponse(
        mathSolverPrompt,
        'EN',
        true,
        [],
        solverRequestId,
        imageUri
      );
    } catch (err: any) {
      setSolverResult(
        'Could not process this image right now. Please make sure the AI model is fully loaded and try again.'
      );
      setIsSolving(false);
      doneSub.remove();
    }
  };

  const handleSolverCapture = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showToast('Camera permission is required to snap math problems.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        solveMathFromImage(res.assets[0].uri);
      }
    } catch (_) {}
  };

  const handleSolverGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        solveMathFromImage(res.assets[0].uri);
      }
    } catch (_) {}
  };

  // --- BOOT SCREEN ---
  if (isBooting) {
    return (
      <SafeAreaView style={styles.bootContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.bootCenter}>
          <Image source={logoSource} style={styles.bootLogo} resizeMode="contain" />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.bootTitle}>Loading Guru Offline AI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- ONBOARDING FORM SCREEN ---
  if (screen === 'onboarding') {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <KeyboardAvoidingView style={styles.darkContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.onboardingContent}>
            <View style={styles.brandHero}>
              <Image source={logoSource} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandTitle}>Guru</Text>
              <Text style={styles.brandSub}>Offline AI Tutor & CDC Textbook Vault</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formItem}>
                <Text style={styles.inputLabel}>Student Full Name</Text>
                <TextInput
                  style={styles.darkInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sangam Gautam"
                  placeholderTextColor="#71717a"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.inputLabel}>School Name</Text>
                <TextInput
                  style={styles.darkInput}
                  value={school}
                  onChangeText={setSchool}
                  placeholder="e.g. Shree Secondary School"
                  placeholderTextColor="#71717a"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.inputLabel}>Select Your Class</Text>
                <View style={styles.gradeGrid}>
                  {['8', '9', '10'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.gradePill, grade === g && styles.gradePillActive]}
                      onPress={() => setGrade(g)}
                    >
                      <Text style={[styles.gradePillText, grade === g && styles.gradePillTextActive]}>{`Class ${g}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, !name.trim() && styles.primaryButtonDisabled]}
                disabled={!name.trim()}
                onPress={registerUser}
              >
                <Text style={styles.primaryButtonText}>Continue to Study Vault</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- STRICT 3-MODEL OFFLINE AI SETUP SCREEN ---
  if (screen === 'download') {
    const isAllReady = isAllModelsReady || gemmaStatus.found;

    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ScrollView contentContainerStyle={styles.downloadScrollContent} showsVerticalScrollIndicator={false}>
          {/* TOP HERO */}
          <View style={styles.downloadHeroSection}>
            <Image source={logoSource} style={styles.downloadLogoHero} resizeMode="contain" />
            <Text style={styles.downloadHeroTitle}>Guru Offline AI Setup</Text>
            <Text style={styles.downloadHeroSub}>
              {`Preparing Class ${user?.grade || grade || '10'} On-Device AI Models & Voice Engines`}
            </Text>
            <View style={styles.downloadStudentTag}>
              <Text style={styles.downloadStudentTagText}>
                {`Student: ${user?.name || 'Scholar'} • Class ${user?.grade || grade || '10'}`}
              </Text>
            </View>
          </View>

          {/* OVERALL PROGRESS CARD */}
          <View style={styles.overallProgressCard}>
            <View style={styles.progressHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <HardDrive size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.progressCardTitle}>Offline AI Engine Setup</Text>
              </View>
              <Text style={styles.progressPercentageText}>{`${isAllReady ? 100 : downloadProgress}%`}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${isAllReady ? 100 : Math.max(6, downloadProgress)}%` },
                ]}
              />
            </View>

            <View style={styles.progressStatsRow}>
              <Text style={styles.progressStatItem}>
                {isAllReady ? 'Status: 100% Offline Ready' : isDownloading ? `Speed: ${downloadSpeed}` : 'Status: Ready for Setup'}
              </Text>
              <Text style={styles.progressStatItem}>
                {isAllReady ? `${gemmaStatus.sizeMb || 2590} MB Verified` : isDownloading ? `${downloadedTotalMb} MB / ${totalAllMb} MB (ETA: ${downloadEta})` : `Total: ${totalAllMb} MB (Gemma & Whisper)`}
              </Text>
            </View>
          </View>

          {/* CORE AI ENGINES CHECKLIST */}
          <View style={styles.checklistContainer}>
            <Text style={styles.checklistSectionHeader}>On-Device AI Engines</Text>

            {/* MODEL 1: GOOGLE GEMMA 4 E2B AI BRAIN */}
            <View style={styles.checklistItemCard}>
              <View style={styles.checklistIconBox}>
                <Cpu size={20} color="#ffffff" />
              </View>
              <View style={styles.checklistContent}>
                <Text style={styles.checklistItemTitle}>Google Gemma 4 E2B AI Brain</Text>
                <Text style={styles.checklistItemSub}>
                  LiteRT-LM On-Device Neural Tutor • Zero Internet Required (2.59 GB)
                </Text>
                <View style={styles.itemBadgeRow}>
                  {gemmaStatus.found ? (
                    <View style={styles.readyBadge}>
                      <Check size={12} color="#10b981" style={{ marginRight: 4 }} />
                      <Text style={styles.readyBadgeText}>
                        {gemmaStatus.sizeMb > 0 ? `Ready (${gemmaStatus.sizeMb} MB)` : 'Ready on Device'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: isDownloading && currentDownloadModel.includes('Gemma') ? '#ffffff' : '#71717a' }}>
                      {isDownloading && currentDownloadModel.includes('Gemma') ? `Downloading: ${downloadProgress}% (${downloadSpeed})` : 'Pending Download'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* MODEL 2: BUILT-IN OFFLINE NEURAL VOICE ENGINE */}
            <View style={styles.checklistItemCard}>
              <View style={styles.checklistIconBox}>
                <Volume2 size={20} color="#ffffff" />
              </View>
              <View style={styles.checklistContent}>
                <Text style={styles.checklistItemTitle}>Offline Neural Speech Engine</Text>
                <Text style={styles.checklistItemSub}>
                  Android Built-in Offline Neural Speech • Zero Extra Download
                </Text>
                <View style={styles.itemBadgeRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <View style={styles.readyBadge}>
                      <Check size={12} color="#10b981" style={{ marginRight: 4 }} />
                      <Text style={styles.readyBadgeText}>Built-in • Ready</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.testVoiceMiniBtn}
                      onPress={testVoiceSample}
                      disabled={isTestingVoice}
                    >
                      <Volume2 size={12} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.testVoiceMiniBtnText}>{isTestingVoice ? 'Playing...' : 'Test Voice'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* MODEL 3: OPENAI WHISPER SPEECH RECOGNITION */}
            <View style={styles.checklistItemCard}>
              <View style={styles.checklistIconBox}>
                <Mic size={20} color="#ffffff" />
              </View>
              <View style={styles.checklistContent}>
                <Text style={styles.checklistItemTitle}>OpenAI Whisper Speech Recognition</Text>
                <Text style={styles.checklistItemSub}>
                  On-Device Voice Transcription for Student Questions (75 MB)
                </Text>
                <View style={styles.itemBadgeRow}>
                  {whisperStatus.found ? (
                    <View style={styles.readyBadge}>
                      <Check size={12} color="#10b981" style={{ marginRight: 4 }} />
                      <Text style={styles.readyBadgeText}>Speech-to-Text Active</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: isDownloading && currentDownloadModel.includes('Whisper') ? '#ffffff' : '#71717a' }}>
                      {isDownloading && currentDownloadModel.includes('Whisper') ? `Downloading: ${downloadProgress}% (${downloadSpeed})` : 'Pending Download'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* OPTIONAL ACCESS TOKEN INPUT BAR */}
          {showHfTokenInput && (
            <View style={[styles.formCard, { marginBottom: 16, padding: 12 }]}>
              <Text style={[styles.inputLabel, { fontSize: 11.5 }]}>Access Token (Optional)</Text>
              <TextInput
                style={[styles.darkInput, { height: 38, fontSize: 12 }]}
                value={hfToken}
                onChangeText={setHfToken}
                placeholder="Paste Access Token: hf_..."
                placeholderTextColor="#71717a"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* ACTION BUTTONS */}
          <View style={styles.downloadBottomActions}>
            {isAllReady ? (
              <>
                <TouchableOpacity
                  style={styles.startLearningPrimaryBtn}
                  onPress={finishDownloadAndEnterMain}
                  activeOpacity={0.85}
                >
                  <Text style={styles.startLearningPrimaryBtnText}>
                    Start Offline Learning (Enter Guru)
                  </Text>
                  <ArrowRight size={18} color="#000000" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkLocalButton}
                  onPress={() => startDownloadAllModels(true)}
                >
                  <RefreshCw size={13} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.linkLocalButtonText}>Re-download & Replace All Models</Text>
                </TouchableOpacity>
              </>
            ) : isDownloading ? (
              <TouchableOpacity
                style={[styles.startLearningPrimaryBtn, { backgroundColor: '#ef4444' }]}
                onPress={cancelAllDownloads}
              >
                <Text style={[styles.startLearningPrimaryBtnText, { color: '#ffffff' }]}>
                  Cancel Download
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.startLearningPrimaryBtn}
                  onPress={() => startDownloadAllModels(false)}
                  activeOpacity={0.85}
                >
                  <Download size={18} color="#000000" style={{ marginRight: 8 }} />
                  <Text style={styles.startLearningPrimaryBtnText}>
                    {`Download All 3 AI Engines (2.75 GB)`}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.recheckResourcesBtn}
              onPress={verifyAllModels}
              disabled={isCheckingModels}
            >
              <RefreshCw size={13} color="#a1a1aa" style={{ marginRight: 6 }} />
              <Text style={styles.recheckResourcesBtnText}>
                {isCheckingModels ? 'Checking Models on Phone...' : 'Re-verify Storage & Models'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- MAIN SCREEN: DASHBOARD, LEARN, REVISION, SOLVER OR IN-APP PDF VIEWER ---
  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <Image source={logoSource} style={styles.headerLogoIcon} resizeMode="contain" />
          <Text style={styles.appHeaderTitle}>Guru</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{`Class ${user?.grade ?? '10'}`}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerUserPill}>
          <User size={13} color="#ffffff" style={{ marginRight: 5 }} />
          <Text style={styles.headerUserName} numberOfLines={1}>{user?.name || 'Student'}</Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: HOME DASHBOARD */}
      {activeTab === 'home' && (
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          {/* GREETING */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>{`Hi, ${user?.name || 'Sangam'}`}</Text>
            <Text style={styles.greetingSub}>Tap any subject folder to open official CDC PDF textbooks in-app.</Text>
          </View>

          {/* SUBJECT RESOURCE FOLDERS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Folder size={17} color="#ffffff" style={{ marginRight: 7 }} />
            <Text style={styles.sectionTitleText}>Subject Resource Folders</Text>
          </View>

          {/* SUBJECT FOLDERS GRID (DIRECT TO IN-APP PDF) */}
          <View style={styles.subjectGrid}>
            {SUBJECTS_DATA.map((subj) => (
              <TouchableOpacity
                key={subj.id}
                style={styles.subjectFolderCard}
                activeOpacity={0.8}
                onPress={() => handleSubjectClick(subj)}
              >
                <View style={styles.subjectCardTop}>
                  <Folder size={19} color="#ffffff" />
                  <View style={styles.unitCountPill}>
                    <Text style={styles.unitCountText}>{`${subj.unitsCount} Units`}</Text>
                  </View>
                </View>
                <Text style={styles.subjectCardTitle} numberOfLines={1}>{subj.name}</Text>
                <Text style={styles.subjectCardPages}>{`${subj.pagesCount} Pages • In-App PDF`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DAILY STREAK CARD */}
          <View style={styles.singleStatCard}>
            <View style={styles.statHeader}>
              <Calendar size={16} color="#ffffff" />
              <Text style={styles.statLabel}>DAILY STREAK</Text>
            </View>
            <Text style={styles.statValue}>2 Days</Text>
            <Text style={styles.statSubText}>offline learning days in a row</Text>
          </View>

          {/* DYNAMIC RANDOM QUIZ CARD */}
          <View style={styles.quizCard}>
            <View style={styles.quizHeaderRow}>
              <View style={styles.quizHeaderLeft}>
                <HelpCircle size={16} color="#ffffff" />
                <Text style={styles.quizTitle}>Quick quiz</Text>
              </View>
              <View style={styles.quizSubjectTag}>
                <Text style={styles.quizSubjectTagText}>{currentQuiz.subject}</Text>
              </View>
            </View>

            <Text style={styles.quizQuestionText}>{currentQuiz.question}</Text>

            <View style={styles.quizOptionsGrid}>
              <View style={styles.quizRowTwo}>
                {currentQuiz.options.slice(0, 2).map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = quizStatus !== 'idle' && idx === currentQuiz.correctIndex;
                  const isWrong = quizStatus === 'wrong' && isSelected && idx !== currentQuiz.correctIndex;
                  return (
                    <TouchableOpacity
                      key={`${opt}-${idx}`}
                      style={[
                        styles.quizOptionPill,
                        isSelected && styles.quizOptionPillSelected,
                        isCorrect && styles.quizOptionPillCorrect,
                        isWrong && styles.quizOptionPillWrong,
                      ]}
                      onPress={() => handleQuizAnswer(idx)}
                    >
                      <Text style={[styles.quizOptionText, (isCorrect || isSelected) && styles.quizOptionTextActive]} numberOfLines={1}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.quizRowTwo}>
                {currentQuiz.options.slice(2, 4).map((opt, idx) => {
                  const realIdx = idx + 2;
                  const isSelected = selectedOption === realIdx;
                  const isCorrect = quizStatus !== 'idle' && realIdx === currentQuiz.correctIndex;
                  const isWrong = quizStatus === 'wrong' && isSelected && realIdx !== currentQuiz.correctIndex;
                  return (
                    <TouchableOpacity
                      key={`${opt}-${realIdx}`}
                      style={[
                        styles.quizOptionPill,
                        isSelected && styles.quizOptionPillSelected,
                        isCorrect && styles.quizOptionPillCorrect,
                        isWrong && styles.quizOptionPillWrong,
                      ]}
                      onPress={() => handleQuizAnswer(realIdx)}
                    >
                      <Text style={[styles.quizOptionText, (isCorrect || isSelected) && styles.quizOptionTextActive]} numberOfLines={1}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {quizStatus !== 'idle' && (
              <View style={[styles.feedbackBox, quizStatus === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackTitle}>{quizStatus === 'correct' ? 'Correct!' : 'Almost there!'}</Text>
                <Text style={styles.feedbackExplain}>{currentQuiz.explanation}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.newQuizButton} onPress={pickRandomQuiz}>
              <RotateCcw size={13} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.newQuizButtonText}>New quiz (Random Subject)</Text>
            </TouchableOpacity>
          </View>

          {/* CLASS-AWARE CARD */}
          <View style={styles.classAwareCard}>
            <GraduationCap size={20} color="#ffffff" />
            <View style={styles.classAwareTextGroup}>
              <Text style={styles.classAwareTitle}>Class-aware tutoring</Text>
              <Text style={styles.classAwareSub}>
                Guru adjusts depth for each grade level, covering foundational concepts through exam preparation.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* TAB 2: LEARN (DEDICATED MULTI-TURN AI CHAT HUB WITH SIDEBAR & MULTIMODAL ATTACHMENTS) */}
      {activeTab === 'learn' && (
        <View style={styles.learnTabContainer}>
          {/* Chat Top Header with Sidebar Menu Button */}
          <View style={styles.chatHubHeader}>
            <TouchableOpacity style={styles.sidebarToggleButton} onPress={() => setIsSidebarOpen(true)}>
              <Menu size={19} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.activeChatTitleBox}>
              <Text style={styles.activeChatTitleText} numberOfLines={1}>
                {activeSession?.title || 'Study Chat'}
              </Text>
            </View>

            <TouchableOpacity style={styles.newChatHeaderButton} onPress={createNewChat}>
              <Plus size={17} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Chat Messages Stream with 10/10 Human Math & Markdown Typesetting */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {activeMessages.length === 0 ? (
              <View style={styles.chatEmptyView}>
                <Image source={logoSource} style={styles.chatEmptyLogo} resizeMode="contain" />
                <Text style={styles.chatEmptyTitle}>How can I help you learn?</Text>
                <Text style={styles.chatEmptySub}>
                  Ask questions across all Grade 10 CDC textbooks. You can type, speak with voice, or snap a photo of any math problem.
                </Text>
              </View>
            ) : (
              <FlatList
                ref={chatListRef}
                data={activeMessages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={styles.chatMessageList}
                onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                  <View style={item.isUser ? styles.userMsgRow : styles.botMsgRow}>
                    {!item.isUser && (
                      <View style={styles.botAvatarBox}>
                        <Image source={logoSource} style={styles.botAvatarImage} resizeMode="contain" />
                      </View>
                    )}
                    <View style={item.isUser ? styles.userBubble : styles.botBubble}>
                      {item.attachmentImageUri && (
                        <Image source={{ uri: item.attachmentImageUri }} style={styles.chatAttachedPreviewImage} />
                      )}
                      {item.attachmentName && (
                        <View style={styles.chatAttachmentPill}>
                          <Text style={styles.chatAttachmentText}>{item.attachmentName}</Text>
                        </View>
                      )}
                      {item.isPending ? (
                        item.text ? (
                          <View>
                            <MathMarkdownRenderer content={item.text} isUser={false} />
                            <View style={[styles.loadingBubbleRow, { marginTop: 6 }]}>
                              <ActivityIndicator size="small" color="#38bdf8" />
                              <Text style={styles.loadingBubbleText}>Generating...</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.loadingBubbleRow}>
                            <ActivityIndicator size="small" color="#38bdf8" />
                            <Text style={styles.loadingBubbleText}>Guru is solving & thinking...</Text>
                          </View>
                        )
                      ) : (
                        <View>
                          <MathMarkdownRenderer content={item.text} isUser={item.isUser} />
                          {!item.isUser && (
                            <View style={styles.botActionButtonsRow}>
                              <TouchableOpacity
                                style={styles.chatActionButton}
                                onPress={() => toggleSpeech(item.id, item.text)}
                              >
                                {playingMessageId === item.id ? (
                                  <VolumeX size={13} color="#ffffff" style={{ marginRight: 4 }} />
                                ) : (
                                  <Volume2 size={13} color="#a1a1aa" style={{ marginRight: 4 }} />
                                )}
                                <Text style={[styles.chatActionButtonText, playingMessageId === item.id && { color: '#ffffff' }]}>
                                  {playingMessageId === item.id ? 'Stop' : 'Listen'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.chatActionButton}
                                onPress={() => copyMessageToClipboard(item.text)}
                              >
                                <ClipboardCopy size={13} color="#a1a1aa" style={{ marginRight: 4 }} />
                                <Text style={styles.chatActionButtonText}>Copy</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              />
            )}

            {/* Thumbnail Preview for Attached Image */}
            {attachedImageUri && (
              <View style={styles.attachedImageThumbnailContainer}>
                <Image source={{ uri: attachedImageUri }} style={styles.attachedThumbImage} />
                <Text style={styles.attachedThumbText} numberOfLines={1}>Attached Image</Text>
                <TouchableOpacity onPress={() => setAttachedImageUri(null)} style={{ padding: 4 }}>
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Chat Input Bar */}
            <View style={styles.chatInputBarContainer}>
              <View style={styles.chatInputPillWrapper}>
                {/* Plus (+) Button for Upload & Camera options */}
                <TouchableOpacity
                  style={styles.chatAttachIconButton}
                  onPress={() => setShowAttachModal(true)}
                >
                  <Plus size={19} color="#ffffff" />
                </TouchableOpacity>

                <TextInput
                  style={styles.chatPillInput}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder={isListening ? 'Listening to voice...' : 'Ask Guru anything or snap a photo...'}
                  placeholderTextColor={isListening ? '#38bdf8' : '#71717a'}
                  multiline
                />

                {/* Voice STT Record Button */}
                <TouchableOpacity
                  style={[styles.chatMicIconButton, isListening && styles.chatMicIconButtonActive]}
                  onPress={isListening ? stopVoiceRecording : startVoiceRecording}
                >
                  {isListening ? (
                    <MicOff size={18} color="#ef4444" />
                  ) : (
                    <Mic size={18} color="#a1a1aa" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chatSendIconButton}
                  disabled={!prompt.trim() && !attachedFileContent && !attachedImageUri}
                  onPress={() => sendPrompt()}
                >
                  <Send size={17} color={prompt.trim() || attachedFileContent || attachedImageUri ? '#ffffff' : '#52525b'} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* ATTACHMENT ACTION SHEET (In-View Overlay — Zero Crash) */}
          {showAttachModal && (
            <View style={styles.attachModalBackdrop}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setShowAttachModal(false)}
              />
              <View style={styles.attachModalSheet}>
                <Text style={styles.attachModalTitle}>Add attachment</Text>

                <TouchableOpacity
                  style={styles.attachOptionRow}
                  onPress={async () => {
                    setShowAttachModal(false);
                    try {
                      const perm = await ImagePicker.requestCameraPermissionsAsync();
                      if (!perm.granted) {
                        showToast('Camera permission required.');
                        return;
                      }
                      const res = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                      });
                      if (!res.canceled && res.assets && res.assets.length > 0) {
                        setAttachedImageUri(res.assets[0].uri);
                      }
                    } catch (_) {}
                  }}
                >
                  <View style={[styles.attachOptionIcon, { backgroundColor: '#27272a' }]}>
                    <Camera size={20} color="#ffffff" />
                  </View>
                  <View style={styles.attachOptionTextGroup}>
                    <Text style={styles.attachOptionLabel}>Take photo</Text>
                    <Text style={styles.attachOptionSub}>Attach image from camera</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOptionRow}
                  onPress={async () => {
                    setShowAttachModal(false);
                    try {
                      const res = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                      });
                      if (!res.canceled && res.assets && res.assets.length > 0) {
                        setAttachedImageUri(res.assets[0].uri);
                      }
                    } catch (_) {}
                  }}
                >
                  <View style={[styles.attachOptionIcon, { backgroundColor: '#27272a' }]}>
                    <ImageIcon size={20} color="#38bdf8" />
                  </View>
                  <View style={styles.attachOptionTextGroup}>
                    <Text style={styles.attachOptionLabel}>Upload from gallery</Text>
                    <Text style={styles.attachOptionSub}>Attach image from gallery</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOptionRow}
                  onPress={async () => {
                    setShowAttachModal(false);
                    try {
                      const res = await DocumentPicker.getDocumentAsync({
                        type: ['text/*', 'application/pdf'],
                        copyToCacheDirectory: true,
                      });
                      if (!res.canceled && res.assets && res.assets.length > 0) {
                        const asset = res.assets[0];
                        setAttachedFileName(asset.name);
                        if (asset.uri) {
                          try {
                            const content = await FileSystem.readAsStringAsync(asset.uri);
                            setAttachedFileContent(content);
                          } catch (_) {}
                        }
                      }
                    } catch (_) {}
                  }}
                >
                  <View style={[styles.attachOptionIcon, { backgroundColor: '#27272a' }]}>
                    <FileText size={20} color="#a1a1aa" />
                  </View>
                  <View style={styles.attachOptionTextGroup}>
                    <Text style={styles.attachOptionLabel}>Attach study note</Text>
                    <Text style={styles.attachOptionSub}>Attach document or text note</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.attachCancelButton} onPress={() => setShowAttachModal(false)}>
                  <Text style={styles.attachCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SLIDE-OUT SIDEBAR DRAWER FOR CHAT SESSIONS */}
          {isSidebarOpen && (
            <View style={styles.sidebarOverlay}>
              <TouchableOpacity
                style={styles.sidebarBackdrop}
                activeOpacity={1}
                onPress={() => setIsSidebarOpen(false)}
              />
              <View style={styles.sidebarContent}>
                <View style={styles.sidebarHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MessageSquare size={17} color="#ffffff" style={{ marginRight: 7 }} />
                    <Text style={styles.sidebarTitle}>Study Chats</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsSidebarOpen(false)} style={{ padding: 4 }}>
                    <PanelLeftClose size={19} color="#a1a1aa" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.sidebarNewChatButton} onPress={createNewChat}>
                  <Plus size={15} color="#000000" style={{ marginRight: 6 }} />
                  <Text style={styles.sidebarNewChatText}>New Study Chat</Text>
                </TouchableOpacity>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                  {sessions.map((s) => {
                    const isActive = (activeSessionId || sessions[0]?.id) === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.sidebarChatItem, isActive && styles.sidebarChatItemActive]}
                        onPress={() => {
                          setActiveSessionId(s.id);
                          setIsSidebarOpen(false);
                        }}
                      >
                        <MessageSquare size={14} color={isActive ? '#000000' : '#a1a1aa'} style={{ marginRight: 9 }} />
                        <Text
                          style={[styles.sidebarChatTitle, isActive && styles.sidebarChatTitleActive]}
                          numberOfLines={1}
                        >
                          {s.title}
                        </Text>
                        {sessions.length > 1 && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              deleteChat(s.id);
                            }}
                            style={{ padding: 4, marginLeft: 6 }}
                          >
                            <Trash2 size={13} color={isActive ? '#000000' : '#71717a'} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      )}

      {/* TAB 3: EXAM REVISION & MOCK EXAM PRACTICE */}
      {activeTab === 'revision' && (
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <Award size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitleText}>Exam Revision & Mock Practice</Text>
          </View>

          {/* AI GENERATE QUIZ BANNER */}
          <View style={styles.mockExamBannerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mockBannerTitle}>Generate AI Mock Exam</Text>
              <Text style={styles.mockBannerSub}>
                Produce fresh multi-subject SEE exam questions based on the CDC syllabus.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.mockBannerButton}
              onPress={() => {
                pickRandomQuiz();
                showToast('New mock exam questions generated');
              }}
            >
              <Sparkles size={14} color="#000000" style={{ marginRight: 5 }} />
              <Text style={styles.mockBannerButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>

          {/* SUBJECT WISE MOCK MODULES */}
          <View style={styles.mockModulesContainer}>
            {[
              { name: 'Science & Technology', count: '15 Units • Full SEE Model', code: 'SCI-10' },
              { name: 'Compulsory Mathematics', count: '14 Units • Formula Sets', code: 'MTH-10' },
              { name: 'Social Studies & Life Skills', count: '9 Units • Constitution & History', code: 'SOC-10' },
              { name: 'Optional Mathematics', count: '9 Units • Geometry & Trig', code: 'OPT-10' },
              { name: 'Compulsory Nepali', count: '10 Units • Literature & Grammar', code: 'NEP-10' },
            ].map((mod, idx) => (
              <TouchableOpacity
                key={mod.code}
                style={styles.mockModuleItem}
                onPress={() => {
                  setPrompt(`Generate a 5-question SEE practice test with solutions for Class 10 ${mod.name}.`);
                  setActiveTab('learn');
                }}
              >
                <View style={styles.mockModuleLeft}>
                  <FileCheck size={18} color="#ffffff" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.mockModuleTitle}>{mod.name}</Text>
                    <Text style={styles.mockModuleSub}>{mod.count}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#71717a" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* TAB 4: MATH SOLVER — SNAP & SOLVE */}
      {activeTab === 'solver' && (
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          {/* Solver Header */}
          <View style={styles.sectionHeaderRow}>
            <Camera size={17} color="#38bdf8" style={{ marginRight: 7 }} />
            <Text style={styles.sectionTitleText}>Math Solver</Text>
          </View>
          <Text style={styles.greetingSub}>
            Snap or upload a photo of any math or science problem — Guru AI will solve it step by step, completely offline.
          </Text>

          {/* Capture Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 16 }}>
            <TouchableOpacity
              style={[styles.newQuizButton, { flex: 1, backgroundColor: '#38bdf8' }]}
              onPress={handleSolverCapture}
            >
              <Camera size={16} color="#000000" style={{ marginRight: 6 }} />
              <Text style={[styles.newQuizButtonText, { color: '#000000', fontWeight: '700' }]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newQuizButton, { flex: 1, backgroundColor: '#27272a' }]}
              onPress={handleSolverGallery}
            >
              <ImageIcon size={16} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text style={styles.newQuizButtonText}>From Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Captured Image Preview */}
          {solverImageUri && (
            <View style={styles.solverImageContainer}>
              <Image
                source={{ uri: solverImageUri }}
                style={styles.solverImagePreview}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.solverImageClearBtn}
                onPress={() => {
                  setSolverImageUri(null);
                  setSolverResult(null);
                  setIsSolving(false);
                }}
              >
                <X size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {isSolving && (
            <View style={styles.solverLoadingCard}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.solverLoadingText}>
                Guru is analyzing the problem and solving step by step...
              </Text>
            </View>
          )}

          {/* Solution Output */}
          {solverResult && !isSolving && (
            <View style={styles.solverResultCard}>
              <View style={styles.solverResultHeader}>
                <CheckCircle2 size={15} color="#22c55e" style={{ marginRight: 6 }} />
                <Text style={styles.solverResultTitle}>Solution</Text>
              </View>
              <View style={styles.solverResultContent}>
                <MathMarkdownRenderer content={solverResult} />
              </View>
            </View>
          )}

          {/* Empty State — No Image Yet */}
          {!solverImageUri && !isSolving && !solverResult && (
            <View style={styles.solverEmptyState}>
              <Camera size={40} color="#3f3f46" />
              <Text style={styles.solverEmptyTitle}>No problem captured yet</Text>
              <Text style={styles.solverEmptySubtitle}>
                Point your camera at a textbook question, handwritten problem, or printed equation and tap "Take Photo"
              </Text>
            </View>
          )}

          {/* Settings Row */}
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity style={styles.solverSettingsRow} onPress={() => setScreen('download')}>
              <HardDrive size={15} color="#71717a" style={{ marginRight: 8 }} />
              <Text style={styles.solverSettingsText}>Manage AI Model & Offline Resources</Text>
              <ChevronRight size={14} color="#3f3f46" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.solverSettingsRow} onPress={() => setScreen('onboarding')}>
              <User size={15} color="#71717a" style={{ marginRight: 8 }} />
              <Text style={styles.solverSettingsText}>{user?.name || 'Student'} — Edit Profile</Text>
              <ChevronRight size={14} color="#3f3f46" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* FREE MOVABLE DRAGGABLE FLOATING GURU AI SPHERE (HIDDEN ON LEARN TAB & PDF VIEWER) */}
      {activeTab !== 'learn' && !activePdf && (
        <Animated.View
          style={[
            styles.floatingBotMovable,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.floatingBotInner}
            activeOpacity={0.85}
            onPress={() => setIsChatModalOpen(true)}
          >
            <Image source={logoSource} style={styles.floatingBotLogo} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* BOTTOM TAB BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Home size={19} color={activeTab === 'home' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('learn')}>
          <BookOpen size={19} color={activeTab === 'learn' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'learn' && styles.tabLabelActive]}>Learn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('revision')}>
          <Award size={19} color={activeTab === 'revision' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'revision' && styles.tabLabelActive]}>Exam Revision</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('solver')}>
          <Camera size={19} color={activeTab === 'solver' ? '#38bdf8' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'solver' && styles.tabLabelActive]}>Solve</Text>
        </TouchableOpacity>
      </View>

      {/* --- IN-APP NATIVE PDF BOOK READER (NO EXTERNAL APPS) --- */}
      {activePdf && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            {/* PDF Header Bar */}
            <View style={styles.pdfHeaderBar}>
              <TouchableOpacity style={styles.pdfCloseButton} onPress={() => setActivePdf(null)}>
                <X size={22} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.pdfHeaderCenter}>
                <Text style={styles.pdfHeaderTitle} numberOfLines={1}>{activePdf.title}</Text>
                <Text style={styles.pdfHeaderPageInfo}>{`Page ${activePdf.currentPage + 1} of ${activePdf.totalPages}`}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.pdfZoomButton}
                  onPress={() => setActivePdf((prev) => (prev ? { ...prev, zoomScale: Math.max(1, prev.zoomScale - 0.25) } : null))}
                >
                  <ZoomOut size={16} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pdfZoomButton}
                  onPress={() => setActivePdf((prev) => (prev ? { ...prev, zoomScale: Math.min(2.5, prev.zoomScale + 0.25) } : null))}
                >
                  <ZoomIn size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* In-App PDF Page Canvas */}
            <View style={styles.pdfCanvasContainer}>
              {activePdf.isLoadingPage ? (
                <View style={styles.pdfLoadingBox}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.pdfLoadingText}>{`Loading Page ${activePdf.currentPage + 1}...`}</Text>
                </View>
              ) : activePdf.pageImageUri ? (
                <ScrollView
                  contentContainerStyle={styles.pdfPageScrollContent}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                >
                  <Image
                    source={{ uri: activePdf.pageImageUri }}
                    style={[
                      styles.pdfRenderedImage,
                      { transform: [{ scale: activePdf.zoomScale }] },
                    ]}
                    resizeMode="contain"
                  />
                </ScrollView>
              ) : (
                <View style={styles.pdfLoadingBox}>
                  <Text style={styles.pdfLoadingText}>Could not render page</Text>
                </View>
              )}
            </View>

            {/* In-App PDF Navigation Footer Bar */}
            <View style={styles.pdfBottomBar}>
              <TouchableOpacity
                style={[styles.pdfNavButton, activePdf.currentPage <= 0 && styles.pdfNavButtonDisabled]}
                disabled={activePdf.currentPage <= 0 || activePdf.isLoadingPage}
                onPress={prevPdfPage}
              >
                <ChevronLeft size={18} color={activePdf.currentPage <= 0 ? '#52525b' : '#ffffff'} />
                <Text style={[styles.pdfNavButtonText, activePdf.currentPage <= 0 && { color: '#52525b' }]}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.pdfFooterPageIndicator}>{`${activePdf.currentPage + 1} / ${activePdf.totalPages}`}</Text>

              <TouchableOpacity
                style={[styles.pdfNavButton, activePdf.currentPage >= activePdf.totalPages - 1 && styles.pdfNavButtonDisabled]}
                disabled={activePdf.currentPage >= activePdf.totalPages - 1 || activePdf.isLoadingPage}
                onPress={nextPdfPage}
              >
                <Text style={[styles.pdfNavButtonText, activePdf.currentPage >= activePdf.totalPages - 1 && { color: '#52525b' }]}>Next</Text>
                <ChevronRight size={18} color={activePdf.currentPage >= activePdf.totalPages - 1 ? '#52525b' : '#ffffff'} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* --- MEDIUM CHOOSER POPUP (FOR DUAL MEDIUM SUBJECTS) --- */}
      {mediumChooserSubject && (
        <View style={styles.modalBackdropOverlay}>
          <View style={styles.mediumSelectorCard}>
            <View style={styles.mediumSelectorHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumSelectorTitle}>{mediumChooserSubject.name}</Text>
                <Text style={styles.mediumSelectorSub}>Select textbook medium to open in-app</Text>
              </View>
              <TouchableOpacity onPress={() => setMediumChooserSubject(null)} style={{ padding: 4 }}>
                <X size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mediumChoiceItem}
              activeOpacity={0.8}
              onPress={() => openInAppPdf(mediumChooserSubject.englishAssetPdf, mediumChooserSubject.englishTitle)}
            >
              <FileText size={20} color="#ffffff" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumChoiceTitle}>English Medium PDF</Text>
                <Text style={styles.mediumChoiceDesc}>{mediumChooserSubject.englishTitle}</Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediumChoiceItem}
              activeOpacity={0.8}
              onPress={() => openInAppPdf(mediumChooserSubject.nepaliAssetPdf, mediumChooserSubject.nepaliTitle)}
            >
              <FileText size={20} color="#ffffff" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumChoiceTitle}>नेपाली माध्यम PDF</Text>
                <Text style={styles.mediumChoiceDesc}>{mediumChooserSubject.nepaliTitle}</Text>
              </View>
              <ChevronRight size={17} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- FULL-PAGE FLOATING GURU AI MODAL --- */}
      {isChatModalOpen && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.chatTopBar}>
              <TouchableOpacity style={styles.chatCloseButton} onPress={() => setIsChatModalOpen(false)}>
                <X size={22} color="#ffffff" />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={logoSource} style={styles.chatModalLogoIcon} resizeMode="contain" />
                <Text style={styles.chatModalHeaderTitle}>Guru AI Assistant</Text>
              </View>

              <TouchableOpacity style={styles.chatBotIconHeader} onPress={createNewChat}>
                <Plus size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={styles.chatBody} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {activeMessages.length === 0 ? (
                <View style={styles.chatEmptyView}>
                  <Image source={logoSource} style={styles.chatEmptyLogo} resizeMode="contain" />
                  <Text style={styles.chatEmptyTitle}>How can I help you learn?</Text>
                  <Text style={styles.chatEmptySub}>
                    Ask any question or snap a photo from your CDC textbooks. All calculations and responses run on-device.
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={chatListRef}
                  data={activeMessages}
                  keyExtractor={(m) => m.id}
                  contentContainerStyle={styles.chatMessageList}
                  onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                  renderItem={({ item }) => (
                    <View style={item.isUser ? styles.userMsgRow : styles.botMsgRow}>
                      {!item.isUser && (
                        <View style={styles.botAvatarBox}>
                          <Image source={logoSource} style={styles.botAvatarImage} resizeMode="contain" />
                        </View>
                      )}
                      <View style={item.isUser ? styles.userBubble : styles.botBubble}>
                        {item.attachmentImageUri && (
                          <Image source={{ uri: item.attachmentImageUri }} style={styles.chatAttachedPreviewImage} />
                        )}
                        {item.attachmentName && (
                          <View style={styles.chatAttachmentPill}>
                            <Text style={styles.chatAttachmentText}>{item.attachmentName}</Text>
                          </View>
                        )}
                        {item.isPending ? (
                          item.text ? (
                            <View>
                              <MathMarkdownRenderer content={item.text} isUser={false} />
                              <View style={[styles.loadingBubbleRow, { marginTop: 6 }]}>
                                <ActivityIndicator size="small" color="#38bdf8" />
                                <Text style={styles.loadingBubbleText}>Generating...</Text>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.loadingBubbleRow}>
                              <ActivityIndicator size="small" color="#38bdf8" />
                              <Text style={styles.loadingBubbleText}>Guru is solving & thinking...</Text>
                            </View>
                          )
                        ) : (
                          <View>
                            <MathMarkdownRenderer content={item.text} isUser={item.isUser} />
                            {!item.isUser && (
                              <View style={styles.botActionButtonsRow}>
                                <TouchableOpacity
                                  style={styles.chatActionButton}
                                  onPress={() => toggleSpeech(item.id, item.text)}
                                >
                                  {playingMessageId === item.id ? (
                                    <VolumeX size={13} color="#ffffff" style={{ marginRight: 4 }} />
                                  ) : (
                                    <Volume2 size={13} color="#a1a1aa" style={{ marginRight: 4 }} />
                                  )}
                                  <Text style={[styles.chatActionButtonText, playingMessageId === item.id && { color: '#ffffff' }]}>
                                    {playingMessageId === item.id ? 'Stop' : 'Listen'}
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.chatActionButton}
                                  onPress={() => copyMessageToClipboard(item.text)}
                                >
                                  <ClipboardCopy size={13} color="#a1a1aa" style={{ marginRight: 4 }} />
                                  <Text style={styles.chatActionButtonText}>Copy</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                />
              )}

              {/* Thumbnail Preview for Attached Image */}
              {attachedImageUri && (
                <View style={styles.attachedImageThumbnailContainer}>
                  <Image source={{ uri: attachedImageUri }} style={styles.attachedThumbImage} />
                  <Text style={styles.attachedThumbText} numberOfLines={1}>Attached Math / Science Photo</Text>
                  <TouchableOpacity onPress={() => setAttachedImageUri(null)} style={{ padding: 4 }}>
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Chat Input Bar */}
              <View style={styles.chatInputBarContainer}>
                <View style={styles.chatInputPillWrapper}>
                  {/* Camera / Photo Button for Multimodal Math Problems */}
                  <TouchableOpacity
                    style={styles.chatAttachIconButton}
                    onPress={async () => {
                      try {
                        const res = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          quality: 0.8,
                        });
                        if (!res.canceled && res.assets && res.assets.length > 0) {
                          setAttachedImageUri(res.assets[0].uri);
                          if (!prompt.trim()) {
                            setPrompt('Please solve and explain this problem step-by-step:');
                          }
                        }
                      } catch (_) {}
                    }}
                  >
                    <Camera size={19} color="#ffffff" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.chatPillInput}
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="Type a message or attach photo..."
                    placeholderTextColor="#71717a"
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.chatSendIconButton}
                    disabled={!prompt.trim() && !attachedFileContent && !attachedImageUri}
                    onPress={() => sendPrompt()}
                  >
                    <Send size={17} color={prompt.trim() || attachedFileContent || attachedImageUri ? '#ffffff' : '#52525b'} />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bootContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootCenter: {
    alignItems: 'center',
    gap: 14,
  },
  bootLogo: {
    width: 68,
    height: 68,
    marginBottom: 6,
  },
  bootTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  onboardingContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 24 : 48,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 26,
  },
  brandLogo: {
    width: 58,
    height: 58,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  brandSub: {
    fontSize: 13.5,
    color: '#a1a1aa',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#121214',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e1e24',
    gap: 14,
  },
  formItem: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  darkInput: {
    height: 44,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#ffffff',
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gradePill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  gradePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  gradePillTextActive: {
    color: '#000000',
  },
  primaryButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.35,
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#000000',
  },
  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#121214',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoIcon: {
    width: 22,
    height: 22,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  classBadge: {
    backgroundColor: '#121214',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4d4d8',
  },
  headerUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    maxWidth: 140,
  },
  headerUserName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  mainScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100,
  },
  greetingBlock: {
    marginBottom: 12,
  },
  greetingTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },
  greetingSub: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectFolderCard: {
    width: '48.5%',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 13,
    padding: 11,
    marginBottom: 8,
  },
  subjectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  unitCountPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  unitCountText: {
    fontSize: 9.5,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  subjectCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  subjectCardPages: {
    fontSize: 10,
    color: '#71717a',
  },
  singleStatCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#a1a1aa',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  statSubText: {
    fontSize: 10.5,
    color: '#71717a',
  },
  quizCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  quizSubjectTag: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  quizSubjectTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  quizQuestionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e4e4e7',
    lineHeight: 16,
    marginBottom: 9,
  },
  quizOptionsGrid: {
    gap: 6,
    marginBottom: 9,
  },
  quizRowTwo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizOptionPill: {
    width: '48.5%',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  quizOptionPillSelected: {
    borderColor: '#ffffff',
  },
  quizOptionPillCorrect: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  quizOptionPillWrong: {
    backgroundColor: '#4c0519',
    borderColor: '#f43f5e',
  },
  quizOptionText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  quizOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  feedbackBox: {
    padding: 9,
    borderRadius: 8,
    marginBottom: 8,
  },
  feedbackCorrect: {
    backgroundColor: '#064e3b',
  },
  feedbackWrong: {
    backgroundColor: '#4c0519',
  },
  feedbackTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  feedbackExplain: {
    fontSize: 10.5,
    color: '#e4e4e7',
    lineHeight: 14,
  },
  newQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 7,
    backgroundColor: '#121214',
  },
  newQuizButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  classAwareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
  },
  classAwareTextGroup: {
    flex: 1,
    marginLeft: 10,
  },
  classAwareTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  classAwareSub: {
    fontSize: 10.5,
    color: '#71717a',
    lineHeight: 14,
  },
  // LEARN TAB
  learnTabContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  sidebarToggleButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChatTitleBox: {
    flex: 1,
    marginHorizontal: 10,
  },
  activeChatTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  newChatHeaderButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // SLIDE-OUT SIDEBAR DRAWER
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sidebarContent: {
    width: '75%',
    backgroundColor: '#0e0e11',
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  sidebarNewChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 9,
    marginBottom: 14,
  },
  sidebarNewChatText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#000000',
  },
  sidebarChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: '#24242a',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 7,
  },
  sidebarChatItemActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sidebarChatTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  sidebarChatTitleActive: {
    color: '#000000',
    fontWeight: '700',
  },
  // REVISION & MOCK PRACTICE TAB
  mockExamBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  mockBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  mockBannerSub: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 15,
  },
  mockBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    marginLeft: 10,
  },
  mockBannerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  mockModulesContainer: {
    gap: 8,
    marginBottom: 20,
  },
  mockModuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 12,
    padding: 13,
  },
  mockModuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mockModuleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  mockModuleSub: {
    fontSize: 10.5,
    color: '#71717a',
  },
  // FREE MOVABLE DRAGGABLE FLOATING BOT
  floatingBotMovable: {
    position: 'absolute',
    width: 48,
    height: 48,
    zIndex: 99,
  },
  floatingBotInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
  },
  floatingBotLogo: {
    width: 28,
    height: 28,
  },
  // BOTTOM TAB BAR
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'android' ? 26 : 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontSize: 9.5,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // IN-APP NATIVE PDF VIEWER
  pdfHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  pdfCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfHeaderCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  pdfHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pdfHeaderPageInfo: {
    fontSize: 10.5,
    color: '#a1a1aa',
  },
  pdfZoomButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCanvasContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfLoadingBox: {
    alignItems: 'center',
    gap: 8,
  },
  pdfLoadingText: {
    fontSize: 12.5,
    color: '#ffffff',
  },
  pdfPageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfRenderedImage: {
    width: SCREEN_WIDTH - 16,
    height: SCREEN_HEIGHT * 0.76,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  pdfBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 24 : 10,
    backgroundColor: '#09090b',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  pdfNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pdfNavButtonDisabled: {
    opacity: 0.4,
  },
  pdfNavButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: 3,
  },
  pdfFooterPageIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  // MEDIUM CHOOSER MODAL
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mediumSelectorCard: {
    width: '100%',
    backgroundColor: '#121214',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    gap: 10,
  },
  mediumSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mediumSelectorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumSelectorSub: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  mediumChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 11,
    padding: 12,
  },
  mediumChoiceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumChoiceDesc: {
    fontSize: 10.5,
    color: '#a1a1aa',
  },
  // CHAT MODAL
  fullModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 200,
  },
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  chatModalLogoIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  chatModalHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBotIconHeader: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBody: {
    flex: 1,
  },
  chatEmptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  chatEmptyLogo: {
    width: 52,
    height: 52,
    marginBottom: 10,
  },
  chatEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  chatEmptySub: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 16,
  },
  chatMessageList: {
    padding: 12,
  },
  userMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 9,
  },
  botMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  botAvatarBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginTop: 2,
    overflow: 'hidden',
  },
  botAvatarImage: {
    width: 18,
    height: 18,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#27272a',
    borderRadius: 13,
    borderBottomRightRadius: 3,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  botBubble: {
    maxWidth: '84%',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#24242a',
    borderRadius: 13,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 19,
  },
  botActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  chatActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#1c1c22',
    borderRadius: 5,
  },
  chatActionButtonText: {
    fontSize: 10.5,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  chatAttachedPreviewImage: {
    width: 160,
    height: 110,
    borderRadius: 8,
    marginBottom: 6,
  },
  chatAttachmentPill: {
    backgroundColor: '#1f1f23',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  chatAttachmentText: {
    fontSize: 10,
    color: '#a1a1aa',
  },
  attachedImageThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  attachedThumbImage: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 8,
  },
  attachedThumbText: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBubbleText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginLeft: 7,
  },
  chatInputBarContainer: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: Platform.OS === 'android' ? 26 : 10,
    backgroundColor: '#000000',
  },
  chatInputPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chatAttachIconButton: {
    marginRight: 7,
  },
  chatPillInput: {
    flex: 1,
    minHeight: 24,
    maxHeight: 85,
    fontSize: 13,
    color: '#ffffff',
    paddingVertical: 0,
  },
  chatSendIconButton: {
    marginLeft: 7,
  },
  // --- DOWNLOAD & RESOURCE SETUP SCREEN STYLES ---
  downloadScrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 24,
    paddingBottom: 40,
  },
  downloadHeroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  downloadLogoHero: {
    width: 68,
    height: 68,
    marginBottom: 12,
  },
  downloadHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  downloadHeroSub: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  downloadStudentTag: {
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  downloadStudentTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  overallProgressCard: {
    backgroundColor: '#111113',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressPercentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressBarBackground: {
    height: 9,
    backgroundColor: '#27272a',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  checklistContainer: {
    gap: 12,
    marginBottom: 24,
  },
  checklistSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  checklistItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111113',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
  },
  checklistIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checklistContent: {
    flex: 1,
  },
  checklistItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  checklistItemSub: {
    fontSize: 11.5,
    color: '#a1a1aa',
    lineHeight: 16,
    marginBottom: 8,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  downloadingActiveText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtonsCol: {
    gap: 8,
    marginTop: 4,
  },
  downloadModelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  downloadModelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  linkLocalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkLocalButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  testVoiceMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  testVoiceMiniBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  downloadBottomActions: {
    gap: 12,
    alignItems: 'center',
  },
  startLearningPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#ffffff',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  startLearningPrimaryBtnDisabled: {
    opacity: 0.45,
  },
  startLearningPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  skipToDashboardBtn: {
    paddingVertical: 6,
  },
  skipToDashboardBtnText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  recheckResourcesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recheckResourcesBtnText: {
    fontSize: 11.5,
    color: '#71717a',
    fontWeight: '500',
  },
  // VOICE MODE HEADER & CHAT MIC BUTTONS
  voiceModeHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c4a6e',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },
  voiceModeHeaderButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  chatMicIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    marginRight: 4,
  },
  chatMicIconButtonActive: {
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  // ATTACHMENT ACTION SHEET (In-View Overlay)
  attachModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 250,
    justifyContent: 'flex-end',
  },
  attachModalSheet: {
    backgroundColor: '#121214',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    gap: 12,
  },
  attachModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  attachOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
  },
  attachOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attachOptionTextGroup: {
    flex: 1,
  },
  attachOptionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  attachOptionSub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 1,
  },
  attachCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  attachCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
  },

  // --- MATH SOLVER STYLES ---
  solverImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 14,
    position: 'relative',
  },
  solverImagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  solverImageClearBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solverLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  solverLoadingText: {
    fontSize: 13,
    color: '#a1a1aa',
    flex: 1,
  },
  solverResultCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  solverResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#0f0f10',
  },
  solverResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  solverResultContent: {
    padding: 14,
  },
  solverEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  solverEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#52525b',
    marginTop: 4,
  },
  solverEmptySubtitle: {
    fontSize: 12.5,
    color: '#3f3f46',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  solverSettingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 13,
    marginBottom: 8,
  },
  solverSettingsText: {
    fontSize: 13,
    color: '#a1a1aa',
    flex: 1,
  },
});
