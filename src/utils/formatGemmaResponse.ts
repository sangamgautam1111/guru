/**
 * Format Gemma 4 response: clean tokens, normalize LaTeX math, and structure sections
 */
export const formatGemmaResponse = (text: string): string => {
  if (!text) return '';

  let out = text;

  // 1. Strip special model tokens & greetings
  out = out
    .replace(/<start_of_turn>/g, '')
    .replace(/<end_of_turn>/g, '')
    .replace(/<eos>/g, '')
    .replace(/<\/s>/g, '')
    .replace(/\[\/?s\]/g, '')
    .replace(/^(?:Namaste[!,\s.-]*|Hello[!,\s.-]*|Hi[!,\s.-]*)/i, '');

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

  // 8. Markdown Headings & Clean Section Breaks (Strip all # hashes)
  out = out
    .replace(/^[ \t]*#{1,6}\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/\b(Step|Phase|Part)\s*(\d+):?/gi, '$1 $2:')
    .replace(/([^\n])\s*(Step\s*\d+:|Phase\s*\d+:|Part\s*\d+:|Summary:|Key Concept:)/gi, '$1\n\n$2')
    .replace(/([a-z0-9\)])\s*(Definition|Origin|Formula|Meaning|Explanation|Note|Given|Solution|Key Point|Example|Derivation|Statement|Condition|Conclusion):/gi, '$1\n\n**$2:** ')
    .replace(/(Formula|Definition|Origin|Meaning|Explanation|Note):\s*([A-Za-z0-9])/gi, '**$1:** $2')
    .replace(/(Step\s*\d+:\s*[^.\n]+?)(Sir|The|According|In|When|Let|We|A|An|This|Here|It|By)\b/g, '$1\n\n$2')
    .replace(/(Phase\s*\d+:\s*[^.\n]+?\.)\s*([A-Z])/g, '$1\n\n$2')
    .replace(/(Step\s*\d+:\s*[^.\n]+?\.)\s*([A-Z])/g, '$1\n\n$2');

  // 9. Markdown Tables Normalization
  out = out
    .replace(/([^\n])\s*(\b(?:Summary\s*Table|Comparison\s*Table|Table)?\s*\|)/gi, '$1\n\n$2')
    .replace(/(Summary\s*Table|Table|Comparison):\s*\|/gi, '**$1:**\n\n|')
    .replace(/\|\s*([A-Za-z0-9][^|\n]*?)\s*\|\s*([A-Za-z0-9])/g, '|$1|\n$2');

  // 10. Clean list items and excess blank lines
  out = out
    .replace(/^[ \t]*[\*\-\+•]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out;
};
