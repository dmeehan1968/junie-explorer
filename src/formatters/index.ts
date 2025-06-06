/**
 * Export all formatters from a single entry point
 */

export { OutputFormatter, BaseOutputFormatter, FormatConfig } from './formatter.js';
export { ConsoleOutputFormatter } from './console-formatter.js';
export { JsonOutputFormatter } from './json-formatter.js';
export { HtmlOutputFormatter } from './html-formatter.js';

/**
 * Create an output formatter based on the format configuration
 * @param formatConfig The format configuration object
 * @returns An instance of the appropriate OutputFormatter
 */
import { FormatConfig, OutputFormatter } from './formatter.js';
import { ConsoleOutputFormatter } from './console-formatter.js';
import { JsonOutputFormatter } from './json-formatter.js';
import { HtmlOutputFormatter } from './html-formatter.js';

export function createFormatter(formatConfig: FormatConfig): OutputFormatter | null {
  const format = formatConfig.format.toLowerCase();
  const outputPath = formatConfig.outputPath;

  switch (format) {
    case 'console':
      return new ConsoleOutputFormatter(outputPath);
    case 'json':
      return new JsonOutputFormatter(outputPath);
    case 'html':
      return new HtmlOutputFormatter(outputPath);
    default:
      console.error(`Unknown output format: ${format}`);
      return null;
  }
}
