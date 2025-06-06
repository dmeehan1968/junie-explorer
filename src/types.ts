/**
 * Interface definitions for task analysis data structures
 */

export interface Statistic {
  min: number;
  max: number;
  sum: number;
  avg: number;
}

export interface StatisticsMap {
  [key: string]: Statistic;
}

export interface StepStatistics {
  stepName: string;
  statistics: { [key: string]: number };
}

export interface TaskAnalysis {
  taskId: string;
  name?: string;
  created?: string;
  state?: string;
  aggregatedStatistics: StatisticsMap;
  steps: StepStatistics[];
}