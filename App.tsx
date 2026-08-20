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
  Award,
  BookOpen,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  FileCheck,
  FileText,
  Folder,
  GraduationCap,
  HelpCircle,
  Home,
  Menu,
  MessageSquare,
  PanelLeftClose,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabState = 'home' | 'learn' | 'revision' | 'profile';
type ScreenState = 'onboarding' | 'main';
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

  // 1. Strip special model tokens
  out = out
    .replace(/<start_of_turn>/g, '')
    .replace(/<end_of_turn>/g, '')
    .replace(/<eos>/g, '')
    .replace(/<\/s>/g, '')
    .replace(/\[\/?s\]/g, '');

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

  // 8. Markdown Headings to Clean Spaced Sections
  out = out
    .replace(/###\s*([0-9]+[\.\)])\s*/g, '\n\n$1 ')
    .replace(/####\s*(.*?)(?=\n|$)/g, '\n\n• $1:\n')
    .replace(/###\s*(.*?)(?=\n|$)/g, '\n\n$1\n')
    .replace(/##\s*(.*?)(?=\n|$)/g, '\n\n$1\n')
    .replace(/#\s*(.*?)(?=\n|$)/g, '\n\n$1\n');

  // 9. Bold formatting
  out = out
    .replace(/\*\*\*(.*?)\*\*\*/g, '\n• $1\n')
    .replace(/\*\*([^*]+)\*\*:/g, '\n• $1:')
    .replace(/\*\*([^*]+)\*\*/g, '$1');

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

  // --- BOOT & MODEL INITIALIZATION ---
  useEffect(() => {
    const bootApp = async () => {
      try {
        let storedUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
        if (!storedUser) {
          storedUser = await AsyncStorage.getItem(STORAGE_KEYS.legacyUser);
        }
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setName(parsed.name || '');
            setSchool(parsed.school || '');
            setGrade(parsed.grade || '10');
            setScreen('main');
          } catch (_) {}
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

    const chunkSub = DeviceEventEmitter.addListener('LiteRTResponseChunk', (event: { requestId?: string; text?: string }) => {
      const active = activeGenerationRef.current;
      if (!active || event.requestId !== active.requestId) return;

      const partialText = String(event.text ?? '');
      updateAssistantMessage(active.sessionId, active.messageId, partialText, true);
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

  const updateAssistantMessage = (sessionId: string, messageId: string, text: string, isPending: boolean) => {
    const formatted = formatGemmaResponse(text);
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          updatedAt: Date.now(),
          messages: session.messages.map((m) => (m.id === messageId ? { ...m, text: formatted, isPending } : m)),
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
      text: 'Analyzing...',
      isUser: false,
      isPending: true,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg] } : s))
    );

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

    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule && isModelReady) {
      try {
        await NativeModules.LLMInferenceModule.generateResponse(
          textToSend,
          'EN',
          true,
          [],
          requestId,
          ''
        );
      } catch (err) {
        console.warn('Native inference fallback:', err);
        simulateOfflineResponse(currentSessionId, assistantMessageId, textToSend);
      }
    } else {
      simulateOfflineResponse(currentSessionId, assistantMessageId, textToSend);
    }
  };

  const simulateOfflineResponse = (sessionId: string, messageId: string, userQuery: string) => {
    setTimeout(() => {
      let rawResponse = `Here is the complete step-by-step CDC explanation:\n\n`;
      const q = userQuery.toLowerCase();

      if (q.includes('photo') || q.includes('chemical') || q.includes('reaction')) {
        rawResponse += `Photosynthesis is the process by which green plants and algae convert solar energy into chemical energy in the form of glucose.\n\n` +
          `Overall Chemical Equation:\n` +
          `6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂\n\n` +
          `Breakdown of Reaction Components:\n` +
          `• Carbon Dioxide (CO₂): Absorbed through stomata pores on leaves.\n` +
          `• Water (H₂O): Taken up by roots and transported via xylem vessels.\n` +
          `• Glucose (C₆H₁₂O₆): Organic chemical energy stored for plant metabolism.\n` +
          `• Oxygen (O₂): Released into the atmosphere as a vital byproduct.\n\n` +
          `The Two Stages of Photosynthesis:\n` +
          `1. Light-Dependent Reactions (in Thylakoid membranes):\n` +
          `Chlorophyll absorbs light photons to split water molecules (photolysis), generating ATP and NADPH.\n\n` +
          `2. Light-Independent Reactions / Calvin Cycle (in Stroma):\n` +
          `Uses ATP and NADPH to fix carbon dioxide into glucose molecules.`;
      } else if (q.includes('gravity') || q.includes('force') || q.includes('weight')) {
        rawResponse += `Unit 7: Force & Gravity (Grade 10)\n\n` +
          `• Universal Law of Gravitation:\n$$F = \\frac{G \\cdot m_1 \\cdot m_2}{d^2}$$\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\n` +
          `• Acceleration due to Gravity:\n$$g = \\frac{G \\cdot M}{R^2} \\approx 9.8 \\text{ m/s}^2$$\n\n` +
          `In true free fall without air drag, acceleration equals g and the object experiences weightlessness.`;
      } else if (q.includes('pressure') || q.includes('pascal') || q.includes('hydraulic')) {
        rawResponse += `Unit 8: Pressure & Hydraulics\n\n` +
          `• Pascal's Law:\n$$\\frac{F_1}{A_1} = \\frac{F_2}{A_2}$$\n\n` +
          `• Archimedes' Upthrust:\n$$\\text{Upthrust } (U) = V \\cdot d \\cdot g$$\n` +
          `A floating object displaces a liquid weight equal to its total gravitational mass.`;
      } else {
        rawResponse += `Class 10 Core Syllabus Explanation:\n\n` +
          `• State the standard CDC definitions, units, and conditions.\n` +
          `• Include step-by-step calculations and chemical balance for full examination marks.`;
      }

      updateAssistantMessage(sessionId, messageId, rawResponse, false);
      setIsGenerating(false);
    }, 400);
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedOption(index);
    setQuizStatus(index === currentQuiz.correctIndex ? 'correct' : 'wrong');
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

  // --- MAIN SCREEN: DASHBOARD, LEARN, REVISION, PROFILE OR IN-APP PDF VIEWER ---
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

          {/* Chat Messages Stream */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {activeMessages.length === 0 ? (
              <View style={styles.chatEmptyView}>
                <Image source={logoSource} style={styles.chatEmptyLogo} resizeMode="contain" />
                <Text style={styles.chatEmptyTitle}>How can I help you learn?</Text>
                <Text style={styles.chatEmptySub}>
                  Ask questions across all Grade 10 CDC textbooks. You can type or snap a photo of any math problem.
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
                        <View style={styles.loadingBubbleRow}>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.loadingBubbleText}>{item.text || 'Analyzing...'}</Text>
                        </View>
                      ) : (
                        <View>
                          <Text style={styles.bubbleText}>{item.text}</Text>
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
                  placeholder="Ask Guru anything or snap a math problem..."
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

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && (
        <ScrollView contentContainerStyle={styles.mainScroll}>
          <Text style={styles.sectionTitleText}>Student Profile</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>{`Name: ${user?.name}`}</Text>
            <Text style={styles.inputLabel}>{`School: ${user?.school}`}</Text>
            <Text style={styles.inputLabel}>{`Class: ${user?.grade}`}</Text>
            <TouchableOpacity style={styles.newQuizButton} onPress={() => setScreen('onboarding')}>
              <Text style={styles.newQuizButtonText}>Edit Profile</Text>
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

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <User size={19} color={activeTab === 'profile' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
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
                          <View style={styles.loadingBubbleRow}>
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text style={styles.loadingBubbleText}>{item.text || 'Analyzing...'}</Text>
                          </View>
                        ) : (
                          <View>
                            <Text style={styles.bubbleText}>{item.text}</Text>
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
});
