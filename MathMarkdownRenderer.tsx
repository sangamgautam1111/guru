import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  content: string;
  isUser?: boolean;
}

interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

interface TextBlock {
  type: 'text';
  text: string;
}

type ParsedBlock = TableBlock | TextBlock;

/**
 * High-performance Mathematical & Markdown Typographic Formatter.
 * Converts raw LaTeX notations, greek symbols, exponents, vector notation,
 * and numbered steps into 10/10 human-readable textbook styling.
 */
export const formatMathSymbols = (text: string): string => {
  if (!text) return '';

  return text
    // Remove Math Mode Delimiters
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\\[(.*?)\\\]/gs, '$1')
    .replace(/\\\((.*?)\\\)/gs, '$1')

    // Bold Vectors (\mathbf{A} -> A)
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
    .replace(/\\mp\b/g, '∓')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\neq\b|\\ne\b/g, '≠')
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/\\degree\b|\^\\circ\b/g, '°')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\Rightarrow\b|\\implies\b/g, ' ⇒ ')
    .replace(/\\rightarrow\b|\\to\b/g, ' → ')
    .replace(/\\text\{([^{}]+)\}/g, '$1')

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
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{1\}\{4\}/g, '¼')
    .replace(/\\frac\{3\}\{4\}/g, '¾')
    .replace(/\\frac\{1\}\{3\}/g, '⅓')
    .replace(/\\frac\{2\}\{3\}/g, '⅔')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, '√$1')

    // Exponents and Superscripts
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^4\b/g, '⁴')
    .replace(/\^n\b/g, 'ⁿ')
    .replace(/\^x\b/g, 'ˣ')
    .replace(/\^t\b/g, 'ᵗ')
    .replace(/\^\{([0-9+\-nixy]+)\}/g, (_, p) => {
      const sup: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
      };
      return p.split('').map((c: string) => sup[c] || c).join('');
    })

    // Subscripts
    .replace(/_0\b/g, '₀')
    .replace(/_1\b/g, '₁')
    .replace(/_2\b/g, '₂')
    .replace(/_3\b/g, '₃')
    .replace(/_n\b/g, 'ₙ')
    .replace(/_i\b/g, 'ᵢ')
    .replace(/_f\b/g, 'ᶠ')
    .replace(/_\{([0-9+\-aeoxn]+)\}/g, (_, p) => {
      const sub: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'n': 'ₙ',
      };
      return p.split('').map((c: string) => sub[c] || c).join('');
    });
};

/**
 * Normalizes bracket tables like `[ Feature ] [ RBC ] [ WBC ]` and single-line tables into standard multi-line markdown tables.
 */
const normalizeSingleLineTables = (rawText: string): string => {
  if (!rawText) return '';

  let text = rawText;

  // 1. Convert bracket tables: `[ Feature ] [ Red Blood Cell (RBC) ] [ White Blood Cell (WBC) ]`
  text = text.replace(/((?:\[[^\]\n]+\]\s*){2,})/g, (match) => {
    const parts = match.match(/\[([^\]]+)\]/g);
    if (parts && parts.length >= 2) {
      const cleanCells = parts.map((p) => p.slice(1, -1).trim()).filter((c) => c !== '---');
      if (cleanCells.length >= 2) {
        return '\n| ' + cleanCells.join(' | ') + ' |\n';
      }
    }
    return match;
  });

  // 2. Remove stray bracket dashes `[---]` or unattached separator lines
  text = text.replace(/\[\s*--+\s*\]/g, '');

  // 3. Look for single line containing table separator like "| :--- |" or "| --- |"
  text = text.replace(/(\|[^|\n]+\|[^|\n]+\|[\s\S]*?:-+:?[\s\S]*?\|)/g, (match) => {
    const tokens = match
      .split('|')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const sepIdx = tokens.findIndex((t) => /^:?-+:?$/.test(t));
    if (sepIdx > 0) {
      const colCount = sepIdx;
      const headers = tokens.slice(0, colCount);

      let dataStartIdx = sepIdx;
      while (dataStartIdx < tokens.length && /^:?-+:?$/.test(tokens[dataStartIdx])) {
        dataStartIdx++;
      }

      const dataTokens = tokens.slice(dataStartIdx);
      const rows: string[] = [];

      for (let i = 0; i < dataTokens.length; i += colCount) {
        const rowCells = dataTokens.slice(i, i + colCount);
        if (rowCells.length === colCount) {
          rows.push('| ' + rowCells.join(' | ') + ' |');
        } else if (rowCells.length > 0) {
          rows.push('\n' + rowCells.join(' '));
        }
      }

      const headerStr = '| ' + headers.join(' | ') + ' |';
      const sepStr = '| ' + headers.map(() => '---').join(' | ') + ' |';
      return '\n\n' + headerStr + '\n' + sepStr + '\n' + rows.join('\n') + '\n\n';
    }
    return match;
  });

  return text;
};

