import express from 'express';
import { jetBrainsPath } from '../utils/jetBrainsPath.js';
import { getMergedProjects, getIDEIcon } from '../utils/appState.js';

const router = express.Router();

// Homepage route (now shows projects instead of IDEs)
router.get('/', (req, res) => {
  try {
    const projects = getMergedProjects();

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JetBrains Project Explorer</title>
        <link rel="stylesheet" href="/css/style.css">
        <script>
          function reloadPage() {
            const button = document.getElementById('reload-button');
            if (button) {
              button.disabled = true;
              button.classList.add('loading');
              setTimeout(() => {
                window.location.href = '/refresh';
              }, 100);
            }
          }
        </script>
        <style>
          .ide-icons {
            display: flex;
            gap: 5px;
            margin-left: auto;
          }
          .ide-icon {
            width: 20px;
            height: 20px;
          }
          .project-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .project-item {
            padding: 10px 15px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>JetBrains Project Explorer</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <p>Projects found in: ${jetBrainsPath}</p>

          <ul class="project-list">
            ${projects.length > 0 
              ? projects.map(project => `
                <li class="project-item">
                  <a href="/project/${encodeURIComponent(project.name)}" class="project-link">
                    <div class="project-name">${project.name}</div>
                    <div class="ide-icons">
                      ${project.ides.map(ide => `
                        <img src="${getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="ide-icon" />
                      `).join('')}
                    </div>
                  </a>
                </li>
              `).join('')
              : '<li>No JetBrains projects found</li>'
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
