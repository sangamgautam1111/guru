// ============================================================================
// GURU AI - NEPAL SEE (GRADE 10) CURRICULUM KNOWLEDGE MEMORY BASE
// Extracted & Synthesized from Official Class 10 Textbooks, 2081/2082 Board Sets & Solutions
// ============================================================================

export interface CurriculumUnit {
  unitNumber: number;
  unitName: string;
  unitNameNe: string;
  keyConcepts: string[];
  formulasOrLaws: string[];
  highYieldExamQuestions: {
    question: string;
    marks: number;
    answerSummary: string;
  }[];
  sampleMcqs: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface SubjectCurriculumMemory {
  id: string;
  name: string;
  nameNe: string;
  description: string;
  totalUnits: number;
  units: CurriculumUnit[];
}

export const SEE_CURRICULUM_MEMORY: Record<string, SubjectCurriculumMemory> = {
  // ============================================================================
  // 1. SCIENCE & TECHNOLOGY (विज्ञान तथा प्रविधि)
  // ============================================================================
  science: {
    id: 'science',
    name: 'Science & Technology',
    nameNe: 'विज्ञान तथा प्रविधि',
    description: 'Complete Class 10 SEE Science knowledge covering Physics, Chemistry, Biology, Astronomy and Geology.',
    totalUnits: 15,
    units: [
      {
        unitNumber: 1,
        unitName: 'Scientific Learning & Measurement',
        unitNameNe: 'वैज्ञानिक सिकाइ तथा मापन',
        keyConcepts: [
          'Dependent, independent and controlled variables in scientific experiments.',
          'Formulation of scientific hypothesis and experimental verification.',
          'Standard units of measurement in SI system and error analysis.'
        ],
        formulasOrLaws: [
          'Density = Mass / Volume (d = m/V)',
          'Independent Variable: Variable changed by experimenter.',
          'Dependent Variable: Variable measured as outcome.'
        ],
        highYieldExamQuestions: [
          {
            question: 'What is the difference between independent and dependent variables with an example?',
            marks: 2,
            answerSummary: 'Independent variable is changed by the experimenter (e.g. temperature), while dependent variable is the responding outcome measured (e.g. solubility of solute).'
          }
        ],
        sampleMcqs: [
          {
            question: 'In an experiment measuring how temperature affects salt dissolution rate, the temperature is the:',
            options: ['Dependent variable', 'Independent variable', 'Controlled variable', 'Constant error'],
            correctIndex: 1,
            explanation: 'Temperature is deliberately altered by the experimenter, making it the independent variable.'
          }
        ]
      },
      {
        unitNumber: 3,
        unitName: 'Classification of Living Beings',
        unitNameNe: 'जीवहरूको वर्गीकरण',
        keyConcepts: [
          'Five Kingdom Classification: Monera, Protista, Fungi, Plantae, Animalia.',
          'Plant Divisions: Algae, Bryophyta, Pteridophyta, Gymnosperms, Angiosperms (Monocot & Dicot).',
          'Invertebrate Phyla (Porifera to Echinodermata) and Chordates (Pisces, Amphibia, Reptilia, Aves, Mammalia).'
        ],
        formulasOrLaws: [
          'Whittaker Five Kingdom Classification System.',
          'Bentham and Hooker Plant Classification System.'
        ],
        highYieldExamQuestions: [
          {
            question: 'Why is Octopus placed in Phylum Mollusca rather than Echinodermata?',
            marks: 2,
            answerSummary: 'Octopus has a soft, unsegmented body with a muscular foot and lacks the spiny skin and water vascular system characteristic of echinoderms.'
          },
          {
            question: 'Differentiate between Pteridophytes and Bryophytes with examples.',
            marks: 2,
            answerSummary: 'Bryophytes lack vascular tissues and true roots (e.g. Riccia, Moss), while Pteridophytes possess vascular tissues (Xylem & Phloem) and true roots, stems, and leaves (e.g. Fern).'
          }
        ],
        sampleMcqs: [
          {
            question: 'Which of the following plants has vascular tissue but does not produce seeds?',
            options: ['Spirogyra', 'Marchantia', 'Fern (Pteridophyta)', 'Cycas'],
            correctIndex: 2,
            explanation: 'Pteridophytes like Ferns have vascular tissues (xylem/phloem) but reproduce through spores rather than seeds.'
          }
        ]
      },
      {
        unitNumber: 5,
        unitName: 'Heredity & Genetics',
        unitNameNe: 'वंशानुक्रम तथा वंशाणुशास्त्र',
        keyConcepts: [
          'Mitosis cell division (growth & repair) and Meiosis cell division (gamete formation).',
          'DNA structure (double helix, nucleotides A-T, G-C) and RNA.',
          'Mendelism: Monohybrid cross (3:1 phenotypic, 1:2:1 genotypic ratio), Law of Segregation, Law of Independent Assortment.'
        ],
        formulasOrLaws: [
          'Mendel Law of Dominance.',
          'Mendel Law of Purity of Gametes (Segregation).',
          'Mendel Law of Independent Assortment (Dihybrid 9:3:3:1 ratio).'
        ],
        highYieldExamQuestions: [
          {
            question: 'Show the phenotypic and genotypic ratio of a monohybrid cross in F2 generation using a Punnett square.',
            marks: 3,
            answerSummary: 'Crossing pure tall (TT) and pure dwarf (tt) gives Tt (all tall) in F1. In F2: TT, Tt, Tt, tt resulting in Phenotypic Ratio 3:1 (Tall:Dwarf) and Genotypic Ratio 1:2:1 (TT:Tt:tt).'
          }
        ],
        sampleMcqs: [
          {
            question: 'What is the genotypic ratio of the F2 generation in Mendel monohybrid cross?',
            options: ['3:1', '1:2:1', '9:3:3:1', '1:1:1:1'],
            correctIndex: 1,
            explanation: 'The genotypic ratio of F2 in a monohybrid cross is 1 TT : 2 Tt : 1 tt (1:2:1).'
          }
        ]
      },
      {
        unitNumber: 7,
        unitName: 'Motion and Force',
        unitNameNe: 'चाल र बल',
        keyConcepts: [
          'Newton Universal Law of Gravitation: Force directly proportional to product of masses and inversely proportional to square of distance.',
          'Acceleration due to gravity (g) and variation with altitude, depth, and latitude.',
          'Free fall, weightlessness, and mass vs weight.',
          'Fluid Pressure, Pascal Law, Hydraulic Machines, Archimedes Principle, Law of Flotation.'
        ],
        formulasOrLaws: [
          'F = G * (m1 * m2) / d^2 (where G = 6.67 x 10^-11 N m^2/kg^2)',
          'g = GM / R^2 (Earth surface: approx 9.8 m/s^2)',
          'Fluid Pressure P = h * rho * g',
          'Pascal Law: F1 / A1 = F2 / A2',
          'Law of Flotation: Weight of floating body = Weight of displaced liquid'
        ],
        highYieldExamQuestions: [
          {
            question: 'If the mass of an object is 49 kg on the Moon, calculate its weight on Earth (g = 9.8 m/s^2).',
            marks: 2,
            answerSummary: 'Mass remains constant everywhere (m = 49 kg). Weight on Earth = m * g = 49 * 9.8 = 480.2 N (or 490 N with g=10 m/s^2).'
          },
          {
            question: 'State Pascal Law and explain how it is used in hydraulic brakes.',
            marks: 3,
            answerSummary: 'Pascal law states that pressure exerted on an enclosed liquid is transmitted equally and undiminished in all directions. In hydraulic brakes, a small force applied on the brake pedal creates pressure that transmits to larger pistons at wheels, creating large stopping force.'
          }
        ],
        sampleMcqs: [
          {
            question: 'What happens to the gravitational force between two bodies if the distance between their centers is halved?',
            options: ['Halved', 'Doubled', 'Increases 4 times', 'Remains unchanged'],
            correctIndex: 2,
            explanation: 'Since F is inversely proportional to d^2, when distance is halved (1/2), force becomes 1/(1/2)^2 = 4 times greater.'
          },
          {
            question: 'Which machine works based on Pascal Law?',
            options: ['Hydraulic Press', 'Hydrometer', 'Submarine', 'Lactometer'],
            correctIndex: 0,
            explanation: 'Hydraulic presses, lifts, and brakes operate directly on Pascal principle of liquid pressure transmission.'
          }
        ]
      },
      {
        unitNumber: 9,
        unitName: 'Heat & Thermodynamics',
        unitNameNe: 'ताप तथा ऊष्मा',
        keyConcepts: [
          'Heat energy vs Temperature (measure of average kinetic energy).',
          'Specific heat capacity of water (4200 J/kg°C) and its climatic significance.',
          'Principle of Calorimetry (Heat lost = Heat gained).',
          'Anomalous expansion of water between 0°C and 4°C.'
        ],
        formulasOrLaws: [
          'Heat Equation: Q = m * s * dt (where s is specific heat capacity)',
          'Principle of Calorimetry: m1 * s1 * (t1 - t) = m2 * s2 * (t - t2)'
        ],
        highYieldExamQuestions: [
          {
            question: 'Why is water used as a coolant in vehicle radiators?',
            marks: 2,
            answerSummary: 'Water has a very high specific heat capacity (4200 J/kg°C), meaning it can absorb large amounts of heat with only a small rise in temperature.'
          }
        ],
        sampleMcqs: [
          {
            question: 'The specific heat capacity of water is:',
            options: ['2100 J/kg°C', '4200 J/kg°C', '380 J/kg°C', '910 J/kg°C'],
            correctIndex: 1,
            explanation: 'Pure water has a specific heat capacity of 4200 J/kg°C.'
          }
        ]
      },
      {
        unitNumber: 10,
        unitName: 'Wave, Light and Sound',
        unitNameNe: 'तरङ्ग, प्रकाश र ध्वनि',
        keyConcepts: [
          'Refraction of light, Refractive index, Total Internal Reflection & Critical angle.',
          'Convex and Concave Lenses, Ray diagrams, Lens Formula, Power of Lens (Diopter).',
          'Human Eye defects: Myopia (short-sightedness, corrected with concave lens) and Hypermetropia (long-sightedness, corrected with convex lens).'
        ],
        formulasOrLaws: [
          'Snell Law: n = sin(i) / sin(r)',
          'Lens Formula: 1/f = 1/u + 1/v',
          'Power of Lens: P = 1 / f (in meters), unit is Diopter (D)'
        ],
        highYieldExamQuestions: [
          {
            question: 'A person cannot clearly see objects situated farther than 1.5 m. Identify the eye defect and state the lens required for correction.',
            marks: 2,
            answerSummary: 'The defect is Myopia (short-sightedness). It is corrected using a Concave (diverging) lens of suitable focal length.'
          }
        ],
        sampleMcqs: [
          {
            question: 'What is the power of a convex lens with focal length 50 cm (0.5 m)?',
            options: ['+0.5 D', '+2.0 D', '-2.0 D', '+5.0 D'],
            correctIndex: 1,
            explanation: 'Power P = 1 / f(m) = 1 / 0.5 = +2.0 Diopters.'
          }
        ]
      },
      {
        unitNumber: 11,
        unitName: 'Electricity and Magnetism',
        unitNameNe: 'विद्युत् र चुम्बकत्व',
        keyConcepts: [
          'Ohm Law: Current is directly proportional to potential difference across conductor at constant temperature.',
          'Electric power, electrical energy calculation (units = kWh).',
          'Transformers: Step-up and Step-down, Turns ratio equation.',
          'Faraday Laws of Electromagnetic Induction, Electric Motor, Dynamo and AC Generator.'
        ],
        formulasOrLaws: [
          'Ohm Law: V = I * R',
          'Electric Power: P = V * I = I^2 * R = V^2 / R',
          'Energy Consumed: E = P(kW) * t(hours) units (kWh)',
          'Transformer Equation: Vp / Vs = Np / Ns = Is / Ip'
        ],
        highYieldExamQuestions: [
          {
            question: 'Calculate the total electricity cost of running five 100W bulbs for 8 hours daily for 30 days at Rs. 10 per unit.',
            marks: 3,
            answerSummary: 'Total Power = 5 * 100W = 500W = 0.5 kW. Total time = 8 * 30 = 240 hours. Energy = 0.5 * 240 = 120 kWh (units). Total Cost = 120 * Rs 10 = Rs. 1,200.'
          }
        ],
        sampleMcqs: [
          {
            question: 'If a step-up transformer has primary voltage 220V, Np = 100 turns, and Ns = 500 turns, what is the secondary voltage?',
            options: ['44 V', '500 V', '1100 V', '2200 V'],
            correctIndex: 2,
            explanation: 'Vs = Vp * (Ns / Np) = 220 * (500 / 100) = 220 * 5 = 1100 V.'
          }
        ]
      },
      {
        unitNumber: 13,
        unitName: 'Classification of Elements',
        unitNameNe: 'तत्त्वहरूको वर्गीकरण',
        keyConcepts: [
          'Modern Periodic Law: Physical and chemical properties of elements are periodic functions of their atomic numbers.',
          'Subshell electronic configuration based on s, p, d, f blocks.',
          'Periodic trends: Atomic radius, ionization energy, electronegativity across periods and down groups.'
        ],
        formulasOrLaws: [
          'Modern Periodic Law (Moseley, 1913).',
          'Aufbau Principle & Bohr-Bury electronic distribution.'
        ],
        highYieldExamQuestions: [
          {
            question: 'Write the electronic configuration of Calcium (Atomic No. 20) based on subshells (s, p, d, f) and find its position in the modern periodic table.',
            marks: 3,
            answerSummary: 'Ca (20): 1s^2 2s^2 2p^6 3s^2 3p^6 4s^2. Valence electrons in 4s -> Period: 4, Group: IIA (Group 2), Block: s-block.'
          }
        ],
        sampleMcqs: [
          {
            question: 'Which block of the modern periodic table contains transition metals?',
            options: ['s-block', 'p-block', 'd-block', 'f-block'],
            correctIndex: 2,
            explanation: 'Elements in groups 3 to 12 (d-block) are known as transition metals.'
          }
        ]
      },
      {
        unitNumber: 15,
        unitName: 'Gases and Chemical Compounds',
        unitNameNe: 'ग्याँसहरू तथा रासायनिक यौगिकहरू',
        keyConcepts: [
          'Laboratory preparation of Carbon Dioxide: CaCO3 + 2HCl -> CaCl2 + H2O + CO2 (upward displacement of air).',
          'Laboratory preparation of Ammonia: 2NH4Cl + Ca(OH)2 -> CaCl2 + 2H2O + 2NH3 (downward displacement of air, collected in inverted dry gas jar).',
          'Metals: Extraction and properties of Iron (Haematite), Copper (Copper pyrites), Aluminum (Bauxite).',
          'Hydrocarbons: Alkanes, Alkenes, Alkynes, Ethyl alcohol, Glycerol.'
        ],
        formulasOrLaws: [
          'CO2 Lab Prep: CaCO3 + 2HCl -> CaCl2 + H2O + CO2',
          'NH3 Lab Prep: 2NH4Cl + Ca(OH)2 -> CaCl2 + 2H2O + 2NH3'
        ],
        highYieldExamQuestions: [
          {
            question: 'Why is ammonia gas collected by downward displacement of air, and why is the delivery tube passed through a lime tower containing CaO?',
            marks: 3,
            answerSummary: 'Ammonia is lighter than air so collected by downward displacement of air. Calcium oxide (quicklime) in the lime tower absorbs moisture/water vapor to produce dry ammonia gas without reacting with basic NH3.'
          }
        ],
        sampleMcqs: [
          {
            question: 'Which drying agent is used during laboratory preparation of Ammonia gas?',
            options: ['Concentrated H2SO4', 'Anhydrous CaCl2', 'Quicklime (CaO)', 'Phosphorus pentoxide (P2O5)'],
            correctIndex: 2,
            explanation: 'Quicklime (CaO) is basic, so it dries ammonia gas without reacting with it, unlike acidic H2SO4 or CaCl2.'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 2. COMPULSORY MATHEMATICS (अनिवार्य गणित)
  // ============================================================================
  math: {
    id: 'math',
    name: 'Compulsory Mathematics',
    nameNe: 'अनिवार्य गणित',
    description: 'Class 10 SEE Compulsory Mathematics covering Sets, Compound Interest, Mensuration, Algebra, Geometry, Trigonometry, Statistics & Probability.',
    totalUnits: 13,
    units: [
      {
        unitNumber: 1,
        unitName: 'Sets & Venn Diagrams',
        unitNameNe: 'समूह तथा भेनचित्र',
        keyConcepts: [
          'Cardinality relations of two and three overlapping sets.',
          'Venn diagram problem solving for survey data.',
          'Complement of union and symmetric difference.'
        ],
        formulasOrLaws: [
          'n(A U B) = n(A) + n(B) - n(A n B)',
          'n(U) = n(A U B) + n(A U B)c',
          'n(A U B U C) = n(A) + n(B) + n(C) - n(A n B) - n(B n C) - n(C n A) + n(A n B n C) + n(A U B U C)c'
        ],
        highYieldExamQuestions: [
          {
            question: 'In a survey of 100 students, 65 like tea, 45 like coffee, and 15 like neither. How many students like both tea and coffee?',
            marks: 4,
            answerSummary: 'n(U) = 100, n(neither) = 15 => n(T U C) = 85. n(T U C) = n(T) + n(C) - n(T n C) => 85 = 65 + 45 - n(T n C) => n(T n C) = 110 - 85 = 25 students.'
          }
        ],
        sampleMcqs: [
          {
            question: 'If n(A) = 30, n(B) = 25, and n(A n B) = 10, what is n(A U B)?',
            options: ['45', '55', '65', '35'],
            correctIndex: 0,
            explanation: 'n(A U B) = n(A) + n(B) - n(A n B) = 30 + 25 - 10 = 45.'
          }
        ]
      },
      {
        unitNumber: 2,
        unitName: 'Compound Interest & Depreciation',
        unitNameNe: 'चक्रीय ब्याज र ह्रासकट्टी',
        keyConcepts: [
          'Annual, semi-annual, and quarterly compound interest.',
          'Compound depreciation of machinery and assets.',
          'Population growth and decay equations.'
        ],
        formulasOrLaws: [
          'Annual CI Amount: A = P(1 + R/100)^T',
          'Semi-Annual CI Amount: A = P(1 + R/200)^(2T)',
          'Depreciation: VT = V0(1 - R/100)^T',
          'Population Growth: PT = P0(1 + R/100)^T'
        ],
        highYieldExamQuestions: [
          {
            question: 'A person deposited Rs. 50,000 in a bank offering 10% p.a. semi-annual compound interest for 2 years. Find the compound interest earned.',
            marks: 4,
            answerSummary: 'P = 50,000, R = 10%, T = 2. A = 50000 * (1 + 10/200)^(2*2) = 50000 * (1.05)^4 = Rs. 60,775.31. CI = A - P = Rs. 10,775.31.'
          }
        ],
        sampleMcqs: [
          {
            question: 'The value of a motorbike purchased for Rs. 200,000 depreciates at 10% per year. What is its value after 2 years?',
            options: ['Rs. 160,000', 'Rs. 162,000', 'Rs. 180,000', 'Rs. 150,000'],
            correctIndex: 1,
            explanation: 'V2 = 200000 * (1 - 10/100)^2 = 200000 * 0.81 = Rs. 162,000.'
          }
        ]
      },
      {
        unitNumber: 4,
        unitName: 'Mensuration (Cylinder, Cone, Sphere)',
        unitNameNe: 'क्षेत्रमिति (बेलना, सोली, गोला)',
        keyConcepts: [
          'Curved surface area, Total surface area, and Volume of Cylinder, Cone, Sphere, Hemisphere.',
          'Combined solids (Cylinder with conical roof, Hemisphere with cone top).'
        ],
        formulasOrLaws: [
          'Cylinder: CSA = 2*pi*r*h, TSA = 2*pi*r*(r+h), Volume = pi*r^2*h',
          'Cone: Slant height l = sqrt(r^2 + h^2), CSA = pi*r*l, TSA = pi*r*(l+r), Volume = (1/3)*pi*r^2*h',
          'Sphere: TSA = 4*pi*r^2, Volume = (4/3)*pi*r^3',
          'Hemisphere: CSA = 2*pi*r^2, TSA = 3*pi*r^2, Volume = (2/3)*pi*r^3'
        ],
        highYieldExamQuestions: [
          {
            question: 'Find the total surface area and volume of a combined solid made of a cylinder of height 10 cm and radius 7 cm surmounted by a cone of height 24 cm.',
            marks: 5,
            answerSummary: 'r = 7 cm, h_cyl = 10 cm, h_cone = 24 cm. Slant height l = sqrt(7^2 + 24^2) = 25 cm. TSA = Base Area + Cylinder CSA + Cone CSA = pi*r^2 + 2*pi*r*h_cyl + pi*r*l = 22/7 * [49 + 140 + 175] = 22/7 * 364 = 1144 cm^2.'
          }
        ],
        sampleMcqs: [
          {
            question: 'What is the volume of a sphere of radius 3 cm in terms of pi?',
            options: ['12 pi cm^3', '36 pi cm^3', '27 pi cm^3', '18 pi cm^3'],
            correctIndex: 1,
            explanation: 'V = (4/3)*pi*r^3 = (4/3)*pi*(27) = 36 pi cm^3.'
          }
        ]
      },
      {
        unitNumber: 9,
        unitName: 'Geometry - Circle Theorems',
        unitNameNe: 'ज्यामिति - वृत्तका साध्यहरू',
        keyConcepts: [
          'Angle subtended by an arc at the center is double the angle at the circumference.',
          'Inscribed angles subtended by the same arc are equal.',
          'Opposite angles of a cyclic quadrilateral are supplementary (sum = 180°).',
          'Angle in a semi-circle is a right angle (90°).'
        ],
        formulasOrLaws: [
          'Central Angle = 2 * Inscribed Angle (on same arc)',
          'Cyclic Quadrilateral: Angle A + Angle C = 180°, Angle B + Angle D = 180°',
          'Semi-circle Angle = 90°'
        ],
        highYieldExamQuestions: [
          {
            question: 'Theoretically prove that the angle subtended by an arc at the center of a circle is double the angle subtended by the same arc at any point on the circumference.',
            marks: 5,
            answerSummary: 'Given circle with center O and arc AB. Inscribed angle ACB and central angle AOB. Join CO and produce to P. In isosceles triangles AOC and BOC, exterior angle equals sum of interior opposite angles. Adding gives Angle AOB = 2 * Angle ACB.'
          }
        ],
        sampleMcqs: [
          {
            question: 'If an angle at the circumference of a circle is 42°, what is the angle at the center subtended by the same arc?',
            options: ['21°', '42°', '84°', '138°'],
            correctIndex: 2,
            explanation: 'Central angle is double the inscribed angle: 2 * 42° = 84°.'
          }
        ]
      },
      {
        unitNumber: 11,
        unitName: 'Trigonometry (Heights & Distances)',
        unitNameNe: 'त्रिकोणमिति (उचाइ र दुरी)',
        keyConcepts: [
          'Angle of elevation and angle of depression.',
          'Right-angled triangle trigonometric applications: tan = perpendicular / base, sin = perpendicular / hypotenuse.'
        ],
        formulasOrLaws: [
          'tan(theta) = Height / Distance',
          'sin(30°) = 1/2, sin(45°) = 1/sqrt(2), sin(60°) = sqrt(3)/2',
          'tan(30°) = 1/sqrt(3), tan(45°) = 1, tan(60°) = sqrt(3)'
        ],
        highYieldExamQuestions: [
          {
            question: 'A 1.5 m tall observer observes the top of a tower of height 31.5 m from a distance. If the angle of elevation is 45°, find the distance of observer from tower base.',
            marks: 4,
            answerSummary: 'Effective tower height AB = 31.5 - 1.5 = 30 m. tan(45°) = AB / d => 1 = 30 / d => d = 30 m.'
          }
        ],
        sampleMcqs: [
          {
            question: 'If a 10 m tall pole casts a shadow of 10 m on level ground, the angle of elevation of the sun is:',
            options: ['30°', '45°', '60°', '90°'],
            correctIndex: 1,
            explanation: 'tan(theta) = Pole / Shadow = 10 / 10 = 1. Since tan(45°) = 1, theta = 45°.'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 3. COMPUTER SCIENCE (कम्प्युटर विज्ञान)
  // ============================================================================
  computer: {
    id: 'computer',
    name: 'Computer Science',
    nameNe: 'कम्प्युटर विज्ञान',
    description: 'Class 10 Computer Science covering Networking, Cyber Ethics, Database (MS Access), QBASIC Modular & File Programming, and C Programming.',
    totalUnits: 6,
    units: [
      {
        unitNumber: 1,
        unitName: 'Computer Networking & Telecommunication',
        unitNameNe: 'कम्प्युटर नेटवर्किङ तथा दूरसञ्चार',
        keyConcepts: [
          'Network Topologies: Star (central hub/switch), Bus (backbone cable), Ring (token passing), Mesh (point-to-point redundant).',
          'Transmission media: Guided (Twisted pair, Coaxial, Fiber Optic) vs Unguided (Microwave, Radio, Satellite).',
          'Protocols: TCP/IP, HTTP, FTP, SMTP, DNS.'
        ],
        formulasOrLaws: [
          'Bandwidth: Data transfer capacity (Hz or bps).',
          'Client-Server vs Peer-to-Peer architecture.'
        ],
        highYieldExamQuestions: [
          {
            question: 'Why is Star topology more reliable than Bus topology in modern school computer labs?',
            marks: 2,
            answerSummary: 'In Star topology, if one cable fails, only that workstation is disconnected without bringing down the whole network, whereas a break in the Bus backbone collapses the entire network.'
          }
        ],
        sampleMcqs: [
          {
            question: 'Which transmission medium uses light signals and provides the highest bandwidth?',
            options: ['Twisted Pair Cable', 'Coaxial Cable', 'Fiber Optic Cable', 'Infrared'],
            correctIndex: 2,
            explanation: 'Fiber optic cables transmit data as pulses of light through glass cores at very high bandwidth and zero electromagnetic interference.'
          }
        ]
      },
      {
        unitNumber: 2,
        unitName: 'Database Management System (DBMS)',
        unitNameNe: 'डेटाबेस व्यवस्थापन प्रणाली',
        keyConcepts: [
          'Database objects in MS Access: Tables (store data), Queries (retrieve filtered data), Forms (user-friendly input), Reports (formatted printable output).',
          'Primary Key: Unique identifier for each record preventing duplication.',
          'Data types: Text, Number, Date/Time, Currency, AutoNumber, Yes/No, OLE Object.'
        ],
        formulasOrLaws: [
          'Relational Database Rules (Codd RDBMS principles).',
          'Primary Key & Foreign Key relationship.'
        ],
        highYieldExamQuestions: [
          {
            question: 'Define Primary Key and explain its importance in database design.',
            marks: 2,
            answerSummary: 'A Primary Key is a field or set of fields that uniquely identifies each record in a database table. It ensures no duplicate records exist and establishes relationships with other tables.'
          }
        ],
        sampleMcqs: [
          {
            question: 'Which database object is used to display and print formatted summary reports for school administration?',
            options: ['Table', 'Query', 'Form', 'Report'],
            correctIndex: 3,
            explanation: 'Reports are specifically designed to format, summarize, and present printable data from tables or queries.'
          }
        ]
      },
      {
        unitNumber: 3,
        unitName: 'Modular Programming in QBASIC',
        unitNameNe: 'क्युबेसिकमा मोड्युलर प्रोग्रामिङ',
        keyConcepts: [
          'SUB Procedures (called via CALL statement, does not return a direct value to its name).',
          'FUNCTION Procedures (returns a single value to its name, called directly in expressions).',
          'Actual parameters (arguments passed in call) vs Formal parameters (variables in definition).'
        ],
        formulasOrLaws: [
          'DECLARE SUB name (parameters)',
          'DECLARE FUNCTION name (parameters)',
          'CALL name (arguments)'
        ],
        highYieldExamQuestions: [
          {
            question: 'Write a program in QBASIC using a FUNCTION procedure to calculate the area of a circle (Area = pi * r^2).',
            marks: 4,
            answerSummary: 'DECLARE FUNCTION Area(r)\nCLS\nINPUT "Enter radius: ", rad\nPRINT "Area = "; Area(rad)\nEND\n\nFUNCTION Area(r)\nArea = 3.1416 * r * r\nEND FUNCTION'
          }
        ],
        sampleMcqs: [
          {
            question: 'Which procedure in QBASIC returns a value to its own name?',
            options: ['SUB procedure', 'FUNCTION procedure', 'GOTO loop', 'DATA statement'],
            correctIndex: 1,
            explanation: 'FUNCTION procedures are designed to return a single computed value directly to the function name.'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 4. SOCIAL STUDIES (सामाजिक अध्ययन)
  // ============================================================================
  social: {
    id: 'social',
    name: 'Social Studies',
    nameNe: 'सामाजिक अध्ययन',
    description: 'Class 10 Social Studies covering Nepal Constitution, Federalism, Human Rights, History, Geography, and Foreign Policy.',
    totalUnits: 7,
    units: [
      {
        unitNumber: 1,
        unitName: 'Civic Consciousness & Constitution of Nepal',
        unitNameNe: 'नागरिक चेतना तथा नेपालको संविधान',
        keyConcepts: [
          'Constitution of Nepal 2072: Federal Democratic Republic, 35 parts, 308 articles, 9 schedules.',
          'Fundamental Rights (Articles 16-46): Right to equality, freedom, education, environment, health, child rights.',
          'Three Organs of State: Legislature (Law making), Executive (Implementation), Judiciary (Interpretation).'
        ],
        formulasOrLaws: [
          'Separation of Powers & Checks and Balances doctrine.',
          'Federal Structure: 7 Provinces, 753 Local Governments, Federal Parliament.'
        ],
        highYieldExamQuestions: [
          {
            question: 'Explain the composition of the Federal Parliament of Nepal as per Constitution 2072.',
            marks: 4,
            answerSummary: 'Federal Parliament is bicameral: House of Representatives (275 members - 165 FPTP + 110 Proportional) and National Assembly (59 members - 56 elected from 7 provinces + 3 nominated by President).'
          }
        ],
        sampleMcqs: [
          {
            question: 'How many total members are in the House of Representatives (Pratinidhi Sabha) of Nepal?',
            options: ['205', '275', '334', '601'],
            correctIndex: 1,
            explanation: 'The House of Representatives has 275 members (165 through first-past-the-post and 110 proportional representation).'
          }
        ]
      },
      {
        unitNumber: 2,
        unitName: 'International Relations & Global Organizations',
        unitNameNe: 'अन्तर्राष्ट्रिय सम्बन्ध तथा विश्व संस्था',
        keyConcepts: [
          'United Nations Organization (UNO) and specialized agencies (UNESCO, UNICEF, WHO, UNDP).',
          'Regional cooperation: SAARC, BIMSTEC.',
          'Principles of Nepal Foreign Policy: Non-alignment (Panchasheel), UN Charter, Sovereign equality.'
        ],
        formulasOrLaws: [
          'Panchasheel 5 Principles of Peaceful Coexistence.'
        ],
        highYieldExamQuestions: [
          {
            question: 'Mention any four principles of Panchasheel that guide Nepal foreign policy.',
            marks: 4,
            answerSummary: '1. Mutual respect for each other territorial integrity and sovereignty. 2. Mutual non-aggression. 3. Mutual non-interference in internal affairs. 4. Equality and mutual benefit. 5. Peaceful co-existence.'
          }
        ],
        sampleMcqs: [
          {
            question: 'Where is the permanent secretariat of SAARC located?',
            options: ['New Delhi, India', 'Kathmandu, Nepal', 'Colombo, Sri Lanka', 'Dhaka, Bangladesh'],
            correctIndex: 1,
            explanation: 'The SAARC Secretariat is headquartered in Kathmandu, Nepal.'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 5. COMPULSORY ENGLISH (अंग्रेजी)
  // ============================================================================
  english: {
    id: 'english',
    name: 'Compulsory English',
    nameNe: 'अंग्रेजी',
    description: 'Class 10 English curriculum covering Reading Comprehension, Grammar transformations, and Guided/Free Writing.',
    totalUnits: 10,
    units: [
      {
        unitNumber: 1,
        unitName: 'Grammar Transformations & Syntax',
        unitNameNe: 'व्याकरण तथा वाक्य संरचना',
        keyConcepts: [
          'Tense and Aspect: Present/Past/Future perfect, continuous, simple.',
          'Voice: Active to Passive (object fronting, appropriate by-phrase).',
          'Reported Speech: Direct to Indirect (tense shift, pronoun change, time word conversion).',
          'Conditionals: Zero, First (Real), Second (Hypothetical), Third (Impossible past).'
        ],
        formulasOrLaws: [
          'Conditional 1: If + Simple Present, ... will/can + V1',
          'Conditional 2: If + Simple Past, ... would/could + V1',
          'Conditional 3: If + Past Perfect (had+V3), ... would have + V3',
          'Passive Voice: Subject + auxiliary be + Past Participle (V3) + by object'
        ],
        highYieldExamQuestions: [
          {
            question: 'Change into passive voice: "The students have completed the project."',
            marks: 1,
            answerSummary: '"The project has been completed by the students."'
          },
          {
            question: 'Change into indirect speech: She said, "I will visit Pokhara tomorrow."',
            marks: 1,
            answerSummary: 'She said that she would visit Pokhara the following day.'
          }
        ],
        sampleMcqs: [
          {
            question: 'If she studied hard, she _______ the board exam with distinction.',
            options: ['will pass', 'would pass', 'would have passed', 'passes'],
            correctIndex: 1,
            explanation: 'This is a Second Conditional (If + simple past "studied"), which requires "would + V1" (would pass).'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 6. COMPULSORY NEPALI (अनिवार्य नेपाली)
  // ============================================================================
  nepali: {
    id: 'nepali',
    name: 'Compulsory Nepali',
    nameNe: 'अनिवार्य नेपाली',
    description: 'कक्षा १० अनिवार्य नेपाली: व्याकरण (शब्दवर्ग, काल, वाच्य, पदसङ्गति), बोध, सारांश, सप्रसङ्ग व्याख्या र निबन्ध।',
    totalUnits: 10,
    units: [
      {
        unitNumber: 1,
        unitName: 'नेपाली व्याकरण (शब्दवर्ग, काल र वाच्य)',
        unitNameNe: 'नेपाली व्याकरण',
        keyConcepts: [
          'शब्दवर्ग पहिचान: नाम, सर्वनाम, विशेषण, क्रियापद, नामयोगी, क्रियायोगी, संयोजक, विस्मयादिबोधक, निपात।',
          'काल र पक्ष: वर्तमान (सामान्य, अपूर्ण, पूर्ण), भूत (सामान्य, अपूर्ण, पूर्ण, अज्ञात, अभ्यस्त), भविष्यत् (सामान्य, अपूर्ण, पूर्ण)।',
          'वाच्य परिवर्तन: कर्तृवाच्य, कर्मवाच्य, भाववाच्य।',
          'पदसङ्गति: लिङ्ग, वचन, पुरुष र आदर अनुसार क्रियापदको सङ्गति।'
        ],
        formulasOrLaws: [
          'कर्मवाच्य नियम: कर्तामा "द्वारा/बाट" जोड्ने, कर्मलाई मुख्य बनाउने, धातुमा "इ" प्रत्यय लगाउने।',
          'भाववाच्य नियम: अकर्मक धातुमा "इ" प्रत्यय र सधैँ तृतीय पुरुष एकवचन क्रियापद।'
        ],
        highYieldExamQuestions: [
          {
            question: 'वाच्य परिवर्तन गर्नुहोस्: "रामले मीठो कविता लेख्यो।" (कर्मवाच्यमा)',
            marks: 1,
            answerSummary: 'रामद्वारा मीठो कविता लेखियो।'
          },
          {
            question: 'कोष्ठकमा दिइएको निर्देशन अनुसार वाक्य परिवर्तन गर्नुहोस्: "ऊ दिनहुँ फुटबल खेल्थ्यो।" (पूर्ण भूतमा)',
            marks: 1,
            answerSummary: 'उसले दिनहुँ फुटबल खेलेको थियो।'
          }
        ],
        sampleMcqs: [
          {
            question: '"हामीले वातावरण सफा राख्नुपर्छ" वाक्यमा "सफा" शब्द कुन शब्दवर्ग अन्तर्गत पर्दछ?',
            options: ['नाम', 'सर्वनाम', 'विशेषण', 'क्रियायोगी'],
            correctIndex: 2,
            explanation: '"सफा" शब्दले वातावरणको विशेषता जनाउने भएकाले यो विशेषण हो।'
          }
        ]
      }
    ]
  },

  // ============================================================================
  // 7. OPTIONAL MATHEMATICS (ऐच्छिक गणित)
  // ============================================================================
  opt_math: {
    id: 'opt_math',
    name: 'Optional Mathematics',
    nameNe: 'ऐच्छिक गणित',
    description: 'Class 10 Optional Mathematics: Functions, Matrices, Coordinate Geometry, Trigonometry, Vectors & Statistics.',
    totalUnits: 9,
    units: [
      {
        unitNumber: 1,
        unitName: 'Matrices & Determinants',
        unitNameNe: 'म्याट्रिक्स तथा डिटरमिनेन्ट',
        keyConcepts: [
          'Determinant of 2x2 matrix: det(A) = ad - bc.',
          'Singular matrix (det=0) vs Non-singular matrix (det!=0).',
          'Inverse of a Matrix: A^-1 = (1/det(A)) * Adjoint(A).',
          'Solving simultaneous linear equations by Matrix method and Cramer Rule.'
        ],
        formulasOrLaws: [
          'A^-1 = 1/(ad - bc) * [[d, -b], [-c, a]]',
          'Cramer Rule: x = D1/D, y = D2/D'
        ],
        highYieldExamQuestions: [
          {
            question: 'Solve the system of equations by matrix method: 2x + 3y = 8 and 3x - y = 1.',
            marks: 4,
            answerSummary: '[[2, 3], [3, -1]] * [[x], [y]] = [[8], [1]]. D = -2 - 9 = -11. A^-1 = -1/11 * [[-1, -3], [-3, 2]]. X = A^-1 * B gives x = 1, y = 2.'
          }
        ],
        sampleMcqs: [
          {
            question: 'If the matrix [[k, 6], [2, 4]] is singular, what is the value of k?',
            options: ['2', '3', '4', '6'],
            correctIndex: 1,
            explanation: 'For a singular matrix, det = 0 => (4k - 12) = 0 => 4k = 12 => k = 3.'
          }
        ]
      },
      {
        unitNumber: 2,
        unitName: 'Coordinate Geometry (Lines & Circles)',
        unitNameNe: 'निर्देशाङ्क ज्यामिति',
        keyConcepts: [
          'Angle between two straight lines: tan(theta) = +-(m1 - m2) / (1 + m1 * m2).',
          'Perpendicular condition: m1 * m2 = -1 (or a1*a2 + b1*b2 = 0).',
          'Parallel condition: m1 = m2 (or a1/a2 = b1/b2).',
          'Homogeneous equation ax^2 + 2hxy + by^2 = 0: tan(theta) = +-2*sqrt(h^2 - ab)/(a+b).',
          'Perpendicular lines condition: a + b = 0; Coincident lines condition: h^2 = ab.'
        ],
        formulasOrLaws: [
          'tan(theta) = +-(m1 - m2) / (1 + m1 * m2)',
          'Pair of lines angle: tan(theta) = +-2*sqrt(h^2 - ab) / (a + b)',
          'Perpendicular condition: a + b = 0',
          'Circle standard equation: (x - h)^2 + (y - k)^2 = r^2'
        ],
        highYieldExamQuestions: [
          {
            question: 'Find the single equation representing the lines x + 2y = 0 and 2x - y = 0, and verify if they are mutually perpendicular.',
            marks: 4,
            answerSummary: '(x + 2y)(2x - y) = 0 => 2x^2 + 3xy - 2y^2 = 0. Here a = 2, b = -2. Since a + b = 2 + (-2) = 0, the lines are mutually perpendicular.'
          }
        ],
        sampleMcqs: [
          {
            question: 'What is the condition for two lines represented by ax^2 + 2hxy + by^2 = 0 to be perpendicular to each other?',
            options: ['h^2 = ab', 'a + b = 0', 'a = b', 'h = 0'],
            correctIndex: 1,
            explanation: 'The pair of straight lines are perpendicular if and only if the sum of coefficients of x^2 and y^2 is zero (a + b = 0).'
          }
        ]
      }
    ]
  }
};

// ============================================================================
// DYNAMIC CURRICULUM CONTEXT RETRIEVAL HELPER FOR ON-DEVICE GEMMA AI
// ============================================================================
export function getCurriculumContextForPrompt(subjectId: string, query?: string): string {
  const normSub = subjectId.toLowerCase().trim();
  let key = 'science';
  if (normSub.includes('math') && !normSub.includes('opt')) key = 'math';
  else if (normSub.includes('opt')) key = 'opt_math';
  else if (normSub.includes('comp') || normSub.includes('cs')) key = 'computer';
  else if (normSub.includes('soc')) key = 'social';
  else if (normSub.includes('eng')) key = 'english';
  else if (normSub.includes('nep')) key = 'nepali';
  else if (normSub.includes('sci')) key = 'science';

  const sub = SEE_CURRICULUM_MEMORY[key];
  if (!sub) return '';

  let context = `[NEPAL SEE CLASS 10 CURRICULUM KNOWLEDGE - ${sub.name.toUpperCase()} (${sub.nameNe})]\n`;
  context += `Description: ${sub.description}\n`;
  context += `Key Units and Core Scientific / Mathematical Laws:\n`;

  for (const unit of sub.units.slice(0, 4)) {
    context += `• Unit ${unit.unitNumber}: ${unit.unitName} (${unit.unitNameNe})\n`;
    if (unit.formulasOrLaws && unit.formulasOrLaws.length > 0) {
      context += `  Laws/Formulas: ${unit.formulasOrLaws.join('; ')}\n`;
    }
    if (unit.keyConcepts && unit.keyConcepts.length > 0) {
      context += `  Core Concepts: ${unit.keyConcepts.join('; ')}\n`;
    }
  }

  return context;
}

// ============================================================================
// CURATED SYLLABUS MCQS GETTER FOR FAST OFFLINE QUIZZES
// ============================================================================
export function getCuratedMCQsForSubject(subjectId: string) {
  const normSub = subjectId.toLowerCase().trim();
  let key = 'science';
  if (normSub.includes('math') && !normSub.includes('opt')) key = 'math';
  else if (normSub.includes('opt')) key = 'opt_math';
  else if (normSub.includes('comp') || normSub.includes('cs')) key = 'computer';
  else if (normSub.includes('soc')) key = 'social';
  else if (normSub.includes('eng')) key = 'english';
  else if (normSub.includes('nep')) key = 'nepali';
  else if (normSub.includes('sci')) key = 'science';

  const sub = SEE_CURRICULUM_MEMORY[key];
  if (!sub) return [];

  const mcqs: any[] = [];
  for (const unit of sub.units) {
    for (const mcq of unit.sampleMcqs) {
      mcqs.push({
        ...mcq,
        subject: sub.name,
        unit: unit.unitName,
      });
    }
  }
  return mcqs;
}
