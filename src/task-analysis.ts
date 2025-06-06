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
   * @returns Task analysis result
   */
  static analyzeTask(taskDirPath: string): TaskAnalysis | null {
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

      return {
        taskId: path.basename(taskDirPath),
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
      const analysis = this.analyzeTask(taskDir);
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
 * Format and display the analysis results
 * @param analyses Array of task analyses
 */
function displayResults(analyses: TaskAnalysis[]): void {
  console.log('Task Analysis Results');
  console.log('====================\n');

  for (const analysis of analyses) {
    console.log(`Task: ${analysis.taskId}`);
    console.log('Aggregated Statistics:');

    // Create a table for aggregated statistics
    const aggregatedTable: Record<string, Record<string, number>> = {};

    for (const key in analysis.aggregatedStatistics) {
      const stat = analysis.aggregatedStatistics[key];
      aggregatedTable[key] = {
        'Min': formatNumber(stat.min),
        'Max': formatNumber(stat.max),
        'Sum': formatNumber(stat.sum),
        'Avg': formatNumber(stat.avg)
      };
    }

    console.table(aggregatedTable);

    console.log('\nIndividual Steps:');

    // Create a table for each step's statistics
    for (const step of analysis.steps) {
      console.log(`  ${step.stepName}:`);

      const stepTable: Record<string, number> = {};
      for (const key in step.statistics) {
        stepTable[key] = formatNumber(step.statistics[key]);
      }

      console.table(stepTable);
    }

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
