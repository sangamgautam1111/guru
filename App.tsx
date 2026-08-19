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
  ChevronRight,
  FileText,
  Flame,
  Folder,
  GraduationCap,
  HelpCircle,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react-native';

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

interface ChapterItem {
  number: number;
  title: string;
  titleNe: string;
  page: number;
  summary: string;
}

interface SubjectPDF {
  id: SubjectId;
  name: string;
  nameNe: string;
  unitsCount: number;
  pagesCount: number;
  englishMediumTitle: string;
  nepaliMediumTitle: string;
  description: string;
  chapters: ChapterItem[];
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

// --- SUBJECT PDF VAULT CONFIGURATION ---
const SUBJECTS_DATA: SubjectPDF[] = [
  {
    id: 'science',
    name: 'Science & Technology',
    nameNe: 'विज्ञान तथा प्रविधि',
    unitsCount: 15,
    pagesCount: 240,
    englishMediumTitle: 'Class 10 Science & Tech (English Medium)',
    nepaliMediumTitle: 'कक्षा १० विज्ञान तथा प्रविधि (नेपाली माध्यम)',
    description: 'Complete official CDC textbook with all 15 units, diagrams, numericals, formulas, and practical guides.',
    chapters: [
      { number: 1, title: 'Scientific Learning', titleNe: 'वैज्ञानिक सिकाइ', page: 1, summary: 'Fundamental scientific methods, measurement units, precision, error analysis, and research process.' },
      { number: 2, title: 'Classification of Living Beings', titleNe: 'जीवहरूको वर्गीकरण', page: 12, summary: 'Five kingdom classification, plant and animal diversity, vertebrates and invertebrates characteristics.' },
      { number: 3, title: 'Honeybee', titleNe: 'माहुरी', page: 26, summary: 'Life cycle of honeybee, caste division (queen, worker, drone), pollination, and apiculture economic benefits.' },
      { number: 4, title: 'Heredity & Genetics', titleNe: 'वंशानुक्रम', page: 38, summary: 'Mendel\'s laws of inheritance, monohybrid and dihybrid cross, chromosomes, DNA, RNA, and mutations.' },
      { number: 5, title: 'Physiological Structure', titleNe: 'शारीरिक संरचना', page: 54, summary: 'Human nervous system, endocrine glands, hormone functions, reflex actions, and sensory organs.' },
      { number: 6, title: 'Nature and Environment', titleNe: 'प्रकृति र वातावरण', page: 68, summary: 'Ecosystem trophic levels, biogeochemical cycles, greenhouse effect, climate change, and conservation.' },
      { number: 7, title: 'Force and Gravity', titleNe: 'बल र गुरुत्वाकर्षण', page: 82, summary: 'Newton\'s universal law of gravitation F=G(m1*m2)/d², acceleration due to gravity g=GM/R², free fall, and weightlessness.' },
      { number: 8, title: 'Pressure & Hydraulics', titleNe: 'चाप र हाइड्रोलिक्स', page: 98, summary: 'Pascal\'s law, hydraulic lift/brakes, Archimedes\' principle, laws of floatation, and atmospheric barometer.' },
      { number: 9, title: 'Energy & Sources', titleNe: 'ऊर्जाका स्रोतहरू', page: 114, summary: 'Renewable and non-renewable energy sources, solar, hydroelectricity, nuclear energy, and energy crisis.' },
      { number: 10, title: 'Wave & Sound', titleNe: 'तरङ्ग र ध्वनि', page: 128, summary: 'Transverse and longitudinal waves, speed of sound in media, reflection, echo, reverberation, and ultrasound.' },
      { number: 11, title: 'Electricity & Magnetism', titleNe: 'विद्युत् र चुम्बकत्व', page: 142, summary: 'Ohm\'s law V=IR, electric power P=VI, household wiring, safety devices (fuse, MCB), Fleming\'s rules, transformer.' },
      { number: 12, title: 'The Universe', titleNe: 'ब्रह्माण्ड', page: 160, summary: 'Big bang theory, life cycle of stars, solar system evolution, satellites, constellations, and space research.' },
      { number: 13, title: 'Classification of Elements', titleNe: 'तत्वहरूको वर्गीकरण', page: 174, summary: 'Modern periodic table, electronic configuration, periodic trends (valency, atomic radius, electronegativity).' },
      { number: 14, title: 'Chemical Reactions & Equations', titleNe: 'रासायनिक प्रतिक्रिया', page: 192, summary: 'Types of chemical reactions (combination, decomposition, displacement, neutralization), rate of reaction factors.' },
      { number: 15, title: 'Gases, Metals & Hydrocarbons', titleNe: 'ग्याँस, धातु र हाइड्रोकार्बन', page: 210, summary: 'Laboratory preparation of CO2 and NH3, metallurgy of iron/copper, alkanes, alkenes, alkynes, and polymers.' },
    ],
  },
  {
    id: 'math',
    name: 'Compulsory Mathematics',
    nameNe: 'अनिवार्य गणित',
    unitsCount: 14,
    pagesCount: 212,
    englishMediumTitle: 'Class 10 Compulsory Mathematics (English)',
    nepaliMediumTitle: 'कक्षा १० अनिवार्य गणित (नेपाली माध्यम)',
    description: 'Complete CDC Mathematics book covering Sets, Compound Interest, Mensuration, Algebra, and Geometry.',
    chapters: [
      { number: 1, title: 'Sets and Venn Diagrams', titleNe: 'समूह र भेनचित्र', page: 1, summary: 'Cardinality formula n(A∪B∪C), problems on 2 and 3 intersecting sets with Venn diagrams.' },
      { number: 2, title: 'Compound Interest', titleNe: 'मिश्र ब्याज', page: 18, summary: 'Annual compounding CI=P[(1+R/100)^T - 1], semi-annual compounding, tax deductions, and depreciation.' },
      { number: 3, title: 'Population Growth & Depreciation', titleNe: 'जनसङ्ख्या वृद्धि र ह्रास', page: 34, summary: 'Formulas Pt = P0(1±R/100)^T applied to compound population growth and asset depreciation.' },
      { number: 4, title: 'Mensuration: Plane Figures', titleNe: 'समतलीय सतहको क्षेत्रफल', page: 48, summary: 'Area of scalene, isosceles, equilateral triangles, Heron\'s formula s=√(s(s-a)(s-b)(s-c)), and paths.' },
      { number: 5, title: 'Mensuration: Cylinder & Sphere', titleNe: 'बेलना र गोला', page: 64, summary: 'Surface area and volume of cylinders (2πrh, πr²h), spheres (4πr², 4/3πr³), and combined solids.' },
      { number: 6, title: 'Mensuration: Prism & Pyramid', titleNe: 'प्रिज्म र पिरामिड', page: 80, summary: 'Lateral and total surface area of triangular prisms, square-based pyramids, volume calculations.' },
      { number: 7, title: 'Algebra: HCF and LCM', titleNe: 'म.स. र ल.स.', page: 96, summary: 'Factorization of algebraic expressions, a³±b³, a⁴+a²b²+b⁴ formulas, determining HCF and LCM.' },
      { number: 8, title: 'Algebra: Quadratic Equations', titleNe: 'वर्ग समीकरण', page: 110, summary: 'Solving ax²+bx+c=0 by factorization and quadratic formula x=(-b±√(b²-4ac))/2a, word problems.' },
      { number: 9, title: 'Algebra: Indices & Surds', titleNe: 'घाताङ्क र करणी', page: 124, summary: 'Laws of indices, exponential equations, rationalizing surds, solving radical equations.' },
      { number: 10, title: 'Geometry: Triangles & Parallelograms', titleNe: 'त्रिभुज र समानान्तर चतुर्भुज', page: 138, summary: 'Theorems on areas of triangles and parallelograms standing on same base and between same parallels.' },
      { number: 11, title: 'Geometry: Circle Theorems', titleNe: 'वृत्तका साध्यहरू', page: 154, summary: 'Angle at center is twice angle at circumference, inscribed angles in same segment are equal, cyclic quads.' },
      { number: 12, title: 'Trigonometry: Height & Distance', titleNe: 'उचाइ र दुरी', page: 170, summary: 'Angles of elevation and depression, solving real-world height and distance problems with right triangles.' },
      { number: 13, title: 'Statistics: Quartiles & Mean', titleNe: 'तथ्याङ्कशास्त्र', page: 184, summary: 'Mean of continuous data, Lower quartile Q1, Median Q2, Upper quartile Q3 calculations from frequency tables.' },
      { number: 14, title: 'Probability', titleNe: 'सम्भाव्यता', page: 200, summary: 'Mutually exclusive events P(A∪B)=P(A)+P(B), independent events P(A∩B)=P(A)*P(B), and tree diagrams.' },
    ],
  },
  {
    id: 'social',
    name: 'Social Studies',
    nameNe: 'सामाजिक अध्ययन',
    unitsCount: 9,
    pagesCount: 270,
    englishMediumTitle: 'Class 10 Social Studies (English Medium)',
    nepaliMediumTitle: 'कक्षा १० सामाजिक अध्ययन (नेपाली माध्यम)',
    description: 'Society, Constitution of Nepal 2072, Federalism, Geography, History, and Foreign Relations.',
    chapters: [
      { number: 1, title: 'We and Our Society', titleNe: 'हामी र हाम्रो समाज', page: 1, summary: 'Human resources development, social cohesion, and role of youth in nation-building.' },
      { number: 2, title: 'Development & Federal Structure', titleNe: 'विकास र प्रादेशिक संरचना', page: 30, summary: 'Provinces of Nepal, infrastructure development, sustainable goals, and decentralization.' },
      { number: 3, title: 'Traditions, Values and Norms', titleNe: 'हाम्रा सामाजिक मूल्य र मान्यता', page: 60, summary: 'Nepali arts, folk music, cultural heritage, world heritage sites, and national pride.' },
      { number: 4, title: 'Social Problems and Solutions', titleNe: 'सामाजिक समस्या र समाधान', page: 90, summary: 'Corruption, human trafficking, untouchability, domestic violence, and legal remedies.' },
      { number: 5, title: 'Civic Consciousness & Constitution', titleNe: 'नागरिक चेतना र मौलिक हक', page: 120, summary: 'Constitution of Nepal 2072, Fundamental Rights, duties of citizens, rule of law, and election system.' },
      { number: 6, title: 'Our Earth & Climate', titleNe: 'हाम्रो पृथ्वी र जलवायु', page: 155, summary: 'Geography of Nepal, climate zones, world geography, natural disasters, and mitigation.' },
      { number: 7, title: 'Our Past & History', titleNe: 'हाम्रो विगत र इतिहास', page: 190, summary: 'Unification of Nepal, democratic movements (2007, 2046, 2062/63 BS), peace process.' },
      { number: 8, title: 'Economic Activities', titleNe: 'हाम्रो आर्थिक क्रियाकलाप', page: 220, summary: 'Agriculture, tourism, hydropower, international trade, remittance, and cooperative economy.' },
      { number: 9, title: 'International Relations & UN', titleNe: 'अन्तर्राष्ट्रिय सम्बन्ध र शान्ति', page: 248, summary: 'United Nations Organization (UNO), SAARC, BIMSTEC, non-aligned foreign policy of Nepal.' },
    ],
  },
  {
    id: 'nepali',
    name: 'Compulsory Nepali',
    nameNe: 'अनिवार्य नेपाली',
    unitsCount: 10,
    pagesCount: 224,
    englishMediumTitle: 'कक्षा १० नेपाली पाठ्यपुस्तक (CDC Official)',
    nepaliMediumTitle: 'कक्षा १० नेपाली व्याकरण, साहित्य र रचना',
    description: 'नेपाली पाठ, कविता, कथा, निबन्ध, व्याकरण (पदवर्ग, समास, पदसङ्गति) र रचना।',
    chapters: [
      { number: 1, title: 'उज्यालो यात्रा (कविता)', titleNe: 'उज्यालो यात्रा (कविता)', page: 1, summary: 'कवि रामप्रसाद ज्ञवालीद्वारा रचित मानवता, परिश्रम र सकारात्मक सोचको सन्देश दिने कविता।' },
      { number: 2, title: 'घरझगडा (कथा)', titleNe: 'घरझगडा (कथा)', page: 24, summary: 'नेपाली ग्रामीण समाज, पारिवारिक सम्बन्ध, र आपसी मेलमिलापको महत्व झल्काउने कथा।' },
      { number: 3, title: 'चिकित्सा विज्ञान र आयुर्वेद (प्रबन्ध)', titleNe: 'चिकित्सा विज्ञान र आयुर्वेद', page: 48, summary: 'प्राकृतिक जडीबुटी, प्राचीन आयुर्वेदिक उपचार पद्धति र आधुनिक चिकित्साको तुलनात्मक प्रबन्ध।' },
      { number: 4, title: 'यस्तो कहिल्यै नहोस् (नाटक)', titleNe: 'यस्तो कहिल्यै नहोस् (नाटक)', page: 72, summary: 'लागुऔषध दुर्व्यसन, युवा पुस्ताको समस्या र सामाजिक सचेतना जगाउने सन्देशमूलक नाटक।' },
      { number: 5, title: 'लक्ष्मीप्रसाद देवकोटा (जीवनी)', titleNe: 'महाकवि लक्ष्मीप्रसाद देवकोटा', page: 96, summary: 'महाकवि देवकोटाको जीवन सङ्घर्ष, साहित्यिक योगदान र अमर कृतिहरूको संक्षिप्त परिचय।' },
      { number: 6, title: 'अधिकार ठूलो कि कर्तव्य (वादविवाद)', titleNe: 'अधिकार ठूलो कि कर्तव्य', page: 118, summary: 'नागरिक अधिकार र कर्तव्यको सन्तुलन, तर्कशीलता र वाककला सम्बन्धी वादविवाद पाठ।' },
      { number: 7, title: 'शत्रु (कथा)', titleNe: 'शत्रु (कथा)', page: 140, summary: 'विश्वेश्वरप्रसाद कोइरालाद्वारा रचित मानव मनको मनोवैज्ञानिक विश्लेषण गरिएको उत्कृष्ट कथा।' },
      { number: 8, title: 'हाम्रो श्रम र सीप (निबन्ध)', titleNe: 'हाम्रो श्रम र सीप', page: 162, summary: 'श्रमको सम्मान, स्वदेशी उत्पादनको प्रवर्द्धन र प्राविधिक सीपको महत्वबारे विचारप्रधान निबन्ध।' },
      { number: 9, title: 'मेरो देशको माटो (कविता)', titleNe: 'मेरो देशको माटो (कविता)', page: 184, summary: 'राष्ट्रप्रेम, भौगोलिक सौन्दर्य र नेपाली माटोप्रतिको अगाध निष्ठा व्यक्त गरिएको कविता।' },
      { number: 10, title: 'नेपाली व्याकरण तथा रचना', titleNe: 'नेपाली व्याकरण तथा रचना', page: 202, summary: 'पदवर्ग (नाम, सर्वनाम, विशेषण, क्रिया), पदसङ्गति, काल र पक्ष, वाच्य, समास, प्रतिवेदन र निबन्ध।' },
    ],
  },
  {
    id: 'english',
    name: 'Compulsory English',
    nameNe: 'अंग्रेजी',
    unitsCount: 10,
    pagesCount: 198,
    englishMediumTitle: 'Class 10 Compulsory English (CDC Official)',
    nepaliMediumTitle: 'Class 10 English Guide & Model Papers',
    description: 'Reading comprehension, writing tasks (essays, brochures, letters), grammar structures, and vocabulary.',
    chapters: [
      { number: 1, title: 'Travel and Tourism', titleNe: 'Travel and Tourism', page: 1, summary: 'Guide to trekking in Nepal, brochures, tourist itineraries, and travelogue writing.' },
      { number: 2, title: 'Health and Hygiene', titleNe: 'Health and Hygiene', page: 20, summary: 'Mental health, physical fitness, conditional sentences (Type 1, 2, 3), and doctor-patient dialogue.' },
      { number: 3, title: 'Family and Relationships', titleNe: 'Family and Relationships', page: 40, summary: 'Poem "A Mother\'s Love", describing personal memories, reported speech transformations.' },
      { number: 4, title: 'Nature and Ecology', titleNe: 'Nature and Ecology', page: 60, summary: 'Climate change, wildlife preservation, passive voice in scientific descriptions.' },
      { number: 5, title: 'Science and Technology', titleNe: 'Science and Technology', page: 80, summary: 'Artificial Intelligence, robotics, technological revolution, and formal essay writing.' },
      { number: 6, title: 'Success and Achievement', titleNe: 'Success and Achievement', page: 100, summary: 'Biography of Nelson Mandela, overcoming adversity, connectors of contrast and reason.' },
      { number: 7, title: 'Power and Politics', titleNe: 'Power and Politics', page: 120, summary: 'Democratic values, speech by Abraham Lincoln, persuasive writing techniques.' },
      { number: 8, title: 'Arts and Creation', titleNe: 'Arts and Creation', page: 140, summary: 'Traditional Nepali Newari architecture, painting styles, relative clauses.' },
      { number: 9, title: 'Media and Entertainment', titleNe: 'Media and Entertainment', page: 160, summary: 'Digital news journalism, film review formats, book review structure.' },
      { number: 10, title: 'Grammar and SEE Model Sets', titleNe: 'Grammar and SEE Model Sets', page: 180, summary: 'Question tags, preposition rules, subject-verb agreement, and official SEE model question practice.' },
    ],
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    nameNe: 'ऐच्छिक गणित',
    unitsCount: 9,
    pagesCount: 256,
    englishMediumTitle: 'Class 10 Optional Mathematics (English)',
    nepaliMediumTitle: 'कक्षा १० ऐच्छिक गणित (नेपाली माध्यम)',
    description: 'Functions, Matrices, Coordinate Geometry, Trigonometry, Vectors, and Transformations.',
    chapters: [
      { number: 1, title: 'Functions & Polynomials', titleNe: 'कार्य र बहुपद', page: 1, summary: 'Composite functions (fog)(x), inverse functions f⁻¹(x), remainder theorem, and polynomial roots.' },
      { number: 2, title: 'Matrices & Determinants', titleNe: 'म्याट्रिक्स र निर्धारक', page: 30, summary: 'Matrix determinant 2x2, adjoint matrix, inverse of matrix A⁻¹, and solving linear systems by Cramer\'s rule.' },
      { number: 3, title: 'Coordinate Geometry: Lines', titleNe: 'सरल रेखाको जोडी', page: 60, summary: 'Angle between two lines tanθ=±(m1-m2)/(1+m1m2), homogeneous equation ax²+2hxy+by²=0, lines pair proofs.' },
      { number: 4, title: 'Coordinate Geometry: Circle', titleNe: 'वृत्तको समीकरण', page: 90, summary: 'Equation of circle (x-h)²+(y-k)²=r², general form x²+y²+2gx+2fy+c=0, center (-g, -f), radius √(g²+f²-c).' },
      { number: 5, title: 'Trigonometry: Multiple Angles', titleNe: 'संयुक्त र अपवर्त्य कोणहरू', page: 120, summary: 'Compound angles sin(A±B), multiple angles sin2A, cos2A, tan2A, sub-multiple angles, and conditional identities.' },
      { number: 6, title: 'Trigonometry: Transformation', titleNe: 'रूपान्तरण सूत्रहरू', page: 155, summary: 'Transforming product to sum/difference 2sinAcosB, and transforming sum to product sinC+sinD.' },
      { number: 7, title: 'Vectors & Scalar Products', titleNe: 'भेक्टर र स्केलर गुणन', page: 190, summary: 'Dot product a·b=|a||b|cosθ, perpendicularity condition a·b=0, vector geometry proofs (Apollonius theorem).' },
      { number: 8, title: 'Matrix Transformations', titleNe: 'म्याट्रिक्स रूपान्तरण', page: 220, summary: '2x2 transformation matrices for reflection in axes, rotation about origin (90°, 180°, 270°), enlargement.' },
      { number: 9, title: 'Statistics: Standard Deviation', titleNe: 'स्तरीक विचलन र विचरणशीलता', page: 240, summary: 'Calculation of mean, standard deviation σ=√(Σfd²/N - (Σfd/N)²), and coefficient of variation (CV).' },
    ],
  },
];

const QUIZ_QUESTIONS = [
  {
    question: 'What can form when an acid reacts with a base in a neutralization reaction?',
    options: ['Salt and water', 'Only hydrogen gas', 'Only metal oxide', 'Ice crystals'],
    correctIndex: 0,
    explanation: 'An acid reacts with a base to form salt and water (e.g., HCl + NaOH -> NaCl + H2O).',
  },
  {
    question: 'What is the value of Universal Gravitational Constant (G)?',
    options: ['6.67 × 10⁻¹¹ N m²/kg²', '9.8 m/s²', '3.0 × 10⁸ m/s', '1.6 × 10⁻¹⁹ C'],
    correctIndex: 0,
    explanation: 'G is 6.67 × 10⁻¹¹ N m²/kg², which remains constant everywhere across the universe.',
  },
  {
    question: 'According to Pascal\'s Law, pressure exerted on an enclosed liquid is transmitted:',
    options: ['Equally in all directions', 'Only in the downward direction', 'Only to the vessel walls', 'Zero at the bottom'],
    correctIndex: 0,
    explanation: 'Pascal\'s Law states that pressure applied to an enclosed liquid is transmitted equally and undiminished in all directions.',
  },
  {
    question: 'What is the specific heat capacity of pure water?',
    options: ['4200 J/kg°C', '1000 J/kg°C', '2100 J/kg°C', '380 J/kg°C'],
    correctIndex: 0,
    explanation: 'Water has a high specific heat capacity of 4200 J/kg°C, making it an excellent natural coolant.',
  },
];

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [screen, setScreen] = useState<ScreenState>('onboarding');
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
  const [selectedSubject, setSelectedSubject] = useState<SubjectPDF | null>(null);
  const [activePdfViewing, setActivePdfViewing] = useState<{
    subject: string;
    medium: string;
    title: string;
    chapterNumber?: number;
    chapterTitle?: string;
    page?: number;
    summary?: string;
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
      if (selectedSubject) {
        setSelectedSubject(null);
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
  }, [activePdfViewing, selectedSubject, isChatModalOpen]);

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
        setTimeout(() => setIsBooting(false), 300);
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

