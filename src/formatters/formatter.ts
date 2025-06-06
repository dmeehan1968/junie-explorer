// Define interfaces for output formatters
export interface OutputFormatter {
  formatHeader(): void;
  formatSummaryTable(summaryTable: any[]): void;
  formatTaskHeader(analysis: TaskAnalysis): void;
  formatAggregatedStatistics(aggregatedTable: Record<string, Record<string, any>>): void;
  formatStepsTable(stepsTable: Record<string, Record<string, any>>): void;
  formatSeparator(): void;
  cleanup(): void;
}

// Import interfaces needed for the formatter
import { TaskAnalysis } from '../types.js';

// Base class for output formatters that handles writing to stdout or a file
import fs from 'fs';

export abstract class BaseOutputFormatter implements OutputFormatter {
  protected outputStream: fs.WriteStream | null = null;

  constructor(outputPath?: string) {
    if (outputPath) {
      try {
        this.outputStream = fs.createWriteStream(outputPath);
      } catch (error) {
        console.error(`Error creating output file ${outputPath}: ${error}`);
        process.exit(1);
      }
    }
  }

  protected write(data: string): void {
    if (this.outputStream) {
      this.outputStream.write(data + '\n');
    } else {
      console.log(data);
    }
  }

  /**
   * Close the output stream if it exists
   */
  public cleanup(): void {
    if (this.outputStream) {
      this.outputStream.end();
    }
  }

  abstract formatHeader(): void;
  abstract formatSummaryTable(summaryTable: any[]): void;
  abstract formatTaskHeader(analysis: TaskAnalysis): void;
  abstract formatAggregatedStatistics(aggregatedTable: Record<string, Record<string, any>>): void;
  abstract formatStepsTable(stepsTable: Record<string, Record<string, any>>): void;
  abstract formatSeparator(): void;
}

// Export the format configuration interface
export interface FormatConfig {
  format: string;
  outputPath?: string;
}
