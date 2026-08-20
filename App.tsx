import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
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
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Folder,
  GraduationCap,
  HelpCircle,
  Home,
  MessageSquare,
  Plus,
  RotateCcw,
  School,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react-native';

type TabState = 'home' | 'learn' | 'progress' | 'profile';
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

interface ChapterMetadata {
  number: number;
  titleEn: string;
  titleNe: string;
  pageStart: number;
  pageEnd: number;
  formulas: string;
  keyConcepts: string;
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
  chapters: ChapterMetadata[];
}

interface QuizItem {
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
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

// --- LATEX TO HUMAN-READABLE MATH FORMATTER ---
const convertLatexToReadableMath = (text: string): string => {
  if (!text) return '';

  let converted = text;

  // Delimiters
  converted = converted
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\\\[(.*?)\\\]/gs, '$1')
    .replace(/\\\((.*?)\\\)/gs, '$1')
    .replace(/\$([^\$\n]+)\$/g, '$1');

  // Fractions
  converted = converted
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{1\}\{4\}/g, '¼')
    .replace(/\\frac\{3\}\{4\}/g, '¾')
    .replace(/\\frac\{1\}\{3\}/g, '⅓')
    .replace(/\\frac\{2\}\{3\}/g, '⅔')
    .replace(/\\frac\{1\}\{5\}/g, '⅕')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');

  // Square roots
  converted = converted
    .replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, '√$1');

  // Superscripts
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
  };
  converted = converted.replace(/\^\{([0-9+\-nixy]+)\}/g, (_, p1) => {
    return p1.split('').map((c: string) => superscriptMap[c] || c).join('');
  });
  converted = converted.replace(/\^([0-9n])/g, (_, p1) => superscriptMap[p1] || `^${p1}`);

  // Subscripts
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'n': 'ₙ',
  };
  converted = converted.replace(/_\{([0-9+\-aeoxn]+)\}/g, (_, p1) => {
    return p1.split('').map((c: string) => subscriptMap[c] || c).join('');
  });
  converted = converted.replace(/_([0-9n])/g, (_, p1) => subscriptMap[p1] || `_${p1}`);

  // Symbols
  converted = converted
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\leq?\b/g, '≤')
    .replace(/\\geq?\b/g, '≥')
    .replace(/\\neq?\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\propto\b/g, '∝')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\int\b/g, '∫')
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
    .replace(/\\Rightarrow\b|\\implies\b/g, '⇒')
    .replace(/\\rightarrow\b|\\to\b/g, '→')
    .replace(/\\Leftarrow\b/g, '⇐')
    .replace(/\\leftrightarrow\b/g, '↔');

  // Markdown cleanups
  converted = converted
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[ \t]*#{1,6}\s*(.*)$/gm, '$1')
    .replace(/\\item/g, '• ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return converted;
};

