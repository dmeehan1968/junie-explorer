#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Define interfaces for our data structures and output formatters
interface OutputFormatter {
  formatHeader(): void;
  formatSummaryTable(summaryTable: any[]): void;
  formatTaskHeader(analysis: TaskAnalysis): void;
  formatAggregatedStatistics(aggregatedTable: Record<string, Record<string, any>>): void;
  formatStepsTable(stepsTable: Record<string, Record<string, any>>): void;
  formatSeparator(): void;
  cleanup(): void;
}

// Base class for output formatters that handles writing to stdout or a file
abstract class BaseOutputFormatter implements OutputFormatter {
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

// Console output formatter implementation
class ConsoleOutputFormatter extends BaseOutputFormatter {
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

// JSON output formatter implementation
class JsonOutputFormatter extends BaseOutputFormatter {
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

// HTML output formatter implementation
class HtmlOutputFormatter extends BaseOutputFormatter {
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
interface Statistic {
  min: number;
  max: number;
  sum: number;
  avg: number;
}

interface StatisticsMap {
  [key: string]: Statistic;
}

interface StepStatistics {
  stepName: string;
  statistics: { [key: string]: number };
}

interface TaskAnalysis {
  taskId: string;
  name?: string;
  created?: string;
  state?: string;
  aggregatedStatistics: StatisticsMap;
  steps: StepStatistics[];
}

/**
 * Utility class to find task directories and step files
 */
class FileSystem {
  /**
   * Find all task directories in the .matterhorn directory
   * @param matterhornPath Path to the .matterhorn directory
   * @returns Array of task directory paths
   */
  static findTaskDirectories(matterhornPath: string): string[] {
    try {
      const entries = fs.readdirSync(matterhornPath);

      // Filter for directories that match the pattern <UUID> <NN>
      return entries
        .filter(entry => {
          const fullPath = path.join(matterhornPath, entry);
          return fs.statSync(fullPath).isDirectory() && 
                 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12} \d+$/.test(entry);
        })
        .map(entry => path.join(matterhornPath, entry));
    } catch (error) {
      console.error(`Error finding task directories: ${error}`);
      return [];
    }
  }

  /**
   * Find all step files in a task directory
   * @param taskDirPath Path to the task directory
   * @returns Array of step file paths
   */
  static findStepFiles(taskDirPath: string): string[] {
    try {
      const entries = fs.readdirSync(taskDirPath);

      // Filter for files that match the pattern step_<NN>.webstorm_swe_next_step
      return entries
        .filter(entry => /^step_\d+\.webstorm_swe_next_step$/.test(entry))
        .map(entry => path.join(taskDirPath, entry));
    } catch (error) {
      console.error(`Error finding step files in ${taskDirPath}: ${error}`);
      return [];
    }
  }

  /**
   * Read task metadata from the issues directory
   * @param matterhornPath Path to the .matterhorn directory
   * @param taskId Task ID (UUID)
   * @returns Object containing name, created, and state fields, or null if not found
   */
  static readTaskMetadata(matterhornPath: string, taskId: string): { name?: string, created?: string, state?: string } | null {
    try {
      // Extract UUID from taskId (which is the directory name like "UUID NN")
      const uuidMatch = taskId.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
      if (!uuidMatch) {
        console.warn(`Could not extract UUID from task ID: ${taskId}`);
        return null;
      }

      const uuid = uuidMatch[1];
      const issuesPath = path.join(matterhornPath, 'issues');
      const metadataFilePath = path.join(issuesPath, `chain-${uuid}.json`);

      if (!fs.existsSync(metadataFilePath)) {
        console.warn(`Metadata file not found: ${metadataFilePath}`);
        return null;
      }

      const content = fs.readFileSync(metadataFilePath, 'utf8');
      const data = JSON.parse(content);

      return {
        name: data.name,
        created: data.created,
        state: data.state
      };
    } catch (error) {
      console.error(`Error reading task metadata for ${taskId}: ${error}`);
      return null;
    }
  }

