import { marked } from 'marked';
import { escapeHtml } from './escapeHtml.js';
import { ParsedRepresentation } from './representationParser.js';

// Types for the parsed content
interface ThoughtContent {
  'Previous Step'?: string;
  Plan?: string;
  Command?: string;
}

// HTML generation utilities
export class RepresentationRenderer {
  private static async renderSection(key: string, value: string): Promise<string> {
    const title = key.replace(/([A-Z])/g, ' $1').trim();
    const content = key === 'Command' 
      ? `<pre><code>${escapeHtmlExceptCodeBlocks(value)}</code></pre>`
      : await marked(escapeHtmlExceptCodeBlocks(value));

    return `
      <div class="parsed-section prose prose-sm max-w-none">
        <h3>${title}</h3>
        ${content}
      </div>
    `;
  }

  private static async renderThoughtSection(parsedContent: ThoughtContent, fallbackContent: string): Promise<string> {
    const hasParsedSections = Object.values(parsedContent).some(value => value);

    if (hasParsedSections) {
      const sections = await Promise.all(
        Object.entries(parsedContent)
          .filter(([_, value]) => value)
          .map(([key, value]) => this.renderSection(key, value!))
      );
      return sections.join('');
    }

    return `<div class="prose prose-sm max-w-none">${await marked(escapeHtmlExceptCodeBlocks(fallbackContent))}</div>`;
  }

  private static async renderResultSection(resultContent: string): Promise<string> {
    if (!resultContent) return '';

    return `
      <div class="result-section max-w-none">
        <h3>Result</h3>
        ${await marked(escapeHtmlExceptCodeBlocks(resultContent))}
      </div>
    `;
  }

  static async renderRepresentation(parsed: ParsedRepresentation): Promise<string> {
    const thoughtSection = await this.renderThoughtSection(parsed.parsedSections, parsed.thoughtContent);
    const resultSection = await this.renderResultSection(parsed.resultContent);

    return `
      <div class="thought-section prose">
        ${thoughtSection}
      </div>
      ${resultSection}
    `;
  }
}

/**
 * Escapes HTML special characters in a given string, except for content wrapped in
 * code blocks (```...```) or inline code spans (`...`). This ensures that code blocks
 * and inline codes are preserved as-is, while other content is made safe for use in HTML.
 * Special handling is provided for Command content which gets wrapped in code tags.
 *
 * @param {string} markdown - The input string which may contain raw HTML and markdown with code blocks.
 * @return {string} A string where HTML special characters are escaped, except within code blocks and inline code spans.
 */
function escapeHtmlExceptCodeBlocks(markdown: string): string {
  const codeBlockRegex = /(```[\s\S]*?```)|(`[^`]*?`)/g;
  const parts: string[] = [];
  let lastIndex = 0;

  for (const match of markdown.matchAll(codeBlockRegex)) {
    const beforeCode = markdown.substring(lastIndex, match.index);
    parts.push(escapeHtml(beforeCode), match[0]);
    lastIndex = match.index! + match[0].length;
  }

  parts.push(escapeHtml(markdown.substring(lastIndex)));
  return parts.join('');
}
