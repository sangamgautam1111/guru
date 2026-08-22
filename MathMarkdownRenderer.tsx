import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  content: string;
  isUser?: boolean;
}

/**
 * High-performance Mathematical & Markdown Typographic Formatter.
 * Converts raw LaTeX notations, greek symbols, exponents, vector notation,
 * and numbered steps into 10/10 human-readable textbook styling.
 */
export const formatMathSymbols = (text: string): string => {
  if (!text) return '';

  return text
    // Remove Math Mode Delimiters
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\\[(.*?)\\\]/g, '$1')
    .replace(/\\\((.*?)\\\)/g, '$1')

    // Bold Vectors (\mathbf{A} -> 𝐀)
    .replace(/\\mathbf\{([A-Za-z0-9])\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\boldsymbol\{([^}]+)\}/g, '$1')
    .replace(/\\vec\{([A-Za-z0-9])\}/g, '$1⃗')
    .replace(/\\hat\{\\mathbf\{([a-z])\}\}/g, '$1̂')
    .replace(/\\hat\{([a-z])\}/g, '$1̂')

    // Greek Alphabet
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\rho\b/g, 'ρ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\Sigma\b/g, 'Σ')
    .replace(/\\Omega\b/g, 'Ω')

    // Math Operators & Relations
    .replace(/\\cdot\b/g, ' · ')
    .replace(/\\times\b/g, ' × ')
    .replace(/\\pm\b/g, '±')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\ne\b/g, '≠')
    .replace(/\\leq\b/g, '≤')
    .replace(/\\le\b/g, '≤')
    .replace(/\\geq\b/g, '≥')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\degree\b/g, '°')
    .replace(/\^\\circ\b/g, '°')
    .replace(/\\infty\b/g, '∞')

    // Trigonometric & Standard Functions
    .replace(/\\cos\b/g, 'cos')
    .replace(/\\sin\b/g, 'sin')
    .replace(/\\tan\b/g, 'tan')
    .replace(/\\sec\b/g, 'sec')
    .replace(/\\csc\b/g, 'csc')
    .replace(/\\cot\b/g, 'cot')
    .replace(/\\log\b/g, 'log')
    .replace(/\\ln\b/g, 'ln')

    // Fractions (\frac{a}{b} -> (a / b))
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')

    // Exponents and Superscripts
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^4\b/g, '⁴')
    .replace(/\^n\b/g, 'ⁿ')
    .replace(/\^x\b/g, 'ˣ')
    .replace(/\^t\b/g, 'ᵗ')

    // Subscripts
    .replace(/_0\b/g, '₀')
    .replace(/_1\b/g, '₁')
    .replace(/_2\b/g, '₂')
    .replace(/_3\b/g, '₃')
    .replace(/_n\b/g, 'ₙ')
    .replace(/_i\b/g, 'ᵢ')
    .replace(/_f\b/g, 'ᶠ');
};

/**
 * Splits model response text into natural, well-formatted paragraphs,
 * headings, bullets, and math expressions with clean typography (no rigid boxes/tables).
 */