  /**
   * Read task title from the .webstorm_swe_patch file if it exists
   * @param matterhornPath Path to the .matterhorn directory
   * @param taskId Task ID (directory name)
   * @returns Title from the patch file, or undefined if not found or no title in the file
   */
  static readTaskTitleFromPatch(matterhornPath: string, taskId: string): string | undefined {
    try {
      const patchFilePath = path.join(matterhornPath, `${taskId}.webstorm_swe_patch`);

      if (!fs.existsSync(patchFilePath)) {
        // No patch file exists, return undefined
        return undefined;
      }

      const content = fs.readFileSync(patchFilePath, 'utf8');
      const data = JSON.parse(content);

      // Return the content.title if it exists
      return data.content?.title;
    } catch (error) {
      console.error(`Error reading patch file for ${taskId}: ${error}`);
      return undefined;
    }
  }
}

/**
 * Class to analyze statistics from step files
 */
class StatisticsAnalyzer {
  /**
   * Extract statistics from a step file
   * @param stepFilePath Path to the step file
   * @returns Object containing step name and statistics
   */
  static extractStatistics(stepFilePath: string): StepStatistics | null {
    try {
      const content = fs.readFileSync(stepFilePath, 'utf8');
      const data = JSON.parse(content);

      if (!data.statistics) {
        console.warn(`No statistics found in ${stepFilePath}`);
        return null;
      }

      return {
        stepName: path.basename(stepFilePath, path.extname(stepFilePath)),
        statistics: data.statistics
      };
    } catch (error) {
      console.error(`Error extracting statistics from ${stepFilePath}: ${error}`);
      return null;
    }
  }

  /**
   * Aggregate statistics for a task
   * @param stepStatistics Array of step statistics
   * @returns Aggregated statistics
   */
  static aggregateStatistics(stepStatistics: StepStatistics[]): StatisticsMap {
    const result: StatisticsMap = {};

    // If no steps, return empty result
    if (stepStatistics.length === 0) {
      return result;
    }

    // Initialize result with keys from the first step
    const firstStep = stepStatistics[0];
    for (const key in firstStep.statistics) {
      result[key] = {
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE,
        sum: 0,
        avg: 0
      };
    }

    // Process each step
    for (const step of stepStatistics) {
      for (const key in step.statistics) {
        const value = step.statistics[key];

        // Skip if not a number
        if (typeof value !== 'number') {
          continue;
        }

        // Create entry if it doesn't exist
        if (!result[key]) {
          result[key] = {
            min: Number.MAX_VALUE,
            max: Number.MIN_VALUE,
            sum: 0,
            avg: 0
          };
        }

        // Update min, max, sum
        result[key].min = Math.min(result[key].min, value);
        result[key].max = Math.max(result[key].max, value);
        result[key].sum += value;
      }
    }

    // Calculate averages
    for (const key in result) {
      result[key].avg = result[key].sum / stepStatistics.length;
    }

    return result;
  }
}

/**
 * Main class to analyze tasks
 */
class TaskAnalyzer {
  /**
   * Analyze a task directory
   * @param taskDirPath Path to the task directory
   * @param matterhornPath Path to the .matterhorn directory
   * @returns Task analysis result
   */
  static analyzeTask(taskDirPath: string, matterhornPath: string): TaskAnalysis | null {
    try {
      const stepFiles = FileSystem.findStepFiles(taskDirPath);

      if (stepFiles.length === 0) {
        console.warn(`No step files found in ${taskDirPath}`);
        return null;
      }

      const stepStatistics: StepStatistics[] = [];

      for (const stepFile of stepFiles) {
        const stats = StatisticsAnalyzer.extractStatistics(stepFile);
        if (stats) {
          stepStatistics.push(stats);
        }
      }

      if (stepStatistics.length === 0) {
        console.warn(`No valid statistics found in ${taskDirPath}`);
        return null;
      }

      const taskId = path.basename(taskDirPath);
      const metadata = FileSystem.readTaskMetadata(matterhornPath, taskId);

      // Check if there's a patch file with a title
      const patchTitle = FileSystem.readTaskTitleFromPatch(matterhornPath, taskId);

      return {
        taskId: taskId,
        // Use patch title if available, otherwise use metadata name
        name: patchTitle !== undefined ? patchTitle : metadata?.name,
        created: metadata?.created,
        state: metadata?.state,
        aggregatedStatistics: StatisticsAnalyzer.aggregateStatistics(stepStatistics),
        steps: stepStatistics
      };
    } catch (error) {
      console.error(`Error analyzing task ${taskDirPath}: ${error}`);
      return null;
    }
  }

