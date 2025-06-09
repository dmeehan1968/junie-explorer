import fs from 'fs-extra';
import path from 'path';
import { IDE, Issue, Project, Step, Task } from '../matterhorn.js';
import { jetBrainsPath } from './jetBrainsPath.js';

// The in-memory app state
let appState: IDE[] = [];

// Function to scan the file system and build the complete hierarchy
export async function scanFileSystem(): Promise<IDE[]> {
  try {
    console.log(`JetBrains Path: ${jetBrainsPath}`);
    console.log('Scanning file system...');
    const exists = await fs.pathExists(jetBrainsPath);
    if (!exists) {
      return [];
    }

    const directories = fs.readdirSync(jetBrainsPath, { withFileTypes: true });

    // Filter for directories only
    const ides = directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Build the complete hierarchy
    const idePromises = ides.map(async (ideName) => {
      const projects = await getProjectsForIDE(ideName);
      return {
        name: ideName,
        projects,
      } satisfies IDE;
    });

    return await Promise.all(idePromises);
  } catch (error) {
    console.error('Error scanning file system:', error);
    return [];
  }
}

// Helper function to get projects for an IDE
async function getProjectsForIDE(ideName: string): Promise<Project[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectsPath = path.join(idePath, 'projects');

    const exists = await fs.pathExists(projectsPath);
    if (!exists) {
      return [];
    }

    const directories = fs.readdirSync(projectsPath, { withFileTypes: true });

    // Filter for directories only
    const projectNames = directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Build projects with their issues
    const projectPromises = projectNames.map(async (projectName) => {
      const issues = await getIssuesForProject(ideName, projectName);
      return {
        name: projectName,
        issues,
      } satisfies Project;
    });

    return await Promise.all(projectPromises);
  } catch (error) {
    console.error(`Error getting projects for IDE ${ideName}:`, error);
    return [];
  }
}

// Helper function to get issues for a project
async function getIssuesForProject(ideName: string, projectName: string): Promise<Issue[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectPath = path.join(idePath, 'projects', projectName);
    const issuesPath = path.join(projectPath, 'matterhorn', '.matterhorn', 'issues');

    const exists = await fs.pathExists(issuesPath);
    if (!exists) {
      return [];
    }

    const files = fs.readdirSync(issuesPath, { withFileTypes: true });

    // Filter for chain-*.json files
    const issueFiles = files
      .filter(file => file.isFile() && file.name.startsWith('chain-') && file.name.endsWith('.json'));

    // Read and parse each issue file
    const issuePromises = issueFiles.map(async (file) => {
      try {
        const filePath = path.join(issuesPath, file.name);
        const data = await fs.readJson(filePath);

        // Get tasks for this issue
        const issueId = data.id.id;
        const tasks = await getTasksForIssue(ideName, projectName, issueId);

        const issue: Issue = {
          ...data,
          created: new Date(data.created),
          tasks,
        };

        return issue;
      } catch (error) {
        console.error(`Error reading issue file ${file.name}:`, error);
        return null;
      }
    });

    const issues = await Promise.all(issuePromises);

    // Filter out any null values
    const validIssues: Issue[] = issues.filter((issue): issue is Issue => issue !== null);

    // Sort by creation date (newest first)
    return validIssues.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch (error) {
    console.error(`Error reading issues for project ${projectName} in IDE ${ideName}:`, error);
    return [];
  }
}

// Helper function to get tasks for an issue
async function getTasksForIssue(ideName: string, projectName: string, issueId: string): Promise<Task[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectPath = path.join(idePath, 'projects', projectName);
    const issuePath = path.join(projectPath, 'matterhorn', '.matterhorn', 'issues', `chain-${issueId}`);

    const exists = await fs.pathExists(issuePath);
    if (!exists) {
      return [];
    }

    const files = fs.readdirSync(issuePath, { withFileTypes: true });

    // Filter for task-*.json files
    const taskFiles = files
      .filter(file => file.isFile() && file.name.startsWith('task-') && file.name.endsWith('.json'));

    // Read and parse each task file
    const taskPromises = taskFiles.map(async (file) => {
      try {
        const filePath = path.join(issuePath, file.name);
        const data = await fs.readJson(filePath);

        // Get steps for this task
        const steps = await getStepsForTask(ideName, projectName, data.artifactPath || '');

        // Create a task object with the full file content
        const task: Task = {
          ...data,
          steps
        };

        return task;
      } catch (error) {
        console.error(`Error reading task file ${file.name}:`, error);
        return null;
      }
    });

    const tasks = await Promise.all(taskPromises);

    // Filter out any null values
    const validTasks: Task[] = tasks.filter((task): task is Task => task !== null);

    // Sort by index
    return validTasks.sort((a, b) => a.id.index - b.id.index);
  } catch (error) {
    console.error(`Error reading tasks for issue ${issueId} in project ${projectName} in IDE ${ideName}:`, error);
    return [];
  }
}

