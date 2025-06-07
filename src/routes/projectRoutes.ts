import express from 'express';
import { getIDEWithProjects } from '../utils/ideUtils.js';

const router = express.Router();

// Projects page route
router.get('/ide/:ideName', async (req, res) => {
  try {
    const { ideName } = req.params;
    const ide = await getIDEWithProjects(ideName);

    if (!ide) {
      return res.status(404).send('IDE not found');
    }

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${ide.name} Projects</title>
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body>
        <div class="container">
          <h1>${ide.name} </h1>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">JetBrains</a></li>
              <li class="breadcrumb-item active">${ide.name}</li>
            </ol>
          </nav>

          <ul class="project-list">
            ${ide.projects.length > 0 
              ? ide.projects.map(project => `
                <li class="project-item">
                  <a href="/ide/${encodeURIComponent(ideName)}/project/${encodeURIComponent(project.name)}" class="project-link">
                    <div class="project-name">${project.name}</div>
                  </a>
                </li>
              `).join('')
              : '<li>No projects found for this IDE</li>'
            }
          </ul>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generating projects page:', error);
    res.status(500).send('An error occurred while generating the projects page');
  }
});

export default router;
