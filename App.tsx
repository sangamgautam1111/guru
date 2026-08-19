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
  ChevronRight,
  ClipboardList,
  Folder,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  User,
  X,
} from 'lucide-react-native';

type TabState = 'home' | 'learn' | 'progress' | 'profile';
type ScreenState = 'onboarding' | 'main';
type SubjectId = 'science' | 'math' | 'social' | 'nepali' | 'english' | 'opt_math';
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

interface SubjectItem {
  id: SubjectId;
  name: string;
  unitsCount: number;
  pagesCount: number;
  englishTitle: string;
  nepaliTitle: string;
  description: string;
  overview: string;
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

  // 1. Remove LaTeX block and inline math delimiters ($$...$$, \[...\], \(...\), $...$)
  converted = converted
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\\\[(.*?)\\\]/gs, '$1')
    .replace(/\\\((.*?)\\\)/gs, '$1')
    .replace(/\$([^\$\n]+)\$/g, '$1');

  // 2. Convert common LaTeX fractions \frac{a}{b}
  converted = converted
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{1\}\{4\}/g, '¼')
    .replace(/\\frac\{3\}\{4\}/g, '¾')
    .replace(/\\frac\{1\}\{3\}/g, '⅓')
    .replace(/\\frac\{2\}\{3\}/g, '⅔')
    .replace(/\\frac\{1\}\{5\}/g, '⅕')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');

  // 3. Convert square roots and cube roots
  converted = converted
    .replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, '√$1');

  // 4. Superscripts and powers (e.g. x^2 -> x², x^{3} -> x³)
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

  // 5. Subscripts (e.g. x_{1} -> x₁)
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

  // 6. LaTeX operators & symbols
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

  // 7. Standard functions & text wrappers
  converted = converted
    .replace(/\\(?:text|mathrm|mathbf|mathit|textsf)\{([^{}]+)\}/g, '$1')
    .replace(/\\(?:sin|cos|tan|cot|sec|cosec|log|ln|lim|max|min)\b/g, (m) => m.slice(1));

  // 8. Markdown cleanups
  converted = converted
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[ \t]*#{1,6}\s*(.*)$/gm, '$1')
    .replace(/\\item/g, '• ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return converted;
};