  const openPdfDirect = (
    subject: SubjectPDF,
    medium: 'English Medium' | 'Nepali Medium',
    chapter?: ChapterItem
  ) => {
    const title = medium === 'English Medium' ? subject.englishMediumTitle : subject.nepaliMediumTitle;
    setActivePdfViewing({
      subject: subject.name,
      medium,
      title,
      chapterNumber: chapter?.number ?? 1,
      chapterTitle: chapter ? (medium === 'English Medium' ? chapter.title : chapter.titleNe) : subject.chapters[0]?.title,
      page: chapter?.page ?? 1,
      summary: chapter?.summary ?? subject.description,
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
        rawResponse += `Unit 8: Pressure & Hydraulics\n\n1. Pascal's Law Principle:\n$$\\frac{F_1}{A_1} = \\frac{F_2}{A_2}$$\n\n2. Archimedes' Upthrust:\n$$\\text{Upthrust } (U) = V \\cdot d \\cdot g$$\nA floating body displaces liquid equal to its own total weight.`;
      } else if (q.includes('interest') || q.includes('math') || q.includes('compound')) {
        rawResponse += `Compulsory Mathematics: Compound Interest\n\n1. Yearly Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{100}\\right)^T - 1 \\right]$$\n\n2. Semi-Annual Compounding:\n$$CI = P \\left[ \\left(1 + \\frac{R}{200}\\right)^{2T} - 1 \\right]$$`;
      } else {
        rawResponse += `Class 10 Core Summary:\n• Thoroughly master formulas, scientific definitions, and theorem proofs.\n• Use step-by-step calculation with exact standard units.\n• Review official CDC textbook questions for the best SEE exam scores.`;
      }

      updateAssistantMessage(sessionId, messageId, rawResponse, false);
      setIsGenerating(false);
    }, 450);
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

