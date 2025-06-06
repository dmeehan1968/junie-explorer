import { BaseOutputFormatter } from './formatter.js';
import { TaskAnalysis } from '../types.js';

/**
 * JSON output formatter implementation
 */
export class JsonOutputFormatter extends BaseOutputFormatter {
  private data: any = {
    summary: null,
    tasks: []
  };

  private currentTask: any = null;

  formatHeader(): void {
    // Reset data for new output
    this.data = {
      summary: null,
      tasks: []
    };
  }

  formatSummaryTable(summaryTable: any[]): void {
    this.data.summary = summaryTable;
  }

  formatTaskHeader(analysis: TaskAnalysis): void {
    this.currentTask = {
      taskId: analysis.taskId,
      name: analysis.name,
      created: analysis.created,
      state: analysis.state,
      aggregatedStatistics: null,
      steps: null
    };
    this.data.tasks.push(this.currentTask);
  }

  formatAggregatedStatistics(aggregatedTable: Record<string, Record<string, any>>): void {
    if (this.currentTask) {
      this.currentTask.aggregatedStatistics = aggregatedTable;
    }
  }

  formatStepsTable(stepsTable: Record<string, Record<string, any>>): void {
    if (this.currentTask) {
      this.currentTask.steps = stepsTable;
    }
  }

  formatSeparator(): void {
    // After processing each task, output the current JSON data
    if (this.data.tasks.length === this.data.summary.length - 1) { // -1 for the TOTAL row
      this.write(JSON.stringify(this.data, null, 2));
    }
  }
}