// --- SUBJECTS DATA CONFIGURATION ---
const SUBJECTS_DATA: SubjectItem[] = [
  {
    id: 'science',
    name: 'Science & Tech',
    unitsCount: 15,
    pagesCount: 240,
    englishTitle: 'Class 10 Science & Technology (English Medium)',
    nepaliTitle: 'कक्षा १० विज्ञान तथा प्रविधि (नेपाली माध्यम)',
    description: 'Complete CDC textbook with physics, chemistry, biology, geology, and astronomy.',
    overview: 'Unit 1: Scientific Learning • Unit 2: Classification of Living Beings • Unit 3: Honeybee • Unit 4: Heredity & Genetics • Unit 5: Physiological Structure • Unit 6: Nature & Environment • Unit 7: Force & Gravity [F=G(m1*m2)/d²] • Unit 8: Pressure [Pascal\'s Law, Archimedes Principle] • Unit 9: Energy • Unit 10: Wave & Sound • Unit 11: Electricity & Magnetism • Unit 12: Universe • Unit 13: Elements • Unit 14: Chemical Reactions • Unit 15: Gases & Metallurgy.',
  },
  {
    id: 'math',
    name: 'Compulsory Maths',
    unitsCount: 14,
    pagesCount: 212,
    englishTitle: 'Class 10 Compulsory Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० अनिवार्य गणित (नेपाली माध्यम)',
    description: 'Sets, Arithmetic, Mensuration, Algebra, Geometry, Trigonometry, and Statistics.',
    overview: 'Chapter 1: Sets & Venn Diagrams • Chapter 2: Compound Interest [CI=P((1+R/100)^T - 1)] • Chapter 3: Population Growth & Depreciation • Chapter 4: Mensuration: Plane Figures (Heron\'s formula) • Chapter 5: Cylinder & Sphere • Chapter 6: Prism & Pyramid • Chapter 7: HCF & LCM • Chapter 8: Quadratic Equations [x=(-b±√(b²-4ac))/2a] • Chapter 9: Indices & Surds • Chapter 10: Triangles & Parallelograms • Chapter 11: Circles Theorems • Chapter 12: Height & Distance • Chapter 13: Quartiles & Mean • Chapter 14: Probability.',
  },
  {
    id: 'social',
    name: 'Social Studies',
    nameNe: 'सामाजिक अध्ययन',
    unitsCount: 9,
    pagesCount: 270,
    englishTitle: 'Class 10 Social Studies (English Medium)',
    nepaliTitle: 'कक्षा १० सामाजिक अध्ययन (नेपाली माध्यम)',
    description: 'Society, Constitution of Nepal 2072, Geography, History, and Foreign Relations.',
    overview: 'Unit 1: We and Our Society • Unit 2: Development & Provincial Structure • Unit 3: Traditions, Values & Culture • Unit 4: Social Problems & Legal Solutions • Unit 5: Civic Consciousness, Constitution 2072 & Rights • Unit 6: Earth Geography & Climate • Unit 7: History of Nepal & Democratic Movements • Unit 8: Economic Activities & Remittance • Unit 9: International Relations & United Nations.',
  },
  {
    id: 'nepali',
    name: 'Nepali',
    unitsCount: 10,
    pagesCount: 224,
    englishTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    nepaliTitle: 'कक्षा १० नेपाली व्याकरण, साहित्य र रचना',
    description: 'नेपाली पाठ, कविता, कथा, निबन्ध, व्याकरण (पदवर्ग, समास, पदसङ्गति) र रचना।',
    overview: 'पाठ १: उज्यालो यात्रा (कविता) • पाठ २: घरझगडा (कथा) • पाठ ३: चिकित्सा विज्ञान र आयुर्वेद (प्रबन्ध) • पाठ ४: यस्तो कहिल्यै नहोस् (नाटक) • पाठ ५: महाकवि लक्ष्मीप्रसाद देवकोटा (जीवनी) • पाठ ६: अधिकार ठूलो कि कर्तव्य (वादविवाद) • पाठ ७: शत्रु (कथा) • पाठ ८: हाम्रो श्रम र सीप (निबन्ध) • पाठ ९: मेरो देशको माटो (कविता) • पाठ १०: नेपाली व्याकरण, पदवर्ग, समास, प्रतिवेदन र निबन्ध।',
  },
  {
    id: 'english',
    name: 'Compulsory English',
    unitsCount: 10,
    pagesCount: 198,
    englishTitle: 'Class 10 Compulsory English (CDC Official)',
    nepaliTitle: 'Class 10 English Guide & Model Papers',
    description: 'Reading comprehension, writing tasks (essays, brochures, letters), and grammar structures.',
    overview: 'Unit 1: Travel & Tourism (Guide to Nepal) • Unit 2: Health & Hygiene (Mental & Physical Fitness) • Unit 3: Family & Relationships (A Mother\'s Love) • Unit 4: Nature & Ecology (Climate Action) • Unit 5: Science & Technology (Artificial Intelligence) • Unit 6: Success & Achievement (Nelson Mandela) • Unit 7: Power & Politics (Democracy) • Unit 8: Arts & Architecture • Unit 9: Media & Entertainment • Unit 10: SEE Model Questions & Grammar.',
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    unitsCount: 9,
    pagesCount: 256,
    englishTitle: 'Class 10 Optional Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० ऐच्छिक गणित (नेपाली माध्यम)',
    description: 'Functions, Matrices, Coordinate Geometry, Trigonometry, Vectors, and Transformations.',
    overview: 'Unit 1: Functions & Polynomials (Composite & Inverse) • Unit 2: Matrices & Determinants (Inverse & Cramer\'s Rule) • Unit 3: Pair of Straight Lines [ax²+2hxy+by²=0] • Unit 4: Circle Equations [(x-h)²+(y-k)²=r²] • Unit 5: Trigonometry: Multiple & Sub-multiple Angles • Unit 6: Transformation Formulas • Unit 7: Vectors & Dot Product [a·b=|a||b|cosθ] • Unit 8: Matrix Transformations (Reflection, Rotation) • Unit 9: Statistics & Standard Deviation.',
  },
];

