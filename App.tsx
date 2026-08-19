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
  FileText,
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

interface ChapterData {
  number: number;
  titleEn: string;
  titleNe: string;
  page: number;
  contentEn: string;
  contentNe: string;
}

interface SubjectItem {
  id: SubjectId;
  name: string;
  hasDualMedium: boolean;
  unitsCount: number;
  pagesCount: number;
  englishTitle: string;
  nepaliTitle: string;
  chapters: ChapterData[];
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

// --- SUBJECTS WITH REAL CURRICULUM CHAPTERS ---
const SUBJECTS_DATA: SubjectItem[] = [
  {
    id: 'science',
    name: 'Science & Tech',
    hasDualMedium: true,
    unitsCount: 15,
    pagesCount: 240,
    englishTitle: 'Class 10 Science & Technology (English Medium)',
    nepaliTitle: 'कक्षा १० विज्ञान तथा प्रविधि (नेपाली माध्यम)',
    chapters: [
      {
        number: 1,
        titleEn: 'Scientific Learning',
        titleNe: 'वैज्ञानिक सिकाइ',
        page: 1,
        contentEn: 'Scientific Learning encompasses the methods used by scientists to explore natural phenomena. Fundamental physical quantities (Mass, Length, Time, Temperature, Electric Current, Luminous Intensity, Amount of Substance) are measured using SI units. Precision in measurements requires calibrated instruments and careful error reduction.',
        contentNe: 'वैज्ञानिक सिकाइले प्राकृतिक घटनाहरूको अध्ययन गर्ने वैज्ञानिक विधिहरूलाई जनाउँछ। आधारभूत भौतिक परिमाणहरू (पिण्ड, लम्बाइ, समय, तापक्रम, विद्युत प्रवाह) SI एकाइमा नापिन्छन्। प्रयोगशालामा प्रयोग गर्दा त्रुटि घटाउन यन्त्रहरूको सही प्रयोग आवश्यक हुन्छ।',
      },
      {
        number: 7,
        titleEn: 'Force and Gravity',
        titleNe: 'बल र गुरुत्वाकर्षण',
        page: 82,
        contentEn: 'Newton\'s Universal Law of Gravitation states that every mass in the universe attracts every other mass with a force proportional to the product of their masses and inversely proportional to the square of the distance between their centers:\n\nF = G · (m₁ · m₂) / d²\n\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\nAcceleration due to gravity on a planetary body of mass M and radius R is:\ng = (G · M) / R²\n\nOn Earth\'s surface, average g ≈ 9.8 m/s². During free fall under gravity without air resistance, acceleration equals g and the apparent weight becomes zero (weightlessness).',
        contentNe: 'न्युटनको गुरुत्वाकर्षण सम्बन्धी विश्वव्यापी नियम अनुसार ब्रह्माण्डका कुनै दुई पिण्डहरू बीचको आकर्षण बल तिनीहरूको पिण्डको गुणनफलसँग समानुपातिक र तिनीहरूको केन्द्र बीचको दुरीको वर्गसँग व्युत्क्रमानुपातिक हुन्छ:\n\nF = G · (m₁ · m₂) / d²\n\nजहाँ G = 6.67 × 10⁻¹¹ N m²/kg²।\n\nगुरुत्व प्रवेग (g):\ng = (G · M) / R²\n\nपृथ्वीको सतहमा g को औसत मान ९.८ m/s² हुन्छ। स्वतन्त्र खसाइको बेला गुरुत्व प्रवेग नै वस्तुको प्रवेग बराबर हुने हुँदा वस्तु तौलविहीन हुन्छ।',
      },
      {
        number: 8,
        titleEn: 'Pressure & Hydraulics',
        titleNe: 'चाप र हाइड्रोलिक्स',
        page: 98,
        contentEn: 'Pascal\'s Law: When pressure is applied to an enclosed liquid, it is transmitted equally and undiminished in all directions.\n\nHydraulic Machine Equation:\nF₁ / A₁ = F₂ / A₂\n\nArchimedes\' Principle: When a body is wholly or partially immersed in a fluid, it experiences an upthrust equal to the weight of the fluid displaced by it:\nUpthrust (U) = V · d · g\n\nLaw of Floatation: A floating body displaces liquid equal to its own weight.',
        contentNe: 'पास्कलको नियम: बन्द भाँडोमा रहेको तरल पदार्थमा कुनै एक ठाउँबाट चाप दिइयो भने त्यो चाप सबै दिशामा समान रूपले प्रसारित हुन्छ।\n\nहाइड्रोलिक मेसिनको सूत्र:\nF₁ / A₁ = F₂ / A₂\n\nआर्किमिडिजको सिद्धान्त: कुनै वस्तुलाई तरल पदार्थमा पूरै वा आंशिक रूपमा डुबाउँदा त्यस वस्तुले विस्थापित गरेको तरलको तौल बराबरको उर्ध्वचाप अनुभव गर्दछ:\nउर्ध्वचाप (U) = V · d · g',
      },
      {
        number: 14,
        titleEn: 'Chemical Reactions',
        titleNe: 'रासायनिक प्रतिक्रिया',
        page: 192,
        contentEn: 'Chemical reactions involve bond breaking and forming. Types include: Combination reactions (A + B -> AB), Decomposition reactions (AB -> A + B), Single Displacement (A + BC -> AC + B), and Neutralization (Acid + Base -> Salt + Water).\n\nRate of reaction is influenced by temperature, surface area, concentration, and catalysts.',
        contentNe: 'रासायनिक प्रतिक्रियामा पदार्थहरूको रासायनिक संरचना परिवर्तन हुन्छ। मुख्य प्रकारहरू: संयोजन, विच्छेदन, विस्थापन र तटीस्थीकरण (अम्ल + क्षार -> लवण + पानी)।\n\nप्रतिक्रियाको दरलाई तापक्रम, सतहको क्षेत्रफल, सान्द्रता र उत्प्रेरकले प्रभाव पार्दछ।',
      },
    ],
  },
  {
    id: 'math',
    name: 'Compulsory Maths',
    hasDualMedium: true,
    unitsCount: 14,
    pagesCount: 212,
    englishTitle: 'Class 10 Compulsory Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० अनिवार्य गणित (नेपाली माध्यम)',
    chapters: [
      {
        number: 1,
        titleEn: 'Sets & Cardinality',
        titleNe: 'समूह र गणनात्मकता',
        page: 1,
        contentEn: 'Sets Cardinality Formula for two sets:\nn(A ∪ B) = n(A) + n(B) - n(A ∩ B)\nn(U) = n(A ∪ B) + n(A ∪ B)⁻\n\nFor three intersecting sets A, B, C:\nn(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A) + n(A ∩ B ∩ C).',
        contentNe: 'दुई समूहको लागि सूत्र:\nn(A ∪ B) = n(A) + n(B) - n(A ∩ B)\nn(U) = n(A ∪ B) + n(A ∪ B)⁻\n\nतीन समूहको लागि सूत्र:\nn(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A) + n(A ∩ B ∩ C)।',
      },
      {
        number: 2,
        titleEn: 'Compound Interest',
        titleNe: 'मिश्र ब्याज',
        page: 18,
        contentEn: 'Annual Compound Amount (CA) and Compound Interest (CI):\nCA = P · (1 + R / 100)ᵀ\nCI = P · [(1 + R / 100)ᵀ - 1]\n\nSemi-Annual Compounding:\nCA = P · (1 + R / 200)²ᵀ\nCI = P · [(1 + R / 200)²ᵀ - 1]\n\nDepreciation after T years with depreciation rate R%:\nValue (Pₜ) = P₀ · (1 - R / 100)ᵀ',
        contentNe: 'वार्षिक मिश्र धन र मिश्र ब्याज:\nCA = P · (1 + R / 100)ᵀ\nCI = P · [(1 + R / 100)ᵀ - 1]\n\nअर्धवार्षिक मिश्र ब्याज:\nCA = P · (1 + R / 200)²ᵀ\nCI = P · [(1 + R / 200)²ᵀ - 1]\n\nह्रास कट्टी सूत्र:\nPₜ = P₀ · (1 - R / 100)ᵀ',
      },
      {
        number: 5,
        titleEn: 'Mensuration: Cylinder & Sphere',
        titleNe: 'क्षेत्रमिति: बेलना र गोला',
        page: 64,
        contentEn: 'Cylinder of radius r and height h:\nCurved Surface Area (CSA) = 2 · π · r · h\nTotal Surface Area (TSA) = 2 · π · r · (r + h)\nVolume (V) = π · r² · h\n\nSphere of radius r:\nSurface Area = 4 · π · r²\nVolume = (4 / 3) · π · r³\n\nHemisphere:\nCurved Surface Area = 2 · π · r²\nTotal Surface Area = 3 · π · r²\nVolume = (2 / 3) · π · r³',
        contentNe: 'बेलना (Cylinder):\nवक्र सतहको क्षेत्रफल = 2 · π · r · h\nपुरा सतहको क्षेत्रफल = 2 · π · r · (r + h)\nआयतन = π · r² · h\n\nगोला (Sphere):\nसतहको क्षेत्रफल = 4 · π · r²\nआयतन = (4 / 3) · π · r³\n\nअर्धगोला (Hemisphere):\nपुरा सतहको क्षेत्रफल = 3 · π · r²',
      },
    ],
  },
  {
    id: 'social',
    name: 'Social Studies',
    hasDualMedium: true,
    unitsCount: 9,
    pagesCount: 270,
    englishTitle: 'Class 10 Social Studies (English Medium)',
    nepaliTitle: 'कक्षा १० सामाजिक अध्ययन (नेपाली माध्यम)',
    chapters: [
      {
        number: 1,
        titleEn: 'We and Our Society',
        titleNe: 'हामी र हाम्रो समाज',
        page: 1,
        contentEn: 'Human Resource Planning in Nepal: Skilled, semi-skilled, and unskilled manpower development. Civic duties and active participation in local self-governance and community building.',
        contentNe: 'नेपालमा मानव संसाधन विकास: दक्ष, अर्धदक्ष र अदक्ष जनशक्ति। समाज निर्माणमा युवाहरूको भूमिका र स्थानीय स्वायत्त शासनमा नागरिक सहभागिता।',
      },
      {
        number: 5,
        titleEn: 'Constitution of Nepal & Civic Rights',
        titleNe: 'नागरिक चेतना र मौलिक हक',
        page: 120,
        contentEn: 'Constitution of Nepal 2072: Promulgated on Ashoj 3, 2072 BS. Features 35 Parts, 308 Articles, and 9 Schedules. Guarantees 31 Fundamental Rights including Right to Equality, Freedom, Education, and Health.',
        contentNe: 'नेपालको संविधान २०७२: वि.सं. २०७२ असोज ३ गते जारी भएको। यसमा ३५ भाग, ३०८ धारा र ९ अनुसूचीहरू छन्। यसले ३१ वटा मौलिक हकको प्रत्याभूति गरेको छ।',
      },
    ],
  },
  {
    id: 'nepali',
    name: 'Nepali',
    hasDualMedium: false, // Single Medium -> DIRECT PDF OPEN
    unitsCount: 10,
    pagesCount: 224,
    englishTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    nepaliTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    chapters: [
      {
        number: 1,
        titleEn: 'उज्यालो यात्रा (कविता)',
        titleNe: 'उज्यालो यात्रा (कविता)',
        page: 1,
        contentEn: 'कवि रामप्रसाद ज्ञवालीद्वारा रचित मानवता, परिश्रम र सकारात्मक सोचको सन्देश दिने कविता। यस कविताले कर्मठ बनेर देश निर्माणमा जुट्न सबैलाई प्रेरणा दिन्छ।',
        contentNe: 'कवि रामप्रसाद ज्ञवालीद्वारा रचित मानवता, परिश्रम र सकारात्मक सोचको सन्देश दिने कविता। यस कविताले कर्मठ बनेर देश निर्माणमा जुट्न सबैलाई प्रेरणा दिन्छ।',
      },
      {
        number: 2,
        titleEn: 'घरझगडा (कथा)',
        titleNe: 'घरझगडा (कथा)',
        page: 24,
        contentEn: 'नेपाली ग्रामीण समाजको परिवेश, पारिवारिक सम्बन्ध र आपसी मेलमिलापको महत्व दर्साइएको सामाजिक कथा।',
        contentNe: 'नेपाली ग्रामीण समाजको परिवेश, पारिवारिक सम्बन्ध र आपसी मेलमिलापको महत्व दर्साइएको सामाजिक कथा।',
      },
      {
        number: 10,
        titleEn: 'नेपाली व्याकरण तथा रचना',
        titleNe: 'नेपाली व्याकरण तथा रचना',
        page: 202,
        contentEn: 'पदवर्ग (नाम, सर्वनाम, विशेषण, क्रियापद, नामयोगी, संयोजक, विस्मयादिबोधक, निपात), शब्द निर्माण (उपसर्ग, प्रत्यय, समास), पदसङ्गति, काल र पक्ष, वाच्य, प्रतिवेदन र निबन्ध लेखन।',
        contentNe: 'पदवर्ग (नाम, सर्वनाम, विशेषण, क्रियापद, नामयोगी, संयोजक, विस्मयादिबोधक, निपात), शब्द निर्माण (उपसर्ग, प्रत्यय, समास), पदसङ्गति, काल र पक्ष, वाच्य, प्रतिवेदन र निबन्ध लेखन।',
      },
    ],
  },
  {
    id: 'english',
    name: 'Compulsory English',
    hasDualMedium: false, // Single Medium -> DIRECT PDF OPEN
    unitsCount: 10,
    pagesCount: 198,
    englishTitle: 'Class 10 Compulsory English (CDC Official)',
    nepaliTitle: 'Class 10 Compulsory English (CDC Official)',
    chapters: [
      {
        number: 1,
        titleEn: 'Travel and Tourism',
        titleNe: 'Travel and Tourism',
        page: 1,
        contentEn: 'Reading Comprehension: A trekking itinerary in the Annapurna Circuit. Vocabulary building on travelogues, tourism terms. Grammar: Simple Past vs Present Perfect structures.',
        contentNe: 'Reading Comprehension: A trekking itinerary in the Annapurna Circuit. Vocabulary building on travelogues, tourism terms. Grammar: Simple Past vs Present Perfect structures.',
      },
      {
        number: 5,
        titleEn: 'Science & Technology',
        titleNe: 'Science & Technology',
        page: 80,
        contentEn: 'Reading text: Artificial Intelligence and Edge Computing in Modern Education. Writing: Expository essays, email etiquette, and persuasive letters.',
        contentNe: 'Reading text: Artificial Intelligence and Edge Computing in Modern Education. Writing: Expository essays, email etiquette, and persuasive letters.',
      },
    ],
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    hasDualMedium: true,
    unitsCount: 9,
    pagesCount: 256,
    englishTitle: 'Class 10 Optional Mathematics (English Medium)',
    nepaliTitle: 'कक्षा १० ऐच्छिक गणित (नेपाली माध्यम)',
    chapters: [
      {
        number: 1,
        titleEn: 'Functions & Polynomials',
        titleNe: 'कार्य र बहुपद',
        page: 1,
        contentEn: 'Composite Functions: (f o g)(x) = f(g(x))\nInverse Function f⁻¹(x).\nPolynomial Remainder Theorem: When P(x) is divided by (x - a), the remainder R = P(a).\nFactor Theorem: (x - a) is a factor of P(x) if and only if P(a) = 0.',
        contentNe: 'संयोजित कार्य: (f o g)(x) = f(g(x))\nविपरीत कार्य: f⁻¹(x)\nशेष साध्य (Remainder Theorem): P(x) लाई (x - a) ले भाग गर्दा आउने शेष R = P(a) हुन्छ।',
      },
      {
        number: 3,
        titleEn: 'Coordinate Geometry: Lines Pair',
        titleNe: 'सरल रेखाको जोडी',
        page: 60,
        contentEn: 'Homogeneous equation of second degree in x and y:\na·x² + 2·h·x·y + b·y² = 0\n\nAngle θ between the pair of straight lines:\ntan θ = ± [2 · √(h² - a·b)] / (a + b)\n\nCondition for perpendicular lines: a + b = 0\nCondition for coincident lines: h² - a·b = 0',
        contentNe: 'सरल रेखाको जोडीको समघाती समीकरण:\na·x² + 2·h·x·y + b·y² = 0\n\nरेखाहरू बीचको कोण θ:\ntan θ = ± [2 · √(h² - a·b)] / (a + b)\n\nलम्ब हुने अवस्था: a + b = 0\nखप्टिने अवस्था: h² - a·b = 0',
      },
    ],
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
  const [mediumPickerSubject, setMediumPickerSubject] = useState<SubjectItem | null>(null);
  const [activePdfViewing, setActivePdfViewing] = useState<{
    subject: SubjectItem;
    medium: 'EN' | 'NE';
    activeChapterIndex: number;
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
      if (mediumPickerSubject) {
        setMediumPickerSubject(null);
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
  }, [activePdfViewing, mediumPickerSubject, isChatModalOpen]);

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

  // --- USER CLICKS A SUBJECT BUTTON FLOW ---
  const handleSubjectClick = (subject: SubjectItem) => {
    if (subject.hasDualMedium) {
      // Has both English and Nepali medium -> Show clean medium selector!
      setMediumPickerSubject(subject);
    } else {
      // Single medium (Nepali or English) -> Directly opens PDF reader immediately!
      setActivePdfViewing({
        subject,
        medium: subject.id === 'nepali' ? 'NE' : 'EN',
        activeChapterIndex: 0,
      });
    }
  };

  const selectMediumAndOpenPdf = (medium: 'EN' | 'NE') => {
    if (!mediumPickerSubject) return;
    const subject = mediumPickerSubject;
    setMediumPickerSubject(null);
    setActivePdfViewing({
      subject,
      medium,
      activeChapterIndex: 0,
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
        rawResponse += `Unit 7: Force & Gravity\n\n1. Universal Law of Gravitation:\n$$F = \\frac{G \\cdot m_1 \\cdot m_2}{d^2}$$\nwhere G = 6.67 × 10⁻¹¹ N m²/kg².\n\n2. Acceleration due to Gravity:\n$$g = \\frac{G \\cdot M}{R^2} \\approx 9.8 \\text{ m/s}^2$$\n\nKey Note: Free fall occurs when acceleration equals g, causing apparent weightlessness.`;
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

      {/* TOP HEADER */}
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

        {/* OFFICIAL CDC TEXTBOOKS BANNER */}
        <TouchableOpacity
          style={styles.textbookBanner}
          activeOpacity={0.85}
          onPress={() => handleSubjectClick(SUBJECTS_DATA[0])}
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

        {/* 2x3 SUBJECT FOLDERS GRID (DIRECT OR CLEAN MEDIUM SELECTOR) */}
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

      {/* FLOATING GURU AI BOT BUTTON */}
      <TouchableOpacity
        style={styles.floatingBotButton}
        activeOpacity={0.9}
        onPress={() => setIsChatModalOpen(true)}
      >
        <Bot size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* BOTTOM TAB NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Home size={22} color={activeTab === 'home' ? '#ffffff' : '#71717a'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => handleSubjectClick(SUBJECTS_DATA[0])}>
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

      {/* --- CLEAN MEDIUM SELECTOR MODAL (FOR SCIENCE, MATH, SOCIAL, OPT MATH) --- */}
      {mediumPickerSubject && (
        <View style={styles.modalBackdropOverlay}>
          <View style={styles.mediumSelectorCard}>
            <View style={styles.mediumSelectorHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mediumSelectorTitle}>{mediumPickerSubject.name}</Text>
                <Text style={styles.mediumSelectorSub}>Choose textbook medium to open PDF</Text>
              </View>
              <TouchableOpacity onPress={() => setMediumPickerSubject(null)} style={styles.mediumCloseBtn}>
                <X size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            {/* ENGLISH MEDIUM OPTION */}
            <TouchableOpacity
              style={styles.mediumChoiceItem}
              activeOpacity={0.8}
              onPress={() => selectMediumAndOpenPdf('EN')}
            >
              <View style={styles.mediumChoiceIconBox}>
                <FileText size={20} color="#ffffff" />
              </View>
              <View style={styles.mediumChoiceTextBox}>
                <Text style={styles.mediumChoiceTitle}>English Medium PDF</Text>
                <Text style={styles.mediumChoiceDesc}>{mediumPickerSubject.englishTitle}</Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>

            {/* NEPALI MEDIUM OPTION */}
            <TouchableOpacity
              style={styles.mediumChoiceItem}
              activeOpacity={0.8}
              onPress={() => selectMediumAndOpenPdf('NE')}
            >
              <View style={styles.mediumChoiceIconBox}>
                <FileText size={20} color="#ffffff" />
              </View>
              <View style={styles.mediumChoiceTextBox}>
                <Text style={styles.mediumChoiceTitle}>नेपाली माध्यम PDF</Text>
                <Text style={styles.mediumChoiceDesc}>{mediumPickerSubject.nepaliTitle}</Text>
              </View>
              <ChevronRight size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- INTERACTIVE PDF VIEWER / DOCUMENT READER SCREEN --- */}
      {activePdfViewing && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            {/* Top Bar */}
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
                  {`CDC Official Textbook • Page ${activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex]?.page || 1} of ${activePdfViewing.subject.pagesCount}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pdfHeaderAiButton}
                onPress={() => {
                  const ch = activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex];
                  setPrompt(`I am studying ${activePdfViewing.subject.name} (Unit ${ch?.number}: ${ch?.titleEn}). Explain the core concepts and SEE numericals.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Sparkles size={16} color="#000000" style={{ marginRight: 4 }} />
                <Text style={styles.pdfHeaderAiButtonText}>Ask AI</Text>
              </TouchableOpacity>
            </View>

            {/* Interactive Chapter Quick-Jump Bar */}
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

            {/* Main Interactive PDF Document Canvas */}
            <ScrollView contentContainerStyle={styles.pdfDocumentCanvasScroll} showsVerticalScrollIndicator={false}>
              {(() => {
                const currentChapter = activePdfViewing.subject.chapters[activePdfViewing.activeChapterIndex] || activePdfViewing.subject.chapters[0];
                return (
                  <View style={styles.pdfDocumentPagePaper}>
                    {/* Chapter Header */}
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

                    {/* Chapter Full Theory & Formulas */}
                    <Text style={styles.pdfCurriculumSectionLabel}>Curriculum Theory & Core Formulations:</Text>
                    <Text style={styles.pdfParagraphText}>
                      {activePdfViewing.medium === 'EN' ? currentChapter.contentEn : currentChapter.contentNe}
                    </Text>

                    {/* Standard Guidelines */}
                    <View style={styles.pdfExamBox}>
                      <Text style={styles.pdfExamBoxTitle}>SEE Examination Specifications:</Text>
                      <Text style={styles.pdfExamBoxBody}>
                        • Very Short Questions (1 Mark): Define key terms and SI units.{'\n'}
                        • Short Questions (2 Marks): Give reasons and state underlying scientific principles.{'\n'}
                        • Long Questions (3 - 4 Marks): Derive mathematical equations and solve numerical problems step-by-step.
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Bottom Page Navigation Controls */}
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
                  <Text style={styles.pdfPageNavBtnText}>Previous Chapter</Text>
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
                  <Text style={styles.pdfPageNavBtnText}>Next Chapter</Text>
                  <ChevronRight size={18} color="#ffffff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- FULL-PAGE GURU AI CHAT (MATCHING SCREENSHOT 2) --- */}
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

// --- STYLESHEET (CLEAN SENIOR-LEVEL DARK THEME) ---
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
  // FLOATING BOT BUTTON
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
  // BOTTOM TAB BAR
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
  // MEDIUM PICKER MODAL BACKDROP
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mediumSelectorCard: {
    width: '100%',
    backgroundColor: '#121214',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    gap: 14,
  },
  mediumSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mediumSelectorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumSelectorSub: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  mediumCloseBtn: {
    padding: 4,
  },
  mediumChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  mediumChoiceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediumChoiceTextBox: {
    flex: 1,
  },
  mediumChoiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  mediumChoiceDesc: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  // FULL MODAL OVERLAY (PDF READER)
  fullModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 200,
  },
  pdfTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  pdfHeaderAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  pdfHeaderAiButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
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