/**
 * Parses cleaned text into Blocks (either Table blocks or Text blocks)
 */
const parseBlocks = (content: string): ParsedBlock[] => {
  const lines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  let currentTableLines: string[] = [];

  const isSeparatorLine = (l: string) => {
    const trimmed = l.trim();
    return /^\|?(\s*:?-+:?\s*\|)+\s*$/.test(trimmed) || /^[\s:|\-]+$/.test(trimmed);
  };

  const flushTable = () => {
    if (currentTableLines.length >= 2) {
      let headerLineIdx = 0;
      while (headerLineIdx < currentTableLines.length && isSeparatorLine(currentTableLines[headerLineIdx])) {
        headerLineIdx++;
      }

      if (headerLineIdx < currentTableLines.length) {
        const headerLine = currentTableLines[headerLineIdx];
        const headers = headerLine
          .split('|')
          .map((h) => h.trim())
          .filter((h) => h.length > 0 && !/^:?-+:?$/.test(h));

        if (headers.length > 0) {
          const rows: string[][] = [];
          for (let i = headerLineIdx + 1; i < currentTableLines.length; i++) {
            const l = currentTableLines[i].trim();
            if (isSeparatorLine(l)) {
              continue;
            }
            const cells = l
              .split('|')
              .map((c) => c.trim())
              .filter((c, idx, arr) => {
                if (idx === 0 && c === '') return false;
                if (idx === arr.length - 1 && c === '') return false;
                return true;
              });

            if (cells.length > 0) {
              while (cells.length < headers.length) {
                cells.push('');
              }
              rows.push(cells.slice(0, headers.length));
            }
          }

          if (rows.length > 0) {
            blocks.push({
              type: 'table',
              headers,
              rows,
            });
            currentTableLines = [];
            return;
          }
        }
      }
    }

    currentTableLines.forEach((tl) => {
      if (!isSeparatorLine(tl)) {
        blocks.push({ type: 'text', text: tl });
      }
    });
    currentTableLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.split('|').length >= 3)) {
      currentTableLines.push(trimmed);
    } else {
      flushTable();
      blocks.push({ type: 'text', text: line });
    }
  }

  flushTable();
  return blocks;
};

/**
 * Splits model response text into natural, well-formatted paragraphs,
 * headings, bullets, math expressions, and responsive tables.
 */
