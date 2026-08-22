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
 * Splits model response text into well-formatted structural sections:
 * - Markdown Headings (###, ##, #)
 * - Numbered steps/formulas (1., 2., 3...)
 * - Bullet list items (•, -)
 * - Standalone formula cards (e.g. F = G (m1 m2 / r²))
 * - Standard paragraphs with bolding
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
    // Ensure headings have newlines around them
    .replace(/([^\n])\s*(#{1,4}\s+)/g, '$1\n\n$2')
    // Insert line breaks before numbered items like ":1." or ".2." or "angles:1."
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

        // Strip any isolated bare hashes
        if (/^#{1,6}\s*$/.test(trimmed)) {
          return null;
        }

        const mathFormatted = formatMathSymbols(trimmed);

        // 1. Markdown Headings (### Heading, ## Heading, # Heading)
        const headingMatch = mathFormatted.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();

          if (headingText.length > 0 && !/^#+$/.test(headingText)) {
            return (
              <View
                key={`h-${lineIdx}`}
                style={[
                  styles.headingContainer,
                  level <= 2 ? styles.majorHeadingBox : styles.subHeadingBox,
                ]}
              >
                <View style={styles.headingAccentLine} />
                <Text
                  style={[
                    styles.headingText,
                    level <= 2 ? styles.majorHeadingText : styles.subHeadingText,
                  ]}
                >
                  {headingText}
                </Text>
              </View>
            );
          }
        }

        // 2. Structured Phase / Step / Section Headings (e.g. "Phase 1: Definition", "Step 2: ...")
        const stepHeaderMatch = mathFormatted.match(/^(Phase\s*\d+|Step\s*\d+|Part\s*\d+|Summary|Key Concept|Formula|Definition|Explanation)(?::\s*|\s+-\s*|\s+)(.*)/i);
        if (stepHeaderMatch && trimmed.length < 85) {
          const prefix = stepHeaderMatch[1];
          const rest = stepHeaderMatch[2];
          return (
            <View key={`step-h-${lineIdx}`} style={styles.subHeadingBox}>
              <View style={styles.headingAccentLine} />
              <Text style={styles.subHeadingText}>
                {prefix}{rest ? `: ${rest}` : ''}
              </Text>
            </View>
          );
        }

        // 2. Numbered step / formula: e.g. "1. Dot Product: ..."
        const numberedMatch = mathFormatted.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          const number = numberedMatch[1];
          const itemText = numberedMatch[2];
          return (
            <View key={`num-${lineIdx}`} style={styles.numberedCard}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>{number}</Text>
              </View>
              <View style={styles.numberedContent}>
                <RenderInlineFormatted text={itemText} />
              </View>
            </View>
          );
        }

        // 3. Bullet item: e.g. "• Photosynthesis components..."
        if (mathFormatted.startsWith('•') || mathFormatted.startsWith('-') || mathFormatted.startsWith('* ')) {
          const bulletText = mathFormatted.replace(/^[•\-\*]\s*/, '');
          return (
            <View key={`bullet-${lineIdx}`} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <View style={styles.bulletContent}>
                <RenderInlineFormatted text={bulletText} />
              </View>
            </View>
          );
        }

        // 4. Standalone formula equation (contains = and math variables)
        const isStandaloneFormula =
          (mathFormatted.includes('=') || mathFormatted.includes('→')) &&
          mathFormatted.length < 90 &&
          !mathFormatted.startsWith('Where:') &&
          !mathFormatted.startsWith('Here are');

        if (isStandaloneFormula && (mathFormatted.includes('·') || mathFormatted.includes('×') || mathFormatted.includes('/') || mathFormatted.includes('²') || mathFormatted.includes('+') || mathFormatted.includes('-'))) {
          return (
            <View key={`formula-${lineIdx}`} style={styles.formulaCard}>
              <Text style={styles.formulaText}>{mathFormatted}</Text>
            </View>
          );
        }

        // 5. Standard Paragraph
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
    lineHeight: 22,
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
    paddingHorizontal: 4,
    borderRadius: 3,
    fontSize: 13,
  },
  paragraphSpacer: {
    height: 8,
  },
  paragraphBox: {
    marginBottom: 6,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 4,
  },
  majorHeadingBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 6,
  },
  subHeadingBox: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  headingAccentLine: {
    width: 3,
    height: 14,
    backgroundColor: '#38bdf8',
    borderRadius: 2,
    marginRight: 6,
  },
  headingText: {
    fontWeight: '800',
    color: '#ffffff',
  },
  majorHeadingText: {
    fontSize: 15.5,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  subHeadingText: {
    fontSize: 14,
    color: '#38bdf8',
    letterSpacing: 0.2,
  },
  numberedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  numberBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  numberedContent: {
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginTop: 8,
    marginRight: 8,
  },
  bulletContent: {
    flex: 1,
  },
  formulaCard: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#38bdf8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
