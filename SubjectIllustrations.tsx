import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// 1. SCIENCE & TECH: Glowing 3D Atom Orbit with Nucleus
export const ScienceAtomIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
        <Stop offset="100%" stopColor="#be123c" stopOpacity={1} />
      </RadialGradient>
      <LinearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#38bdf8" />
        <Stop offset="100%" stopColor="#818cf8" />
      </LinearGradient>
      <LinearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#38bdf8" />
        <Stop offset="100%" stopColor="#c084fc" />
      </LinearGradient>
    </Defs>
    <Ellipse cx="30" cy="30" rx="24" ry="9" stroke="url(#orbitGrad1)" strokeWidth="2.2" transform="rotate(-30 30 30)" opacity="0.9" />
    <Ellipse cx="30" cy="30" rx="24" ry="9" stroke="url(#orbitGrad2)" strokeWidth="2.2" transform="rotate(30 30 30)" opacity="0.9" />
    <Ellipse cx="30" cy="30" rx="24" ry="9" stroke="#67e8f9" strokeWidth="1.8" transform="rotate(90 30 30)" opacity="0.75" />
    <Circle cx="49" cy="19" r="3.2" fill="#38bdf8" />
    <Circle cx="11" cy="41" r="3.2" fill="#818cf8" />
    <Circle cx="49" cy="41" r="3.2" fill="#c084fc" />
    <Circle cx="30" cy="6" r="2.8" fill="#67e8f9" />
    <Circle cx="30" cy="30" r="7.5" fill="url(#coreGlow)" />
    <Circle cx="28" cy="28" r="2.5" fill="#fecdd3" opacity="0.8" />
  </Svg>
);

// 2. COMPULSORY MATHS: 3D Triangle Pyramid & Precision Divider Compass
export const MathPyramidIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <LinearGradient id="pyrLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#38bdf8" />
        <Stop offset="100%" stopColor="#0284c7" />
      </LinearGradient>
      <LinearGradient id="pyrRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#0284c7" />
        <Stop offset="100%" stopColor="#0369a1" />
      </LinearGradient>
      <LinearGradient id="compassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f59e0b" />
        <Stop offset="100%" stopColor="#d97706" />
      </LinearGradient>
    </Defs>
    <Path d="M22 14 L8 46 L24 50 Z" fill="url(#pyrLeft)" />
    <Path d="M22 14 L24 50 L38 43 Z" fill="url(#pyrRight)" />
    <Path d="M22 14 L8 46 L38 43 Z" stroke="#7dd3fc" strokeWidth="1" opacity="0.5" />
    <Circle cx="44" cy="16" r="4" fill="url(#compassGrad)" />
    <Circle cx="44" cy="16" r="1.8" fill="#ffffff" />
    <Path d="M42 18 L32 48" stroke="url(#compassGrad)" strokeWidth="3" strokeLinecap="round" />
    <Path d="M46 18 L54 48" stroke="url(#compassGrad)" strokeWidth="3" strokeLinecap="round" />
    <Path d="M36 34 L50 34" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    <Circle cx="32" cy="48" r="1.5" fill="#fef3c7" />
    <Circle cx="54" cy="48" r="1.5" fill="#fef3c7" />
  </Svg>
);

// 3. SOCIAL STUDIES: 3D Earth Globe & Historical Open Book
export const SocialGlobeIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <LinearGradient id="globeOcean" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#0ea5e9" />
        <Stop offset="100%" stopColor="#0369a1" />
      </LinearGradient>
      <LinearGradient id="bookPage" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fef3c7" />
        <Stop offset="100%" stopColor="#fde68a" />
      </LinearGradient>
    </Defs>
    <Circle cx="25" cy="24" r="17" fill="url(#globeOcean)" />
    <Path d="M16 18 Q20 12 26 14 Q28 20 22 24 Q18 24 16 18 Z" fill="#22c55e" opacity="0.9" />
    <Path d="M26 24 Q34 22 36 28 Q32 34 26 32 Q24 28 26 24 Z" fill="#16a34a" opacity="0.9" />
    <Path d="M25 5 A19 19 0 0 1 25 43" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
    <Path d="M25 43 L25 49 M19 49 L31 49" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M30 38 Q42 34 54 36 L52 50 Q40 48 30 52 Z" fill="url(#bookPage)" stroke="#b45309" strokeWidth="1" />
    <Path d="M30 38 Q22 34 14 36 L16 50 Q24 48 30 52 Z" fill="#fef9c3" stroke="#b45309" strokeWidth="1" />
    <Path d="M30 38 L30 52" stroke="#78350f" strokeWidth="1.5" />
  </Svg>
);

