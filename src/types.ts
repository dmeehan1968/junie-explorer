/**
 * Interface definitions for task analysis data structures
 */

export interface Aggregates {
  min: number;
  max: number;
  sum: number;
  avg: number;
}

export interface StatisticsMap {
  [key: string]: Aggregates;
}

export interface StepStatistics {
  stepName: string;
  statistics: {
    // [key: string]: number
    totalArtifactBuildTimeSeconds: number,
    artifactTime: number,
    modelTime: number,
    modelCachedTime: number,
    requests: number,
    cachedRequests: number,
    inputTokens: number,
    outputTokens: number,
    cacheInputTokens: number,
    cacheCreateInputTokens: number,
    cost: number,
    cachedCost: number
  };
}

export interface TaskAnalysis {
  taskId: string;
  name?: string;
  created?: string;
  state?: string;
  aggregatedStatistics: StatisticsMap;
  steps: StepStatistics[];
}