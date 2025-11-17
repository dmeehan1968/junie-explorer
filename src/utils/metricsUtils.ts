import { Metrics, Step } from "../Step"

/**
 * Helper function to calculate summary data for a task's steps
 * @param steps Array of steps to calculate metrics for
 * @returns Aggregated metrics for all steps
 */
export function calculateStepSummary(steps: Step[]): Metrics {
  return steps.reduce((acc: Metrics, step: Step) => {
    acc.inputTokens += step.metrics.inputTokens;
    acc.outputTokens += step.metrics.outputTokens;
    acc.cacheTokens += step.metrics.cacheTokens;
    acc.cost += step.metrics.cost;
    acc.cachedCost += step.metrics.cachedCost;
    acc.buildTime += step.metrics.buildTime;
    acc.artifactTime += step.metrics.artifactTime;
    acc.modelTime += step.metrics.modelTime;
    acc.modelCachedTime += step.metrics.modelCachedTime;
    acc.requests += step.metrics.requests;
    acc.cachedRequests += step.metrics.cachedRequests;
    return acc;
  }, {
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    cost: 0,
    cachedCost: 0,
    buildTime: 0,
    artifactTime: 0,
    modelTime: 0,
    modelCachedTime: 0,
    requests: 0,
    cachedRequests: 0
  });
}