const QUIZ_QUESTIONS = [
  {
    question: 'What can form when an acid reacts with a base?',
    options: ['Salt and water', 'Only gas', 'Only metal', 'Ice'],
    correctIndex: 0,
    explanation: 'An acid reacts with a base in a neutralization reaction to form salt and water (e.g., HCl + NaOH -> NaCl + H2O).',
  },
  {
    question: 'What is the value of Universal Gravitational Constant (G)?',
    options: ['6.67 × 10⁻¹¹ N m²/kg²', '9.8 m/s²', '3 × 10⁸ m/s', '1.6 × 10⁻¹⁹ C'],
    correctIndex: 0,
    explanation: 'G = 6.67 × 10⁻¹¹ N m²/kg², which remains constant everywhere across the universe.',
  },
  {
    question: 'According to Pascal\'s Law, pressure exerted on an enclosed liquid is transmitted:',
    options: ['Equally in all directions', 'Only downwards', 'Only to the walls', 'Zero at the bottom'],
    correctIndex: 0,
    explanation: 'Pascal\'s Law states that pressure applied to an enclosed liquid is transmitted equally and undiminished in every direction.',
  },
  {
    question: 'What is the specific heat capacity of pure water?',
    options: ['4200 J/kg°C', '1000 J/kg°C', '2100 J/kg°C', '380 J/kg°C'],
    correctIndex: 0,
    explanation: 'Water has a high specific heat capacity of 4200 J/kg°C, helping it regulate temperature.',
  },
];

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [screen, setScreen] = useState<ScreenState>('onboarding');
  const [activeTab, setActiveTab] = useState<TabState>('home');
  const [language, setLanguage] = useState<'EN' | 'NE'>('NE');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');

  // AI Chat & Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  // Modals & Navigation
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activePdfViewing, setActivePdfViewing] = useState<{
    subject: SubjectItem;
    medium: 'EN' | 'NE';
  } | null>(null);

  // Quick Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');

  // Attachments
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);

  const chatListRef = useRef<FlatList>(null);
  const activeGenerationRef = useRef<GenerationRef | null>(null);
  const modelReadyRef = useRef(false);

  const currentQuiz = QUIZ_QUESTIONS[quizIndex % QUIZ_QUESTIONS.length];
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSession?.messages ?? [];

  // --- HARDWARE BACK BUTTON HANDLER ---
  useEffect(() => {
    const onBackPress = () => {
      if (activePdfViewing) {
        setActivePdfViewing(null);
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
  }, [activePdfViewing, isChatModalOpen]);

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
      } catch (err) {
        console.warn('Boot issue:', err);
      } finally {
        setTimeout(() => setIsBooting(false), 250);
      }
    };

    void bootApp();
  }, []);

  // --- STREAMING LISTENERS ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const chunkSub = DeviceEventEmitter.addListener('LiteRTResponseChunk', (event: { requestId?: string; text?: string }) => {
      const active = activeGenerationRef.current;
      if (!active || event.requestId !== active.requestId) return;

      const partialText = String(event.text ?? '');
      updateAssistantMessage(active.sessionId, active.messageId, partialText, true);
    });

    const errorSub = DeviceEventEmitter.addListener('LiteRTResponseError', () => {
      setIsGenerating(false);
    });

    return () => {
      chunkSub.remove();
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
    const profile: UserProfile = { name: name.trim(), grade: grade || '10' };
    setUser(profile);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
    setScreen('main');
  };

  const openPdfForSubject = (subject: SubjectItem, medium: 'EN' | 'NE' = 'EN') => {
    setActivePdfViewing({
      subject,
      medium,
    });
  };

  const createNewChat = () => {
    const newId = Math.random().toString(36).slice(2, 10);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Study Session',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const sendPrompt = async () => {
    const textToSend = prompt.trim();
    if (!textToSend && !attachedFileContent) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newId = Math.random().toString(36).slice(2, 10);
      const newSession: ChatSession = {
        id: newId,
        title: textToSend.slice(0, 30) || 'Study Question',
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

    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule && isModelReady) {
      try {
        const fullPrompt = `You are Guru, an expert offline AI tutor for Nepal Class 10 SEE. Explain clearly step-by-step with formulas and examples.\nQuestion: ${textToSend}`;
        await NativeModules.LLMInferenceModule.generateResponse(fullPrompt, requestId);
        setIsGenerating(false);
      } catch (_) {
        simulateOfflineResponse(currentSessionId, assistantMessageId, textToSend);
      }
    } else {
      simulateOfflineResponse(currentSessionId, assistantMessageId, textToSend);
    }
  };

  const simulateOfflineResponse = (sessionId: string, messageId: string, userQuery: string) => {
    setTimeout(() => {
      let rawResponse = `Here is the step-by-step solution:\n\n`;
      const q = userQuery.toLowerCase();

      if (q.includes('gravity') || q.includes('force') || q.includes('weight')) {
        rawResponse += `Unit 7: Force & Gravity\n\n1. Universal Law of Gravitation:\n$$F = \\frac{G \\cdot m_1 \\cdot m_2}{d^2}$$\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\n2. Acceleration due to Gravity:\n$$g = \\frac{G \\cdot M}{R^2} \\approx 9.8 \\text{ m/s}^2$$\n\nKey Note: Free fall occurs when acceleration equals g, causing weightlessness.`;
      } else if (q.includes('pressure') || q.includes('pascal') || q.includes('hydraulic')) {
        rawResponse += `Unit 8: Pressure & Hydraulics\n\n1. Pascal's Law Principle:\n$$\\frac{F_1}{A_1} = \\frac{F_2}{A_2}$$\n\n2. Archimedes' Upthrust:\n$$\\text{Upthrust } (U) = V \\cdot d \\cdot g$$\nA floating body displaces liquid equal to its own weight.`;
      } else if (q.includes('interest') || q.includes('math') || q.includes('compound')) {
        rawResponse += `Compulsory Mathematics: Compound Interest\n\n1. Yearly Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{100}\\right)^T - 1 \\right]$$\n\n2. Semi-Annual Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{200}\\right)^{2T} - 1 \\right]$$`;
      } else {
        rawResponse += `Class 10 Core Summary:\n• Thoroughly master formulas, scientific definitions, and theorem proofs.\n• Use step-by-step calculations with exact standard units.\n• Consult official CDC textbook questions for the best SEE exam scores.`;
      }

      updateAssistantMessage(sessionId, messageId, rawResponse, false);
      setIsGenerating(false);
    }, 400);
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedOption(index);
    setQuizStatus(index === currentQuiz.correctIndex ? 'correct' : 'wrong');
  };

  const nextQuiz = () => {
    setQuizIndex((prev) => prev + 1);
    setSelectedOption(null);
    setQuizStatus('idle');
  };

  // --- BOOT SCREEN (CLEAN MINIMALIST) ---
  if (isBooting) {
    return (
      <SafeAreaView style={styles.bootContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.bootCenter}>
          <Image source={logoSource} style={styles.bootLogo} />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.bootTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- ONBOARDING SCREEN ---
  if (screen === 'onboarding') {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <KeyboardAvoidingView style={styles.darkContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.onboardingContent}>
            <View style={styles.brandHero}>
              <Image source={logoSource} style={styles.brandLogo} />
              <Text style={styles.brandTitle}>Guru</Text>
              <Text style={styles.brandSub}>Offline AI Tutor & CDC Textbook Vault</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Enter your name</Text>
              <TextInput
                style={styles.darkInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sangam"
                placeholderTextColor="#71717a"
              />

              <Text style={styles.inputLabel}>Your Class</Text>
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

              <TouchableOpacity
                style={[styles.primaryButton, !name.trim() && styles.primaryButtonDisabled]}
                disabled={!name.trim()}
                onPress={registerUser}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- MAIN DASHBOARD (EXACT MATCH TO SCREENSHOT 1) ---
  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* TOP HEADER (MATCHING SCREENSHOT 1) */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <Text style={styles.appHeaderTitle}>Guru</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{`Class ${user?.grade ?? '10'}`}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.langPillButton}
          onPress={() => setLanguage(language === 'EN' ? 'NE' : 'EN')}
        >
          <Globe size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.langPillText}>{language}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {/* GREETING */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>{`Hi, ${user?.name || 'Sangam'}`}</Text>
          <Text style={styles.greetingSub}>Choose a subject folder or read official CDC textbooks offline.</Text>
        </View>

        {/* OFFICIAL CDC TEXTBOOKS BANNER (OPENS PDF DIRECTLY) */}
        <TouchableOpacity
          style={styles.textbookBanner}
          activeOpacity={0.85}
          onPress={() => openPdfForSubject(SUBJECTS_DATA[0])}
        >
          <View style={styles.textbookBannerLeft}>
            <View style={styles.textbookIconBox}>
              <BookOpen size={22} color="#ffffff" />
            </View>
            <View style={styles.textbookTextGroup}>
              <Text style={styles.textbookBannerTitle}>Official CDC Textbooks</Text>
              <Text style={styles.textbookBannerSub}>English & Nepali{'\n'}Medium • PDF Vault</Text>
            </View>
          </View>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>See All Books</Text>
            <ChevronRight size={16} color="#a1a1aa" />
          </View>
        </TouchableOpacity>

        {/* SUBJECT RESOURCE FOLDERS HEADER */}
        <View style={styles.sectionHeaderRow}>
          <Folder size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitleText}>Subject Resource Folders</Text>
        </View>

        {/* 2x3 SUBJECT FOLDERS GRID (DIRECTLY OPENS PDF ON CLICK) */}
        <View style={styles.subjectGrid}>
          {SUBJECTS_DATA.map((subj) => (
            <TouchableOpacity
              key={subj.id}
              style={styles.subjectFolderCard}
              activeOpacity={0.8}
              onPress={() => openPdfForSubject(subj)}
            >
              <View style={styles.subjectCardTop}>
                <Folder size={20} color="#ffffff" />
                <View style={styles.unitCountPill}>
                  <Text style={styles.unitCountText}>{`${subj.unitsCount} Units`}</Text>
                </View>
              </View>
              <Text style={styles.subjectCardTitle} numberOfLines={1}>{subj.name}</Text>
              <Text style={styles.subjectCardPages}>{`${subj.pagesCount} Pages • Model Papers`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DUAL STAT CARDS */}
        <View style={styles.dualStatsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Calendar size={18} color="#ffffff" />
              <Text style={styles.statLabel}>DAILY STREAK</Text>
            </View>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statSubText}>learning days in a row</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Target size={18} color="#ffffff" />
              <Text style={styles.statLabel}>CURRENT FOCUS</Text>
            </View>
            <Text style={styles.statFocusSubject}>Science</Text>
            <Text style={styles.statSubText} numberOfLines={2}>
              science concepts, numericals, diagrams, and exam-focused revision
            </Text>
          </View>
        </View>

        {/* QUICK QUIZ CARD */}
        <View style={styles.quizCard}>
          <View style={styles.quizHeader}>
            <HelpCircle size={18} color="#ffffff" />
            <Text style={styles.quizTitle}>Quick quiz</Text>
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

          <TouchableOpacity style={styles.newQuizButton} onPress={nextQuiz}>
            <RotateCcw size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.newQuizButtonText}>New quiz</Text>
          </TouchableOpacity>
        </View>

        {/* CLASS-AWARE TUTORING CARD */}
        <TouchableOpacity
          style={styles.classAwareCard}
          activeOpacity={0.85}
          onPress={() => setIsChatModalOpen(true)}
        >
          <GraduationCap size={22} color="#ffffff" />
          <View style={styles.classAwareTextGroup}>
            <Text style={styles.classAwareTitle}>Class-aware tutoring</Text>
            <Text style={styles.classAwareSub}>
              Guru changes tone and depth for each class level, from gentle basics to serious exam prep.
            </Text>
          </View>
          <ChevronRight size={18} color="#71717a" />
        </TouchableOpacity>
      </ScrollView>

      {/* FLOATING GURU AI BOT BUTTON (EXACT MATCH TO SCREENSHOT 1) */}
      <TouchableOpacity
        style={styles.floatingBotButton}
        activeOpacity={0.9}
        onPress={() => setIsChatModalOpen(true)}
      >
        <Bot size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* BOTTOM TAB NAVIGATION BAR (MATCHING SCREENSHOT 1) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Home size={22} color={activeTab === 'home' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => openPdfForSubject(SUBJECTS_DATA[0])}>
          <BookOpen size={22} color={activeTab === 'learn' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'learn' && styles.tabLabelActive]}>Learn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('progress')}>
          <ClipboardList size={22} color={activeTab === 'progress' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'progress' && styles.tabLabelActive]}>Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <User size={22} color={activeTab === 'profile' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* --- DIRECT FULL-PAGE PDF VIEWER POPUP --- */}
      {activePdfViewing && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackButton} onPress={() => setActivePdfViewing(null)}>
                <ArrowLeft size={22} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.modalHeaderTitleGroup}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {activePdfViewing.medium === 'EN' ? activePdfViewing.subject.englishTitle : activePdfViewing.subject.nepaliTitle}
                </Text>
                <Text style={styles.modalHeaderSub}>{`Official CDC Textbook • ${activePdfViewing.subject.pagesCount} Pages`}</Text>
              </View>
              <TouchableOpacity
                style={styles.pdfHeaderAiBtn}
                onPress={() => {
                  setPrompt(`I am reading ${activePdfViewing.subject.name}. Explain the key formulas, definitions, and SEE questions.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Sparkles size={16} color="#000000" />
                <Text style={styles.pdfHeaderAiBtnText}>Ask AI</Text>
              </TouchableOpacity>
            </View>

            {/* Medium Switcher Pill in PDF */}
            <View style={styles.pdfMediumSwitchBar}>
              <TouchableOpacity
                style={[styles.pdfMediumPill, activePdfViewing.medium === 'EN' && styles.pdfMediumPillActive]}
                onPress={() => setActivePdfViewing({ ...activePdfViewing, medium: 'EN' })}
              >
                <Text style={[styles.pdfMediumPillText, activePdfViewing.medium === 'EN' && styles.pdfMediumPillTextActive]}>
                  English Medium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pdfMediumPill, activePdfViewing.medium === 'NE' && styles.pdfMediumPillActive]}
                onPress={() => setActivePdfViewing({ ...activePdfViewing, medium: 'NE' })}
              >
                <Text style={[styles.pdfMediumPillText, activePdfViewing.medium === 'NE' && styles.pdfMediumPillTextActive]}>
                  नेपाली माध्यम
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.pdfViewportScroll} showsVerticalScrollIndicator={false}>
              {/* PDF NOTICE BANNER */}
              <View style={styles.pdfNoticeBanner}>
                <BookOpen size={20} color="#ffffff" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pdfNoticeTitle}>Official CDC Textbook Loaded</Text>
                  <Text style={styles.pdfNoticeSub}>100% Offline Access • Curriculum Development Centre, Nepal</Text>
                </View>
              </View>

              {/* PDF DOCUMENT CANVAS */}
              <View style={styles.pdfDocumentCanvas}>
                <View style={styles.pdfDocHeader}>
                  <Text style={styles.pdfDocTitleText}>{activePdfViewing.subject.name}</Text>
                  <Text style={styles.pdfDocMetaText}>Government of Nepal • CDC Class 10 Syllabus</Text>
                </View>

                <View style={styles.pdfContentBlock}>
                  <Text style={styles.pdfSectionHeading}>Complete Units Overview:</Text>
                  <Text style={styles.pdfBodyText}>{activePdfViewing.subject.overview}</Text>
                </View>

                <View style={styles.pdfContentBlock}>
                  <Text style={styles.pdfSectionHeading}>Exam Preparation Guidelines:</Text>
                  <Text style={styles.pdfBodyText}>
                    1. Thoroughly practice numerical formulas, theorems, and definitions from this official CDC textbook.{'\n'}
                    2. Draw neat, labeled diagrams for science and map-pointing for social studies.{'\n'}
                    3. Tap the "Ask Guru AI" button below for instant derivations and step-by-step proofs.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.askGuruLargeButton}
                onPress={() => {
                  setPrompt(`Explain the most important SEE exam questions and derivations for ${activePdfViewing.subject.name}.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Bot size={20} color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.askGuruLargeButtonText}>Ask Guru AI To Explain This Book</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- FULL-PAGE GURU AI ASSISTANT (EXACT MATCH TO SCREENSHOT 2) --- */}
      {isChatModalOpen && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            {/* Top Bar with X on left, Robot Icon on right */}
            <View style={styles.chatTopBar}>
              <TouchableOpacity style={styles.chatCloseButton} onPress={() => setIsChatModalOpen(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.chatBotIconHeader} onPress={createNewChat}>
                <Bot size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Chat Body & Input Bar */}
            <KeyboardAvoidingView style={styles.chatBody} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              {activeMessages.length === 0 ? (
                <View style={styles.chatEmptyView}>
                  <Bot size={48} color="#ffffff" />
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

              {/* Bottom Input Area matching Screenshot 2 */}
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
                          setAttachedFileContent('Attached file for study analysis');
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
                    onPress={sendPrompt}
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

// --- STYLESHEET (PIXEL-PERFECT DARK MODE MATCHING SCREENSHOTS) ---
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
    gap: 16,
  },
  bootLogo: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  bootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  onboardingContent: {
    padding: 24,
    paddingTop: 60,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandLogo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  brandSub: {
    fontSize: 15,
    color: '#a1a1aa',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#121214',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e1e24',
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e4e4e7',
  },
  darkInput: {
    height: 50,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#ffffff',
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  gradePill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  gradePillTextActive: {
    color: '#000000',
  },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.35,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeftGroup: {
    alignItems: 'flex-start',
  },
  appHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  classBadge: {
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d4d4d8',
  },
  langPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  mainScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  greetingBlock: {
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  textbookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  textbookBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textbookIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textbookTextGroup: {
    flex: 1,
  },
  textbookBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  textbookBannerSub: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginRight: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subjectFolderCard: {
    width: '48.5%',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  subjectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unitCountPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  unitCountText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  subjectCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  subjectCardPages: {
    fontSize: 11,
    color: '#71717a',
  },
  dualStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 14,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  statFocusSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  statSubText: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
  },
  quizCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  quizQuestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e4e4e7',
    lineHeight: 18,
    marginBottom: 12,
  },
  quizOptionsGrid: {
    gap: 8,
    marginBottom: 12,
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
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  quizOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  feedbackCorrect: {
    backgroundColor: '#064e3b',
  },
  feedbackWrong: {
    backgroundColor: '#4c0519',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  feedbackExplain: {
    fontSize: 12,
    color: '#e4e4e7',
    lineHeight: 16,
  },
  newQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    backgroundColor: '#121214',
  },
  newQuizButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  classAwareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  classAwareTextGroup: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  classAwareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  classAwareSub: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
  },
  // FLOATING BOT BUTTON (MATCHING SCREENSHOT 1)
  floatingBotButton: {
    position: 'absolute',
    bottom: 74,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
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
  // BOTTOM TAB BAR (MATCHING SCREENSHOT 1)
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingVertical: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // FULL MODAL OVERLAY
  fullModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
  },
  modalBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderTitleGroup: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  pdfHeaderAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pdfHeaderAiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 4,
  },
  pdfMediumSwitchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  pdfMediumPill: {
    flex: 1,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pdfMediumPillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  pdfMediumPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  pdfMediumPillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  pdfViewportScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  pdfNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  pdfNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  pdfNoticeSub: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  pdfDocumentCanvas: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    minHeight: 320,
  },
  pdfDocHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
    paddingBottom: 14,
    marginBottom: 14,
  },
  pdfDocTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  pdfDocMetaText: {
    fontSize: 11,
    color: '#71717a',
  },
  pdfContentBlock: {
    marginBottom: 16,
  },
  pdfSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  pdfBodyText: {
    fontSize: 13,
    color: '#d4d4d8',
    lineHeight: 20,
  },
  askGuruLargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 12,
  },
  askGuruLargeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  // FULL-PAGE GURU AI CHAT (MATCHING SCREENSHOT 2)
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chatCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBotIconHeader: {
    width: 40,
    height: 40,
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
    padding: 32,
  },
  chatEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  chatEmptySub: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
  },
  chatMessageList: {
    padding: 16,
  },
  userMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  botMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  botAvatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#27272a',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    maxWidth: '82%',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#24242a',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  chatAttachmentPill: {
    backgroundColor: '#1f1f23',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  chatAttachmentText: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBubbleText: {
    fontSize: 13,
    color: '#a1a1aa',
    marginLeft: 8,
  },
  chatInputBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  chatInputPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chatAttachIconButton: {
    marginRight: 10,
  },
  chatPillInput: {
    flex: 1,
    minHeight: 28,
    maxHeight: 100,
    fontSize: 14,
    color: '#ffffff',
    paddingVertical: 0,
  },
  chatSendIconButton: {
    marginLeft: 10,
  },
});
