import { BaseOutputFormatter } from './formatter.js';
import { TaskAnalysis } from '../types.js';

/**
 * HTML output formatter implementation
 */
export class HtmlOutputFormatter extends BaseOutputFormatter {
  private html: string[] = [];
  private currentTaskHtml: string[] = [];

  formatHeader(): void {
    // Reset HTML content
    this.html = [];

    // Start HTML document with CSS styles
    this.html.push(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Junie Task Analysis Results</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
    .task-section {
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    .total-row {
      font-weight: bold;
      background-color: #e9f7ef;
    }
  </style>
</head>
<body>
  <h1>Task Analysis Results</h1>`);
  }

  formatSummaryTable(summaryTable: any[]): void {
    this.html.push('<h2>Summary Table</h2>');
    this.html.push('<table>');

    // Table headers
    if (summaryTable.length > 0) {
      const headers = Object.keys(summaryTable[0]);
      this.html.push('<tr>');
      for (const header of headers) {
        this.html.push(`<th>${header}</th>`);
      }
      this.html.push('</tr>');

      // Table rows
      for (let i = 0; i < summaryTable.length; i++) {
        const row = summaryTable[i];
        // Add special class for the TOTAL row
        const isTotal = row.name === 'TOTAL';
        this.html.push(`<tr${isTotal ? ' class="total-row"' : ''}>`);
        for (const header of headers) {
          this.html.push(`<td>${row[header]}</td>`);
        }
        this.html.push('</tr>');
      }
    }

    this.html.push('</table>');
  }

  formatTaskHeader(analysis: TaskAnalysis): void {
    // Start a new task section
    this.currentTaskHtml = [];
    this.currentTaskHtml.push('<div class="task-section">');
    this.currentTaskHtml.push(`<h2>Task: ${analysis.taskId}</h2>`);

    if (analysis.name) this.currentTaskHtml.push(`<p><strong>Name:</strong> ${analysis.name}</p>`);
    if (analysis.created) this.currentTaskHtml.push(`<p><strong>Created:</strong> ${analysis.created}</p>`);
    if (analysis.state) this.currentTaskHtml.push(`<p><strong>State:</strong> ${analysis.state}</p>`);

    this.currentTaskHtml.push('<h3>Aggregated Statistics</h3>');
  }

  formatAggregatedStatistics(aggregatedTable: Record<string, Record<string, any>>): void {
    this.currentTaskHtml.push('<table>');

    // Table headers
    const statKeys = Object.keys(aggregatedTable);
    if (statKeys.length > 0) {
      const firstStat = aggregatedTable[statKeys[0]];
      const headers = ['Statistic', ...Object.keys(firstStat)];

      this.currentTaskHtml.push('<tr>');
      for (const header of headers) {
        this.currentTaskHtml.push(`<th>${header}</th>`);
      }
      this.currentTaskHtml.push('</tr>');

      // Table rows
      for (const statKey of statKeys) {
        this.currentTaskHtml.push('<tr>');
        this.currentTaskHtml.push(`<td>${statKey}</td>`);

        const stat = aggregatedTable[statKey];
        for (const key in stat) {
          this.currentTaskHtml.push(`<td>${stat[key]}</td>`);
        }

        this.currentTaskHtml.push('</tr>');
      }
    }

    this.currentTaskHtml.push('</table>');
  }

  formatStepsTable(stepsTable: Record<string, Record<string, any>>): void {
    this.currentTaskHtml.push('<h3>Individual Steps</h3>');
    this.currentTaskHtml.push('<table>');

    // Get all step names and statistic keys
    const stepNames = Object.keys(stepsTable);

    if (stepNames.length > 0) {
      const firstStep = stepsTable[stepNames[0]];
      const statKeys = Object.keys(firstStep);

      // Table headers
      this.currentTaskHtml.push('<tr>');
      this.currentTaskHtml.push('<th>Step</th>');
      for (const key of statKeys) {
        this.currentTaskHtml.push(`<th>${key}</th>`);
      }
      this.currentTaskHtml.push('</tr>');

      // Table rows
      for (const stepName of stepNames) {
        this.currentTaskHtml.push('<tr>');
        this.currentTaskHtml.push(`<td>${stepName}</td>`);

        const stats = stepsTable[stepName];
        for (const key of statKeys) {
          this.currentTaskHtml.push(`<td>${stats[key]}</td>`);
        }

        this.currentTaskHtml.push('</tr>');
      }
    }

    this.currentTaskHtml.push('</table>');
  }

  formatSeparator(): void {
    // Close the current task section and add it to the main HTML
    this.currentTaskHtml.push('</div>');
    this.html.push(this.currentTaskHtml.join('\n'));

    // If this is the last task, output the complete HTML
    if (this.html.length > 0) {
      // Close the HTML document
      this.html.push('</body></html>');
      this.write(this.html.join('\n'));

      // Reset HTML content after writing
      this.html = [];
    }
  }

  cleanup(): void {
    // Make sure we close the HTML document if it hasn't been closed yet
    if (this.html.length > 0 && !this.html[this.html.length - 1].includes('</html>')) {
      this.html.push('</body></html>');
      this.write(this.html.join('\n'));
    }

    // Call parent cleanup to close the output stream
    super.cleanup();
  }
}
