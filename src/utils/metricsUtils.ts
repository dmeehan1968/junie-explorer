import { Issue } from "../v2/Issue.js"
import { Metrics, Step } from "../v2/Step.js"
import { Task } from "../v2/Task.js"

/**
 * Helper function to calculate summary data for all steps in all tasks of an issue
 * @param tasks Array of tasks to calculate metrics for
 * @returns Aggregated metrics for all tasks
 */
export function calculateIssueSummary(tasks: Task[]): Metrics {
  return tasks.reduce((acc: Metrics, task: Task) => {
    // Calculate metrics for each task's steps
    const taskMetrics = [...task.steps.values()].reduce((stepAcc: Metrics, step: Step) => {
      stepAcc.inputTokens += step.metrics.inputTokens;
      stepAcc.outputTokens += step.metrics.outputTokens;
      stepAcc.cacheTokens += step.metrics.cacheTokens;
      stepAcc.cost += step.metrics.cost;
      stepAcc.cachedCost += step.metrics.cachedCost;
      stepAcc.buildTime += step.metrics.buildTime;
      stepAcc.artifactTime += step.metrics.artifactTime;
      stepAcc.modelTime += step.metrics.modelTime;
      stepAcc.modelCachedTime += step.metrics.modelCachedTime;
      stepAcc.requests += step.metrics.requests;
      stepAcc.cachedRequests += step.metrics.cachedRequests;
      return stepAcc;
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

    // Add task metrics to issue metrics
    acc.inputTokens += taskMetrics.inputTokens;
    acc.outputTokens += taskMetrics.outputTokens;
    acc.cacheTokens += taskMetrics.cacheTokens;
    acc.cost += taskMetrics.cost;
    acc.cachedCost += taskMetrics.cachedCost;
    acc.buildTime += taskMetrics.buildTime;
    acc.artifactTime += taskMetrics.artifactTime;
    acc.modelTime += taskMetrics.modelTime;
    acc.modelCachedTime += taskMetrics.modelCachedTime;
    acc.requests += taskMetrics.requests;
    acc.cachedRequests += taskMetrics.cachedRequests;

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


/**
 * Function to calculate project metrics by aggregating all issue metrics
 * @param issues Array of issues to calculate metrics for
 * @returns Aggregated metrics for all issues
 */
export function calculateProjectMetrics(issues: Issue[]): Metrics {
  return issues.reduce((acc: Metrics, issue: Issue) => {
    const issueMetrics = calculateIssueSummary([...issue.tasks.values()]);

    acc.inputTokens += issueMetrics.inputTokens;
    acc.outputTokens += issueMetrics.outputTokens;
    acc.cacheTokens += issueMetrics.cacheTokens;
    acc.cost += issueMetrics.cost;
    acc.cachedCost += issueMetrics.cachedCost;
    acc.buildTime += issueMetrics.buildTime;
    acc.artifactTime += issueMetrics.artifactTime;
    acc.modelTime += issueMetrics.modelTime;
    acc.modelCachedTime += issueMetrics.modelCachedTime;
    acc.requests += issueMetrics.requests;
    acc.cachedRequests += issueMetrics.cachedRequests;

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