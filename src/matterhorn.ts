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

export class Task {
  // Basic properties loaded initially
  id: {
    index: number;
  };
  created: string;
  artifactPath: string;
  context: {
    description: string;
  };
  isDeclined: boolean;
  plan: Array<{
    description: string;
    status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  }>;
  steps: Step[];

  // Path to the source JSON file
  private readonly filePath: string;

  // Memoized properties
  private _previousTasksInfo: {
    agentState: AgentState;
    patch: string;
    sessionHistory: SessionHistory;
  } | null = null;
  private _finalAgentState: AgentState | null = null;
  private _sessionHistory: SessionHistory | null = null;
  private _patch: string | null = null;

  /**
   * Constructor for Task class
   * @param filePath Full path to the source JSON file
   */
  constructor(filePath: string) {
    this.filePath = filePath;

    // Read the JSON file excluding fields that will be lazy loaded
    const { previousTasksInfo, finalAgentState, sessionHistory, patch, ...data } = fs.readJsonSync(filePath);

    // Assign basic properties
    this.id = data.id;
    this.created = data.created;
    this.artifactPath = data.artifactPath || '';
    this.context = data.context;
    this.isDeclined = data.isDeclined;
    this.plan = data.plan || [];
    this.steps = data.steps || [];
  }

  /**
   * Helper method to lazy load all properties at once
   * @returns this instance for chaining
   */
  private lazyLoad(): this {
    if (this._previousTasksInfo === null || this._finalAgentState === null || 
        this._sessionHistory === null || this._patch === null) {
      const data = fs.readJsonSync(this.filePath);
      this._previousTasksInfo = data.previousTasksInfo || null;
      this._finalAgentState = data.finalAgentState;
      this._sessionHistory = data.sessionHistory;
      this._patch = data.patch || '';
    }
    return this;
  }

  /**
   * Getter for previousTasksInfo property
   * Reads from source JSON and memoizes the result
   */
  get previousTasksInfo(): {
    agentState: AgentState;
    patch: string;
    sessionHistory: SessionHistory;
  } | null {
    return this.lazyLoad()._previousTasksInfo;
  }

  /**
   * Getter for finalAgentState property
   * Reads from source JSON and memoizes the result
   */
  get finalAgentState(): AgentState {
    return this.lazyLoad()._finalAgentState!;
  }

  /**
   * Getter for sessionHistory property
   * Reads from source JSON and memoizes the result
   */
  get sessionHistory(): SessionHistory {
    return this.lazyLoad()._sessionHistory!;
  }

  /**
   * Getter for patch property
   * Reads from source JSON and memoizes the result
   */
  get patch(): string {
    return this.lazyLoad()._patch!;
  }

  toJSON() {
    return {
      filePath: this.filePath,
      id: this.id,
      created: this.created,
      artifactPath: this.artifactPath,
      context: this.context,
      isDeclined: this.isDeclined,
      plan: this.plan,
      previousTasksInfo: this.previousTasksInfo,
      finalAgentState: this.finalAgentState,
      sessionHistory: this.sessionHistory,
      patch: this.patch,
    }
  }
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

import fs from 'fs-extra';

export class Step {
  // Basic properties loaded initially
  id: string;
  title: string;
  reasoning: {
    type: string;
    reason: string;
  };
  statistics: Statistics;

  // Derived fields
  metrics: Metrics;
  startTime: Date;
  endTime: Date;

  // Path to the source JSON file
  private readonly filePath: string;

  // Memoized properties
  private _content: StepContent | null = null;
  private _dependencies: Array<StepDependency> | null = null;
  private _description: string | null = null;

  /**
   * Constructor for Step class
   * @param filePath Full path to the source JSON file
   */
  constructor(filePath: string) {
    this.filePath = filePath;

    // Read the JSON file excluding content, dependencies, and description which will be lazy loaded if needed
    const { content, dependencies, description, ...data } = fs.readJsonSync(filePath);

    // Assign basic properties
    this.id = data.id;
    this.title = data.title;
    this.reasoning = data.reasoning;
    this.statistics = data.statistics || {};

    // Get file stats to extract creation time
    const stats = fs.statSync(filePath);
    const fileCreationTime = stats.birthtime;

    // Calculate metrics
    const artifactTime = this.statistics?.artifactTime || 0;
    const modelTime = this.statistics?.modelTime || 0;
    const modelCachedTime = this.statistics?.modelCachedTime || 0;

    // Calculate startTime: fileCreationTime minus the sum of times
    const totalDeductionMs = artifactTime + modelTime + modelCachedTime;
    this.startTime = new Date(fileCreationTime.getTime() - totalDeductionMs);
    this.endTime = fileCreationTime;

    // Calculate metrics
    this.metrics = {
      inputTokens: this.statistics?.inputTokens || 0,
      outputTokens: this.statistics?.outputTokens || 0,
      cacheTokens: this.statistics?.cacheCreateInputTokens !== undefined ? this.statistics.cacheCreateInputTokens : 0,
      cost: this.statistics?.cost || 0,
      cachedCost: this.statistics?.cachedCost || 0,
      buildTime: this.statistics?.totalArtifactBuildTimeSeconds || 0,
      artifactTime: artifactTime,
      modelTime: modelTime,
      modelCachedTime: modelCachedTime,
      requests: this.statistics?.requests || 0,
      cachedRequests: this.statistics?.cachedRequests || 0,
    };
  }

  private lazyLoad(): this {
    if (this._content === null || this._description == null || this._dependencies === null) {
      const data = fs.readJsonSync(this.filePath);
      this._content = data.content || {};
      try {
        this._description = JSON.parse(data.description || '') as string;
      } catch (error) {
        console.error('Error parsing step description:', error);
        this._description = data.description || '';
      }
      this._dependencies = data.dependencies || [];
    }
    return this;
  }
  /**
   * Getter for content property
   * Reads from source JSON and memoizes the result
   */
  get content(): any {
    return this.lazyLoad()._content!;
  }

  /**
   * Getter for dependencies property
   * Reads from source JSON and memoizes the result
   */
  get dependencies(): Array<StepDependency> {
    return this.lazyLoad()._dependencies!
  }

  /**
   * Getter for description property
   * Reads from source JSON and memoizes the result
   */
  get description(): string {
    return this.lazyLoad()._description!
  }

  toJSON() {
    return {
      filePath: this.filePath,
      id: this.id,
      title: this.title,
      reasoning: this.reasoning,
      statistics: this.statistics,
      metrics: this.metrics,
      startTime: this.startTime,
      endTime: this.endTime,
      content: this.content,
      dependencies: this.dependencies,
      description: this.description,
    }
  }
}

interface StepContent {
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
}

interface StepDependency {
  id: string;
  cached: boolean;
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