// 4. NEPALI: Traditional Golden Sukunda / Brass Diyo Lamp with Warm Flame
export const NepaliDiyoIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <LinearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fef08a" />
        <Stop offset="50%" stopColor="#eab308" />
        <Stop offset="100%" stopColor="#a16207" />
      </LinearGradient>
      <RadialGradient id="flameGrad" cx="50%" cy="60%" r="50%">
        <Stop offset="0%" stopColor="#fef08a" />
        <Stop offset="40%" stopColor="#f97316" />
        <Stop offset="100%" stopColor="#dc2626" />
      </RadialGradient>
    </Defs>
    <Circle cx="30" cy="30" r="23" stroke="#ca8a04" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
    <Ellipse cx="30" cy="49" rx="14" ry="4.5" fill="url(#brassGrad)" />
    <Path d="M26 48 L28 40 L32 40 L34 48 Z" fill="url(#brassGrad)" />
    <Path d="M14 36 Q30 46 46 36 Q43 28 30 28 Q17 28 14 36 Z" fill="url(#brassGrad)" stroke="#713f12" strokeWidth="1" />
    <Ellipse cx="30" cy="31" rx="13" ry="3.5" fill="#713f12" />
    <Path d="M30 11 Q37 22 30 28 Q23 22 30 11 Z" fill="url(#flameGrad)" />
    <Path d="M30 17 Q34 23 30 27 Q26 23 30 17 Z" fill="#fef08a" />
  </Svg>
);

// 5. COMPULSORY ENGLISH: Open Book & Classic Feather Quill Pen
export const EnglishQuillIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <LinearGradient id="quillFeather" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f8fafc" />
        <Stop offset="60%" stopColor="#94a3b8" />
        <Stop offset="100%" stopColor="#475569" />
      </LinearGradient>
    </Defs>
    <Path d="M12 28 Q26 23 30 25 Q34 23 48 28 L46 45 Q33 40 30 42 Q27 40 14 45 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
    <Path d="M30 25 L30 42" stroke="#475569" strokeWidth="1.5" />
    <Path d="M17 31 H26 M17 35 H24 M34 31 H43 M34 35 H41" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    <Path d="M48 9 Q38 18 36 34 L38 35 Q45 22 51 11 Z" fill="url(#quillFeather)" />
    <Path d="M36 34 L34 38 L38 35 Z" fill="#d97706" />
    <Path d="M51 11 L35 37" stroke="#cbd5e1" strokeWidth="0.8" />
  </Svg>
);

// 6. OPTIONAL MATHS: 3D Board with Matrix of Operators (+ - * /)
export const OptMathIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Rect x="10" y="12" width="40" height="38" rx="6" fill="#0b192c" stroke="#38bdf8" strokeWidth="1.8" />
    <Path d="M30 14 V48 M12 31 H48" stroke="#1e293b" strokeWidth="1.5" />
    <Path d="M20 18 V26 M16 22 H24" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M36 22 H44" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M17 38 L23 44 M23 38 L17 44" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M36 41 H44" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
    <Circle cx="40" cy="37" r="1.5" fill="#fbbf24" />
    <Circle cx="40" cy="45" r="1.5" fill="#fbbf24" />
  </Svg>
);

