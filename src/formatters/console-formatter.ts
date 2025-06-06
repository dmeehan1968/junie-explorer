import { BaseOutputFormatter } from './formatter.js';
import { TaskAnalysis } from '../types.js';

/**
 * Console output formatter implementation
 */
export class ConsoleOutputFormatter extends BaseOutputFormatter {
  formatHeader(): void {
    this.write('Task Analysis Results');
    this.write('====================\n');
  }

  formatSummaryTable(summaryTable: any[]): void {
    this.write('Summary Table:');
    // console.table doesn't work with file output, so we need to format the table manually if using a file
    if (this.outputStream) {
      // Simple table formatting for file output
      const keys = Object.keys(summaryTable[0] || {});
      this.write(keys.join('\t'));
      for (const row of summaryTable) {
        this.write(keys.map(key => row[key]).join('\t'));
      }
    } else {
      console.table(summaryTable);
    }
    this.write('\n');
  }

  formatTaskHeader(analysis: TaskAnalysis): void {
    this.write(`Task: ${analysis.taskId}`);
    if (analysis.name) this.write(`Name: ${analysis.name}`);
    if (analysis.created) this.write(`Created: ${analysis.created}`);
    if (analysis.state) this.write(`State: ${analysis.state}`);
    this.write('Aggregated Statistics:');
  }

  formatAggregatedStatistics(aggregatedTable: Record<string, Record<string, any>>): void {
    if (this.outputStream) {
      // Simple table formatting for file output
      for (const key in aggregatedTable) {
        this.write(`${key}:`);
        const stats = aggregatedTable[key];
        for (const statKey in stats) {
          this.write(`  ${statKey}: ${stats[statKey]}`);
        }
      }
    } else {
      console.table(aggregatedTable);
    }
  }

  formatStepsTable(stepsTable: Record<string, Record<string, any>>): void {
    this.write('\nIndividual Steps:');
    if (this.outputStream) {
      // Simple table formatting for file output
      const stepNames = Object.keys(stepsTable);
      if (stepNames.length > 0) {
        const statKeys = Object.keys(stepsTable[stepNames[0]] || {});
        this.write(['Step', ...statKeys].join('\t'));
        for (const stepName of stepNames) {
          const stats = stepsTable[stepName];
          this.write([stepName, ...statKeys.map(key => stats[key])].join('\t'));
        }
      }
    } else {
      console.table(stepsTable);
    }
  }

  formatSeparator(): void {
    this.write('\n-------------------\n');
  }
}
