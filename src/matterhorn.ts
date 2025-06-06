/**
 * Which JetBrains IDE are the logs for
 *
 * Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>
 *
 * <username> can be accessed via process.env.USER
 * <IDE> is read from the filesystem
 */

export interface IDE {
  name: string;
  projects: Project[];
}

/**
 * Which user project are the logs for
 *
 * Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>/projects/<project-name>
 *
 * <project-name> is read from the filesystem
 */

export interface Project {
  name: string;
  issues: Issue[];
}

/**
 * Each issue that has been run within the project
 *
 * Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>/projects/<project-name>/matterhorn/.matterhorn/issues/chain-<UUID>.json
 * Order by: created
 *
 * <UUID> is read from the filesystem
 */

export interface Issue {
  id: string;  // UUID
  name: string;  // short summary of what was requested
  created: Date;
  state: 'Done' | 'Stopped';
  tasks: Task[];
}

/**
 * Each task that belongs to an issue
 *
 * Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>/projects/<project-name>/matterhorn/.matterhorn/issues/chain-<UUID>/task-<index>.json
 * Order by: index or created
 *
 * <index> is read from the filesystem
 */

export interface Task {
  id: number;        // index
  created: Date;
  artifactPath: string;
  steps: Step[];
}

/**
 * Each step taken within a task
 *
 * Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>/projects/<project-name>/matterhorn/.matterhorn/<artifactPath>/step_<id>.*swe_next_step*
 * Order by: id
 *
 * <artifactPath> comes from Task.artifactPath
 * <id> is read from the filesystem
 * swe_next_step is part of the file extension and can be prefixed or suffixed with other text
 */

export interface Step {
  id: string;

  // Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>/projects/<project-name>/matterhorn/.matterhorn/<artifactPath>.*swe_patch*
  // field: content.title
  // swe_patch is part of the file extension and can be prefixed or suffixed with other text
  title: string;
  // field: content.output
  summary: string;
  // field: statistics
  junieMetrics: JunieMetrics;

  // translated from junieMetrics
  metrics: Metrics;
}

export interface JunieMetrics {
  totalArtifactBuildTimeSeconds: number;
  artifactTime: number;
  modelTime: number;
  modelCachedTime: number;
  requests: number;
  cachedRequests: number;
  inputTokens: number;
  outputTokens: number;
  cacheInputTokens: number;
  cacheCreateInputTokens: number;
  cost: number;
  cachedCost: number;
}

/**
 * Represents the metrics that we will display from the JunieMetrics

 * Output in this order
 */
export interface Metrics {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;  // renamed from cacheCreateInputTokens
  cost: number;
  cachedCost: number;
  buildTime: number;    // renamed from totalArtifactBuildTimeSeconds
  artifactTime: number;
  modelTime: number;
  modelCachedTime: number;
  requests: number;
  cachedRequests: number;
}
