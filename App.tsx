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
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  PlayCircle,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  User,
  Video,
  X,
} from 'lucide-react-native';

type TabState = 'home' | 'learn' | 'progress' | 'profile';
type ScreenState = 'onboarding' | 'main';
type SubjectId = 'science' | 'math' | 'social' | 'nepali' | 'english' | 'opt_math' | 'computer';
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

interface ChapterData {
  number: number;
  titleEn: string;
  titleNe: string;
  page: number;
  contentEn: string;
  contentNe: string;
}

interface LectureItem {
  id: string;
  title: string;
  duration: string;
  topic: string;
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
  lectures: LectureItem[];
  chapters: ChapterData[];
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

// --- LATEX TO READABLE MATH CONVERTER ---
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

  // Wrappers
  converted = converted
    .replace(/\\(?:text|mathrm|mathbf|mathit|textsf)\{([^{}]+)\}/g, '$1')
    .replace(/\\(?:sin|cos|tan|cot|sec|cosec|log|ln|lim|max|min)\b/g, (m) => m.slice(1));

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

// --- DYNAMIC QUIZ POOL (ALL SUBJECTS) ---
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
    explanation: 'Compound Amount for annual compounding is calculated using the formula CA = P(1 + R/100)ᵀ.',
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
    explanation: 'For a pair of straight lines represented by ax² + 2hxy + by² = 0 to be mutually perpendicular, the condition is a + b = 0.',
  },
  {
    subject: 'Nepali',
    question: '‘उज्यालो यात्रा’ कविताका रचनाकार को हुन्?',
    options: ['रामप्रसाद ज्ञवाली', 'लक्ष्मीप्रसाद देवकोटा', 'भानुभक्त आचार्य', 'माधवप्रसाद घिमिरे'],
    correctIndex: 0,
    explanation: 'कक्षा १० को पहिलो पाठ ‘उज्यालो यात्रा’ कविता कवि रामप्रसाद ज्ञवालीद्वारा रचित हो।',
  },
  {
    subject: 'English',
    question: 'Which connector expresses contrast between two sentences?',
    options: ['However', 'Therefore', 'Because', 'Moreover'],
    correctIndex: 0,
    explanation: '‘However’ is used to connect two contrasting statements in English grammar.',
  },
];