export const MathMarkdownRenderer: React.FC<Props> = ({ content, isUser = false }) => {
  if (!content) return null;

  if (isUser) {
    return <Text style={styles.userText}>{content}</Text>;
  }

  // Pre-process and clean model output
  let formatted = content
    // Strip repetitive leading greetings
    .replace(/^(?:Namaste[!,\s.-]*|Hello[!,\s.-]*|Hi[!,\s.-]*)/i, '')
    // Strip all markdown heading hashes from every line
    .replace(/^[ \t]*#{1,6}\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    // Insert clean line breaks before numbered items like "1. ", "2. "
    .replace(/([^\n])\s*(\b\d+\.\s+[A-Za-z])/g, '$1\n\n$2')
    // Convert list dashes/asterisks into clean bullets
    .replace(/([^\n])\s*(•|\-|\*)\s+/g, '$1\n• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = formatted.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={`spacer-${lineIdx}`} style={styles.paragraphSpacer} />;
        }

        // Ignore any leftover hash strings
        if (/^#+$/.test(trimmed)) {
          return null;
        }

        const mathFormatted = formatMathSymbols(trimmed);

        // 1. Structured Step / Section Headings (e.g. "Step 1: ...", "Phase 1: ...", "Summary:")
        const stepHeaderMatch = mathFormatted.match(/^(Phase\s*\d+|Step\s*\d+|Part\s*\d+|Summary|Key Concept|Formula|Definition|Explanation)(?::\s*|\s+-\s*|\s+)(.*)/i);
        if (stepHeaderMatch && trimmed.length < 90) {
          const prefix = stepHeaderMatch[1];
          const rest = stepHeaderMatch[2];
          return (
            <View key={`step-${lineIdx}`} style={styles.headingBox}>
              <Text style={styles.headingText}>
                {prefix}{rest ? `: ${rest}` : ''}
              </Text>
            </View>
          );
        }

        // 2. Bullet item: e.g. "• Gravity acts everywhere..."
        if (mathFormatted.startsWith('•') || mathFormatted.startsWith('- ') || mathFormatted.startsWith('* ')) {
          const bulletText = mathFormatted.replace(/^[•\-\*]\s*/, '');
          return (
            <View key={`bullet-${lineIdx}`} style={styles.bulletRow}>
              <Text style={styles.bulletSymbol}>•</Text>
              <View style={styles.bulletContent}>
                <RenderInlineFormatted text={bulletText} />
              </View>
            </View>
          );
        }

        // 3. Numbered list item: e.g. "1. First step..."
        const numberedMatch = mathFormatted.match(/^(\d+[\.\)])\s+(.*)/);
        if (numberedMatch) {
          const numLabel = numberedMatch[1];
          const itemText = numberedMatch[2];
          return (
            <View key={`num-${lineIdx}`} style={styles.numberedRow}>
              <Text style={styles.numberLabel}>{numLabel}</Text>
              <View style={styles.numberedContent}>
                <RenderInlineFormatted text={itemText} />
              </View>
            </View>
          );
        }

        // 4. Standard Paragraph with clean typography
        return (
          <View key={`p-${lineIdx}`} style={styles.paragraphBox}>
            <RenderInlineFormatted text={mathFormatted} />
          </View>
        );
      })}
    </View>
  );
};

const RenderInlineFormatted: React.FC<{ text: string }> = ({ text }) => {
  // Parse bold **text** or *text* and highlight math symbols
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return (
    <Text style={styles.assistantText}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldContent = part.slice(2, -2);
          return (
            <Text key={`b-${idx}`} style={styles.boldText}>
              {boldContent}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          const italicContent = part.slice(1, -1);
          return (
            <Text key={`i-${idx}`} style={styles.boldText}>
              {italicContent}
            </Text>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          const codeContent = part.slice(1, -1);
          return (
            <Text key={`c-${idx}`} style={styles.inlineCode}>
              {codeContent}
            </Text>
          );
        }
        return <Text key={`t-${idx}`}>{part}</Text>;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  userText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: '#ffffff',
  },
  assistantText: {
    fontSize: 14.5,
    lineHeight: 23,
    color: '#e4e4e7',
    letterSpacing: 0.15,
  },
  boldText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: '#27272a',
    color: '#38bdf8',
    paddingHorizontal: 5,
    borderRadius: 4,
    fontSize: 13,
  },
  paragraphSpacer: {
    height: 6,
  },
  paragraphBox: {
    marginBottom: 6,
  },
  headingBox: {
    marginTop: 10,
    marginBottom: 4,
  },
  headingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 2,
  },
  bulletSymbol: {
    fontSize: 14,
    color: '#38bdf8',
    marginRight: 8,
    lineHeight: 22,
  },
  bulletContent: {
    flex: 1,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: 2,
  },
  numberLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
    marginRight: 6,
    lineHeight: 22,
  },
  numberedContent: {
    flex: 1,
  },
});
