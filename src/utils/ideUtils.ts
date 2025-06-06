import fs from 'fs-extra';
import path from 'path';
import { IDE, Project, Issue } from '../matterhorn.js';

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

// Export the path for use in other modules
export { jetBrainsPath };
