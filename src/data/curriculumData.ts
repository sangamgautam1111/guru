// Nepal CDC Curriculum Reference Data for Grade 9 & Grade 10
// Structured for lightweight on-device prompt conditioning and local context injection.
// Designed for compact 2B models (Gemma 4 / LiteRT-LM) on memory-constrained mobile devices.

export interface CurriculumChunk {
  id: string;
  grade: '9' | '10' | 'all';
  subjectId: 'math' | 'optmath' | 'science' | 'social' | 'computer' | 'nepali' | 'english' | 'general';
  topic: string;
  keywords: string[];
  concepts: string;
  formulasOrRules?: string;
  seePattern?: string;
}

export interface GradePromptRule {
  grade: '9' | '10';
  tone: string;
  complexity: string;
  focus: string;
  formatInstruction: string;
}

export const GRADE_PROMPT_RULES: Record<'9' | '10', GradePromptRule> = {
  '9': {
    grade: '9',
    tone: 'Gentle, foundational, encouraging and clear.',
    complexity: 'Introduce concepts from basics. Avoid jumping into complex board exam patterns.',
    focus: 'Concept clarity, accurate definitions, and step-by-step formula applications.',
    formatInstruction: 'Give a concise explanation followed by clear, numbered steps with simplified vocabulary.',
  },
  '10': {
    grade: '10',
    tone: 'Rigorous, exam-oriented, precise and structured for SEE board examinations.',
    complexity: 'Assume core knowledge. Align with Nepal CDC SEE marking criteria.',
    focus: 'Step-by-step mathematical proofs, exact scientific laws, and structured analytical answers.',
    formatInstruction: 'For problems, structure as: Given, Formula, Calculation, Final Answer with units. For theory, use clear concise points.',
  },
};

export const SEE_MARKING_SCHEME_RULES = [
  'Mathematics: Marks are allocated for Given statements, correct formula selection, algebraic steps, and final units.',
  'Science: Definitions must follow CDC standards. Chemical reactions must be balanced. Numerical problems must show formula and calculation.',
  'Social Studies: Historical events require chronological precision. Constitutional questions must reference specific articles where applicable.',
  'Languages (Nepali/English): Strict grammatical accuracy. Structured essays require introduction, body paragraphs, and conclusion.',
];

