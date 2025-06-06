import fs from 'fs-extra'
import { IDE } from '../matterhorn.js'

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

// Export the path for use in other modules
export { jetBrainsPath }
