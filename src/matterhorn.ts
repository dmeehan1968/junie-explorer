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
 * 
 * Projects with the same name across different IDEs are merged
 * The ides array contains the names of all IDEs that have this project
 */

export interface Project {
  name: string;
  issues: Issue[];
  ides: string[]; // Names of IDEs that have this project
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
  id: {
    id: string;  // UUID
  };
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
  previousTasksInfo: {
    agentState: AgentState;
    patch: string;
    sessionHistory: SessionHistory;
  } | null;
  finalAgentState: AgentState;
  isDeclined: boolean;
  plan: Array<{
    description: string;
    status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  }>;
  patch: string;
  sessionHistory: SessionHistory;
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
  title: string;
  description: string;
  reasoning: {
    type: string;
    reason: string;
  };
  statistics: Statistics;
  dependencies: Array<{
    id: string;
    cached: boolean;
  }>;
  content: {
    llmResponse: {
      type: string;
      content: string;
      kind: string;
    };
    actionRequest: {
      type: string;
      name: string;
      arguments: string;
      description: string;
    };
    actionResult: {
      type: string;
      content: string;
      kind: string;
    };
  };

  // Derived fields
  metrics: Metrics;
  startTime: Date;
  endTime: Date;
}

export interface Statistics {
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

export interface AgentState {
  issue: {
    description: string;
    editorContext: {
      recentFiles: string[];
      openFiles: string[];
    };
    previousTasksInfo: {
      agentState: AgentState;
      patch: string;
      sessionHistory: SessionHistory;
    } | null;
  };
  observations: Array<{
    element: {
      type: string;
      content: string;
      kind: 'Assistant' | 'User';
    };
    action:
    | 'open'
    | 'open_entire_file'
    | 'create'
    | 'search_replace'
    | 'submit'
    | 'mkdir'
    | 'ls'
    | 'get_file_structure'
    | 'scroll_down'
    | 'scroll_up'
    | 'undo_edit'
  }>;
  ideInitialState: {
    content: string;
    kind: string;
  };
}

export interface SessionHistory {
  viewedFiles: string[];
  viewedImports: string[];
  createdFiles: string[];
  shownCode: Record<string, Array<{
    first: number;
    second: number;
  }>>;
}