  // --- BOOT SCREEN (CLEAN & MINIMALIST) ---
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

  // --- MAIN DASHBOARD (DARK MODE DEFAULT) ---
  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* TOP HEADER (CLEAN NO TRANSLATOR BUTTON) */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.appHeaderTitle}>Guru</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{`Class ${user?.grade ?? '10'}`}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => setIsChatModalOpen(true)}>
          <Bot size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {/* GREETING */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>{`Hi, ${user?.name || 'Student'}`}</Text>
          <Text style={styles.greetingSub}>Choose a subject folder to read official CDC textbooks offline.</Text>
        </View>

        {/* OFFICIAL CDC TEXTBOOKS BANNER */}
        <TouchableOpacity
          style={styles.textbookBanner}
          activeOpacity={0.85}
          onPress={() => setSelectedSubject(SUBJECTS_DATA[0])}
        >
          <View style={styles.textbookBannerLeft}>
            <View style={styles.textbookIconBox}>
              <BookOpen size={22} color="#ffffff" />
            </View>
            <View style={styles.textbookTextGroup}>
              <Text style={styles.textbookBannerTitle}>Official CDC Textbooks</Text>
              <Text style={styles.textbookBannerSub}>English & Nepali Medium • PDF Vault</Text>
            </View>
          </View>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>See All Books</Text>
            <ChevronRight size={16} color="#a1a1aa" />
          </View>
        </TouchableOpacity>

        {/* SUBJECT RESOURCE FOLDERS TITLE */}
        <View style={styles.sectionHeaderRow}>
          <Folder size={18} color="#ffffff" />
          <Text style={styles.sectionTitleText}>Subject Resource Folders</Text>
        </View>

        {/* 6 SUBJECT FOLDER GRID CARDS */}
        <View style={styles.subjectGrid}>
          {SUBJECTS_DATA.map((subj) => (
            <TouchableOpacity
              key={subj.id}
              style={styles.subjectFolderCard}
              activeOpacity={0.8}
              onPress={() => setSelectedSubject(subj)}
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
              <Flame size={18} color="#ffffff" />
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
            {currentQuiz.options.map((opt, idx) => {
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
                  <Text style={[styles.quizOptionText, (isCorrect || isSelected) && styles.quizOptionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {quizStatus !== 'idle' && (
            <View style={[styles.feedbackBox, quizStatus === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackTitle}>{quizStatus === 'correct' ? 'Correct!' : 'Almost there!'}</Text>
              <Text style={styles.feedbackExplain}>{currentQuiz.explanation}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.newQuizButton} onPress={nextQuiz}>
            <RotateCcw size={14} color="#ffffff" />
            <Text style={styles.newQuizButtonText}>New quiz</Text>
          </TouchableOpacity>
        </View>

        {/* CLASS-AWARE TUTORING CARD */}
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

      {/* FLOATING GURU AI ASSISTANT BUTTON (MOVABLE & ACCESSIBLE EVERYWHERE) */}
      <TouchableOpacity
        style={styles.floatingBotButton}
        activeOpacity={0.9}
        onPress={() => setIsChatModalOpen(true)}
      >
        <Bot size={26} color="#000000" />
      </TouchableOpacity>

      {/* --- SUBJECT DETAIL MODAL (OPENS ALL CHAPTERS & PDF) --- */}
      {selectedSubject && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackButton} onPress={() => setSelectedSubject(null)}>
                <ArrowLeft size={22} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.modalHeaderTitleGroup}>
                <Text style={styles.modalHeaderTitle}>{selectedSubject.name}</Text>
                <Text style={styles.modalHeaderSub}>{`Class ${user?.grade ?? '10'} • Official CDC Curriculum`}</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.pdfSelectionScroll} showsVerticalScrollIndicator={false}>
              {/* SUBJECT HERO CARD */}
              <View style={styles.pdfSubjectHero}>
                <BookOpen size={36} color="#ffffff" />
                <Text style={styles.pdfSubjectHeroTitle}>{selectedSubject.name}</Text>
                <Text style={styles.pdfSubjectHeroDesc}>{selectedSubject.description}</Text>
                <View style={styles.metaBadgeRow}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{`${selectedSubject.unitsCount} Units`}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{`${selectedSubject.pagesCount} Pages`}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>SEE Syllabus</Text>
                  </View>
                </View>
              </View>

              {/* QUICK MEDIUM LAUNCH BUTTONS */}
              <Text style={styles.selectMediumHeading}>Open Official Textbook PDF:</Text>
              <View style={styles.mediumActionRow}>
                <TouchableOpacity
                  style={styles.mediumButton}
                  activeOpacity={0.85}
                  onPress={() => openPdfDirect(selectedSubject, 'English Medium')}
                >
                  <FileText size={18} color="#ffffff" />
                  <Text style={styles.mediumButtonText}>English Medium PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediumButton}
                  activeOpacity={0.85}
                  onPress={() => openPdfDirect(selectedSubject, 'Nepali Medium')}
                >
                  <FileText size={18} color="#ffffff" />
                  <Text style={styles.mediumButtonText}>नेपाली माध्यम PDF</Text>
                </TouchableOpacity>
              </View>

              {/* CHAPTERS LIST (TAP ANY CHAPTER TO OPEN PDF READER DIRECTLY) */}
              <Text style={styles.selectMediumHeading}>Chapters & Units in this Book:</Text>
              <View style={styles.chapterListContainer}>
                {selectedSubject.chapters.map((ch) => (
                  <TouchableOpacity
                    key={ch.number}
                    style={styles.chapterCardItem}
                    activeOpacity={0.8}
                    onPress={() => openPdfDirect(selectedSubject, 'English Medium', ch)}
                  >
                    <View style={styles.chapterNumberBox}>
                      <Text style={styles.chapterNumberText}>{ch.number}</Text>
                    </View>
                    <View style={styles.chapterTextBox}>
                      <Text style={styles.chapterTitleMain}>{ch.title}</Text>
                      <Text style={styles.chapterTitleNe}>{ch.titleNe}</Text>
                      <Text style={styles.chapterPageInfo}>{`Page ${ch.page} • Tap to read PDF`}</Text>
                    </View>
                    <ChevronRight size={18} color="#ffffff" />
                  </TouchableOpacity>
                ))}
              </View>

              {/* ASK AI ABOUT SUBJECT */}
              <TouchableOpacity
                style={styles.askAiForSubjectBtn}
                onPress={() => {
                  setSelectedSubject(null);
                  setPrompt(`Explain the complete Class 10 SEE syllabus and important questions for ${selectedSubject.name}.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Bot size={20} color="#000000" />
                <Text style={styles.askAiForSubjectBtnText}>{`Ask Guru AI about ${selectedSubject.name}`}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- FULL-PAGE PDF VIEWER / READER POPUP --- */}
      {activePdfViewing && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackButton} onPress={() => setActivePdfViewing(null)}>
                <ArrowLeft size={22} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.modalHeaderTitleGroup}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>{activePdfViewing.title}</Text>
                <Text style={styles.modalHeaderSub}>{`${activePdfViewing.subject} • ${activePdfViewing.medium} • Page ${activePdfViewing.page || 1}`}</Text>
              </View>
              <TouchableOpacity
                style={styles.pdfHeaderAiBtn}
                onPress={() => {
                  setPrompt(`I am reading ${activePdfViewing.title}, ${activePdfViewing.chapterTitle || ''}. Explain the key concepts and SEE questions.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Sparkles size={16} color="#000000" />
                <Text style={styles.pdfHeaderAiBtnText}>Ask AI</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.pdfViewportScroll} showsVerticalScrollIndicator={false}>
              {/* PDF NOTICE BANNER */}
              <View style={styles.pdfNoticeBanner}>
                <BookOpen size={20} color="#ffffff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pdfNoticeTitle}>Official CDC Textbook Loaded</Text>
                  <Text style={styles.pdfNoticeSub}>100% Offline Access • Curriculum Development Centre, Nepal</Text>
                </View>
              </View>

              {/* ACTIVE CHAPTER CANVAS */}
              <View style={styles.pdfDocumentCanvas}>
                <View style={styles.pdfDocHeader}>
                  <View style={styles.activeChapterPill}>
                    <Text style={styles.activeChapterPillText}>{`UNIT ${activePdfViewing.chapterNumber || 1}`}</Text>
                  </View>
                  <Text style={styles.pdfDocTitleText}>{activePdfViewing.chapterTitle || activePdfViewing.title}</Text>
                  <Text style={styles.pdfDocMetaText}>{`Government of Nepal • CDC Class 10 • Page ${activePdfViewing.page || 1}`}</Text>
                </View>

                <View style={styles.pdfContentBlock}>
                  <Text style={styles.pdfSectionHeading}>Key Concepts & Theory:</Text>
                  <Text style={styles.pdfBodyText}>{activePdfViewing.summary}</Text>
                </View>

                <View style={styles.pdfContentBlock}>
                  <Text style={styles.pdfSectionHeading}>Exam Preparation Guidelines:</Text>
                  <Text style={styles.pdfBodyText}>
                    1. Study all standard definitions, principles, and laws carefully.{'\n'}
                    2. Practice the numerical formulas and step-by-step proofs.{'\n'}
                    3. Tap the "Ask Guru AI" button below for instant derivations and solutions.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.askGuruLargeButton}
                onPress={() => {
                  setPrompt(`Explain the most important SEE exam questions from ${activePdfViewing.title}, ${activePdfViewing.chapterTitle || ''}.`);
                  setIsChatModalOpen(true);
                }}
              >
                <Bot size={20} color="#000000" />
                <Text style={styles.askGuruLargeButtonText}>Ask Guru AI To Explain This Chapter</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* --- FULL-PAGE GURU AI ASSISTANT MODAL (NO CLUTTER, FULL SCREEN) --- */}
      {isChatModalOpen && (
        <View style={styles.fullModalOverlay}>
          <SafeAreaView style={styles.darkContainer}>
            <View style={styles.chatTopBar}>
              <TouchableOpacity style={styles.chatCloseButton} onPress={() => setIsChatModalOpen(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.chatHeaderCenter}>
                <Text style={styles.chatHeaderTitle}>Guru AI Assistant</Text>
                <View style={styles.offlineStatusRow}>
                  <View style={styles.offlineDot} />
                  <Text style={styles.offlineStatusText}>100% Offline On-Device</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.chatBotIconHeader} onPress={createNewChat}>
                <Plus size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

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

              {/* CHAT INPUT BAR */}
              <View style={styles.chatInputBar}>
                <TouchableOpacity
                  style={styles.chatAttachButton}
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
                  <Plus size={22} color="#ffffff" />
                </TouchableOpacity>

                <TextInput
                  style={styles.chatTextInput}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Ask Guru anything offline..."
                  placeholderTextColor="#71717a"
                  multiline
                />

                <TouchableOpacity
                  style={[styles.chatSendButton, (!prompt.trim() && !attachedFileContent) && styles.chatSendButtonDisabled]}
                  disabled={!prompt.trim() && !attachedFileContent}
                  onPress={sendPrompt}
                >
                  <Send size={18} color="#ffffff" />
                </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#121214',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  classBadge: {
    backgroundColor: '#18181b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#24242a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainScroll: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 16,
  },
  greetingBlock: {
    gap: 4,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  greetingSub: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  textbookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
  },
  textbookBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  textbookIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1c1c20',
    borderWidth: 1,
    borderColor: '#2a2a32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textbookTextGroup: {
    flex: 1,
    gap: 2,
  },
  textbookBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  textbookBannerSub: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectFolderCard: {
    width: '48%',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  subjectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectCardPages: {
    fontSize: 11,
    color: '#71717a',
  },
  dualStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  statFocusSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  statSubText: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
  },
  quizCard: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  quizQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e4e4e7',
    lineHeight: 20,
  },
  quizOptionsGrid: {
    gap: 8,
  },
  quizOptionPill: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    fontSize: 13,
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
    gap: 4,
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
    gap: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    backgroundColor: '#18181b',
  },
  newQuizButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  classAwareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  classAwareTextGroup: {
    flex: 1,
    gap: 2,
  },
  classAwareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  classAwareSub: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
  },
  floatingBotButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
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
    gap: 12,
  },
  modalBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitleGroup: {
    flex: 1,
    gap: 2,
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
  pdfSelectionScroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  pdfSubjectHero: {
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 18,
    padding: 24,
    gap: 10,
  },
  pdfSubjectHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  pdfSubjectHeroDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  metaBadge: {
    backgroundColor: '#1c1c22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e2e38',
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectMediumHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 6,
  },
  mediumActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mediumButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  mediumButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  chapterListContainer: {
    gap: 10,
  },
  chapterCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  chapterNumberBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  chapterTextBox: {
    flex: 1,
    gap: 2,
  },
  chapterTitleMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  chapterTitleNe: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  chapterPageInfo: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  askAiForSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 12,
    marginTop: 10,
  },
  askAiForSubjectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  // Real PDF Viewport
  pdfViewportScroll: {
    padding: 18,
    gap: 14,
    paddingBottom: 40,
  },
  pdfHeaderAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pdfHeaderAiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  pdfNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    padding: 14,
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
    gap: 16,
    minHeight: 320,
  },
  pdfDocHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
    paddingBottom: 14,
    gap: 6,
  },
  activeChapterPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  activeChapterPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  pdfDocTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  pdfDocMetaText: {
    fontSize: 11,
    color: '#71717a',
  },
  pdfContentBlock: {
    gap: 6,
  },
  pdfSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
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
    gap: 8,
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 12,
    marginTop: 6,
  },
  askGuruLargeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  // Full-Page Guru AI Chat
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  chatCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderCenter: {
    alignItems: 'center',
    gap: 2,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  offlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  offlineStatusText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '500',
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
    padding: 32,
    gap: 12,
  },
  chatEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  chatEmptySub: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
  },
  chatMessageList: {
    padding: 16,
    gap: 14,
  },
  userMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  botMsgRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    alignItems: 'flex-start',
  },
  botAvatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 6,
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
  },
  chatAttachmentText: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  loadingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingBubbleText: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    backgroundColor: '#000000',
    gap: 10,
  },
  chatAttachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#ffffff',
  },
  chatSendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendButtonDisabled: {
    opacity: 0.3,
  },
});
