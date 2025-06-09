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
  state: 'Done' | 'Stopped' | 'Finished' | 'Running' | 'Declined';
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
  id: {
    index: number;
  };
  created: string;
  artifactPath: string;
  context: {
    description: string;
  };
  previousTasksInfo: any | null;
  finalAgentState: {
    issue: {
      description: string;
      editorContext: {
        recentFiles: string[];
        openFiles: string[];
      };
      previousTasksInfo: any | null;
    };
    observations: Array<{
      element: {
        type: string;
        content: string;
        kind: string;
      };
      action: string;
    }>;
    ideInitialState: {
      content: string;
      kind: string;
    };
  };
  isDeclined: boolean;
  plan: Array<{
    description: string;
    status: string;
  }>;
  patch: string;
  sessionHistory: {
    viewedFiles: string[];
    viewedImports: string[];
    createdFiles: string[];
    shownCode: Record<string, Array<{
      first: number;
      second: number;
    }>>;
  };
  steps: Step[];
}

/**
 * Each step taken within a task
 *
 * Location: /Users/<username>/Libraries/Caches/JetBrains/<IDE>/projects/<project-name>/matterhorn/.matterhorn/<artifactPath>/step_<id>.*swe_next_step* or step_<id>.*chat_next*
 * Order by: id
 *
 * <artifactPath> comes from Task.artifactPath
 * <id> is read from the filesystem
 * swe_next_step or chat_next is part of the file extension and can be prefixed or suffixed with other text
 */

export interface Step {
  id: string;

  // field: statistics
  junieMetrics: JunieMetrics;

  // translated from junieMetrics
  metrics: Metrics;

  // timestamp from file creation date
  createdAt: Date;
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
