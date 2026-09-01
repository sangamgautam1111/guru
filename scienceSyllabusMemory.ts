// ============================================================================
// GURU AI - NEPAL SEE CLASS 10 SCIENCE COMPLETE 19-CHAPTER SYLLABUS MEMORY
// Extracted & Synthesized from Official Class 10 Science & Technology Curriculum
// ============================================================================

export interface ScienceChapter {
  id: number;
  slug: string;
  name: string;
  nameNe: string;
  category: 'Physics' | 'Chemistry' | 'Biology' | 'Astronomy & Geology' | 'ICT & General';
  keyConcepts: string[];
  formulasAndLaws: string[];
  mcqs: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export const SCIENCE_19_CHAPTERS: ScienceChapter[] = [
  // --------------------------------------------------------------------------
  // Chapter 1: Scientific Study
  // --------------------------------------------------------------------------
  {
    id: 1,
    slug: 'scientific-study',
    name: 'Scientific Study',
    nameNe: 'वैज्ञानिक अध्ययन',
    category: 'ICT & General',
    keyConcepts: [
      'Identification of independent, dependent, and controlled variables in scientific experiments.',
      'Formulation of scientific hypothesis and experimental verification.',
      'Measurement, SI units, and graphical data analysis.'
    ],
    formulasAndLaws: [
      'Independent Variable: Factor deliberately changed by experimenter (e.g. Temperature).',
      'Dependent Variable: Responding factor measured as result (e.g. Rate of reaction).',
      'Controlled Variables: Factors kept constant to ensure valid test.'
    ],
    mcqs: [
      {
        question: 'In an experiment investigating how heating affects the dissolving rate of sugar in water, the temperature of water is the:',
        options: ['Dependent variable', 'Independent variable', 'Controlled variable', 'Extraneous variable'],
        correctIndex: 1,
        explanation: 'Temperature is intentionally manipulated by the experimenter, making it the independent variable.'
      },
      {
        question: 'Which of the following represents a quantitative scientific observation?',
        options: ['The solution turned dark blue', 'The gas produced smells pungent', 'The volume of gas collected is 45.2 mL', 'The test tube feels warm'],
        correctIndex: 2,
        explanation: '45.2 mL is a numerical measurement with a standard unit, which defines a quantitative observation.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 2: Classification of Living Beings
  // --------------------------------------------------------------------------
  {
    id: 2,
    slug: 'classification-of-living-beings',
    name: 'Classification of Living Beings',
    nameNe: 'जीवहरूको वर्गीकरण',
    category: 'Biology',
    keyConcepts: [
      'Five Kingdom Classification: Monera, Protista, Fungi, Plantae, Animalia (Robert Whittaker).',
      'Plant Divisions: Algae, Bryophyta, Pteridophyta, Gymnosperms, Angiosperms (Monocots & Dicots).',
      'Invertebrate Phyla: Porifera, Coelenterata, Platyhelminthes, Aschelminthes, Annelida, Arthropoda, Mollusca, Echinodermata.',
      'Chordates: Pisces, Amphibia, Reptilia, Aves, Mammalia.'
    ],
    formulasAndLaws: [
      'Five Kingdom System proposed by R.H. Whittaker (1969).',
      'Binomial Nomenclature formulated by Carl Linnaeus.'
    ],
    mcqs: [
      {
        question: 'Why is an Octopus classified under Phylum Mollusca rather than Echinodermata?',
        options: [
          'It possesses radial symmetry and tube feet',
          'It has a soft, unsegmented body with a muscular foot and lacks spiny skin',
          'It has jointed appendages and an exoskeleton',
          'It breathes exclusively through book lungs'
        ],
        correctIndex: 1,
        explanation: 'Octopus has a soft, unsegmented body (Mollusca) and lacks the spiny calcareous endoskeleton of echinoderms.'
      },
      {
        question: 'Which of the following plants has true vascular tissues (xylem and phloem) but does NOT produce seeds?',
        options: ['Marchantia (Bryophyta)', 'Fern (Pteridophyta)', 'Pinus (Gymnosperm)', 'Mustard (Angiosperm)'],
        correctIndex: 1,
        explanation: 'Pteridophytes (like Ferns) are seedless vascular cryptogams reproducing via spores.'
      },
      {
        question: 'Pneumatic (hollow, air-filled) bones and feathers are unique evolutionary adaptations of which class?',
        options: ['Reptilia', 'Amphibia', 'Aves (Birds)', 'Mammalia'],
        correctIndex: 2,
        explanation: 'Class Aves have lightweight pneumatic bones and feathers adapted for flight.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 3: Honey Bee
  // --------------------------------------------------------------------------
  {
    id: 3,
    slug: 'honey-bee',
    name: 'Honey Bee',
    nameNe: 'मौरी',
    category: 'Biology',
    keyConcepts: [
      'Colony Organization and Castes: Queen (fertile diploid female), Worker (sterile diploid female), Drone (fertile haploid male).',
      'Life cycle: Complete metamorphosis (Egg -> Larva -> Pupa -> Adult).',
      'Parthenogenesis: Drones develop from unfertilized haploid eggs (16 chromosomes).',
      'Economic importance: Honey, beeswax, royal jelly, and crop cross-pollination.'
    ],
    formulasAndLaws: [
      'Parthenogenesis: Development of an embryo from an unfertilized egg cell.',
      'Queen & Worker Chromosome: 2n = 32; Drone Chromosome: n = 16 (Haploid).'
    ],
    mcqs: [
      {
        question: 'In a honey bee colony, drone bees develop through which biological process?',
        options: ['Binary fission', 'Parthenogenesis from unfertilized eggs', 'Budding from fertilized eggs', 'Regeneration'],
        correctIndex: 1,
        explanation: 'Drones develop from unfertilized haploid eggs via parthenogenesis and possess 16 chromosomes.'
      },
      {
        question: 'What special food is fed to a female bee larva throughout its larval stage to develop it into a Queen bee?',
        options: ['Worker jelly', 'Raw nectar', 'Royal Jelly', 'Propolis'],
        correctIndex: 2,
        explanation: 'Royal Jelly, secreted from the hypopharyngeal glands of worker bees, triggers development into a fertile Queen.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 4: Heredity
  // --------------------------------------------------------------------------
  {
    id: 4,
    slug: 'heredity',
    name: 'Heredity',
    nameNe: 'वंशानुक्रम',
    category: 'Biology',
    keyConcepts: [
      'Cell division: Mitosis (equational, 2 diploid daughter cells) and Meiosis (reductional, 4 haploid gametes).',
      'Chromosomes: Autosomes (22 pairs) and Sex chromosomes (1 pair: XX female, XY male).',
      'DNA double helix structure (Adenine-Thymine, Guanine-Cytosine).',
      'Mendelism: Law of Dominance, Law of Segregation (Purity of Gametes), Law of Independent Assortment.',
      'Monohybrid cross F2 ratio: Phenotypic 3:1, Genotypic 1:2:1.'
    ],
    formulasAndLaws: [
      'Mendel Law of Segregation: Alleles separate during gamete formation.',
      'Monohybrid F2 Genotypic Ratio: 1 TT : 2 Tt : 1 tt (1:2:1).',
      'Dihybrid F2 Phenotypic Ratio: 9:3:3:1.'
    ],
    mcqs: [
      {
        question: 'What is the genotypic ratio obtained in the F2 generation of a Mendelian monohybrid cross?',
        options: ['3:1', '1:2:1', '9:3:3:1', '1:1:1:1'],
        correctIndex: 1,
        explanation: 'Crossing heterozygous parents (Tt x Tt) yields 1 TT : 2 Tt : 1 tt (1:2:1 genotypic ratio).'
      },
      {
        question: 'Which type of cell division is responsible for gamete formation and reduction of chromosome number from 2n to n?',
        options: ['Amitosis', 'Mitosis', 'Meiosis', 'Cytokinesis only'],
        correctIndex: 2,
        explanation: 'Meiosis is the reductional division producing haploid (n) sperm and egg gametes.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 5: Physical Structure and Life Process
  // --------------------------------------------------------------------------
  {
    id: 5,
    slug: 'physical-structure-and-life-process',
    name: 'Physical Structure and Life Process',
    nameNe: 'शारीरिक संरचना र जीवन प्रक्रिया',
    category: 'Biology',
    keyConcepts: [
      'Human Blood Circulatory System: Heart anatomy (4 chambers), Arteries, Veins, Capillaries, Blood pressure, and Double circulation.',
      'Blood Components: Plasma (55%), RBCs (Erythrocytes - oxygen transport via hemoglobin), WBCs (Leukocytes - immunity), Platelets (Thrombocytes - clotting).',
      'Endocrine System: Pituitary (master gland, Growth Hormone), Thyroid (Thyroxine), Pancreas (Insulin & Glucagon), Adrenal (Adrenaline).',
      'Nervous System: Brain (Cerebrum, Cerebellum, Medulla), Spinal cord, Reflex action.',
      'Excretory System: Kidney structure, Nephron functioning (filtration, reabsorption).'
    ],
    formulasAndLaws: [
      'Blood Pressure Standard: 120/80 mm of Hg (Systolic/Diastolic).',
      'Hemoglobin + Oxygen -> Oxyhemoglobin (Hb + O2 -> HbO2).'
    ],
    mcqs: [
      {
        question: 'Which blood cells contain hemoglobin and are responsible for transporting oxygen throughout the human body?',
        options: ['Leukocytes (WBCs)', 'Erythrocytes (RBCs)', 'Thrombocytes (Platelets)', 'Lymphocytes'],
        correctIndex: 1,
        explanation: 'Erythrocytes (Red Blood Cells) contain iron-rich hemoglobin that binds oxygen.'
      },
      {
        question: 'Insulin hormone, which regulates blood glucose levels, is secreted by which organ?',
        options: ['Thyroid gland', 'Adrenal gland', 'Islets of Langerhans in Pancreas', 'Pituitary gland'],
        correctIndex: 2,
        explanation: 'The Beta cells in the Islets of Langerhans within the Pancreas produce and secrete insulin.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 6: Nature and Environment
  // --------------------------------------------------------------------------
  {
    id: 6,
    slug: 'nature-and-environment',
    name: 'Nature and Environment',
    nameNe: 'प्रकृति र वातावरण',
    category: 'Biology',
    keyConcepts: [
      'Ecosystem structure: Biotic (Producers, Primary/Secondary Consumers, Decomposers) and Abiotic components.',
      'Energy flow: 10% Ecological Law (Lindeman 10% Rule), Food chains, Food webs, Ecological pyramids.',
      'Biogeochemical cycles: Carbon cycle, Nitrogen cycle, Water cycle.',
      'Environmental Challenges: Greenhouse effect, Global warming, Acid rain (SO2 and NOx), Ozone layer depletion (CFCs).'
    ],
    formulasAndLaws: [
      '10% Law of Energy Transfer: Only ~10% of energy transfers to the next trophic level.',
      'Greenhouse Gases: CO2, CH4, N2O, Water vapor, CFCs.'
    ],
    mcqs: [
      {
        question: 'According to Lindeman 10% rule of ecological energy transfer, if producers synthesize 10,000 J of energy, how much energy reaches primary consumers?',
        options: ['10,000 J', '1,000 J', '100 J', '10 J'],
        correctIndex: 1,
        explanation: 'Primary consumers receive 10% of 10,000 J = 1,000 J.'
      },
      {
        question: 'Which gas is primarily responsible for the depletion of the stratospheric ozone layer?',
        options: ['Carbon dioxide (CO2)', 'Chlorofluorocarbons (CFCs)', 'Methane (CH4)', 'Nitrogen (N2)'],
        correctIndex: 1,
        explanation: 'Chlorofluorocarbons (CFCs) release chlorine radicals that catalytically break down ozone molecules (O3).'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 7: Force and Motion
  // --------------------------------------------------------------------------
  {
    id: 7,
    slug: 'force-and-motion',
    name: 'Force and Motion',
    nameNe: 'बल र चाल',
    category: 'Physics',
    keyConcepts: [
      'Newton Universal Law of Gravitation: Force is directly proportional to product of masses and inversely proportional to square of distance.',
      'Universal Gravitational Constant: G = 6.67 x 10^-11 N m^2/kg^2.',
      'Acceleration due to gravity (g = GM/R^2): Variation with height, depth, and latitude (Poles = 9.83 m/s^2, Equator = 9.78 m/s^2).',
      'Mass (constant scalar quantity) vs Weight (variable vector quantity, W = mg).',
      'Free fall (acceleration = g) and Weightlessness conditions.'
    ],
    formulasAndLaws: [
      'F = G * (m1 * m2) / d^2',
      'g = G * M / R^2',
      'g_height = G * M / (R + h)^2 = g * [R / (R + h)]^2',
      'Weight W = m * g (Newtons)'
    ],
    mcqs: [
      {
        question: 'If the distance between two masses is doubled while keeping masses constant, the gravitational force between them becomes:',
        options: ['2 times greater', 'Half (1/2)', 'One-fourth (1/4)', '4 times greater'],
        correctIndex: 2,
        explanation: 'Since F is inversely proportional to d^2, doubling distance (2d) reduces force to 1/(2)^2 = 1/4 of original.'
      },
      {
        question: 'Where on the surface of the Earth is the acceleration due to gravity (g) maximum?',
        options: ['At the Equator', 'At the North and South Poles', 'At the center of the Earth', 'On Mount Everest'],
        correctIndex: 1,
        explanation: 'Earth is flattened at the poles, making the polar radius (R) smallest. Since g = GM/R^2, g is maximum at the poles (~9.83 m/s^2).'
      },
      {
        question: 'An astronaut inside an orbiting artificial satellite experiences weightlessness because:',
        options: ['There is zero gravity in space', 'The satellite is in a continuous state of free fall towards Earth', 'The astronaut mass becomes zero', 'Air pressure cancels gravity'],
        correctIndex: 1,
        explanation: 'In orbit, both the satellite and astronaut fall freely towards Earth with acceleration equal to local g, eliminating normal reaction force.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 8: Pressure
  // --------------------------------------------------------------------------
  {
    id: 8,
    slug: 'pressure',
    name: 'Pressure',
    nameNe: 'चाप',
    category: 'Physics',
    keyConcepts: [
      'Thrust and Pressure: P = F / A (SI unit: Pascal or N/m^2).',
      'Liquid Pressure: P = h * rho * g (depends on depth, density, and g; independent of container shape).',
      'Pascal Law of Liquid Pressure: Pressure applied to enclosed fluid is transmitted equally and undiminished in all directions.',
      'Hydraulic Machines (Press, Lift, Brakes): Mechanical Advantage = A2 / A1.',
      'Archimedes Principle: Upthrust = Weight of displaced liquid (U = V * rho * g).',
      'Law of Flotation: Weight of floating body = Weight of displaced liquid (Density_body / Density_liquid = V_submerged / V_total).'
    ],
    formulasAndLaws: [
      'P = F / A',
      'Liquid Pressure: P = h * rho * g',
      'Pascal Law: F1 / A1 = F2 / A2  =>  F2 = F1 * (A2 / A1)',
      'Upthrust: U = V * rho * g = Weight of displaced fluid',
      'Law of Flotation: Weight of floating body = Upthrust'
    ],
    mcqs: [
      {
        question: 'In a hydraulic press, a force of 50 N is applied on a piston of area 0.02 m^2. What force is produced on the larger piston of area 0.4 m^2?',
        options: ['100 N', '500 N', '1,000 N', '2,000 N'],
        correctIndex: 2,
        explanation: 'F2 = F1 * (A2 / A1) = 50 * (0.4 / 0.02) = 50 * 20 = 1,000 N.'
      },
      {
        question: 'Which instrument works directly on the Principle of Flotation to measure the relative density of liquids?',
        options: ['Barometer', 'Manometer', 'Hydrometer', 'Sphygmomanometer'],
        correctIndex: 2,
        explanation: 'A Hydrometer floats in liquids and measures relative density based on the law of flotation.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 9: Heat
  // --------------------------------------------------------------------------
  {
    id: 9,
    slug: 'heat',
    name: 'Heat',
    nameNe: 'ताप',
    category: 'Physics',
    keyConcepts: [
      'Heat (total internal kinetic energy of molecules, Joules) vs Temperature (average kinetic energy, Kelvin/Celsius).',
      'Heat Equation: Q = m * s * dt (where s = specific heat capacity).',
      'Specific Heat Capacity of Water: 4200 J/kg°C (very high; used in car radiators, hot water bottles, moderation of coastal climates).',
      'Principle of Calorimetry: Heat lost by hot body = Heat gained by cold body (assuming no heat loss to surroundings).',
      'Anomalous Expansion of Water: Water contracts from 0°C to 4°C and reaches maximum density (1000 kg/m^3) at 4°C.'
    ],
    formulasAndLaws: [
      'Heat Equation: Q = m * s * dt (in Joules)',
      'Specific Heat Capacity: s = Q / (m * dt) (unit: J/kg°C)',
      'Calorimetry Principle: m1 * s1 * (t1 - t_final) = m2 * s2 * (t_final - t2)'
    ],
    mcqs: [
      {
        question: 'Calculate the heat energy required to raise the temperature of 2 kg of water from 20°C to 70°C (Specific heat capacity of water = 4200 J/kg°C).',
        options: ['210,000 J', '420,000 J', '84,000 J', '520,000 J'],
        correctIndex: 1,
        explanation: 'Q = m * s * dt = 2 * 4200 * (70 - 20) = 2 * 4200 * 50 = 420,000 J.'
      },
      {
        question: 'At what temperature does pure water exhibit its maximum density?',
        options: ['0°C', '4°C', '10°C', '100°C'],
        correctIndex: 1,
        explanation: 'Due to anomalous expansion, water contracts when heated from 0°C to 4°C, attaining maximum density at 4°C.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 10: Wave (Light and Sound)
  // --------------------------------------------------------------------------
  {
    id: 10,
    slug: 'wave',
    name: 'Wave (Light and Sound)',
    nameNe: 'तरङ्ग (प्रकाश र ध्वनि)',
    category: 'Physics',
    keyConcepts: [
      'Light Refraction: Snell Law (n = sin i / sin r), Total Internal Reflection & Critical angle.',
      'Convex Lens (converging) and Concave Lens (diverging), Principal focus, Optical center, Ray diagrams.',
      'Lens Formula: 1/f = 1/u + 1/v; Magnification m = v/u; Power of lens P = 1/f (in meters, Diopter D).',
      'Vision Defects: Myopia (short-sightedness, corrected with concave lens) and Hypermetropia (long-sightedness, corrected with convex lens).',
      'Sound: Longitudinal wave, Echo (minimum distance 17m in air), Reverberation, Ultrasound (frequencies > 20 kHz).'
    ],
    formulasAndLaws: [
      'Snell Law: n = sin(i) / sin(r)',
      'Lens Equation: 1/f = 1/u + 1/v',
      'Power of Lens: P = 1 / f(m) (Diopters, D)',
      'Echo Distance: d = (v * t) / 2'
    ],
    mcqs: [
      {
        question: 'What is the power of a convex lens having a focal length of 25 cm (0.25 m)?',
        options: ['+0.25 D', '+2.5 D', '+4.0 D', '-4.0 D'],
        correctIndex: 2,
        explanation: 'Power P = 1 / f(m) = 1 / 0.25 = +4.0 Diopters.'
      },
      {
        question: 'A person can see distant mountains clearly but struggles to read a book at 25 cm. What is the eye defect and corrective lens?',
        options: ['Myopia; Concave lens', 'Hypermetropia; Convex lens', 'Astigmatism; Cylindrical lens', 'Cataract; Bifocal lens'],
        correctIndex: 1,
        explanation: 'Inability to see nearby objects clearly is Hypermetropia (far-sightedness), corrected with a convex (converging) lens.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 11: Electricity and Magnetism
  // --------------------------------------------------------------------------
  {
    id: 11,
    slug: 'electricity-and-magnetism',
    name: 'Electricity and Magnetism',
    nameNe: 'विद्युत् र चुम्बकत्व',
    category: 'Physics',
    keyConcepts: [
      'Ohm Law: V = I * R at constant temperature.',
      'Electric Power: P = V * I = I^2 * R = V^2 / R (Watts).',
      'Electrical Energy Consumption: Energy = Power (kW) * Time (hours) = kWh (Units).',
      'Domestic AC Wiring: Live (Brown/Red), Neutral (Blue/Black), Earth (Green/Yellow), Fuse, MCB.',
      'Transformers: Step-up and Step-down (Np/Ns = Vp/Vs = Is/Ip).',
      'Faraday Laws of Electromagnetic Induction, Motor effect, AC Generator, Dynamo.'
    ],
    formulasAndLaws: [
      'Ohm Law: V = I * R',
      'Electric Energy: E = P(kW) * t(hours) (units)',
      'Transformer Equation: Vp / Vs = Np / Ns = Is / Ip'
    ],
    mcqs: [
      {
        question: 'If a 1500W electric heater is operated for 4 hours daily for 30 days, calculate the total electricity consumed in units (kWh):',
        options: ['45 units', '180 units', '180,000 units', '60 units'],
        correctIndex: 1,
        explanation: 'Power = 1.5 kW. Total time = 4 * 30 = 120 h. Energy = 1.5 * 120 = 180 kWh (units).'
      },
      {
        question: 'A transformer has 200 primary turns and 1000 secondary turns. If the input primary voltage is 220V, what is the output secondary voltage?',
        options: ['44 V', '110 V', '1,100 V', '2,200 V'],
        correctIndex: 2,
        explanation: 'Vs = Vp * (Ns / Np) = 220 * (1000 / 200) = 220 * 5 = 1,100 V.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 12: Universe
  // --------------------------------------------------------------------------
  {
    id: 12,
    slug: 'universe',
    name: 'Universe',
    nameNe: 'ब्रह्माण्ड',
    category: 'Astronomy & Geology',
    keyConcepts: [
      'Origin of Universe: Big Bang Theory (approx 13.8 billion years ago) and expanding universe (Hubble Law).',
      'Life cycle of stars: Protostar -> Main sequence (like Sun) -> Red Giant -> Planetary Nebula -> White Dwarf OR Supernova -> Neutron star / Black hole.',
      'Galaxies: Spiral (Milky Way), Elliptical, Irregular.',
      'Astronomical Distance Units: Light year (9.46 x 10^12 km), Astronomical Unit (AU ~ 1.5 x 10^8 km).'
    ],
    formulasAndLaws: [
      '1 Light Year = Distance light travels in 1 year in vacuum approx 9.46 x 10^12 km.',
      'Nuclear Fusion in Stars: 4 Hydrogen nuclei -> 1 Helium nucleus + Energy (E = mc^2).'
    ],
    mcqs: [
      {
        question: 'What nuclear reaction powers our Sun and other main-sequence stars?',
        options: ['Nuclear fission of Uranium', 'Nuclear fusion of Hydrogen into Helium', 'Combustion of natural gas', 'Chemical oxidation'],
        correctIndex: 1,
        explanation: 'High core temperature and pressure fuse Hydrogen nuclei into Helium, releasing massive energy according to E=mc^2.'
      },
      {
        question: 'A massive dying star having mass greater than Chandrasekhar limit ends its life in a violent stellar explosion called a:',
        options: ['Protostar', 'White dwarf', 'Supernova', 'Black hole directly'],
        correctIndex: 2,
        explanation: 'Massive stars collapse and explode in a catastrophic Supernova, leaving behind a neutron star or black hole.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 13: Information and Communication Technology (ICT)
  // --------------------------------------------------------------------------
  {
    id: 13,
    slug: 'information-and-communication-technology',
    name: 'Information and Communication Technology (ICT)',
    nameNe: 'सूचना तथा सञ्चार प्रविधि',
    category: 'ICT & General',
    keyConcepts: [
      'Digital communication vs Analog communication.',
      'Computer storage: Primary memory (RAM volatile, ROM non-volatile) and Secondary storage (SSD, HDD, SD Card).',
      'Internet technologies, Cloud computing, and IoT (Internet of Things).',
      'Cybersecurity, Computer viruses, Firewall, and Ethical usage of Artificial Intelligence in education.'
    ],
    formulasAndLaws: [
      'Data Hierarchy: 1 Byte = 8 Bits, 1 KB = 1024 Bytes, 1 MB = 1024 KB, 1 GB = 1024 MB.'
    ],
    mcqs: [
      {
        question: 'Which of the following computer memories is non-volatile and retains essential boot instructions even when power is turned off?',
        options: ['DRAM', 'SRAM', 'ROM (Read Only Memory)', 'Cache memory'],
        correctIndex: 2,
        explanation: 'ROM is non-volatile memory storing BIOS firmware that persists without power.'
      },
      {
        question: 'A security system designed to monitor and filter incoming and outgoing network traffic based on predetermined security rules is called a:',
        options: ['Gateway', 'Firewall', 'Modem', 'Compiler'],
        correctIndex: 1,
        explanation: 'A Firewall acts as a network barrier preventing unauthorized access and cyber threats.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 14: Classification of Elements
  // --------------------------------------------------------------------------
  {
    id: 14,
    slug: 'classification-of-elements',
    name: 'Classification of Elements',
    nameNe: 'तत्त्वहरूको वर्गीकरण',
    category: 'Chemistry',
    keyConcepts: [
      'Modern Periodic Law (Henry Moseley): Physical and chemical properties are periodic functions of their atomic numbers.',
      'Modern Periodic Table Structure: 7 Periods (horizontal rows) and 18 Groups (vertical columns).',
      'Subshell Electronic Configuration: s-block (Gr 1-2), p-block (Gr 13-18), d-block (Gr 3-12 Transition metals), f-block (Lanthanides & Actinides).',
      'Periodic Trends: Atomic size (increases down group, decreases across period), Electronegativity (increases across period), Metallic character.'
    ],
    formulasAndLaws: [
      'Modern Periodic Law: Properties of elements are periodic functions of Atomic Number (Z).',
      'Aufbau Principle: 1s -> 2s -> 2p -> 3s -> 3p -> 4s -> 3d.'
    ],
    mcqs: [
      {
        question: 'What is the subshell electronic configuration of Calcium (Atomic Number = 20)?',
        options: ['1s^2 2s^2 2p^6 3s^2 3p^6 4s^2', '1s^2 2s^2 2p^6 3s^2 3d^8', '1s^2 2s^2 2p^6 3s^2 3p^8', '1s^2 2s^2 2p^6 3s^2 3p^4 4s^4'],
        correctIndex: 0,
        explanation: 'Calcium (20) fills subshells in order: 1s^2 2s^2 2p^6 3s^2 3p^6 4s^2 (Period 4, Group 2).'
      },
      {
        question: 'Across a period from left to right in the modern periodic table, what happens to atomic radius?',
        options: ['Increases continuously', 'Decreases due to increasing effective nuclear charge', 'Remains unchanged', 'Doubles'],
        correctIndex: 1,
        explanation: 'Increasing nuclear charge pulls the electron cloud closer to the nucleus, decreasing atomic radius across a period.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 15: Chemical Reaction
  // --------------------------------------------------------------------------
  {
    id: 15,
    slug: 'chemical-reaction',
    name: 'Chemical Reaction',
    nameNe: 'रासायनिक प्रतिक्रिया',
    category: 'Chemistry',
    keyConcepts: [
      'Types of Chemical Reactions: Combination (Synthesis), Decomposition, Single Displacement, Double Displacement, Neutralization (Acid-Base).',
      'Endothermic vs Exothermic reactions.',
      'Factors affecting Rate of Reaction: Temperature (increases collisions), Concentration, Surface Area (granulated vs powder), Catalysts (Positive vs Negative promoter).',
      'Balancing chemical equations and Law of Conservation of Mass.'
    ],
    formulasAndLaws: [
      'Law of Conservation of Mass: Total mass of reactants = Total mass of products.',
      'Neutralization: Acid + Base -> Salt + Water (e.g. HCl + NaOH -> NaCl + H2O).'
    ],
    mcqs: [
      {
        question: 'What type of chemical reaction is represented by: 2Mg + O2 -> 2MgO?',
        options: ['Decomposition reaction', 'Combination (Synthesis) reaction', 'Single displacement reaction', 'Double displacement reaction'],
        correctIndex: 1,
        explanation: 'Two reactants (Mg and O2) combine to form a single product (MgO), which is a combination reaction.'
      },
      {
        question: 'Why does powdered marble (CaCO3) react much faster with dilute HCl than large marble chips?',
        options: ['Powder increases the activation energy', 'Powder increases total reactant surface area exposed to acid collisions', 'Powder acts as a catalyst', 'Powder cools the reaction'],
        correctIndex: 1,
        explanation: 'Powdering increases surface area, significantly increasing the frequency of effective reactant collisions.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 16: Gases
  // --------------------------------------------------------------------------
  {
    id: 16,
    slug: 'gases',
    name: 'Gases',
    nameNe: 'ग्याँसहरू',
    category: 'Chemistry',
    keyConcepts: [
      'Laboratory Preparation of Carbon Dioxide (CO2): CaCO3 + 2HCl -> CaCl2 + H2O + CO2 (Woulfe bottle, upward displacement of air, tested with burning splint and lime water).',
      'Laboratory Preparation of Ammonia (NH3): 2NH4Cl + Ca(OH)2 -> CaCl2 + 2H2O + 2NH3 (hard glass test tube, lime tower with CaO drying agent, downward displacement of air in inverted jar).',
      'Properties and uses of CO2 (fire extinguishers, soda water, photosynthesis) and NH3 (fertilizers, refrigerants).'
    ],
    formulasAndLaws: [
      'CO2 Lab Prep: CaCO3 + 2HCl -> CaCl2 + H2O + CO2',
      'Lime water test: Ca(OH)2 + CO2 -> CaCO3 (milky ppt) + H2O',
      'NH3 Lab Prep: 2NH4Cl + Ca(OH)2 -> CaCl2 + 2H2O + 2NH3'
    ],
    mcqs: [
      {
        question: 'Why is Quicklime (CaO) used in the drying tower during laboratory preparation of Ammonia gas?',
        options: [
          'It is basic and absorbs moisture without reacting with basic ammonia',
          'It turns ammonia into a solid',
          'It provides heat to speed up the gas collection',
          'It oxidizes ammonia into nitrogen'
        ],
        correctIndex: 0,
        explanation: 'CaO is basic, so it dries basic NH3 without reacting (unlike acidic H2SO4 or CaCl2 which react with NH3).'
      },
      {
        question: 'What happens when carbon dioxide gas is passed through freshly prepared clear lime water for a short time?',
        options: ['It turns deep blue', 'It turns milky due to insoluble Calcium Carbonate (CaCO3)', 'It catches fire', 'It turns brown'],
        correctIndex: 1,
        explanation: 'CO2 reacts with Ca(OH)2 forming insoluble white precipitate of CaCO3, turning lime water milky.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 17: Metals and Non-metals
  // --------------------------------------------------------------------------
  {
    id: 17,
    slug: 'metals-and-non-metals',
    name: 'Metals and Non-metals',
    nameNe: 'धातु र अधातुहरू',
    category: 'Chemistry',
    keyConcepts: [
      'Occurrence and Metallurgy: Minerals, Ores, Concentration, Calcination, Roasting, Smelting, Refining.',
      'Important Metals and Ores: Iron (Haematite Fe2O3, Magnetite Fe3O4), Copper (Copper Pyrites CuFeS2), Aluminium (Bauxite Al2O3.2H2O), Gold (Native state).',
      'Corrosion and Prevention: Rusting of Iron (4Fe + 3O2 + 2xH2O -> 2Fe2O3.xH2O), Galvanization, Electroplating, Alloying.',
      'Important Alloys: Brass (Cu + Zn), Bronze (Cu + Sn), Stainless Steel (Fe + Cr + Ni + C).'
    ],
    formulasAndLaws: [
      'Rust Chemical Formula: Fe2O3.xH2O (Hydrated Ferric Oxide)',
      'Bauxite Ore: Al2O3.2H2O; Haematite Ore: Fe2O3'
    ],
    mcqs: [
      {
        question: 'What is the main chemical ore used for the industrial extraction of Aluminium metal?',
        options: ['Haematite', 'Bauxite (Al2O3.2H2O)', 'Galena', 'Copper Pyrites'],
        correctIndex: 1,
        explanation: 'Bauxite (Al2O3.2H2O) is the primary ore from which aluminum is extracted via Hall-Héroult electrolysis.'
      },
      {
        question: 'Galvanization is the process of coating iron or steel with a thin protective layer of which metal to prevent rusting?',
        options: ['Copper', 'Zinc', 'Tin', 'Silver'],
        correctIndex: 1,
        explanation: 'Galvanizing coats iron with Zinc, which acts as a sacrificial anode preventing oxidation.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 18: Hydrocarbons and their Compounds
  // --------------------------------------------------------------------------
  {
    id: 18,
    slug: 'hydrocarbons-and-their-compounds',
    name: 'Hydrocarbons and their Compounds',
    nameNe: 'हाइड्रोकार्बन र तिनका यौगिकहरू',
    category: 'Chemistry',
    keyConcepts: [
      'Hydrocarbons classification: Saturated (Alkanes: CnH2n+2) vs Unsaturated (Alkenes: CnH2n and Alkynes: CnH2n-2).',
      'IUPAC Nomenclature of Methane (CH4), Ethane (C2H6), Propane (C3H8), Butane (C4H10).',
      'Functional Groups: Alcohol (-OH), Aldehyde (-CHO), Carboxylic acid (-COOH), Ketone (>C=O), Ether (-O-).',
      'Important Organic Compounds: Ethyl Alcohol (Ethanol C2H5OH - solvent, antiseptic) and Glycerol (Glycerin C3H5(OH)3 - cosmetics, moisturizer).'
    ],
    formulasAndLaws: [
      'Alkanes General Formula: CnH2n+2 (Single covalent bonds)',
      'Alkenes General Formula: CnH2n (Double covalent bond)',
      'Alkynes General Formula: CnH2n-2 (Triple covalent bond)',
      'Ethanol: C2H5OH; Glycerol: CH2OH-CHOH-CH2OH'
    ],
    mcqs: [
      {
        question: 'What is the general molecular formula for the Alkene homologous series possessing a carbon-carbon double bond?',
        options: ['CnH2n+2', 'CnH2n', 'CnH2n-2', 'CnHn'],
        correctIndex: 1,
        explanation: 'Alkenes have the general formula CnH2n (e.g. Ethene C2H4, Propene C3H6).'
      },
      {
        question: 'Glycerol (Glycerin) contains how many hydroxyl (-OH) functional groups in its molecular structure?',
        options: ['One (Monohydric)', 'Two (Dihydric)', 'Three (Trihydric alcohol)', 'Four'],
        correctIndex: 2,
        explanation: 'Glycerol [CH2OH-CHOH-CH2OH] is a trihydric alcohol containing three -OH groups.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Chapter 19: Chemicals Used in Daily Life
  // --------------------------------------------------------------------------
  {
    id: 19,
    slug: 'chemicals-used-in-daily-life',
    name: 'Chemicals Used in Daily Life',
    nameNe: 'दैनिक जीवनमा प्रयोग हुने रसायनहरू',
    category: 'Chemistry',
    keyConcepts: [
      'Soap (Saponification of fats with NaOH/KOH) vs Synthetic Detergents (Sodium alkyl sulfates, works in hard water).',
      'Plastics: Thermoplastics (Polythene, PVC - recyclable, melts on heating) vs Thermosetting plastics (Bakelite, Melamine - non-recyclable, rigid).',
      'Glass: Raw materials (Silica SiO2, Na2CO3, CaCO3) and types (Soda-lime, Borosilicate/Pyrex, Flint, Hard glass).',
      'Chemical Fertilizers: Nitrogenous (Urea NH2CONH2), Phosphatic (Superphosphate), Potassic (KCl).',
      'Cement: Raw materials (Limestone CaCO3 60-65%, Clay Al2O3.2SiO2 20-25%), Gypsum (CaSO4.2H2O added to retard setting time).'
    ],
    formulasAndLaws: [
      'Saponification: Fat/Oil + NaOH -> Soap (Sodium stearate) + Glycerol',
      'Gypsum (CaSO4.2H2O): Added (2-3%) to cement clinker to slow down setting time.'
    ],
    mcqs: [
      {
        question: 'Why is 2% to 3% Gypsum (CaSO4.2H2O) added to cement during grinding of clinkers?',
        options: [
          'To increase cement hardness',
          'To slow down (retard) the initial setting time of cement',
          'To impart gray color to cement',
          'To make cement completely waterproof'
        ],
        correctIndex: 1,
        explanation: 'Gypsum delays the rapid hydration of tricalcium aluminate, slowing down the setting time so masons have time to work with mortar.'
      },
      {
        question: 'Which type of plastic cannot be remolded or softened upon reheating once set into shape?',
        options: ['Thermoplastics (e.g. Polythene)', 'Thermosetting plastics (e.g. Bakelite)', 'Polyvinyl Chloride (PVC)', 'Nylon-66'],
        correctIndex: 1,
        explanation: 'Thermosetting plastics like Bakelite undergo permanent cross-linking and cannot be melted or reshaped upon heating.'
      }
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS FOR SCIENCE MCQ GENERATOR ENGINE
// ============================================================================

export function getScienceChapterById(id: number): ScienceChapter | undefined {
  return SCIENCE_19_CHAPTERS.find((ch) => ch.id === id);
}

export function getScienceChapterContextForGemma(chapterId?: number): string {
  if (chapterId && chapterId >= 1 && chapterId <= 19) {
    const ch = getScienceChapterById(chapterId);
    if (ch) {
      return `[NEPAL SEE SCIENCE CURRICULUM - CHAPTER ${ch.id}: ${ch.name.toUpperCase()} (${ch.nameNe})]
Category: ${ch.category}
Key Concepts: ${ch.keyConcepts.join('; ')}
Formulas & Laws: ${ch.formulasAndLaws.join('; ')}`;
    }
  }

  // If no chapter specified, pick 3 random chapters across physics, chemistry, biology
  const randomSample = [
    SCIENCE_19_CHAPTERS[6],  // Force & Motion
    SCIENCE_19_CHAPTERS[15], // Gases
    SCIENCE_19_CHAPTERS[3],  // Heredity
  ];

  return `[NEPAL SEE SCIENCE CURRICULUM KNOWLEDGE BASE - 19 CHAPTERS]
${randomSample
  .map(
    (ch) =>
      `• Chapter ${ch.id} (${ch.name}): Laws: ${ch.formulasAndLaws.join('; ')} | Concepts: ${ch.keyConcepts.join('; ')}`
  )
  .join('\n')}`;
}

export function getRandomScienceMCQ(chapterId?: number) {
  if (chapterId && chapterId >= 1 && chapterId <= 19) {
    const ch = getScienceChapterById(chapterId);
    if (ch && ch.mcqs.length > 0) {
      const rnd = ch.mcqs[Math.floor(Math.random() * ch.mcqs.length)];
      return {
        ...rnd,
        chapterId: ch.id,
        chapterName: ch.name,
        chapterNameNe: ch.nameNe,
        category: ch.category,
      };
    }
  }

  // Pick random chapter from all 19
  const allMcqs: any[] = [];
  for (const ch of SCIENCE_19_CHAPTERS) {
    for (const mcq of ch.mcqs) {
      allMcqs.push({
        ...mcq,
        chapterId: ch.id,
        chapterName: ch.name,
        chapterNameNe: ch.nameNe,
        category: ch.category,
      });
    }
  }

  return allMcqs[Math.floor(Math.random() * allMcqs.length)];
}