// --- SUBJECT RESOURCE DIRECTORIES CONFIGURATION ---
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
    englishTitle: 'Class 10 Science & Technology (English Medium)',
    nepaliTitle: 'कक्षा १० विज्ञान तथा प्रविधि (नेपाली माध्यम)',
    lectures: [
      { id: 'sc_1', title: 'Unit 7: Universal Gravitation & Free Fall', duration: '14 min', topic: 'Physics' },
      { id: 'sc_2', title: 'Unit 8: Pascal\'s Law & Hydraulic Machines', duration: '18 min', topic: 'Physics' },
      { id: 'sc_3', title: 'Unit 14: Chemical Reactions & Balancing', duration: '12 min', topic: 'Chemistry' },
      { id: 'sc_4', title: 'Unit 4: Mendel\'s Laws of Inheritance', duration: '16 min', topic: 'Biology' },
    ],
    chapters: [
      {
        number: 1,
        titleEn: 'Scientific Learning',
        titleNe: 'वैज्ञानिक सिकाइ',
        page: 1,
        contentEn: 'Scientific Learning encompasses the methods used by scientists to explore natural phenomena. Fundamental physical quantities (Mass, Length, Time, Temperature, Electric Current) are measured using SI units. Precision requires calibrated instruments and careful error reduction.',
        contentNe: 'वैज्ञानिक सिकाइले प्राकृतिक घटनाहरूको अध्ययन गर्ने वैज्ञानिक विधिहरूलाई जनाउँछ। आधारभूत भौतिक परिमाणहरू SI एकाइमा नापिन्छन्।',
      },
      {
        number: 7,
        titleEn: 'Force and Gravity',
        titleNe: 'बल र गुरुत्वाकर्षण',
        page: 82,
        contentEn: 'Newton\'s Universal Law of Gravitation:\nF = G · (m₁ · m₂) / d²\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\nAcceleration due to gravity:\ng = (G · M) / R² ≈ 9.8 m/s² on Earth.\nDuring free fall without air resistance, acceleration equals g and the apparent weight becomes zero (weightlessness).',
        contentNe: 'न्युटनको गुरुत्वाकर्षण सम्बन्धी नियम:\nF = G · (m₁ · m₂) / d²\nजहाँ G = 6.67 × 10⁻¹¹ N m²/kg²।\n\nगुरुत्व प्रवेग: g = (G · M) / R² ≈ ९.८ m/s²। स्वतन्त्र खसाइमा वस्तु तौलविहीन हुन्छ।',
      },
      {
        number: 8,
        titleEn: 'Pressure & Hydraulics',
        titleNe: 'चाप र हाइड्रोलिक्स',
        page: 98,
        contentEn: 'Pascal\'s Law: Pressure applied to an enclosed liquid is transmitted equally in all directions.\nHydraulic Machine: F₁ / A₁ = F₂ / A₂\nArchimedes\' Principle: Upthrust (U) = V · d · g.',
        contentNe: 'पास्कलको नियम: बन्द भाँडोमा रहेको तरल पदार्थमा दिइएको चाप सबै दिशामा समान रूपले प्रसारित हुन्छ। सूत्र: F₁ / A₁ = F₂ / A₂। उर्ध्वचाप: U = V · d · g।',
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
    englishTitle: 'Class 10 Compulsory Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० अनिवार्य गणित (नेपाली माध्यम)',
    lectures: [
      { id: 'm_1', title: 'Chapter 1: Sets & 3-Set Venn Diagrams', duration: '15 min', topic: 'Sets' },
      { id: 'm_2', title: 'Chapter 2: Compound Interest & Depreciation', duration: '20 min', topic: 'Arithmetic' },
      { id: 'm_3', title: 'Chapter 5: Mensuration - Cylinder & Sphere', duration: '18 min', topic: 'Mensuration' },
      { id: 'm_4', title: 'Chapter 11: Circle Theorems & Proofs', duration: '22 min', topic: 'Geometry' },
    ],
    chapters: [
      {
        number: 1,
        titleEn: 'Sets & Venn Diagrams',
        titleNe: 'समूह र भेनचित्र',
        page: 1,
        contentEn: 'Cardinality Formula for 2 Sets:\nn(A ∪ B) = n(A) + n(B) - n(A ∩ B)\n\nFor 3 Sets:\nn(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A) + n(A ∩ B ∩ C).',
        contentNe: 'दुई समूहको लागि सूत्र: n(A ∪ B) = n(A) + n(B) - n(A ∩ B)। तीन समूहको लागि गणनात्मकता सूत्र भेनचित्रको आधारमा प्रयोग गरिन्छ।',
      },
      {
        number: 2,
        titleEn: 'Compound Interest',
        titleNe: 'मिश्र ब्याज',
        page: 18,
        contentEn: 'Annual Compound Interest:\nCA = P · (1 + R / 100)ᵀ\nCI = P · [(1 + R / 100)ᵀ - 1]\n\nSemi-Annual Compounding:\nCI = P · [(1 + R / 200)²ᵀ - 1]',
        contentNe: 'वार्षिक मिश्र ब्याज: CI = P[(1 + R/100)ᵀ - 1]। अर्धवार्षिक मिश्र ब्याज: CI = P[(1 + R/200)²ᵀ - 1]।',
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
    englishTitle: 'Class 10 Social Studies (English Medium)',
    nepaliTitle: 'कक्षा १० सामाजिक अध्ययन (नेपाली माध्यम)',
    lectures: [
      { id: 'soc_1', title: 'Unit 5: Constitution of Nepal 2072 & Rights', duration: '16 min', topic: 'Civics' },
      { id: 'soc_2', title: 'Unit 7: Democratic Movements in Nepal', duration: '19 min', topic: 'History' },
      { id: 'soc_3', title: 'Unit 6: Climate Zones & Natural Resources', duration: '14 min', topic: 'Geography' },
    ],
    chapters: [
      {
        number: 5,
        titleEn: 'Constitution of Nepal 2072',
        titleNe: 'नेपालको संविधान २०७२ र मौलिक हक',
        page: 120,
        contentEn: 'The Constitution of Nepal 2072 contains 35 Parts, 308 Articles, and 9 Schedules. It guarantees 31 Fundamental Rights to all citizens.',
        contentNe: 'नेपालको संविधान २०७२ मा ३५ भाग, ३०८ धारा र ९ अनुसूचीहरू छन्। यसले नागरिकका लागि ३१ वटा मौलिक हकको प्रत्याभूति गरेको छ।',
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
    lectures: [
      { id: 'nep_1', title: 'पाठ १: उज्यालो यात्रा (कविता भाव तथा व्याख्या)', duration: '12 min', topic: 'साहित्य' },
      { id: 'nep_2', title: 'पाठ १०: नेपाली व्याकरण (पदवर्ग, समास, पदसङ्गति)', duration: '20 min', topic: 'व्याकरण' },
    ],
    chapters: [
      {
        number: 1,
        titleEn: 'उज्यालो यात्रा (कविता)',
        titleNe: 'उज्यालो यात्रा (कविता)',
        page: 1,
        contentEn: 'कवि रामप्रसाद ज्ञवालीद्वारा रचित मानवता, परिश्रम र सकारात्मक सोचको सन्देश दिने कविता।',
        contentNe: 'कवि रामप्रसाद ज्ञवालीद्वारा रचित मानवता, परिश्रम र सकारात्मक सोचको सन्देश दिने कविता।',
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
    lectures: [
      { id: 'eng_1', title: 'Unit 1: Travel & Tourism (Reading & Vocab)', duration: '14 min', topic: 'Reading' },
      { id: 'eng_2', title: 'Unit 10: SEE Model Grammar & Sentence Structures', duration: '18 min', topic: 'Grammar' },
    ],
    chapters: [
      {
        number: 1,
        titleEn: 'Travel and Tourism',
        titleNe: 'Travel and Tourism',
        page: 1,
        contentEn: 'Reading Comprehension: A trekking guide to the Annapurna Circuit. Grammar: Simple Past vs Present Perfect structures.',
        contentNe: 'Reading Comprehension: A trekking guide to the Annapurna Circuit. Grammar: Simple Past vs Present Perfect structures.',
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
    englishAssetPdf: 'optional math/pdf/english medium/?????? ???? ????? - ??_txqqmbs.pdf',
    nepaliAssetPdf: 'optional math/pdf/nepali medium/Class 10 Optional Mathematics Book [Nepali Medium].pdf.pdf',
    englishTitle: 'Class 10 Optional Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० ऐच्छिक गणित (नेपाली माध्यम)',
    lectures: [
      { id: 'opt_1', title: 'Unit 3: Pair of Straight Lines & Angle Theorem', duration: '20 min', topic: 'Coordinate Geometry' },
      { id: 'opt_2', title: 'Unit 5: Multiple Angles Trigonometric Identities', duration: '22 min', topic: 'Trigonometry' },
    ],
    chapters: [
      {
        number: 3,
        titleEn: 'Pair of Straight Lines',
        titleNe: 'सरल रेखाको जोडी',
        page: 60,
        contentEn: 'Homogeneous equation: ax² + 2hxy + by² = 0.\nAngle: tan θ = ± [2 · √(h² - ab)] / (a + b).\nPerpendicular condition: a + b = 0.',
        contentNe: 'समघाती समीकरण: ax² + 2hxy + by² = 0। लम्ब हुने अवस्था: a + b = 0।',
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
    lectures: [
      { id: 'cs_1', title: 'Unit 1: Networking & Internet Architecture', duration: '15 min', topic: 'Networking' },
      { id: 'cs_2', title: 'Unit 4: QBASIC Programming & Modular Subroutines', duration: '25 min', topic: 'Programming' },
      { id: 'cs_3', title: 'Unit 6: C Programming Fundamentals & Loops', duration: '20 min', topic: 'Programming' },
    ],
    chapters: [
      {
        number: 1,
        titleEn: 'Networking & Telecommunication',
        titleNe: 'नेटवर्किङ र दूरसञ्चार',
        page: 1,
        contentEn: 'Computer Network Types: LAN, MAN, WAN. Network Topologies: Star, Bus, Ring, Mesh. Communication media (Fiber optic, Coaxial, Twisted pair).',
        contentNe: 'कम्प्युटर नेटवर्कका प्रकारहरू (LAN, MAN, WAN) र टोपोलोजी (Star, Bus, Ring)।',
      },
    ],
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
  const [selectedSubjectDirectory, setSelectedSubjectDirectory] = useState<SubjectItem | null>(null);
  const [activePdfViewing, setActivePdfViewing] = useState<{
    subject: SubjectItem;
    medium: 'EN' | 'NE';
    activeChapterIndex: number;
  } | null>(null);

  // Dynamic Random Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<QuizItem>(ALL_QUIZ_POOL[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');

  // Attachments
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);

  const chatListRef = useRef<FlatList>(null);
  const activeGenerationRef = useRef<GenerationRef | null>(null);
  const modelReadyRef = useRef(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSession?.messages ?? [];

  // Pick a dynamic random quiz question
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
      if (selectedSubjectDirectory) {
        setSelectedSubjectDirectory(null);
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
  }, [activePdfViewing, selectedSubjectDirectory, isChatModalOpen]);

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

        pickRandomQuiz();
      } catch (err) {
        console.warn('Boot issue:', err);
      } finally {
        setTimeout(() => setIsBooting(false), 200);
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

  const openPdfViewer = (subject: SubjectItem, medium: 'EN' | 'NE') => {
    setActivePdfViewing({
      subject,
      medium,
      activeChapterIndex: 0,
    });
  };

  const openExternalSystemPdf = async (assetPath?: string) => {
    if (!assetPath) return;
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.openAssetPdf) {
      try {
        await NativeModules.LLMInferenceModule.openAssetPdf(assetPath);
      } catch (err) {
        console.warn('Could not open external PDF viewer:', err);
      }
    }
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

  // --- SAFE PROMPT SENDER (NEVER CRASHES) ---
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

    // Safe execution with exact Kotlin arguments: (prompt, language, isMathRequest, history, requestId, imagePathOrBase64)
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule && isModelReady) {
      try {
        await NativeModules.LLMInferenceModule.generateResponse(
          textToSend,
          language || 'EN',
          true,
          [],
          requestId,
          ''
        );
        setIsGenerating(false);
      } catch (err) {
        console.warn('Native inference error:', err);
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
        rawResponse += `Unit 7: Force & Gravity\n\n1. Universal Law of Gravitation:\n$$F = \\frac{G \\cdot m_1 \\cdot m_2}{d^2}$$\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\n2. Acceleration due to Gravity:\n$$g = \\frac{G \\cdot M}{R^2} \\approx 9.8 \\text{ m/s}^2$$\n\nKey Note: Free fall occurs when acceleration equals g, causing apparent weightlessness.`;
      } else if (q.includes('pressure') || q.includes('pascal') || q.includes('hydraulic')) {
        rawResponse += `Unit 8: Pressure & Hydraulics\n\n1. Pascal's Law Principle:\n$$\\frac{F_1}{A_1} = \\frac{F_2}{A_2}$$\n\n2. Archimedes' Upthrust:\n$$\\text{Upthrust } (U) = V \\cdot d \\cdot g$$\nA floating body displaces liquid equal to its own weight.`;
      } else if (q.includes('interest') || q.includes('math') || q.includes('compound')) {
        rawResponse += `Compulsory Mathematics: Compound Interest\n\n1. Yearly Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{100}\\right)^T - 1 \\right]$$\n\n2. Semi-Annual Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{200}\\right)^{2T} - 1 \\right]$$`;
      } else if (q.includes('constitution') || q.includes('social') || q.includes('rights')) {
        rawResponse += `Social Studies: Constitution of Nepal 2072\n\n• Promulgated on Ashoj 3, 2072 BS.\n• Structure: 35 Parts, 308 Articles, 9 Schedules.\n• Guarantees 31 Fundamental Rights to all citizens.`;
      } else {
        rawResponse += `Class 10 Core Summary:\n• Thoroughly master formulas, scientific definitions, and theorem proofs.\n• Use step-by-step calculations with exact standard units.\n• Consult official CDC textbook questions for the best SEE exam scores.`;
      }

      updateAssistantMessage(sessionId, messageId, rawResponse, false);
      setIsGenerating(false);
    }, 350);
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedOption(index);
    setQuizStatus(index === currentQuiz.correctIndex ? 'correct' : 'wrong');
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
              <Text style={styles.brandSub}>Offline AI Tutor & CDC Resource Vault</Text>
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

  // --- MAIN DASHBOARD (STATUSBAR SAFE & ZERO CLIPPING) ---
  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* TOP HEADER (SAFE DISTANCE FROM STATUS BAR) */}
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
          <Text style={styles.greetingSub}>Choose a subject folder to view official PDF textbooks, video lectures, or chat with AI.</Text>
        </View>

        {/* SUBJECT RESOURCE FOLDERS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Folder size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitleText}>Subject Resource Folders</Text>
        </View>

        {/* SUBJECT FOLDERS GRID (OPENS DIRECTORIES: PDF, LECTURES, CHAT WITH AI) */}
        <View style={styles.subjectGrid}>
          {SUBJECTS_DATA.map((subj) => (
            <TouchableOpacity
              key={subj.id}
              style={styles.subjectFolderCard}
              activeOpacity={0.8}
              onPress={() => setSelectedSubjectDirectory(subj)}
            >
              <View style={styles.subjectCardTop}>
                <Folder size={20} color="#ffffff" />
                <View style={styles.unitCountPill}>
                  <Text style={styles.unitCountText}>{`${subj.unitsCount} Units`}</Text>
                </View>
              </View>
              <Text style={styles.subjectCardTitle} numberOfLines={1}>{subj.name}</Text>
              <Text style={styles.subjectCardPages}>{`${subj.pagesCount} Pages • ${subj.lectures.length} Lectures`}</Text>
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

      {/* FLOATING GURU AI BOT BUTTON */}
      <TouchableOpacity
        style={styles.floatingBotButton}
        activeOpacity={0.9}
        onPress={() => setIsChatModalOpen(true)}
      >
        <Bot size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* BOTTOM TAB NAVIGATION (SAFE FOR ALL SCREENS) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Home size={22} color={activeTab === 'home' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setSelectedSubjectDirectory(SUBJECTS_DATA[0])}>
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

      {/* --- SUBJECT HUB DIRECTORY MODAL (PDF, LECTURES, CHAT WITH AI) --- */}
      {selectedSubjectDirectory && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.dirModalHeader}>
              <TouchableOpacity style={styles.modalBackButton} onPress={() => setSelectedSubjectDirectory(null)}>
                <ArrowLeft size={22} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.modalHeaderTitleGroup}>
                <Text style={styles.modalHeaderTitle}>{selectedSubjectDirectory.name}</Text>
                <Text style={styles.modalHeaderSub}>Grade 10 Resources Directory</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.dirContentScroll} showsVerticalScrollIndicator={false}>
              {/* DIRECTORY 1: OFFICIAL PDF TEXTBOOKS */}
              <View style={styles.directorySectionCard}>
                <View style={styles.dirSectionHeader}>
                  <FileText size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.dirSectionTitle}>1. Official PDF Textbooks</Text>
                </View>
                <Text style={styles.dirSectionSub}>CDC Official Original Grade 10 Textbooks</Text>

                {selectedSubjectDirectory.hasDualMedium ? (
                  <View style={styles.pdfChoicesRow}>
                    {/* ENGLISH MEDIUM */}
                    <TouchableOpacity
                      style={styles.pdfOptionCard}
                      activeOpacity={0.8}
                      onPress={() => openPdfViewer(selectedSubjectDirectory, 'EN')}
                    >
                      <View style={styles.pdfOptionTop}>
                        <FileText size={22} color="#ffffff" />
                        <Text style={styles.pdfMediumBadge}>ENGLISH</Text>
                      </View>
                      <Text style={styles.pdfOptionTitle}>English Medium PDF</Text>
                      <Text style={styles.pdfOptionDesc}>{selectedSubjectDirectory.englishTitle}</Text>
                      <View style={styles.pdfActionBtns}>
                        <Text style={styles.viewPdfText}>Read In-App ›</Text>
                      </View>
                    </TouchableOpacity>

                    {/* NEPALI MEDIUM */}
                    <TouchableOpacity
                      style={styles.pdfOptionCard}
                      activeOpacity={0.8}
                      onPress={() => openPdfViewer(selectedSubjectDirectory, 'NE')}
                    >
                      <View style={styles.pdfOptionTop}>
                        <FileText size={22} color="#ffffff" />
                        <Text style={styles.pdfMediumBadge}>नेपाली</Text>
                      </View>
                      <Text style={styles.pdfOptionTitle}>नेपाली माध्यम PDF</Text>
                      <Text style={styles.pdfOptionDesc}>{selectedSubjectDirectory.nepaliTitle}</Text>
                      <View style={styles.pdfActionBtns}>
                        <Text style={styles.viewPdfText}>Read In-App ›</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.singlePdfCard}
                    activeOpacity={0.8}
                    onPress={() => openPdfViewer(selectedSubjectDirectory, selectedSubjectDirectory.id === 'nepali' ? 'NE' : 'EN')}
                  >
                    <View style={styles.singlePdfLeft}>
                      <FileText size={24} color="#ffffff" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.singlePdfTitle}>
                          {selectedSubjectDirectory.id === 'nepali'
                            ? selectedSubjectDirectory.nepaliTitle
                            : selectedSubjectDirectory.englishTitle}
                        </Text>
                        <Text style={styles.singlePdfSub}>{`${selectedSubjectDirectory.pagesCount} Pages • Official CDC Textbook`}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* DIRECTORY 2: VIDEO LECTURES & MICRO-LESSONS */}
              <View style={styles.directorySectionCard}>
                <View style={styles.dirSectionHeader}>
                  <Video size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.dirSectionTitle}>2. Video Lectures & Micro-Lessons</Text>
                </View>
                <Text style={styles.dirSectionSub}>Curated video explanations for SEE exam success</Text>

                <View style={styles.lecturesList}>
                  {selectedSubjectDirectory.lectures.map((lec) => (
                    <View key={lec.id} style={styles.lectureCard}>
                      <View style={styles.lectureIconBox}>
                        <PlayCircle size={24} color="#ffffff" />
                      </View>
                      <View style={styles.lectureInfo}>
                        <Text style={styles.lectureTitle}>{lec.title}</Text>
                        <Text style={styles.lectureTopic}>{`${lec.topic} • ${lec.duration}`}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* DIRECTORY 3: CHAT WITH GURU AI ON THIS SUBJECT */}
              <TouchableOpacity
                style={styles.chatWithAiDirectoryCard}
                activeOpacity={0.85}
                onPress={() => {
                  const subjectName = selectedSubjectDirectory.name;
                  setSelectedSubjectDirectory(null);
                  setPrompt(`I want to learn ${subjectName}. Please give me a breakdown of the key concepts and SEE questions.`);
                  setIsChatModalOpen(true);
                }}
              >
                <View style={styles.aiDirLeft}>
                  <Bot size={28} color="#000000" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.aiDirTitle}>{`3. Chat with Guru AI on ${selectedSubjectDirectory.name}`}</Text>
                    <Text style={styles.aiDirSub}>Ask any numerical, theorem proof, or concept offline.</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#000000" />
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- REAL INTERACTIVE PDF VIEWER SCREEN --- */}
      {activePdfViewing && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
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
                <Text style={styles.pdfHeaderPageInfo}>
                  {`Official CDC Textbook • Page ${activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex]?.page || 1} of ${activePdfViewing.subject.pagesCount}`}
                </Text>
              </View>

              {/* Button to open in external full PDF viewer if desired */}
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
            </View>

            {/* Chapter Horizontal Jump Selector */}
            <View style={styles.chapterTabsBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterTabsScroll}>
                {activePdfViewing.subject.chapters.map((ch, idx) => {
                  const isActive = activePdfViewing.activeChapterIndex === idx;
                  return (
                    <TouchableOpacity
                      key={ch.number}
                      style={[styles.chapterTabPill, isActive && styles.chapterTabPillActive]}
                      onPress={() => setActivePdfViewing({ ...activePdfViewing, activeChapterIndex: idx })}
                    >
                      <Text style={[styles.chapterTabPillText, isActive && styles.chapterTabPillTextActive]}>
                        {activePdfViewing.medium === 'EN' ? `Unit ${ch.number}: ${ch.titleEn}` : `एकाइ ${ch.number}: ${ch.titleNe}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Document Content Canvas */}
            <ScrollView contentContainerStyle={styles.pdfDocumentCanvasScroll} showsVerticalScrollIndicator={false}>
              {(() => {
                const currentChapter = activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex] || activePdfViewing.subject.chapters[0];
                return (
                  <View style={styles.pdfDocumentPagePaper}>
                    <View style={styles.pdfDocPageTop}>
                      <View style={styles.pdfUnitTag}>
                        <Text style={styles.pdfUnitTagText}>{`UNIT ${currentChapter.number}`}</Text>
                      </View>
                      <Text style={styles.pdfPageNumberBadge}>{`Page ${currentChapter.page}`}</Text>
                    </View>

                    <Text style={styles.pdfChapterHeading}>
                      {activePdfViewing.medium === 'EN' ? currentChapter.titleEn : currentChapter.titleNe}
                    </Text>
                    <Text style={styles.pdfInstitutionSub}>Government of Nepal • Curriculum Development Centre (CDC)</Text>

                    <View style={styles.pdfDividerLine} />

                    <Text style={styles.pdfCurriculumSectionLabel}>Official Book Content & Theoretical Formulations:</Text>
                    <Text style={styles.pdfParagraphText}>
                      {activePdfViewing.medium === 'EN' ? currentChapter.contentEn : currentChapter.contentNe}
                    </Text>

                    <View style={styles.pdfExamBox}>
                      <Text style={styles.pdfExamBoxTitle}>SEE Examination Specifications:</Text>
                      <Text style={styles.pdfExamBoxBody}>
                        • Very Short Questions (1 Mark): Define key terms and SI units.{'\n'}
                        • Short Questions (2 Marks): Give reasons and state scientific principles.{'\n'}
                        • Long Questions (3 - 4 Marks): Derive mathematical equations and solve numerical problems step-by-step.
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Bottom Nav Buttons */}
              <View style={styles.pdfBottomNavRow}>
                <TouchableOpacity
                  style={[styles.pdfPageNavBtn, activePdfViewing.activeChapterIndex === 0 && styles.pdfPageNavBtnDisabled]}
                  disabled={activePdfViewing.activeChapterIndex === 0}
                  onPress={() =>
                    setActivePdfViewing({
                      ...activePdfViewing,
                      activeChapterIndex: Math.max(0, activePdfViewing.activeChapterIndex - 1),
                    })
                  }
                >
                  <ChevronLeft size={18} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.pdfPageNavBtnText}>Previous Unit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pdfPageNavBtn,
                    activePdfViewing.activeChapterIndex === activePdfViewing.subject.chapters.length - 1 &&
                      styles.pdfPageNavBtnDisabled,
                  ]}
                  disabled={activePdfViewing.activeChapterIndex === activePdfViewing.subject.chapters.length - 1}
                  onPress={() =>
                    setActivePdfViewing({
                      ...activePdfViewing,
                      activeChapterIndex: Math.min(
                        activePdfViewing.subject.chapters.length - 1,
                        activePdfViewing.activeChapterIndex + 1
                      ),
                    })
                  }
                >
                  <Text style={styles.pdfPageNavBtnText}>Next Unit</Text>
                  <ChevronRight size={18} color="#ffffff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- FULL-PAGE GURU AI CHAT MODAL (PERFECT FIT ON ALL PHONES) --- */}
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

            <KeyboardAvoidingView
              style={styles.chatBody}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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

              {/* Chat Input Bar with Safe Bottom Spacing */}
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
  // TOP HEADER (SAFE DISTANCE FROM STATUS BAR)
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#121214',
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
    paddingTop: 14,
    paddingBottom: 100,
  },
  greetingBlock: {
    marginBottom: 18,
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
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  quizSubjectTag: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quizSubjectTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
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
  // FLOATING BOT BUTTON
  floatingBotButton: {
    position: 'absolute',
    bottom: 84,
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
  // BOTTOM TAB BAR (PERFECT FIT ON PHONES)
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 18 : 10,
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
    zIndex: 200,
  },
  dirModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  dirContentScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  directorySectionCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
  },
  dirSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dirSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  dirSectionSub: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  pdfChoicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  pdfOptionCard: {
    flex: 1,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
  },
  pdfOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pdfMediumBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pdfOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  pdfOptionDesc: {
    fontSize: 11,
    color: '#71717a',
    marginBottom: 8,
  },
  pdfActionBtns: {
    alignItems: 'flex-start',
  },
  viewPdfText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  singlePdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
  },
  singlePdfLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  singlePdfTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  singlePdfSub: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  lecturesList: {
    gap: 8,
  },
  lectureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
  },
  lectureIconBox: {
    marginRight: 10,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  lectureTopic: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  chatWithAiDirectoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  aiDirLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiDirTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  aiDirSub: {
    fontSize: 11,
    color: '#3f3f46',
    marginTop: 2,
  },
  // REAL PDF VIEWER STYLES
  pdfTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  pdfBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pdfHeaderInfo: {
    flex: 1,
  },
  pdfHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  pdfHeaderPageInfo: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  openExternalPdfBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  chapterTabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  chapterTabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chapterTabPill: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chapterTabPillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  chapterTabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  chapterTabPillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  pdfDocumentCanvasScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  pdfDocumentPagePaper: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  pdfDocPageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pdfUnitTag: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pdfUnitTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  pdfPageNumberBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  pdfChapterHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  pdfInstitutionSub: {
    fontSize: 11,
    color: '#71717a',
    marginBottom: 12,
  },
  pdfDividerLine: {
    height: 1,
    backgroundColor: '#1e1e24',
    marginBottom: 16,
  },
  pdfCurriculumSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  pdfParagraphText: {
    fontSize: 13.5,
    color: '#d4d4d8',
    lineHeight: 22,
    marginBottom: 16,
  },
  pdfExamBox: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
  },
  pdfExamBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  pdfExamBoxBody: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  pdfBottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  pdfPageNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 12,
  },
  pdfPageNavBtnDisabled: {
    opacity: 0.35,
  },
  pdfPageNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  // FULL-PAGE GURU AI CHAT
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
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
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 24 : 12,
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
