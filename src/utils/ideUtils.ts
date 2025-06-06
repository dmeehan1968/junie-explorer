import fs from 'fs-extra';
import path from 'path';
import { IDE, Project, Issue, Task, Step } from '../matterhorn.js'

// Get username from environment variable
const username = process.env.USER;
const jetBrainsPath = `/Users/${username}/Library/Caches/JetBrains`;

// Function to get IDE directories
export async function getIDEDirectories(): Promise<IDE[]> {
  try {
    const exists = await fs.pathExists(jetBrainsPath);
    if (!exists) {
      console.error(`Path does not exist: ${jetBrainsPath}`);
      return [];
    }

    const directories = fs.readdirSync(jetBrainsPath, { withFileTypes: true });

    // Filter for directories only
    return directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        name: dirent.name,
        projects: [], // We're not loading projects for the homepage
      } satisfies IDE));
  } catch (error) {
    console.error('Error reading JetBrains directories:', error);
    return [];
  }
}

// Function to get projects for a specific IDE
export async function getProjects(ideName: string): Promise<Project[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectsPath = path.join(idePath, 'projects');

    const exists = await fs.pathExists(projectsPath);
    if (!exists) {
      console.error(`Projects path does not exist: ${projectsPath}`);
      return [];
    }

    const directories = fs.readdirSync(projectsPath, { withFileTypes: true });

    // Filter for directories only
    return directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        name: dirent.name,
        issues: [], // We're not loading issues for the projects page
      } satisfies Project));
  } catch (error) {
    console.error(`Error reading projects for IDE ${ideName}:`, error);
    return [];
  }
}

// Function to get a specific IDE with its projects
export async function getIDEWithProjects(ideName: string): Promise<IDE | null> {
  try {
    const projects = await getProjects(ideName);
    return {
      name: ideName,
      projects
    };
  } catch (error) {
    console.error(`Error getting IDE with projects for ${ideName}:`, error);
    return null;
  }
}

