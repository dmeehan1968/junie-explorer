import fs from 'fs-extra'
import path from 'path'
import { IDE, Project } from '../matterhorn.js'

// Get username from environment variable
const username = process.env.USER
const jetBrainsPath = `/Users/${username}/Library/Caches/JetBrains`

// Function to get IDE directories
export async function getIDEDirectories(): Promise<IDE[]> {
  try {
    const exists = await fs.pathExists(jetBrainsPath)
    if (!exists) {
      console.error(`Path does not exist: ${jetBrainsPath}`)
      return []
    }

    const directories = fs.readdirSync(jetBrainsPath, { withFileTypes: true })

    // Filter for directories only
    return directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        name: dirent.name,
        projects: [], // We're not loading projects for the homepage
      } satisfies IDE))
  } catch (error) {
    console.error('Error reading JetBrains directories:', error)
    return []
  }
}

// Function to get projects for a specific IDE
export async function getProjects(ideName: string): Promise<Project[]> {
  try {
    const idePath = path.join(jetBrainsPath, ideName)
    const projectsPath = path.join(idePath, 'projects')

    const exists = await fs.pathExists(projectsPath)
    if (!exists) {
      console.error(`Projects path does not exist: ${projectsPath}`)
      return []
    }

    const directories = fs.readdirSync(projectsPath, { withFileTypes: true })

    // Filter for directories only
    return directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        name: dirent.name,
        issues: [], // We're not loading issues for the projects page
      } satisfies Project))
  } catch (error) {
    console.error(`Error reading projects for IDE ${ideName}:`, error)
    return []
  }
}

// Function to get a specific IDE with its projects
export async function getIDEWithProjects(ideName: string): Promise<IDE | null> {
  try {
    const projects = await getProjects(ideName)
    return {
      name: ideName,
      projects
    }
  } catch (error) {
    console.error(`Error getting IDE with projects for ${ideName}:`, error)
    return null
  }
}

// Export the path for use in other modules
export { jetBrainsPath }