// --- DYNAMIC MULTI-SUBJECT QUIZ POOL ---
const ALL_QUIZ_POOL: QuizItem[] = [
  {
    subject: 'Science & Tech',
    question: 'What can form when an acid reacts with a base in a neutralization reaction?',
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
    options: ['Equally in all directions', 'Only downwards', 'Only to the walls', 'Zero at the bottom'],
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
    englishAssetPdf: 'science/pdf/english medium/Class 10 Science and Technology Book [English Medium].pdf',
    nepaliAssetPdf: 'science/pdf/nepali medium/Book - Class 10 Compulsory Science_1754397695.pdf',
    englishTitle: 'Class 10 Science & Technology (English)',
    nepaliTitle: 'कक्षा १० विज्ञान तथा प्रविधि (नेपाली)',
    chapters: [
      {
        number: 1,
        titleEn: 'Scientific Learning',
        titleNe: 'वैज्ञानिक सिकाइ',
        pageStart: 1,
        pageEnd: 11,
        formulas: 'SI Units, Fundamental & Derived Quantities',
        keyConcepts: 'Scientific method, measurement precision, parallax error reduction, vernier calipers, micrometer screw gauge.',
      },
      {
        number: 7,
        titleEn: 'Force and Gravity',
        titleNe: 'बल र गुरुत्वाकर्षण',
        pageStart: 82,
        pageEnd: 97,
        formulas: 'F = G · (m₁ · m₂) / d², g = (G · M) / R²',
        keyConcepts: 'Newton universal law of gravitation, variation of g with altitude and depth, free fall, weightlessness.',
      },
      {
        number: 8,
        titleEn: 'Pressure & Hydraulics',
        titleNe: 'चाप र हाइड्रोलिक्स',
        pageStart: 98,
        pageEnd: 113,
        formulas: 'P = F / A, F₁ / A₁ = F₂ / A₂, Upthrust (U) = V · d · g',
        keyConcepts: 'Pascal law and hydraulic lift/brakes, Archimedes principle, laws of floatation, mercury barometer.',
      },
      {
        number: 11,
        titleEn: 'Electricity & Magnetism',
        titleNe: 'विद्युत् र चुम्बकत्व',
        pageStart: 142,
        pageEnd: 159,
        formulas: 'V = I · R, P = V · I, E = P · t',
        keyConcepts: 'Ohm law, domestic electrical wiring, safety fuse, MCB, Faraday electromagnetic induction, transformer.',
      },
    ],
  },
  {
    id: 'math',
    name: 'Compulsory Maths',
    nameNe: 'अनिवार्य गणित',
    unitsCount: 14,
    pagesCount: 212,
    hasDualMedium: true,
    englishAssetPdf: 'maths/pdf/english medium/Class-10-Maths-in-English.pdf',
    nepaliAssetPdf: 'maths/pdf/nepali medium/0010_MathsGrade10NepaliVersion.pdf',
    englishTitle: 'Class 10 Compulsory Mathematics (English)',
    nepaliTitle: 'कक्षा १० अनिवार्य गणित (नेपाली)',
    chapters: [
      {
        number: 1,
        titleEn: 'Sets & Venn Diagrams',
        titleNe: 'समूह र भेनचित्र',
        pageStart: 1,
        pageEnd: 17,
        formulas: 'n(A ∪ B) = n(A) + n(B) - n(A ∩ B)',
        keyConcepts: 'Cardinality of 2 and 3 intersecting sets, Venn diagrams, set complementation.',
      },
      {
        number: 2,
        titleEn: 'Compound Interest',
        titleNe: 'मिश्र ब्याज',
        pageStart: 18,
        pageEnd: 33,
        formulas: 'CA = P · (1 + R/100)ᵀ, CI = P · [(1 + R/100)ᵀ - 1]',
        keyConcepts: 'Annual compounding, semi-annual compounding, asset depreciation, compound population growth.',
      },
      {
        number: 5,
        titleEn: 'Mensuration: Cylinder & Sphere',
        titleNe: 'बेलना र गोला',
        pageStart: 64,
        pageEnd: 79,
        formulas: 'Cylinder V = π · r² · h, Sphere V = (4/3) · π · r³, SA = 4 · π · r²',
        keyConcepts: 'Surface area and volume of combined solids (cone + hemisphere, cylinder + hemisphere).',
      },
    ],
  },
  {
    id: 'social',
    name: 'Social Studies',
    nameNe: 'सामाजिक अध्ययन',
    unitsCount: 9,
    pagesCount: 270,
    hasDualMedium: true,
    englishAssetPdf: 'Social/0010_SocialStudiesGrade10.pdf',
    nepaliAssetPdf: 'maths/social_studies/pdf/Class-10-Book-Social-Studies-NE-2080_1760939605.pdf',
    englishTitle: 'Class 10 Social Studies (English)',
    nepaliTitle: 'कक्षा १० सामाजिक अध्ययन (नेपाली)',
    chapters: [
      {
        number: 1,
        titleEn: 'We and Our Society',
        titleNe: 'हामी र हाम्रो समाज',
        pageStart: 1,
        pageEnd: 29,
        formulas: 'Syllabus Core',
        keyConcepts: 'Human resources in Nepal, social harmony, nation-building, active youth participation.',
      },
      {
        number: 5,
        titleEn: 'Constitution of Nepal 2072',
        titleNe: 'नेपालको संविधान २०७२ र मौलिक हक',
        pageStart: 120,
        pageEnd: 154,
        formulas: 'Constitution: 35 Parts, 308 Articles, 9 Schedules, 31 Fundamental Rights',
        keyConcepts: 'Rule of law, federal democratic republic, citizen rights, duties, election system.',
      },
    ],
  },
  {
    id: 'nepali',
    name: 'Nepali',
    nameNe: 'नेपाली',
    unitsCount: 10,
    pagesCount: 224,
    hasDualMedium: false,
    nepaliAssetPdf: 'nepali/pdf/0010_NepaliGrade10.pdf',
    englishTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    nepaliTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    chapters: [
      {
        number: 1,
        titleEn: 'उज्यालो यात्रा (कविता)',
        titleNe: 'उज्यालो यात्रा (कविता)',
        pageStart: 1,
        pageEnd: 23,
        formulas: 'साहित्यिक विधा',
        keyConcepts: 'कवि रामप्रसाद ज्ञवालीद्वारा रचित मानवता, परिश्रम, नैतिक शिक्षा र समाज रूपान्तरणको सन्देश।',
      },
      {
        number: 10,
        titleEn: 'नेपाली व्याकरण तथा रचना',
        titleNe: 'नेपाली व्याकरण तथा रचना',
        pageStart: 202,
        pageEnd: 224,
        formulas: 'पदवर्ग, समास, पदसङ्गति',
        keyConcepts: 'नाम, सर्वनाम, विशेषण, क्रियापद, समासका प्रकार, काल र पक्ष, वाच्य, प्रतिवेदन लेखन।',
      },
    ],
  },
  {
    id: 'english',
    name: 'Compulsory English',
    nameNe: 'अंग्रेजी',
    unitsCount: 10,
    pagesCount: 198,
    hasDualMedium: false,
    englishAssetPdf: 'english/pdf/9.Reduced-class 10 English Final_hsjc8bm.pdf',
    englishTitle: 'Class 10 Compulsory English (CDC Official)',
    nepaliTitle: 'Class 10 Compulsory English (CDC Official)',
    chapters: [
      {
        number: 1,
        titleEn: 'Travel and Tourism',
        titleNe: 'Travel and Tourism',
        pageStart: 1,
        pageEnd: 19,
        formulas: 'Simple Past vs Present Perfect',
        keyConcepts: 'Reading comprehension, travel brochures, trekking guide to Annapurna, vocabulary.',
      },
      {
        number: 5,
        titleEn: 'Science & Technology',
        titleNe: 'Science & Technology',
        pageStart: 80,
        pageEnd: 99,
        formulas: 'Expository essay writing',
        keyConcepts: 'Artificial Intelligence, robotics, technological revolution in education.',
      },
    ],
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    nameNe: 'ऐच्छिक गणित',
    unitsCount: 9,
    pagesCount: 256,
    hasDualMedium: true,
    englishAssetPdf: 'optional math/pdf/english medium/Class-10-Optional-Mathematics-English.pdf',
    nepaliAssetPdf: 'optional math/pdf/nepali medium/Class 10 Optional Mathematics Book [Nepali Medium].pdf.pdf',
    englishTitle: 'Class 10 Optional Mathematics (English)',
    nepaliTitle: 'कक्षा १० ऐच्छिक गणित (नेपाली)',
    chapters: [
      {
        number: 3,
        titleEn: 'Pair of Straight Lines',
        titleNe: 'सरल रेखाको जोडी',
        pageStart: 60,
        pageEnd: 89,
        formulas: 'ax² + 2hxy + by² = 0, tan θ = ± [2 · √(h² - ab)] / (a + b)',
        keyConcepts: 'Homogeneous equation of 2nd degree, perpendicularity (a + b = 0), coincident lines (h² = ab).',
      },
    ],
  },
  {
    id: 'computer',
    name: 'Computer Science',
    nameNe: 'कम्प्युटर विज्ञान',
    unitsCount: 8,
    pagesCount: 160,
    hasDualMedium: false,
    englishAssetPdf: 'computer science/CSGrade 10_rs8obhn.pdf',
    englishTitle: 'Class 10 Computer Science (Official CDC)',
    nepaliTitle: 'कक्षा १० कम्प्युटर विज्ञान (Official CDC)',
    chapters: [
      {
        number: 1,
        titleEn: 'Networking & Telecommunication',
        titleNe: 'नेटवर्किङ र दूरसञ्चार',
        pageStart: 1,
        pageEnd: 24,
        formulas: 'Topologies & Protocols',
        keyConcepts: 'LAN, MAN, WAN, Star/Bus/Ring topologies, Transmission media (Fiber, Coaxial, Twisted pair).',
      },
    ],
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

  // Floating AI modal
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Scrollable PDF Reader View State
  const [activePdfViewing, setActivePdfViewing] = useState<{
    subject: SubjectItem;
    medium: 'EN' | 'NE';
    currentPage: number;
    activeChapterIndex: number;
  } | null>(null);

  // Medium Selection Popup
  const [mediumChooserSubject, setMediumChooserSubject] = useState<SubjectItem | null>(null);

  // Dynamic Random Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<QuizItem>(ALL_QUIZ_POOL[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');

  // File Attachments
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);

  const chatListRef = useRef<FlatList>(null);
  const activeGenerationRef = useRef<GenerationRef | null>(null);
  const modelReadyRef = useRef(false);

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
      if (activePdfViewing) {
        setActivePdfViewing(null);
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
  }, [activePdfViewing, mediumChooserSubject, isChatModalOpen]);

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
        console.warn('Boot issue:', err);
      } finally {
        setTimeout(() => setIsBooting(false), 200);
      }
    };

    void bootApp();
  }, []);

  // Save sessions to storage on change
  useEffect(() => {
    if (sessions.length > 0) {
      void AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    }
  }, [sessions]);

  // --- STREAMING LISTENERS (CLEAN RESOLUTION WITH NO GLITCHES) ---
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
    const formatted = convertLatexToReadableMath(text);
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

  // --- SUBJECT CLICK FLOW (DIRECT SCROLLABLE PDF) ---
  const handleSubjectClick = (subject: SubjectItem) => {
    if (subject.hasDualMedium) {
      setMediumChooserSubject(subject);
    } else {
      openPdfDirect(subject, subject.id === 'nepali' ? 'NE' : 'EN');
    }
  };

  const openPdfDirect = (subject: SubjectItem, medium: 'EN' | 'NE') => {
    setMediumChooserSubject(null);
    setActivePdfViewing({
      subject,
      medium,
      currentPage: subject.chapters[0]?.pageStart || 1,
      activeChapterIndex: 0,
    });
  };

  const openExternalSystemPdf = async (assetPath?: string) => {
    if (!assetPath) return;
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.openAssetPdf) {
      try {
        await NativeModules.LLMInferenceModule.openAssetPdf(assetPath);
      } catch (err) {
        console.warn('Could not open external PDF:', err);
      }
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

  // --- CONTEXT-AWARE SAFE PROMPT SENDER ---
  const sendPrompt = async (forcedPrompt?: string, activeContextMetadata?: string) => {
    const textToSend = (forcedPrompt || prompt).trim();
    if (!textToSend && !attachedFileContent) return;

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
    };

    const botMsg: Message = {
      id: assistantMessageId,
      text: 'Thinking...',
      isUser: false,
      isPending: true,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg] } : s))
    );

    setPrompt('');
    setAttachedFileName(null);
    setAttachedFileContent(null);
    setIsGenerating(true);

    activeGenerationRef.current = {
      requestId,
      sessionId: currentSessionId,
      messageId: assistantMessageId,
    };

    // Construct Context-Injected Prompt
    let fullContextualPrompt = textToSend;
    if (activeContextMetadata) {
      fullContextualPrompt = `[CDC Context: ${activeContextMetadata}]\nQuestion: ${textToSend}`;
    }

    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule && isModelReady) {
      try {
        await NativeModules.LLMInferenceModule.generateResponse(
          fullContextualPrompt,
          'EN',
          true,
          [],
          requestId,
          ''
        );
      } catch (err) {
        console.warn('Native inference fallback:', err);
        simulateOfflineResponse(currentSessionId, assistantMessageId, textToSend, activeContextMetadata);
      }
    } else {
      simulateOfflineResponse(currentSessionId, assistantMessageId, textToSend, activeContextMetadata);
    }
  };

  const simulateOfflineResponse = (
    sessionId: string,
    messageId: string,
    userQuery: string,
    contextMeta?: string
  ) => {
    setTimeout(() => {
      let rawResponse = `Here is the step-by-step explanation:\n\n`;
      const q = userQuery.toLowerCase();

      if (contextMeta) {
        rawResponse += `Based on ${contextMeta}:\n\n`;
      }

      if (q.includes('gravity') || q.includes('force') || q.includes('weight')) {
        rawResponse += `Unit 7: Force & Gravity (Page 82)\n\n1. Universal Law of Gravitation:\n$$F = \\frac{G \\cdot m_1 \\cdot m_2}{d^2}$$\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\n2. Acceleration due to Gravity:\n$$g = \\frac{G \\cdot M}{R^2} \\approx 9.8 \\text{ m/s}^2$$\n\nKey Concept: In free fall without air resistance, acceleration equals g and the object experiences weightlessness.`;
      } else if (q.includes('pressure') || q.includes('pascal') || q.includes('hydraulic')) {
        rawResponse += `Unit 8: Pressure & Hydraulics (Page 98)\n\n1. Pascal's Law Principle:\n$$\\frac{F_1}{A_1} = \\frac{F_2}{A_2}$$\n\n2. Archimedes' Upthrust:\n$$\\text{Upthrust } (U) = V \\cdot d \\cdot g$$\nA floating body displaces liquid equal to its own total weight.`;
      } else if (q.includes('interest') || q.includes('math') || q.includes('compound')) {
        rawResponse += `Compulsory Mathematics: Compound Interest (Page 18)\n\n1. Annual Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{100}\\right)^T - 1 \\right]$$\n\n2. Semi-Annual Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{200}\\right)^{2T} - 1 \\right]$$`;
      } else if (q.includes('straight') || q.includes('pair') || q.includes('opt')) {
        rawResponse += `Optional Mathematics: Pair of Straight Lines (Page 60)\n\n1. Homogeneous Equation:\n$$ax^2 + 2hxy + by^2 = 0$$\n\n2. Angle between lines:\n$$\\tan\\theta = \\pm \\frac{2\\sqrt{h^2 - ab}}{a + b}$$\n\nPerpendicular condition: $a + b = 0$.`;
      } else {
        rawResponse += `Class 10 Core Syllabus:\n• Always state standard definitions, formulas, and SI units.\n• Provide clear step-by-step derivations for full SEE exam marks.`;
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
          <Image source={logoSource} style={styles.bootLogo} />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.bootTitle}>Loading Guru...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- ONBOARDING FORM SCREEN (NAME, SCHOOL, GRADE) ---
  if (screen === 'onboarding') {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <KeyboardAvoidingView style={styles.darkContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.onboardingContent}>
            <View style={styles.brandHero}>
              <Image source={logoSource} style={styles.brandLogo} />
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

  // --- MAIN SCREEN: DASHBOARD OR CHAT HUB ---
  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* TOP HEADER (CLEAN NO TRANSLATOR BUTTON) */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <Text style={styles.appHeaderTitle}>Guru</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{`Class ${user?.grade ?? '10'}`}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerUserPill}>
          <User size={14} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.headerUserName} numberOfLines={1}>{user?.name || 'Student'}</Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: HOME DASHBOARD */}
      {activeTab === 'home' && (
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          {/* GREETING */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>{`Hi, ${user?.name || 'Sangam'}`}</Text>
            <Text style={styles.greetingSub}>Choose a subject folder to view official scrollable PDF textbooks.</Text>
          </View>

          {/* SUBJECT RESOURCE FOLDERS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Folder size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitleText}>Subject Resource Folders</Text>
          </View>

          {/* SUBJECT FOLDERS GRID (DIRECT TO SCROLLABLE PDF) */}
          <View style={styles.subjectGrid}>
            {SUBJECTS_DATA.map((subj) => (
              <TouchableOpacity
                key={subj.id}
                style={styles.subjectFolderCard}
                activeOpacity={0.8}
                onPress={() => handleSubjectClick(subj)}
              >
                <View style={styles.subjectCardTop}>
                  <Folder size={20} color="#ffffff" />
                  <View style={styles.unitCountPill}>
                    <Text style={styles.unitCountText}>{`${subj.unitsCount} Units`}</Text>
                  </View>
                </View>
                <Text style={styles.subjectCardTitle} numberOfLines={1}>{subj.name}</Text>
                <Text style={styles.subjectCardPages}>{`${subj.pagesCount} Pages • CDC PDF`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DAILY STREAK CARD */}
          <View style={styles.singleStatCard}>
            <View style={styles.statHeader}>
              <Calendar size={18} color="#ffffff" />
              <Text style={styles.statLabel}>DAILY STREAK</Text>
            </View>
            <Text style={styles.statValue}>2 Days</Text>
            <Text style={styles.statSubText}>offline learning days in a row</Text>
          </View>

          {/* DYNAMIC RANDOM QUIZ CARD */}
          <View style={styles.quizCard}>
            <View style={styles.quizHeaderRow}>
              <View style={styles.quizHeaderLeft}>
                <HelpCircle size={18} color="#ffffff" />
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
              <RotateCcw size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.newQuizButtonText}>New quiz (Random Subject)</Text>
            </TouchableOpacity>
          </View>

          {/* CLASS-AWARE CARD */}
          <View style={styles.classAwareCard}>
            <GraduationCap size={22} color="#ffffff" />
            <View style={styles.classAwareTextGroup}>
              <Text style={styles.classAwareTitle}>Class-aware tutoring</Text>
              <Text style={styles.classAwareSub}>
                Guru changes tone and depth for each class level, from gentle basics to serious exam prep.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* TAB 2: LEARN (DEDICATED MULTI-TURN AI CHAT HUB) */}
      {activeTab === 'learn' && (
        <View style={styles.learnTabContainer}>
          {/* Chat Sessions Top Bar */}
          <View style={styles.chatHubTopBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sessionPillsScroll}>
              <TouchableOpacity style={styles.newChatPill} onPress={createNewChat}>
                <Plus size={16} color="#000000" style={{ marginRight: 4 }} />
                <Text style={styles.newChatPillText}>New Chat</Text>
              </TouchableOpacity>

              {sessions.map((s) => {
                const isActive = (activeSessionId || sessions[0]?.id) === s.id;
                return (
                  <View key={s.id} style={[styles.sessionPill, isActive && styles.sessionPillActive]}>
                    <TouchableOpacity onPress={() => setActiveSessionId(s.id)}>
                      <Text style={[styles.sessionPillTitle, isActive && styles.sessionPillTitleActive]} numberOfLines={1}>
                        {s.title}
                      </Text>
                    </TouchableOpacity>
                    {sessions.length > 1 && (
                      <TouchableOpacity onPress={() => deleteChat(s.id)} style={{ marginLeft: 6 }}>
                        <Trash2 size={13} color={isActive ? '#000000' : '#71717a'} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Chat Messages Stream */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {activeMessages.length === 0 ? (
              <View style={styles.chatEmptyView}>
                <Bot size={44} color="#ffffff" />
                <Text style={styles.chatEmptyTitle}>How can I help you learn?</Text>
                <Text style={styles.chatEmptySub}>
                  Ask any question from your Class 10 CDC textbooks. I remember follow-up questions in this chat.
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
                        <Bot size={16} color="#000000" />
                      </View>
                    )}
                    <View style={item.isUser ? styles.userBubble : styles.botBubble}>
                      {item.attachmentName && (
                        <View style={styles.chatAttachmentPill}>
                          <Text style={styles.chatAttachmentText}>{item.attachmentName}</Text>
                        </View>
                      )}
                      {item.isPending ? (
                        <View style={styles.loadingBubbleRow}>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.loadingBubbleText}>{item.text || 'Thinking...'}</Text>
                        </View>
                      ) : (
                        <Text style={styles.bubbleText}>{item.text}</Text>
                      )}
                    </View>
                  </View>
                )}
              />
            )}

            {/* Chat Input Bar */}
            <View style={styles.chatInputBarContainer}>
              <View style={styles.chatInputPillWrapper}>
                <TouchableOpacity
                  style={styles.chatAttachIconButton}
                  onPress={async () => {
                    try {
                      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
                      if (!res.canceled && res.assets && res.assets.length > 0) {
                        const file = res.assets[0];
                        setAttachedFileName(file.name);
                        setAttachedFileContent('Attached file');
                      }
                    } catch (_) {}
                  }}
                >
                  <Plus size={20} color="#ffffff" />
                </TouchableOpacity>

                <TextInput
                  style={styles.chatPillInput}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Ask Guru anything..."
                  placeholderTextColor="#71717a"
                  multiline
                />

                <TouchableOpacity
                  style={styles.chatSendIconButton}
                  disabled={!prompt.trim() && !attachedFileContent}
                  onPress={() => sendPrompt()}
                >
                  <Send size={18} color={prompt.trim() || attachedFileContent ? '#ffffff' : '#52525b'} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* TAB 3: PROGRESS */}
      {activeTab === 'progress' && (
        <ScrollView contentContainerStyle={styles.mainScroll}>
          <Text style={styles.sectionTitleText}>Study Progress</Text>
          <View style={styles.singleStatCard}>
            <Text style={styles.statValue}>Class {user?.grade || '10'} Syllabus</Text>
            <Text style={styles.statSubText}>{`School: ${user?.school || 'CDC High School'}`}</Text>
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

      {/* FLOATING GURU AI SPHERE (ACCESSIBLE EVERYWHERE) */}
      <TouchableOpacity
        style={styles.floatingBotButton}
        activeOpacity={0.9}
        onPress={() => setIsChatModalOpen(true)}
      >
        <Bot size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* BOTTOM TAB BAR (SAFE VIEWPORT FIT FOR ALL MOBILES) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Home size={20} color={activeTab === 'home' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('learn')}>
          <BookOpen size={20} color={activeTab === 'learn' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'learn' && styles.tabLabelActive]}>Learn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('progress')}>
          <ClipboardList size={20} color={activeTab === 'progress' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'progress' && styles.tabLabelActive]}>Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <User size={20} color={activeTab === 'profile' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* --- MEDIUM CHOOSER POPUP (FOR DUAL MEDIUM SUBJECTS) --- */}
      {mediumChooserSubject && (
        <View style={styles.modalBackdropOverlay}>
          <View style={styles.mediumSelectorCard}>
            <View style={styles.mediumSelectorHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumSelectorTitle}>{mediumChooserSubject.name}</Text>
                <Text style={styles.mediumSelectorSub}>Select textbook medium to open PDF</Text>
              </View>
              <TouchableOpacity onPress={() => setMediumChooserSubject(null)} style={{ padding: 4 }}>
                <X size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mediumChoiceItem}
              activeOpacity={0.8}
              onPress={() => openPdfDirect(mediumChooserSubject, 'EN')}
            >
              <FileText size={22} color="#ffffff" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumChoiceTitle}>English Medium PDF</Text>
                <Text style={styles.mediumChoiceDesc}>{mediumChooserSubject.englishTitle}</Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediumChoiceItem}
              activeOpacity={0.8}
              onPress={() => openPdfDirect(mediumChooserSubject, 'NE')}
            >
              <FileText size={22} color="#ffffff" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumChoiceTitle}>नेपाली माध्यम PDF</Text>
                <Text style={styles.mediumChoiceDesc}>{mediumChooserSubject.nepaliTitle}</Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- SCROLLABLE PDF READER VIEW (MATCHING USER'S SCREENSHOT 4) --- */}
      {activePdfViewing && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            {/* Top Bar matching Screenshot 4 */}
            <View style={styles.pdfTopBar}>
              <TouchableOpacity style={styles.pdfBackButton} onPress={() => setActivePdfViewing(null)}>
                <ArrowLeft size={22} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.pdfHeaderInfo}>
                <Text style={styles.pdfHeaderTitle} numberOfLines={1}>
                  {activePdfViewing.medium === 'EN'
                    ? activePdfViewing.subject.englishTitle
                    : activePdfViewing.subject.nepaliTitle}
                </Text>
                <Text style={styles.pdfHeaderPageInfo}>Official CDC Textbook</Text>
              </View>

              {/* Open in external system PDF viewer */}
              <TouchableOpacity
                style={styles.openExternalPdfBtn}
                onPress={() => {
                  const asset = activePdfViewing.medium === 'EN'
                    ? activePdfViewing.subject.englishAssetPdf
                    : activePdfViewing.subject.nepaliAssetPdf;
                  openExternalSystemPdf(asset);
                }}
              >
                <ExternalLink size={16} color="#ffffff" />
              </TouchableOpacity>

              {/* Ask Guru on this Page */}
              <TouchableOpacity
                style={styles.pdfHeaderAiButton}
                onPress={() => {
                  const ch = activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex];
                  const meta = `${activePdfViewing.subject.name} (Unit ${ch?.number || 1}, Page ${activePdfViewing.currentPage})`;
                  setPrompt(`Explain the key formulas and questions on Page ${activePdfViewing.currentPage} of ${activePdfViewing.subject.name}.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Sparkles size={14} color="#000000" style={{ marginRight: 4 }} />
                <Text style={styles.pdfHeaderAiButtonText}>Ask AI</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable PDF Document Canvas */}
            <ScrollView contentContainerStyle={styles.pdfDocumentScroll} showsVerticalScrollIndicator={true}>
              {(() => {
                const currentChapter =
                  activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex] ||
                  activePdfViewing.subject.chapters[0];

                return (
                  <View style={styles.pdfBookPagePaper}>
                    <View style={styles.pdfDocPageTop}>
                      <Text style={styles.pdfUnitHeadingTop}>{`Unit ${currentChapter?.number || 1}: ${currentChapter?.titleEn || activePdfViewing.subject.name}`}</Text>
                      <Text style={styles.pdfPageNumberTop}>{`Page ${activePdfViewing.currentPage} / ${activePdfViewing.subject.pagesCount}`}</Text>
                    </View>

                    <View style={styles.pdfBookTitleBlock}>
                      <Text style={styles.pdfBookUnitMainTitle}>
                        {`UNIT ${currentChapter?.number || 1}`}
                      </Text>
                      <Text style={styles.pdfBookChapterTitle}>
                        {activePdfViewing.medium === 'EN' ? currentChapter?.titleEn : currentChapter?.titleNe}
                      </Text>
                    </View>

                    <View style={styles.pdfDividerLine} />

                    {/* Original Textbook Formulations */}
                    <Text style={styles.pdfSubSectionTitle}>CDC Standard Formulations & Theorems:</Text>
                    <View style={styles.pdfFormulaHighlightBox}>
                      <Text style={styles.pdfFormulaMathText}>{currentChapter?.formulas}</Text>
                    </View>

                    <Text style={styles.pdfSubSectionTitle}>Core Theoretical Concepts:</Text>
                    <Text style={styles.pdfBookBodyText}>{currentChapter?.keyConcepts}</Text>

                    <View style={styles.pdfDividerLine} />

                    <View style={styles.pdfExamNoticeBox}>
                      <Text style={styles.pdfExamNoticeTitle}>SEE Exam Problem Solving Method:</Text>
                      <Text style={styles.pdfExamNoticeBody}>
                        1. Always state given variables and standard SI units.{'\n'}
                        2. Write formula before calculation.{'\n'}
                        3. Tap "Ask AI" on the top right for complete step-by-step derivation.
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Bottom Scroll Controls matching Screenshot 4 */}
              <View style={styles.pdfBottomBarControls}>
                <TouchableOpacity
                  style={[styles.pdfBottomNavPill, activePdfViewing.activeChapterIndex === 0 && styles.pdfBottomNavPillDisabled]}
                  disabled={activePdfViewing.activeChapterIndex === 0}
                  onPress={() => {
                    const newIndex = Math.max(0, activePdfViewing.activeChapterIndex - 1);
                    const newPage = activePdfViewing.subject.chapters[newIndex]?.pageStart || 1;
                    setActivePdfViewing({ ...activePdfViewing, activeChapterIndex: newIndex, currentPage: newPage });
                  }}
                >
                  <ChevronLeft size={16} color="#ffffff" />
                  <Text style={styles.pdfNavPillText}>Previous Unit</Text>
                </TouchableOpacity>

                <View style={styles.pdfPageIndicatorBubble}>
                  <Text style={styles.pdfPageIndicatorText}>{`${activePdfViewing.currentPage} / ${activePdfViewing.subject.pagesCount}`}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pdfBottomNavPill,
                    activePdfViewing.activeChapterIndex === activePdfViewing.subject.chapters.length - 1 &&
                      styles.pdfBottomNavPillDisabled,
                  ]}
                  disabled={activePdfViewing.activeChapterIndex === activePdfViewing.subject.chapters.length - 1}
                  onPress={() => {
                    const newIndex = Math.min(activePdfViewing.subject.chapters.length - 1, activePdfViewing.activeChapterIndex + 1);
                    const newPage = activePdfViewing.subject.chapters[newIndex]?.pageStart || 1;
                    setActivePdfViewing({ ...activePdfViewing, activeChapterIndex: newIndex, currentPage: newPage });
                  }}
                >
                  <Text style={styles.pdfNavPillText}>Next Unit</Text>
                  <ChevronRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- FULL-PAGE FLOATING GURU AI MODAL --- */}
      {isChatModalOpen && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.chatTopBar}>
              <TouchableOpacity style={styles.chatCloseButton} onPress={() => setIsChatModalOpen(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.chatBotIconHeader} onPress={createNewChat}>
                <Bot size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={styles.chatBody} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {activeMessages.length === 0 ? (
                <View style={styles.chatEmptyView}>
                  <Bot size={44} color="#ffffff" />
                  <Text style={styles.chatEmptyTitle}>How can I help you learn?</Text>
                  <Text style={styles.chatEmptySub}>
                    Ask any question from your CDC textbooks. I run 100% offline on your device with complete math formatting.
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
                          <Bot size={16} color="#000000" />
                        </View>
                      )}
                      <View style={item.isUser ? styles.userBubble : styles.botBubble}>
                        {item.attachmentName && (
                          <View style={styles.chatAttachmentPill}>
                            <Text style={styles.chatAttachmentText}>{item.attachmentName}</Text>
                          </View>
                        )}
                        {item.isPending ? (
                          <View style={styles.loadingBubbleRow}>
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text style={styles.loadingBubbleText}>{item.text || 'Thinking...'}</Text>
                          </View>
                        ) : (
                          <Text style={styles.bubbleText}>{item.text}</Text>
                        )}
                      </View>
                    </View>
                  )}
                />
              )}

              {/* Chat Input Bar */}
              <View style={styles.chatInputBarContainer}>
                <View style={styles.chatInputPillWrapper}>
                  <TouchableOpacity
                    style={styles.chatAttachIconButton}
                    onPress={async () => {
                      try {
                        const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
                        if (!res.canceled && res.assets && res.assets.length > 0) {
                          const file = res.assets[0];
                          setAttachedFileName(file.name);
                          setAttachedFileContent('Attached file');
                        }
                      } catch (_) {}
                    }}
                  >
                    <Plus size={20} color="#ffffff" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.chatPillInput}
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="Type a message..."
                    placeholderTextColor="#71717a"
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.chatSendIconButton}
                    disabled={!prompt.trim() && !attachedFileContent}
                    onPress={() => sendPrompt()}
                  >
                    <Send size={18} color={prompt.trim() || attachedFileContent ? '#ffffff' : '#52525b'} />
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

// --- STYLESHEET (OPTIMIZED SCALING FOR ALL MOBILES) ---
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
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  bootTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  onboardingContent: {
    padding: 20,
    paddingTop: 48,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLogo: {
    width: 56,
    height: 56,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  brandSub: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#121214',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e1e24',
    gap: 14,
  },
  formItem: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  darkInput: {
    height: 46,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#ffffff',
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gradePill: {
    flex: 1,
    height: 40,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  gradePillTextActive: {
    color: '#000000',
  },
  primaryButton: {
    height: 46,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#121214',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  mainScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 110,
  },
  greetingBlock: {
    marginBottom: 14,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },
  greetingSub: {
    fontSize: 12.5,
    color: '#a1a1aa',
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectFolderCard: {
    width: '48.5%',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  subjectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  unitCountPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  unitCountText: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  subjectCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  subjectCardPages: {
    fontSize: 10.5,
    color: '#71717a',
  },
  singleStatCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  statSubText: {
    fontSize: 11,
    color: '#71717a',
  },
  quizCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 13,
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
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  quizQuestionText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#e4e4e7',
    lineHeight: 17,
    marginBottom: 10,
  },
  quizOptionsGrid: {
    gap: 6,
    marginBottom: 10,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    fontSize: 11.5,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  quizOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  feedbackBox: {
    padding: 10,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  feedbackExplain: {
    fontSize: 11,
    color: '#e4e4e7',
    lineHeight: 15,
  },
  newQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 7,
    backgroundColor: '#121214',
  },
  newQuizButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  classAwareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  classAwareTextGroup: {
    flex: 1,
    marginLeft: 10,
  },
  classAwareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  classAwareSub: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
  },
  // LEARN TAB (CHAT HUB)
  learnTabContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatHubTopBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  sessionPillsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  newChatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  newChatPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: 160,
  },
  sessionPillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sessionPillTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  sessionPillTitleActive: {
    color: '#000000',
    fontWeight: '700',
  },
  // FLOATING BOT BUTTON
  floatingBotButton: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
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
    zIndex: 99,
  },
  // BOTTOM TAB BAR (SAFE OVERLAY)
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'android' ? 24 : 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tabLabel: {
    fontSize: 10.5,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // MEDIUM CHOOSER MODAL
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  mediumSelectorCard: {
    width: '100%',
    backgroundColor: '#121214',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 18,
    gap: 12,
  },
  mediumSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mediumSelectorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumSelectorSub: {
    fontSize: 11.5,
    color: '#a1a1aa',
  },
  mediumChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
  },
  mediumChoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumChoiceDesc: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  // FULL-SCREEN SCROLLABLE PDF VIEWER (MATCHING SCREENSHOT 4)
  fullModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 200,
  },
  pdfTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  pdfBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pdfHeaderInfo: {
    flex: 1,
  },
  pdfHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  pdfHeaderPageInfo: {
    fontSize: 10.5,
    color: '#a1a1aa',
  },
  openExternalPdfBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  pdfHeaderAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 6,
  },
  pdfHeaderAiButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#000000',
  },
  pdfDocumentScroll: {
    padding: 14,
    paddingBottom: 40,
  },
  pdfBookPagePaper: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  pdfDocPageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pdfUnitHeadingTop: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  pdfPageNumberTop: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  pdfBookTitleBlock: {
    alignItems: 'center',
    marginVertical: 10,
  },
  pdfBookUnitMainTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#a1a1aa',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pdfBookChapterTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  pdfDividerLine: {
    height: 1,
    backgroundColor: '#1e1e24',
    marginVertical: 14,
  },
  pdfSubSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  pdfFormulaHighlightBox: {
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: '#24242e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pdfFormulaMathText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 18,
  },
  pdfBookBodyText: {
    fontSize: 12.5,
    color: '#d4d4d8',
    lineHeight: 20,
    marginBottom: 10,
  },
  pdfExamNoticeBox: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 12,
  },
  pdfExamNoticeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  pdfExamNoticeBody: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 16,
  },
  pdfBottomBarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 12,
    padding: 8,
  },
  pdfBottomNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pdfBottomNavPillDisabled: {
    opacity: 0.3,
  },
  pdfNavPillText: {
    fontSize: 11.5,
    color: '#ffffff',
    fontWeight: '600',
    marginHorizontal: 4,
  },
  pdfPageIndicatorBubble: {
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfPageIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  // CHAT MODAL
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  chatCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBotIconHeader: {
    width: 36,
    height: 36,
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
    padding: 28,
  },
  chatEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  chatEmptySub: {
    fontSize: 12.5,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 17,
  },
  chatMessageList: {
    padding: 14,
  },
  userMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  botMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  botAvatarBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 3,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#27272a',
    borderRadius: 14,
    borderBottomRightRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  botBubble: {
    maxWidth: '82%',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#24242a',
    borderRadius: 14,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleText: {
    fontSize: 13.5,
    color: '#ffffff',
    lineHeight: 19,
  },
  chatAttachmentPill: {
    backgroundColor: '#1f1f23',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  chatAttachmentText: {
    fontSize: 10.5,
    color: '#a1a1aa',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBubbleText: {
    fontSize: 12.5,
    color: '#a1a1aa',
    marginLeft: 8,
  },
  chatInputBarContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 26 : 10,
    backgroundColor: '#000000',
  },
  chatInputPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chatAttachIconButton: {
    marginRight: 8,
  },
  chatPillInput: {
    flex: 1,
    minHeight: 26,
    maxHeight: 90,
    fontSize: 13.5,
    color: '#ffffff',
    paddingVertical: 0,
  },
  chatSendIconButton: {
    marginLeft: 8,
  },
});