// Function to get issues for a specific project
export async function getIssues(ideName: string, projectName: string): Promise<Issue[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectPath = path.join(idePath, 'projects', projectName);
    const issuesPath = path.join(projectPath, 'matterhorn', '.matterhorn', 'issues');

    const exists = await fs.pathExists(issuesPath);
    if (!exists) {
      console.error(`Issues path does not exist: ${issuesPath}`);
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

        // Extract UUID from filename (chain-<UUID>.json)
        const id = file.name.replace('chain-', '').replace('.json', '');

        const issue: Issue = {
          id,
          name: data.name || 'Unnamed Issue',
          created: new Date(data.created || Date.now()),
          state: data.state || 'Unknown',
          tasks: [] // We're not loading tasks for the issues page
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

// Function to get a specific project with its issues
export async function getProjectWithIssues(ideName: string, projectName: string): Promise<Project | null> {
  try {
    const issues = await getIssues(ideName, projectName);
    return {
      name: projectName,
      issues
    };
  } catch (error) {
    console.error(`Error getting project with issues for ${projectName} in IDE ${ideName}:`, error);
    return null;
  }
}

// Function to get tasks for a specific issue
export async function getTasks(ideName: string, projectName: string, issueId: string): Promise<Task[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectPath = path.join(idePath, 'projects', projectName);
    const issuePath = path.join(projectPath, 'matterhorn', '.matterhorn', 'issues', `chain-${issueId}`);

    const exists = await fs.pathExists(issuePath);
    if (!exists) {
      console.error(`Issue path does not exist: ${issuePath}`);
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

        // Extract index from filename (task-<index>.json)
        const id = parseInt(file.name.replace('task-', '').replace('.json', ''), 10);

        const task: Task = {
          id,
          created: new Date(data.created || Date.now()),
          artifactPath: data.artifactPath || '',
          description: data.context?.description || '',
          steps: [] // We're not loading steps for the tasks page
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

    // Sort by index or creation date
    return validTasks.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error(`Error reading tasks for issue ${issueId} in project ${projectName} in IDE ${ideName}:`, error);
    return [];
  }
}

// Function to get a specific issue with its tasks
export async function getIssueWithTasks(ideName: string, projectName: string, issueId: string): Promise<Issue | null> {
  try {
    // First get the issue details
    const issues = await getIssues(ideName, projectName);
    const issue = issues.find(i => i.id === issueId);

    if (!issue) {
      console.error(`Issue ${issueId} not found in project ${projectName} in IDE ${ideName}`);
      return null;
    }

    // Then get the tasks for this issue
    const tasks = await getTasks(ideName, projectName, issueId);

    return {
      ...issue,
      tasks
    };
  } catch (error) {
    console.error(`Error getting issue with tasks for ${issueId} in project ${projectName} in IDE ${ideName}:`, error);
    return null;
  }
}

// Function to get steps for a specific task
export async function getSteps(ideName: string, projectName: string, taskArtifactPath: string): Promise<Step[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName);
    const projectPath = path.join(idePath, 'projects', projectName);
    const matterhornPath = path.join(projectPath, 'matterhorn', '.matterhorn');
    const stepsPath = path.join(matterhornPath, taskArtifactPath);

    const exists = await fs.pathExists(stepsPath);
    if (!exists) {
      console.error(`Steps path does not exist: ${stepsPath}`);
      return [];
    }

    // Read all files in the directory
    const files = fs.readdirSync(stepsPath, { withFileTypes: true });

    // Filter for step_*.swe_next_step* files
    const stepFiles = files
      .filter(file => file.isFile() && file.name.match(/step_\d+.*swe_next_step/));

    // Read and parse each step file
    const stepPromises = stepFiles.map(async (file) => {
      try {
        // Extract step ID from filename (step_<id>.*)
        const idMatch = file.name.match(/step_(\d+)/);
        const id = idMatch ? idMatch[1] : '0';

        // Find corresponding swe_patch file
        const patchFiles = files.filter(f => 
          f.isFile() && f.name.includes('swe_patch') && f.name.startsWith(`step_${id}`)
        );

        if (patchFiles.length === 0) {
          console.error(`No swe_patch file found for step ${id}`);
          return null;
        }

        const patchFilePath = path.join(stepsPath, patchFiles[0].name);
        const data = await fs.readJson(patchFilePath);

        // Extract step data
        const step = {
          id,
          title: data.content?.title || `Step ${id}`,
          summary: data.content?.output || '',
          junieMetrics: data.statistics || {},
          metrics: {
            inputTokens: data.statistics?.inputTokens || 0,
            outputTokens: data.statistics?.outputTokens || 0,
            cacheTokens: data.statistics?.cacheCreateInputTokens || 0,
            cost: data.statistics?.cost || 0,
            cachedCost: data.statistics?.cachedCost || 0,
            buildTime: data.statistics?.totalArtifactBuildTimeSeconds || 0,
            artifactTime: data.statistics?.artifactTime || 0,
            modelTime: data.statistics?.modelTime || 0,
            modelCachedTime: data.statistics?.modelCachedTime || 0,
            requests: data.statistics?.requests || 0,
            cachedRequests: data.statistics?.cachedRequests || 0
          }
        };

        return step;
      } catch (error) {
        console.error(`Error reading step file ${file.name}:`, error);
        return null;
      }
    });

    const steps = await Promise.all(stepPromises);

    // Filter out any null values
    const validSteps = steps.filter(step => step !== null);

    // Sort by step ID
    return validSteps.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  } catch (error) {
    console.error(`Error reading steps for task with artifact path ${taskArtifactPath} in project ${projectName} in IDE ${ideName}:`, error);
    return [];
  }
}

// Function to get a specific task with its steps
export async function getTaskWithSteps(ideName: string, projectName: string, issueId: string, taskId: number): Promise<Task | null> {
  try {
    // First get the issue with tasks
    const issue = await getIssueWithTasks(ideName, projectName, issueId);

    if (!issue) {
      console.error(`Issue ${issueId} not found in project ${projectName} in IDE ${ideName}`);
      return null;
    }

    // Find the specific task
    const task = issue.tasks.find(t => t.id === taskId);

    if (!task) {
      console.error(`Task ${taskId} not found in issue ${issueId} in project ${projectName} in IDE ${ideName}`);
      return null;
    }

    // Get steps for this task
    const steps = await getSteps(ideName, projectName, task.artifactPath);

    return {
      ...task,
      steps
    };
  } catch (error) {
    console.error(`Error getting task with steps for task ${taskId} in issue ${issueId} in project ${projectName} in IDE ${ideName}:`, error);
    return null;
  }
}

// Export the path for use in other modules
export { jetBrainsPath };
