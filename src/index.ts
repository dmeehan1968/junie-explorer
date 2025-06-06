import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { IDE } from './matterhorn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Get username from environment variable
const username = process.env.USER;
const jetBrainsPath = `/Users/${username}/Library/Caches/JetBrains`;

// Function to get IDE directories
async function getIDEDirectories(): Promise<IDE[]> {
  try {
    const exists = await fs.pathExists(jetBrainsPath);
    if (!exists) {
      console.error(`Path does not exist: ${jetBrainsPath}`);
      return [];
    }

    const directories = await fs.readdir(jetBrainsPath, { withFileTypes: true });
    
    // Filter for directories only
    const ideDirectories = directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        return {
          name: dirent.name,
          projects: [] // We're not loading projects for the homepage
        } as IDE;
      });
    
    return ideDirectories;
  } catch (error) {
    console.error('Error reading JetBrains directories:', error);
    return [];
  }
}

// Homepage route
app.get('/', async (req, res) => {
  try {
    const ideDirectories = await getIDEDirectories();
    
    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JetBrains IDE Explorer</title>
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body>
        <div class="container">
          <h1>JetBrains IDE Explorer</h1>
          <p>Directories found in: ${jetBrainsPath}</p>
          
          <ul class="ide-list">
            ${ideDirectories.length > 0 
              ? ideDirectories.map(ide => `
                <li class="ide-item">
                  <div class="ide-name">${ide.name}</div>
                </li>
              `).join('')
              : '<li>No JetBrains IDE directories found</li>'
            }
          </ul>
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error generating homepage:', error);
    res.status(500).send('An error occurred while generating the homepage');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Looking for JetBrains IDEs in: ${jetBrainsPath}`);
});