import express from 'express';
import { jetBrainsPath } from '../utils/jetBrainsPath.js';
import { getIDEs } from '../utils/appState.js';

const router = express.Router();

// Homepage route
router.get('/', (req, res) => {
  try {
    const ideDirectories = getIDEs();

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
          <p><a href="/refresh" class="refresh-button">Refresh</a></p>

          <ul class="ide-list">
            ${ideDirectories.length > 0 
              ? ideDirectories.map(ide => `
                <li class="ide-item">
                  <a href="/ide/${encodeURIComponent(ide.name)}" class="ide-link">
                    <div class="ide-name">${ide.name}</div>
                  </a>
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

export default router;