export const MathMarkdownRenderer: React.FC<Props> = ({ content, isUser = false }) => {
  if (!content) return null;

  if (isUser) {
    return <Text style={styles.userText}>{content}</Text>;
  }

  // 1. De-glue glued table headings and single-line tables
  let unglued = content
    .replace(/([^\n])\s*(\b(?:Summary\s*Table|Comparison\s*Table|Table)?\s*\|)/gi, '$1\n\n$2')
    .replace(/(Summary\s*Table|Table|Comparison):\s*\|/gi, '**$1:**\n\n|')
    .replace(/\|\s*([A-Za-z0-9][^|\n]*?)\s*\|\s*([A-Za-z0-9])/g, '|$1|\n$2');

  unglued = normalizeSingleLineTables(unglued);

  // 2. Pre-process and clean model output
  let formatted = unglued
    // Strip repetitive leading greetings
    .replace(/^(?:Namaste[!,\s.-]*|Hello[!,\s.-]*|Hi[!,\s.-]*)/i, '')
    // Strip all markdown heading hashes (#, ##, ###, etc.)
    .replace(/^[ \t]*#{1,6}\s*/gm, '')
    .replace(/#{1,6}\s*/g, '')
    // Clean up multiple periods (.. or . .)
    .replace(/\.{2,}/g, '.')
    // Normalize Step/Phase numbers: "Step1:" -> "Step 1:"
    .replace(/\b(Phase|Step|Part)\s*(\d+):?/gi, '$1 $2:')
    // Ensure clean line breaks before structured steps
    .replace(/([^\n])\s*(Phase\s*\d+:|Step\s*\d+:|Part\s*\d+:|Summary:|Key Concept:)/gi, '$1\n\n$2')
    // Break subheaders glued to previous sentences/words
    .replace(
      /([a-z0-9\)])\s*(Definition|Origin|Formula|Meaning|Explanation|Note|Given|Solution|Key Point|Example|Derivation|Statement|Condition|Conclusion|Weight|Mass|Acceleration due to Gravity|Value on Earth|Keeping Objects on Earth|Orbits|Tides|Applications of Gravity):/gi,
      '$1\n\n**$2:** '
    )
    .replace(/(Formula|Definition|Origin|Meaning|Explanation|Note|Value on Earth):\s*([A-Za-z0-9])/gi, '**$1:** $2')
    // Break sentences glued directly to step headings
    .replace(/(Step\s*\d+:\s*[^.\n]+?)(Sir|The|According|In|When|Let|We|A|An|This|Here|It|By)\b/g, '$1\n\n$2')
    .replace(/(Phase\s*\d+:\s*[^.\n]+?)(Sir|The|According|In|When|Let|We|A|An|This|Here|It|By)\b/g, '$1\n\n$2')
    .replace(/(vs\.)([A-Z])/g, '$1 $2')
    // Convert all bullet variations at start of any line into clean bullet symbol
    .replace(/^[ \t]*[\*\-\+•]\s+/gm, '• ')
    // Ensure clean line breaks before numbered items (e.g. "1. ", "2. ")
    .replace(/([^\n])\s*(\b\d+[\.\)]\s+[A-Za-z])/g, '$1\n\n$2')
    // Remove lines that only contain asterisks or dashes
    .replace(/^[ \t]*[\*\-_]{2,}[ \t]*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const blocks = parseBlocks(formatted);

  return (
    <View style={styles.container}>
      {blocks.map((block, blockIdx) => {
        if (block.type === 'table') {
          // Calculate consistent column widths so header and data rows align with mathematical precision
          const colWidths = block.headers.map((h, colIdx) => {
            let maxLen = h.length;
            for (const r of block.rows) {
              if (r[colIdx]) maxLen = Math.max(maxLen, r[colIdx].length);
            }
            return Math.max(125, Math.min(220, maxLen * 7.5 + 28));
          });

          return (
            <ScrollView
              key={`tbl-${blockIdx}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableScrollContainer}
            >
              <View style={styles.tableCard}>
                {/* Table Header Row */}
                <View style={styles.tableHeaderRow}>
                  {block.headers.map((h, hIdx) => (
                    <View
                      key={`th-${hIdx}`}
                      style={[
                        styles.tableHeaderCell,
                        { width: colWidths[hIdx] },
                        hIdx === block.headers.length - 1 && { borderRightWidth: 0 },
                      ]}
                    >
                      <Text style={styles.tableHeaderText}>{formatMathSymbols(h)}</Text>
                    </View>
                  ))}
                </View>
                {/* Table Data Rows */}
                {block.rows.map((row, rIdx) => (
                  <View
                    key={`tr-${rIdx}`}
                    style={[
                      styles.tableRow,
                      rIdx % 2 === 1 && styles.tableRowAlt,
                      rIdx === block.rows.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    {row.map((cell, cIdx) => (
                      <View
                        key={`td-${rIdx}-${cIdx}`}
                        style={[
                          styles.tableCell,
                          { width: colWidths[cIdx] },
                          cIdx === row.length - 1 && { borderRightWidth: 0 },
                        ]}
                      >
                        <RenderInlineFormatted text={formatMathSymbols(cell)} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          );
        }

        // Standard Text line handling
        const trimmed = block.text.trim();
        if (!trimmed) {
          return <View key={`spacer-${blockIdx}`} style={styles.paragraphSpacer} />;
        }

        if (/^[\*\-_#\.\s]+$/.test(trimmed)) {
          return null;
        }

        const mathFormatted = formatMathSymbols(trimmed);

        // 1. Markdown Headings (# Header, ## Header, ### Header)
        const mdHeaderMatch = mathFormatted.match(/^(#{1,4})\s+(.*)/);
        if (mdHeaderMatch) {
          const rest = mdHeaderMatch[2].trim();
          return (
            <View key={`heading-${blockIdx}`} style={styles.paragraphBox}>
              <Text style={styles.headingTitleText}>
                <RenderInlineFormatted text={rest} isHeading />
              </Text>
            </View>
          );
        }

        // 2. Mathematical Steps / Key Concepts (Clean subtle badge or bold line)
        const stepHeaderMatch = mathFormatted.match(
          /^(Step\s*\d+|Part\s*\d+|Formula|Definition|Key Concept|Key Points|Important Note)(?::\s*|\s+-\s*|\s+)(.*)/i
        );
        if (stepHeaderMatch && trimmed.length < 100) {
          const prefix = stepHeaderMatch[1].trim();
          const rest = stepHeaderMatch[2].trim();
          return (
            <View key={`step-${blockIdx}`} style={styles.headingBox}>
              <View style={styles.headingBadge}>
                <Text style={styles.headingBadgeText}>{prefix}</Text>
              </View>
              {rest ? (
                <Text style={styles.headingTitleText}>
                  <RenderInlineFormatted text={rest} isHeading />
                </Text>
              ) : null}
            </View>
          );
        }

        // 2. Bullet item: e.g. "• Gravity acts everywhere..."
        if (mathFormatted.startsWith('• ') || mathFormatted.startsWith('- ') || mathFormatted.startsWith('* ')) {
          const bulletText = mathFormatted.replace(/^[•\-\*]\s+/, '');
          return (
            <View key={`bullet-${blockIdx}`} style={styles.bulletRow}>
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
            <View key={`num-${blockIdx}`} style={styles.numberedRow}>
              <Text style={styles.numberLabel}>{numLabel}</Text>
              <View style={styles.numberedContent}>
                <RenderInlineFormatted text={itemText} />
              </View>
            </View>
          );
        }

        // 4. Standard Paragraph with clean human typography
        return (
          <View key={`p-${blockIdx}`} style={styles.paragraphBox}>
            <RenderInlineFormatted text={mathFormatted} />
          </View>
        );
      })}
    </View>
  );
};

const RenderInlineFormatted: React.FC<{ text: string; isHeading?: boolean }> = ({ text, isHeading = false }) => {
  if (!text) return null;

  // Clean any leading lone bullet symbols inside the text
  let cleaned = text.replace(/^[•\-\*]\s+/, '');

  // Parse markdown bold (**text** or __text__), italic (*text* or _text_), code (`code`)
  const tokens = cleaned.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g);

  return (
    <Text style={isHeading ? styles.headingTitleText : styles.assistantText}>
      {tokens.map((part, idx) => {
        if (!part) return null;

        // Bold with double asterisks or double underscores
        if (
          (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length > 4)
        ) {
          const boldContent = part.slice(2, -2).replace(/\*/g, '').trim();
          return (
            <Text key={`b-${idx}`} style={styles.boldText}>
              {boldContent}
            </Text>
          );
        }

        // Code with backticks
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          const codeContent = part.slice(1, -1);
          return (
            <Text key={`c-${idx}`} style={styles.inlineCode}>
              {codeContent}
            </Text>
          );
        }

        // Single asterisk / underscore emphasis
        if (
          (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
          (part.startsWith('_') && part.endsWith('_') && part.length > 2)
        ) {
          const italicContent = part.slice(1, -1).replace(/\*/g, '').trim();
          return (
            <Text key={`i-${idx}`} style={styles.boldText}>
              {italicContent}
            </Text>
          );
        }

        // Standard text — strip any leftover stray asterisks so no raw '*' ever appears
        const sanitized = part.replace(/\*/g, '');
        return <Text key={`t-${idx}`}>{sanitized}</Text>;
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 6,
    gap: 6,
  },
  headingBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  headingBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.3,
  },
  headingTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.15,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2.5,
    paddingLeft: 2,
  },
  bulletSymbol: {
    fontSize: 15,
    color: '#38bdf8',
    marginRight: 8,
    lineHeight: 22,
    fontWeight: '700',
  },
  bulletContent: {
    flex: 1,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2.5,
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
  // --- TABLE STYLES ---
  tableScrollContainer: {
    marginVertical: 10,
  },
  tableCard: {
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#27272a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 2,
    borderBottomColor: '#38bdf8',
  },
  tableHeaderCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  tableHeaderText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#18181b',
  },
  tableRowAlt: {
    backgroundColor: '#111113',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#27272a',
  },
});