export const CURRICULUM_DATA: CurriculumChunk[] = [
  // =========================================================================
  // GRADE 9: COMPULSORY MATHEMATICS
  // =========================================================================
  {
    id: 'G9_MATH_SETS',
    grade: '9',
    subjectId: 'math',
    topic: 'Sets & Venn Diagrams',
    keywords: ['set', 'union', 'intersection', 'difference', 'complement', 'venn', 'cardinality'],
    concepts: 'Operations on two intersecting sets, universal set, subset, and two-set Venn diagram representations.',
    formulasOrRules: 'n(A U B) = n(A) + n(B) - n(A ∩ B); n(U) = n(A U B) + n(A U B)\'; n(A - B) = n(A) - n(A ∩ B)',
  },
  {
    id: 'G9_MATH_ARITHMETIC',
    grade: '9',
    subjectId: 'math',
    topic: 'Profit & Loss, Discount, Tax and Home Arithmetic',
    keywords: ['profit', 'loss', 'discount', 'marked price', 'vat', 'tax', 'electricity bill', 'water bill', 'cost price', 'selling price'],
    concepts: 'Calculating percentage profit or loss, trade discount, value added tax (VAT), and basic utility tariff rates.',
    formulasOrRules: 'Discount = Discount% of MP; SP = MP - Discount; VAT Amount = VAT% of SP; SP with VAT = SP + VAT; Profit% = (Profit / CP) * 100',
  },
  {
    id: 'G9_MATH_MENSURATION',
    grade: '9',
    subjectId: 'math',
    topic: 'Plane Figures & Area',
    keywords: ['area', 'perimeter', 'triangle', 'quadrilateral', 'equilateral', 'scalene', 'four walls', 'pathway', 'heron'],
    concepts: 'Area of various triangles, rectangles, pathways inside/outside fields, and surface area of four walls of a room.',
    formulasOrRules: 'Right triangle = (1/2) * b * h; Equilateral triangle = (sqrt(3)/4) * a^2; Scalene (Heron) = sqrt(s(s-a)(s-b)(s-c)) where s = (a+b+c)/2; Area of 4 walls = 2h(l + b)',
  },
  {
    id: 'G9_MATH_ALGEBRA',
    grade: '9',
    subjectId: 'math',
    topic: 'Algebraic Factorization, Indices & Linear Equations',
    keywords: ['factorize', 'indices', 'powers', 'exponent', 'linear equation', 'algebra', 'cube formula'],
    concepts: 'Factorization using sum and difference of cubes, laws of indices, and solving simultaneous linear equations.',
    formulasOrRules: 'a^3 + b^3 = (a + b)(a^2 - ab + b^2); a^3 - b^3 = (a - b)(a^2 + ab + b^2); a^m * a^n = a^(m+n); a^m / a^n = a^(m-n); a^0 = 1; (a^m)^n = a^(mn)',
  },
  {
    id: 'G9_MATH_GEOMETRY',
    grade: '9',
    subjectId: 'math',
    topic: 'Geometry: Triangles and Parallelograms',
    keywords: ['triangle theorem', 'parallelogram', 'congruence', 'interior angles', 'isosceles', 'construction'],
    concepts: 'Theorems on sum of angles of a triangle, properties of isosceles triangles, and opposite sides/angles of parallelograms.',
    formulasOrRules: 'Sum of interior angles of a triangle = 180 degrees; Exterior angle = sum of opposite interior angles; Opposite sides and angles of a parallelogram are equal.',
  },

  // =========================================================================
  // GRADE 10: COMPULSORY MATHEMATICS (SEE BOARD FOCUS)
  // =========================================================================
  {
    id: 'G10_MATH_SETS',
    grade: '10',
    subjectId: 'math',
    topic: 'Three Intersecting Sets & Cardinality',
    keywords: ['three sets', 'union', 'intersection', 'cardinality', 'venn diagram', 'survey', 'exactly two', 'all three'],
    concepts: 'Analysis of real-world survey data using 3-set Venn diagrams and cardinality equations.',
    formulasOrRules: 'n(A U B U C) = n(A) + n(B) + n(C) - n(A∩B) - n(B∩C) - n(C∩A) + n(A∩B∩C); n(U) = n(A U B U C) + n(A U B U C)\'',
    seePattern: 'Mandatory 4-mark question. Must present a labelled Venn diagram alongside formal cardinality equations.',
  },
  {
    id: 'G10_MATH_COMPOUND_INTEREST',
    grade: '10',
    subjectId: 'math',
    topic: 'Compound Interest, Population Dynamics & Depreciation',
    keywords: ['compound interest', 'ci', 'population growth', 'depreciation', 'semi-annual', 'half yearly', 'principal', 'rate'],
    concepts: 'Annual, semi-annual, and quarterly compound interest calculations, compound population growth rate, and fixed asset depreciation.',
    formulasOrRules: 'Yearly CI = P * [(1 + R/100)^T - 1]; Semi-annual CI = P * [(1 + R/200)^(2T) - 1]; Pt = P0 * (1 + R/100)^T; Dt = P0 * (1 - R/100)^T',
    seePattern: 'Comparison between simple and compound interest over different compounding intervals.',
  },
  {
    id: 'G10_MATH_MENSURATION_SOLIDS',
    grade: '10',
    subjectId: 'math',
    topic: 'Mensuration: Cylinder, Sphere, Cone, Hemisphere and Pyramids',
    keywords: ['cylinder', 'sphere', 'hemisphere', 'cone', 'pyramid', 'slant height', 'total surface area', 'curved surface area', 'volume', 'combined solid'],
    concepts: 'Surface area and volume of single and composite three-dimensional solids.',
    formulasOrRules: 'Cylinder: CSA = 2*pi*r*h, TSA = 2*pi*r*(r+h), V = pi*r^2*h; Sphere: SA = 4*pi*r^2, V = (4/3)*pi*r^3; Hemisphere: CSA = 2*pi*r^2, TSA = 3*pi*r^2, V = (2/3)*pi*r^3; Cone: CSA = pi*r*l, TSA = pi*r*(r+l), V = (1/3)*pi*r^2*h where l^2 = r^2 + h^2; Pyramid: V = (1/3)*a^2*h, LSA = 2*a*l',
    seePattern: 'Combined solid word problems (e.g. cone surmounted on a hemisphere or cylinder).',
  },
  {
    id: 'G10_MATH_ALGEBRA_QUADRATIC',
    grade: '10',
    subjectId: 'math',
    topic: 'HCF, LCM, Radical Equations and Quadratic Equations',
    keywords: ['hcf', 'lcm', 'quadratic equation', 'surds', 'radical equation', 'polynomial factorization'],
    concepts: 'Finding HCF and LCM of algebraic expressions, solving radical equations containing surds, and quadratic formula application.',
    formulasOrRules: 'Quadratic formula: x = [-b +- sqrt(b^2 - 4ac)] / (2a); HCF = product of common factors; LCM = product of common and remaining factors',
    seePattern: '4-mark question on radical equation verification to exclude extraneous roots.',
  },
  {
    id: 'G10_MATH_CIRCLE_THEOREMS',
    grade: '10',
    subjectId: 'math',
    topic: 'Theoretical & Experimental Circle Theorems',
    keywords: ['circle theorem', 'circumference angle', 'central angle', 'cyclic quadrilateral', 'semicircle', 'tangent', 'arc'],
    concepts: 'Relationships between central and inscribed angles, angles in the same segment, cyclic quadrilaterals, and tangent properties.',
    formulasOrRules: '1. Central angle = 2 * Inscribed angle standing on the same arc; 2. Inscribed angles in the same segment are equal; 3. Angle in a semi-circle is 90 degrees; 4. Opposite angles of a cyclic quadrilateral sum to 180 degrees.',
    seePattern: 'Both theoretical formal proof (Given, To Prove, Construction, Proof statements/reasons) and experimental table verification are tested.',
  },
  {
    id: 'G10_MATH_PROBABILITY',
    grade: '10',
    subjectId: 'math',
    topic: 'Probability & Tree Diagrams',
    keywords: ['probability', 'tree diagram', 'with replacement', 'without replacement', 'independent event', 'mutually exclusive'],
    concepts: 'Calculating theoretical probabilities using sample spaces and tree diagrams for sequential events.',
    formulasOrRules: 'P(E) = n(E) / n(S); P(A U B) = P(A) + P(B) [mutually exclusive]; P(A ∩ B) = P(A) * P(B) [independent events]',
    seePattern: 'Drawing probability tree diagrams for drawing balls or cards without replacement.',
  },

  // =========================================================================
  // GRADE 9: SCIENCE & TECHNOLOGY
  // =========================================================================
  {
    id: 'G9_SCI_PHYSICS',
    grade: '9',
    subjectId: 'science',
    topic: 'Measurement, Force, Motion, Simple Machines and Energy',
    keywords: ['measurement', 'si unit', 'fundamental unit', 'derived unit', 'force', 'equations of motion', 'velocity ratio', 'mechanical advantage', 'efficiency', 'work', 'power'],
    concepts: 'Fundamental and derived physical quantities, dimensional consistency, equations of linear motion, and principles of simple machines.',
    formulasOrRules: 'v = u + at; s = ut + 0.5*a*t^2; v^2 = u^2 + 2as; MA = Load / Effort; VR = Distance moved by effort / Distance moved by load; Efficiency = (MA / VR) * 100%; Work = F * d; Power = Work / time',
  },
  {
    id: 'G9_SCI_CHEMISTRY',
    grade: '9',
    subjectId: 'science',
    topic: 'Atomic Structure, Chemical Bonding, Valency and Solutions',
    keywords: ['atom', 'proton', 'neutron', 'electron', 'valency', 'chemical formula', 'solubility', 'saturated', 'unsaturated', 'supersaturated', 'crystallization'],
    concepts: 'Bohr-Rutherford atomic structure, electronic configurations of elements 1-20, chemical bonding basics, solubility curves and crystallization.',
    formulasOrRules: 'Solubility = (Mass of solute / Mass of solvent) * 100 at constant temperature.',
  },
  {
    id: 'G9_SCI_BIOLOGY',
    grade: '9',
    subjectId: 'science',
    topic: 'Five Kingdom Classification, Plant/Animal Tissues and Cell Division',
    keywords: ['classification', 'five kingdom', 'monera', 'protista', 'fungi', 'plantae', 'animalia', 'algae', 'bryophyta', 'pteridophyta', 'gymnosperm', 'angiosperm', 'mitosis', 'meiosis'],
    concepts: 'Whittaker five-kingdom taxonomy, division of plant kingdom, characteristic features of invertebrate phyla, and cell division fundamentals.',
  },

  // =========================================================================
  // GRADE 10: SCIENCE & TECHNOLOGY (SEE BOARD FOCUS)
  // =========================================================================
  {
    id: 'G10_SCI_PHYSICS',
    grade: '10',
    subjectId: 'science',
    topic: 'Gravitation, Fluid Pressure, Heat, Light and Electricity',
    keywords: ['gravity', 'gravitation', 'acceleration due to gravity', 'pascal law', 'archimedes principle', 'upthrust', 'floatation', 'specific heat capacity', 'refraction', 'lens', 'transformer'],
    concepts: 'Newton universal law of gravitation, variation of g with height/depth, hydraulic systems, buoyancy, thermal capacity, optical lenses, and AC transformers.',
    formulasOrRules: 'F = G*(m1*m2)/d^2 where G = 6.67e-11 N*m^2/kg^2; g = G*M/R^2; Pressure P = F/A = h*d*g; Pascal law: F1/A1 = F2/A2; Upthrust = V*d*g = weight of displaced liquid; Heat Q = m*s*dT; Lens formula: 1/f = 1/v - 1/u; Transformer: Vp/Vs = Np/Ns = Is/Ip',
    seePattern: 'Numerical calculations on gravitation, hydraulic lift, heat exchange principle, and conceptual reasoning questions on buoyancy and lenses.',
  },
  {
    id: 'G10_SCI_CHEMISTRY',
    grade: '10',
    subjectId: 'science',
    topic: 'Modern Periodic Table, Chemical Kinetics, Industrial Gases, Metals and Hydrocarbons',
    keywords: ['periodic table', 'modern periodic law', 'chemical reaction', 'catalyst', 'ammonia', 'carbon dioxide', 'haber process', 'iron', 'aluminum', 'copper', 'hydrocarbon', 'alkane', 'alkene', 'alkyne'],
    concepts: 'Moseley modern periodic law, factors affecting reaction rate, laboratory preparation of CO2 and NH3 gases, metallurgy of Fe/Al/Cu, and IUPAC hydrocarbon structures.',
    formulasOrRules: 'CO2 Lab prep: CaCO3 + 2HCl -> CaCl2 + H2O + CO2; NH3 Lab prep: 2NH4Cl + Ca(OH)2 -> CaCl2 + 2H2O + 2NH3; General formulas: Alkane CnH2n+2, Alkene CnH2n, Alkyne CnH2n-2',
    seePattern: 'Laboratory preparation apparatus diagrams, conditions (temperature, pressure, catalyst), and balanced molecular equations.',
  },
  {
    id: 'G10_SCI_BIOLOGY',
    grade: '10',
    subjectId: 'science',
    topic: 'Invertebrate Life Cycles, Nervous/Endocrine System, Blood Circulation and Genetics',
    keywords: ['silkworm', 'honey bee', 'life cycle', 'neuron', 'brain', 'hormone', 'pituitary', 'thyroid', 'heart', 'circulation', 'mendel law', 'monohybrid cross', 'chromosome', 'sex determination'],
    concepts: 'Complete metamorphosis in economic insects, human nervous coordination, hormone regulation, double circulation through four heart chambers, and Mendelian inheritance.',
    formulasOrRules: 'Monohybrid cross phenotypic ratio = 3:1, genotypic ratio = 1:2:1; Sex determination: 44+XX (female), 44+XY (male).',
    seePattern: 'Punnett square genetic crosses, structural labeling of human heart/neuron, and life cycle stage comparison tables.',
  },
  {
    id: 'G10_SCI_EARTH_SPACE',
    grade: '10',
    subjectId: 'science',
    topic: 'Geological Time Scale, Climate Change and Astronomical Universe',
    keywords: ['geological time scale', 'era', 'precambrian', 'paleozoic', 'mesozoic', 'cenozoic', 'climate change', 'greenhouse effect', 'comet', 'meteor', 'meteorite', 'galaxy', 'black hole'],
    concepts: 'Evolutionary milestones across geological eras, anthropogenic greenhouse dynamics, and celestial mechanics of solar system debris.',
    seePattern: 'Differentiating meteors from meteorites, identifying dominant life forms per era (e.g. Mesozoic = dinosaurs/reptiles; Cenozoic = mammals/birds).',
  },

  // =========================================================================
  // GRADE 10: OPTIONAL MATHEMATICS (SEE BOARD FOCUS)
  // =========================================================================
  {
    id: 'G10_OPTMATH_ALGEBRA_MATRICES',
    grade: '10',
    subjectId: 'optmath',
    topic: 'Functions, Polynomials, Matrices and Determinants',
    keywords: ['composite function', 'inverse function', 'remainder theorem', 'factor theorem', 'matrix inverse', 'determinant', 'cramer rule', 'matrix equation'],
    concepts: 'Algebra of functions, polynomial root factorization using synthetic division, determinant of 2x2 matrix, inverse matrices, and simultaneous linear solving.',
    formulasOrRules: 'f(g(x)) composite; f^-1(x) inverse; Determinant |A| = ad - bc; A^-1 = (1/|A|) * [d, -b; -c, a]; Cramer rule: x = Dx/D, y = Dy/D',
    seePattern: 'Solving systems of equations using matrix method and determining inverse/composite function values.',
  },
  {
    id: 'G10_OPTMATH_COORDINATE_TRIGONOMETRY',
    grade: '10',
    subjectId: 'optmath',
    topic: 'Coordinate Straight Lines & Advanced Trigonometry Identities',
    keywords: ['angle between lines', 'pair of straight lines', 'conic section', 'circle equation', 'multiple angle', 'submultiple angle', 'conditional identity', 'height and distance'],
    concepts: 'Angle between intersecting lines, homogeneous second-degree equations, standard circle equations, multiple/sub-multiple angle transformations, and conditional identities when A+B+C = 180 degrees.',
    formulasOrRules: 'tan(theta) = +- (m1 - m2) / (1 + m1*m2); Homogeneous angle: tan(theta) = +- 2*sqrt(h^2 - ab) / (a + b); Circle: (x - h)^2 + (y - k)^2 = r^2; sin(2A) = 2sinA*cosA; cos(2A) = cos^2A - sin^2A = 2cos^2A - 1 = 1 - 2sin^2A',
    seePattern: 'Complex multi-step trigonometric identity proofs and vector geometry proofs (e.g. diagonals of a rhombus bisect at right angles).',
  },
  {
    id: 'G10_OPTMATH_VECTORS_TRANSFORMATIONS',
    grade: '10',
    subjectId: 'optmath',
    topic: 'Vector Scalar Products, Geometry Proofs & Matrix Transformations',
    keywords: ['vector product', 'dot product', 'scalar product', 'vector geometry', 'matrix transformation', 'reflection', 'rotation', 'enlargement'],
    concepts: 'Dot product of vectors, angle between vectors, coordinate vector proofs of geometric theorems, and 2x2 geometric matrix transformation composition.',
    formulasOrRules: 'a . b = |a| * |b| * cos(theta); cos(theta) = (a1*b1 + a2*b2) / [sqrt(a1^2 + a2^2) * sqrt(b1^2 + b2^2)]; Perpendicular vectors: a . b = 0',
  },

  // =========================================================================
  // SOCIAL STUDIES (GRADE 9 & 10)
  // =========================================================================
  {
    id: 'G10_SOCIAL_HISTORY',
    grade: 'all',
    subjectId: 'social',
    topic: 'Modern History of Nepal & Democratic Movements',
    keywords: ['rana regime', 'kot massacre', 'jung bahadur', '2007 bs', '2017 bs', '2046 bs', '2062 2063 bs', 'democracy movement', 'loktantra', 'republic'],
    concepts: 'Establishment of Rana autocracy, revolution of 2007 BS, royal takeover of 2017 BS, restoration of democracy in 2046 BS, and the historic People Movement of 2062/63 BS leading to federal republic.',
    seePattern: 'Chronological timeline formatting and structured causes/consequences analysis.',
  },
  {
    id: 'G10_SOCIAL_GEOGRAPHY_MAP',
    grade: 'all',
    subjectId: 'social',
    topic: 'Physical & Economic Geography of Nepal & Map Work',
    keywords: ['geography', 'himalayan', 'hilly', 'terai', 'climate', 'map of nepal', 'rivers', 'national parks', 'agriculture', 'hydropower'],
    concepts: 'Topographical divisions, climatic characteristics, socioeconomic lifestyle across geographical belts, natural resource distribution, and outline map-pointing.',
    seePattern: 'Mandatory 4-mark outline map of Nepal with four specific geographic, cultural, or economic locations.',
  },
  {
    id: 'G10_SOCIAL_CIVICS_CONSTITUTION',
    grade: 'all',
    subjectId: 'social',
    topic: 'Constitution of Nepal 2072, Federal Governance and International Relations',
    keywords: ['constitution of nepal 2072', 'fundamental rights', 'federalism', 'executive', 'legislative', 'judiciary', 'united nations', 'un specialized agencies', 'non aligned movement', 'foreign policy'],
    concepts: 'Key provisions of the 2072 Constitution, three tiers of government (Federal, Provincial, Local), separation of powers, role of the UN, and foreign policy principles of non-alignment and Panchasheel.',
  },

  // =========================================================================
  // COMPUTER SCIENCE (GRADE 9 & 10)
  // =========================================================================
  {
    id: 'G9_G10_COMPUTER_FUNDAMENTALS',
    grade: 'all',
    subjectId: 'computer',
    topic: 'Computer System, Number Systems, Boolean Logic and Cyber Law',
    keywords: ['number system', 'binary', 'octal', 'hexadecimal', 'boolean logic', 'logic gates', 'and gate', 'or gate', 'not gate', 'cyber law', 'it policy', 'computer ethics', 'virus', 'cyber security'],
    concepts: 'Radix conversions between Binary, Octal, Decimal, and Hexadecimal; truth tables for fundamental and universal logic gates; Cyber crime provisions under Nepal Electronic Transactions Act (ETA 2063).',
    formulasOrRules: 'Radix values: Binary = 2, Octal = 8, Decimal = 10, Hexadecimal = 16; Universal gates: NAND and NOR.',
  },
  {
    id: 'G10_COMPUTER_PROGRAMMING_DBMS',
    grade: '10',
    subjectId: 'computer',
    topic: 'Database Management Systems (MS Access), Modular QBASIC & C Programming',
    keywords: ['dbms', 'ms access', 'primary key', 'data types', 'field', 'record', 'table', 'qbasic', 'sub procedure', 'function procedure', 'c language', 'modular programming', 'loop', 'array'],
    concepts: 'Relational database concepts, normalization, primary keys in MS Access, sub and function modular programming syntax in QBASIC, and core structured programming syntax in C.',
    formulasOrRules: 'QBASIC Modular: DECLARE SUB name(), SUB name() ... END SUB; DECLARE FUNCTION name() ... END FUNCTION; C syntax: #include <stdio.h>, int main() { return 0; }',
    seePattern: 'Debugging short QBASIC code blocks, tracing loops, and writing modular functions to reverse strings or calculate factorials.',
  },

  // =========================================================================
  // NEPALI GRAMMAR & COMPOSITION (GRADE 9 & 10)
  // =========================================================================
  {
    id: 'G9_G10_NEPALI_BYAKARAN',
    grade: 'all',
    subjectId: 'nepali',
    topic: 'Nepali Byakaran: Shabda Barga, Pad Sangati, Kaal ra Paksha, Karak ra Bibhakti',
    keywords: ['shabda barga', 'pad sangati', 'kaal', 'paksha', 'karak', 'bibhakti', 'shabda nirman', 'upasarga', 'pratyaya', 'samash', 'karan akaran', 'bhabya', 'nibandha', 'chithi'],
    concepts: 'Word class identification (Naam, Sarbanaam, Bisheshan, Kriyapad, Abyaya), subject-verb grammatical concord (Linga, Bachan, Purush, Aadar), tense-aspect inflection, case endings, and formal letter/essay structures.',
    formulasOrRules: 'Karak ra Bibhakti: Karta (Prathama - le), Karma (Dwitiya - lai), Karan (Tritiya - le/dwara), Sampradan (Chaturthi - lai/lagi), Apadan (Panchami - bata/dekhi), Sambandha (Sasthi - ko/ka/ki), Adhikaran (Saptami - ma).',
    seePattern: 'Sentence transformation (Karan/Akaran, Bachya pariwartan), error correction (Shuddha/Ashuddha), and 150-word structured essays.',
  },

  // =========================================================================
  // ENGLISH GRAMMAR & WRITING (GRADE 9 & 10)
  // =========================================================================
  {
    id: 'G9_G10_ENGLISH_GRAMMAR_WRITING',
    grade: 'all',
    subjectId: 'english',
    topic: 'English Grammar Rules, Reported Speech, Voice, Conditionals & Guided Writing',
    keywords: ['reported speech', 'indirect speech', 'passive voice', 'active voice', 'conditional', 'if clause', 'preposition', 'concord', 'subject verb agreement', 'job application', 'formal letter', 'essay', 'book review'],
    concepts: 'Transformation of direct to indirect speech, active to passive voice, conditional types (Zero, First, Second, Third), appropriate prepositions, and official formatting for job applications with CV and critical reviews.',
    formulasOrRules: 'Conditionals: Type 1 (If + Present Simple, will + V1); Type 2 (If + Past Simple, would + V1); Type 3 (If + Past Perfect, would have + V3); Reported speech tense shifts: Present -> Past, Past Simple -> Past Perfect.',
    seePattern: 'Grammar transformation questions (1 mark each) and 8-mark guided writing essays, job applications, or formal letters.',
  },
];
