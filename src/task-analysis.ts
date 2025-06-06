#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Define interfaces for our data structures
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
        stepName: path.basename(stepFilePath),
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

      return {
        taskId: taskId,
        name: metadata?.name,
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
 */
function displayResults(analyses: TaskAnalysis[]): void {
  console.log('Task Analysis Results');
  console.log('====================\n');

  // Display summary table
  console.log('Summary Table:');
  const summaryTable = generateSummaryTable(analyses);
  console.table(summaryTable);
  console.log('\n');

  for (const analysis of analyses) {
    console.log(`Task: ${analysis.taskId}`);
    if (analysis.name) console.log(`Name: ${analysis.name}`);
    if (analysis.created) console.log(`Created: ${analysis.created}`);
    if (analysis.state) console.log(`State: ${analysis.state}`);
    console.log('Aggregated Statistics:');

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

    console.table(aggregatedTable);

    console.log('\nIndividual Steps:');

    // Create a single table with all steps as columns
    const stepsTable = generateStepsTable(analysis.steps);
    console.table(stepsTable);

    console.log('\n-------------------\n');
  }
}

/**
 * Main function
 */
function main(): void {
  // Path to the fixtures directory
  const fixturesPath = path.join(process.cwd(), 'fixtures');

  // Path to the .matterhorn directory
  const matterhornPath = path.join(
    fixturesPath, 
    'junie-explorer', 
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

  // Display results
  displayResults(analyses);
}

// Run the main function
main();