  /**
   * Analyze all tasks in the .matterhorn directory
   * @param matterhornPath Path to the .matterhorn directory
   * @returns Array of task analyses
   */
  static analyzeAllTasks(matterhornPath: string): TaskAnalysis[] {
    const taskDirs = FileSystem.findTaskDirectories(matterhornPath);
    const results: TaskAnalysis[] = [];

    for (const taskDir of taskDirs) {
      const analysis = this.analyzeTask(taskDir, matterhornPath);
      if (analysis) {
        results.push(analysis);
      }
    }

    // Sort tasks by created date in ascending order
    results.sort((a, b) => {
      // Handle cases where created date might be undefined
      if (!a.created) return -1;
      if (!b.created) return 1;
      return new Date(a.created).getTime() - new Date(b.created).getTime();
    });

    return results;
  }
}

/**
 * Format a number with up to 4 decimal places
 * @param value The number to format
 * @returns Formatted number
 */
function formatNumber(value: number): number {
  // For integers, return as is
  // For decimals, round to 4 decimal places
  return Number.isInteger(value) ? value : Number(value.toFixed(4));
}

/**
 * Format milliseconds as HH:MM:SS.MS
 * @param milliseconds The milliseconds to format
 * @returns Formatted time string
 */
function formatMillisecondsToTime(milliseconds: number): string {
  // Calculate hours, minutes, seconds, and remaining milliseconds
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = milliseconds % 1000;

  // Format as HH:MM:SS.MS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Generate a summary table with specific statistics for all tasks
 * @param analyses Array of task analyses
 * @returns Summary table with required columns
 */
function generateSummaryTable(analyses: TaskAnalysis[]): any[] {
  const summaryTable: any[] = [];

  // Initialize sums
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreateInputTokens = 0;
  let totalCost = 0;

  for (const analysis of analyses) {
    const stats = analysis.aggregatedStatistics;
    // Extract the suffix number from the taskId (which is in the format "UUID NN")
    const promptMatch = analysis.taskId.match(/ (\d+)$/);
    // Convert to number, use 0 as fallback for consistency in data type
    const prompt = promptMatch ? parseInt(promptMatch[1], 10) : 0;

    // Get values for the current row
    const inputTokens = stats.inputTokens ? stats.inputTokens.sum : 0;
    const outputTokens = stats.outputTokens ? stats.outputTokens.sum : 0;
    const cacheCreateInputTokens = stats.cacheCreateInputTokens ? stats.cacheCreateInputTokens.sum : 0;
    const cost = stats.cost ? stats.cost.sum : 0;

    // Add to totals
    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
    totalCacheCreateInputTokens += cacheCreateInputTokens;
    totalCost += cost;

    summaryTable.push({
      'name': analysis.name || 'N/A',
      'prompt': prompt,
      'created': analysis.created || 'N/A',
      'state': analysis.state || 'N/A',
      'modelTime': stats.modelTime ? formatMillisecondsToTime(stats.modelTime.sum) : '00:00:00.000',
      'inputTokens': formatNumber(inputTokens),
      'outputTokens': formatNumber(outputTokens),
      'cacheCreateInputTokens': formatNumber(cacheCreateInputTokens),
      'cost': formatNumber(cost)
    });
  }

  // Add footer row with totals
  summaryTable.push({
    'name': 'TOTAL',
    'prompt': '',
    'created': '',
    'state': '',
    'modelTime': '',
    'inputTokens': formatNumber(totalInputTokens),
    'outputTokens': formatNumber(totalOutputTokens),
    'cacheCreateInputTokens': formatNumber(totalCacheCreateInputTokens),
    'cost': formatNumber(totalCost)
  });

  return summaryTable;
}

/**
 * Generate a table with all steps for a task
 * @param steps Array of step statistics
 * @returns Table with steps as rows and statistics as columns
 */
function generateStepsTable(steps: StepStatistics[]): Record<string, Record<string, any>> {
  const stepsTable: Record<string, Record<string, any>> = {};

  // Get all unique statistic keys across all steps
  const allKeys = new Set<string>();
  for (const step of steps) {
    for (const key in step.statistics) {
      allKeys.add(key);
    }
  }

  // Create rows for each step
  for (const step of steps) {
    const stepName = step.stepName;
    stepsTable[stepName] = {};

    // Add columns for each statistic
    for (const key of allKeys) {
      if (key in step.statistics) {
        // Format modelTime as HH:MM:SS.MS
        if (key === 'modelTime') {
          stepsTable[stepName][key] = formatMillisecondsToTime(step.statistics[key]);
        } else {
          stepsTable[stepName][key] = formatNumber(step.statistics[key]);
        }
      } else {
        stepsTable[stepName][key] = 'N/A';
      }
    }
  }

  return stepsTable;
}

/**
 * Format and display the analysis results
 * @param analyses Array of task analyses
 * @param formatters Array of output formatters to use
 */
function displayResults(analyses: TaskAnalysis[], formatters: OutputFormatter[]): void {
  for (const formatter of formatters) {
    formatter.formatHeader();

    // Display summary table
    const summaryTable = generateSummaryTable(analyses);
    formatter.formatSummaryTable(summaryTable);

    for (const analysis of analyses) {
      formatter.formatTaskHeader(analysis);

      // Create a table for aggregated statistics
      const aggregatedTable: Record<string, Record<string, any>> = {};

      for (const key in analysis.aggregatedStatistics) {
        const stat = analysis.aggregatedStatistics[key];

        // Format modelTime as HH:MM:SS.MS
        if (key === 'modelTime') {
          aggregatedTable[key] = {
            'Min': formatMillisecondsToTime(stat.min),
            'Max': formatMillisecondsToTime(stat.max),
            'Sum': formatMillisecondsToTime(stat.sum),
            'Avg': formatMillisecondsToTime(stat.avg)
          };
        } else {
          aggregatedTable[key] = {
            'Min': formatNumber(stat.min),
            'Max': formatNumber(stat.max),
            'Sum': formatNumber(stat.sum),
            'Avg': formatNumber(stat.avg)
          };
        }
      }

      formatter.formatAggregatedStatistics(aggregatedTable);

      // Create a single table with all steps as columns
      const stepsTable = generateStepsTable(analysis.steps);
      formatter.formatStepsTable(stepsTable);

      formatter.formatSeparator();
    }
  }
}

/**
 * Create an output formatter based on the format configuration
 * @param formatConfig The format configuration object
 * @returns An instance of the appropriate OutputFormatter
 */
function createFormatter(formatConfig: FormatConfig): OutputFormatter | null {
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

/**
 * Interface for format configuration
 */
interface FormatConfig {
  format: string;
  outputPath?: string;
}

/**
 * Parse command line arguments
 * @returns Object containing parsed arguments
 */
function parseArgs(): { formats: FormatConfig[] } {
  const args = process.argv.slice(2);
  const result: { formats: FormatConfig[] } = { formats: [{ format: 'console' }] }; // Default to console output

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' || args[i] === '-f') {
      if (i + 1 < args.length) {
        // Replace the default format with the specified formats
        if (result.formats.length === 1 && result.formats[0].format === 'console') {
          result.formats = [];
        }

        // Split by comma to allow multiple formats
        const formatSpecs = args[i + 1].split(',');

        for (const spec of formatSpecs) {
          // Check if the format includes a file path (format:filepath)
          const parts = spec.split(':');
          if (parts.length === 1) {
            // No file path specified, just the format
            result.formats.push({ format: parts[0] });
          } else {
            // Format with file path
            result.formats.push({ 
              format: parts[0], 
              outputPath: parts.slice(1).join(':') // Rejoin in case the path contains colons
            });
          }
        }

        i++; // Skip the next argument as we've already processed it
      }
    }
  }

  return result;
}

/**
 * Main function
 */
function main(): void {
  // Parse command line arguments
  const args = parseArgs();

  // Create formatters
  const formatters: OutputFormatter[] = [];
  for (const formatConfig of args.formats) {
    const formatter = createFormatter(formatConfig);
    if (formatter) {
      formatters.push(formatter);
    }
  }

  // If no valid formatters, exit
  if (formatters.length === 0) {
    console.error('No valid output formats specified.');
    process.exit(1);
  }

  // Path to the fixtures directory
  const junieLogsPath = path.join('/Users/dmeehan/Library/Caches/JetBrains/WebStorm2025.1/projects');

  // Path to the .matterhorn directory
  const matterhornPath = path.join(
    junieLogsPath,
    'junie-explorer.8cd3e64c',
    'matterhorn',
    '.matterhorn'
  );

  // Check if the directory exists
  if (!fs.existsSync(matterhornPath)) {
    console.error(`Directory not found: ${matterhornPath}`);
    process.exit(1);
  }

  // Analyze all tasks
  const analyses = TaskAnalyzer.analyzeAllTasks(matterhornPath);

  if (analyses.length === 0) {
    console.warn('No tasks found or all tasks failed analysis.');
    process.exit(1);
  }

  // Display results using the specified formatters
  displayResults(analyses, formatters);

  // Clean up formatters (close file streams)
  for (const formatter of formatters) {
    formatter.cleanup();
  }
}

// Run the main function
try {
  main();
} catch(error) {
  console.log(error)
}