// 7. COMPUTER SCIENCE: Sleek Coding Monitor with Neon </> Tag
export const ComputerCodeIllustration = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <Defs>
      <LinearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1e293b" />
        <Stop offset="100%" stopColor="#0f172a" />
      </LinearGradient>
      <LinearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#34d399" />
        <Stop offset="100%" stopColor="#22c55e" />
      </LinearGradient>
    </Defs>
    <Rect x="8" y="12" width="44" height="30" rx="4" fill="url(#screenGrad)" stroke="#475569" strokeWidth="1.8" />
    <Path d="M26 42 L24 49 M34 42 L36 49 M20 49 H40" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M21 21 L15 27 L21 33" stroke="url(#codeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M39 21 L45 27 L39 33" stroke="url(#codeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M32 19 L28 35" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

// 8. PRACTICE FOR EXAM: 3D Notebook & Pen Hero Icon
export const ExamNotebookIllustration = ({ size = 48 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 54 54" fill="none">
    <Defs>
      <LinearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f8fafc" />
        <Stop offset="100%" stopColor="#e2e8f0" />
      </LinearGradient>
      <LinearGradient id="penBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#38bdf8" />
        <Stop offset="100%" stopColor="#0284c7" />
      </LinearGradient>
    </Defs>
    <Rect x="10" y="8" width="28" height="36" rx="4" fill="url(#docGrad)" stroke="#94a3b8" strokeWidth="1.2" />
    <Path d="M16 16 H30 M16 22 H28 M16 28 H32 M16 34 H24" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M32 36 L43 14 L46 17 L35 39 Z" fill="url(#penBody)" />
    <Path d="M32 36 L30 40 L35 39 Z" fill="#0f172a" />
    <Path d="M43 14 L46 17 L44 12 Z" fill="#f59e0b" />
  </Svg>
);

// 9. DAILY STREAK: Glowing Circular Progress Ring with Flame
export const StreakFlameRing = ({ size = 56 }: { size?: number }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 60 60" style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id="streakRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#38bdf8" />
          <Stop offset="100%" stopColor="#0284c7" />
        </LinearGradient>
      </Defs>
      <Circle cx="30" cy="30" r="23" stroke="#1e293b" strokeWidth="4.5" fill="none" />
      <Circle
        cx="30"
        cy="30"
        r="23"
        stroke="url(#streakRingGrad)"
        strokeWidth="4.5"
        strokeDasharray="144"
        strokeDashoffset="38"
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 30 30)"
      />
    </Svg>
    <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 32 32" fill="none">
      <Defs>
        <RadialGradient id="innerFlame" cx="50%" cy="60%" r="50%">
          <Stop offset="0%" stopColor="#fef08a" />
          <Stop offset="40%" stopColor="#f97316" />
          <Stop offset="100%" stopColor="#ef4444" />
        </RadialGradient>
      </Defs>
      <Path
        d="M16 2 C16 2 24 10 24 18 C24 23 20 28 16 28 C12 28 8 23 8 18 C8 12 13 8 14 6 C14 6 12 10 13 13 C14 14.5 16 15 16 15 C16 15 17 12 16 2 Z"
        fill="url(#innerFlame)"
      />
      <Path
        d="M16 14 C16 14 19 18 19 21 C19 24 17 26 16 26 C15 26 13 24 13 21 C13 18 15 16 16 14 Z"
        fill="#fef08a"
      />
    </Svg>
  </View>
);

// 10. UNIVERSAL AI TUTORING: Cute 3D AI Robot Illustration
export const RobotAiIllustration = ({ size = 68 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70" fill="none">
    <Defs>
      <LinearGradient id="botHead" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#38bdf8" />
        <Stop offset="100%" stopColor="#0369a1" />
      </LinearGradient>
      <LinearGradient id="botBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1e293b" />
        <Stop offset="100%" stopColor="#0f172a" />
      </LinearGradient>
    </Defs>
    <Path d="M35 15 V8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
    <Circle cx="35" cy="7" r="3.2" fill="#38bdf8" />
    <Rect x="16" y="15" width="38" height="26" rx="9" fill="url(#botHead)" stroke="#7dd3fc" strokeWidth="1.2" />
    <Rect x="20" y="19" width="30" height="18" rx="6" fill="#0b1329" />
    <Circle cx="28" cy="28" r="3.5" fill="#38bdf8" />
    <Circle cx="42" cy="28" r="3.5" fill="#38bdf8" />
    <Circle cx="29.2" cy="26.8" r="1.2" fill="#ffffff" />
    <Circle cx="43.2" cy="26.8" r="1.2" fill="#ffffff" />
    <Rect x="12" y="24" width="4" height="8" rx="2" fill="#0284c7" />
    <Rect x="54" y="24" width="4" height="8" rx="2" fill="#0284c7" />
    <Path d="M22 43 C22 41 48 41 48 43 L52 60 H18 Z" fill="url(#botBody)" stroke="#334155" strokeWidth="1" />
    <Circle cx="35" cy="51" r="4.5" fill="#38bdf8" opacity="0.8" />
  </Svg>
);