// Helper function to get steps for a task
async function getStepsForTask(ideName: string, projectName: string, taskArtifactPath: string): Promise<Step[]> {
  try {
    if (!taskArtifactPath) {
      return [];
    }

    const idePath = path.join(jetBrainsPath, ideName);
    const projectPath = path.join(idePath, 'projects', projectName);
    const matterhornPath = path.join(projectPath, 'matterhorn', '.matterhorn');
    const stepsPath = path.join(matterhornPath, taskArtifactPath);

    const exists = await fs.pathExists(stepsPath);
    if (!exists) {
      return [];
    }

    // Read all files in the directory
    const files = fs.readdirSync(stepsPath, { withFileTypes: true });

    // Filter for step_*.swe_next_step* and step_*.chat_next* files
    const stepFiles = files
      .filter(file => file.isFile() && file.name.match(/step_\d+\..*(swe_next|chat_next).*$/));

    // Read and parse each step file
    const stepPromises = stepFiles.map(async (file) => {
      try {
        const filePath = path.join(stepsPath, file.name);
        const data = await fs.readJson(filePath);

        // Get file stats to extract creation time
        const stats = fs.statSync(filePath);
        const fileCreationTime = stats.birthtime;

        // Calculate metrics
        const artifactTime = data.statistics?.artifactTime || 0;
        const modelTime = data.statistics?.modelTime || 0;
        const modelCachedTime = data.statistics?.modelCachedTime || 0;

        // Calculate startTime: fileCreationTime minus the sum of times (not artifactTime, which appears to be whole seconds of these)
        const totalDeductionMs = artifactTime + modelTime + modelCachedTime;
        const startTime = new Date(fileCreationTime.getTime() - totalDeductionMs);
        const endTime = fileCreationTime;

        // Use the full file content for the Step interface
        return {
          ...data,
          metrics: {
            inputTokens: data.statistics?.inputTokens || 0,
            outputTokens: data.statistics?.outputTokens || 0,
            cacheTokens: data.statistics?.cacheCreateInputTokens !== undefined ? data.statistics.cacheCreateInputTokens : 0,
            cost: data.statistics?.cost || 0,
            cachedCost: data.statistics?.cachedCost || 0,
            buildTime: data.statistics?.totalArtifactBuildTimeSeconds || 0,
            artifactTime: artifactTime,
            modelTime: modelTime,
            modelCachedTime: modelCachedTime,
            requests: data.statistics?.requests || 0,
            cachedRequests: data.statistics?.cachedRequests || 0,
          },
          startTime,
          endTime,
        };
      } catch (error) {
        console.error(`Error reading step file ${file.name}:`, error);
        return null;
      }
    });

    const steps = await Promise.all(stepPromises);

    // Filter out any null values
    const validSteps = steps.filter((step): step is Step => step !== null);

    // Sort by step ID (lexicographically)
    return validSteps.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error(`Error reading steps for task with artifact path ${taskArtifactPath} in project ${projectName} in IDE ${ideName}:`, error);
    return [];
  }
}

// Initialize the app state
export async function initializeAppState(): Promise<void> {
  appState = await scanFileSystem();
  console.log(`App state initialized with ${appState.length} IDEs`);
}

// Refresh the app state
export async function refreshAppState(): Promise<void> {
  appState = await scanFileSystem();
  console.log(`App state refreshed with ${appState.length} IDEs`);
}

// Get all IDEs
export function getIDEs(): IDE[] {
  return appState;
}

// Get a specific IDE by name
export function getIDE(ideName: string): IDE | undefined {
  return appState.find(ide => ide.name === ideName);
}

// Get a specific project by IDE name and project name
export function getProject(ideName: string, projectName: string): Project | undefined {
  const ide = getIDE(ideName);
  if (!ide) return undefined;
  return ide.projects.find(project => project.name === projectName);
}

// Get a specific issue by IDE name, project name, and issue ID
export function getIssue(ideName: string, projectName: string, issueId: string): Issue | undefined {
  const project = getProject(ideName, projectName);
  if (!project) return undefined;
  return project.issues.find(issue => issue.id.id === issueId);
}

// Get a specific task by IDE name, project name, issue ID, and task ID
export function getTask(ideName: string, projectName: string, issueId: string, taskId: number): Task | undefined {
  const issue = getIssue(ideName, projectName, issueId);
  if (!issue) return undefined;
  return issue.tasks.find(task => task.id.index === taskId);
}
