import express from 'express';
import { jetBrainsPath } from '../utils/jetBrainsPath.js';
import { getMergedProjects, getIDEIcon } from '../utils/appState.js';

const router = express.Router();

// Homepage route (now shows projects instead of IDEs)
router.get('/', (req, res) => {
  try {
    const projects = getMergedProjects();

    // Get all unique IDE names from all projects
    const allIdes = new Set<string>();
    projects.forEach(project => {
      project.ides.forEach(ide => allIdes.add(ide));
    });

    // Sort IDE names alphabetically
    const uniqueIdes = Array.from(allIdes).sort();

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JetBrains Project Explorer</title>
        <link rel="stylesheet" href="/css/style.css">
        <script src="/js/ideFilters.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header-container">
            <h1>JetBrains Project Explorer</h1>
            <button id="reload-button" class="reload-button" onclick="reloadPage()">Reload</button>
          </div>
          <p>Projects found in: ${jetBrainsPath}</p>

          <div class="ide-filter-toolbar">
            <div class="filter-label">Filter by IDE</div>
            ${uniqueIdes.map(ide => `
              <div class="ide-filter" data-ide="${ide}" onclick="toggleIdeFilter(this)">
                <img src="${getIDEIcon(ide)}" alt="${ide}" title="${ide}" />
              </div>
            `).join('')}
            <div class="project-search">
              <input type="text" id="project-search-input" placeholder="Search projects..." oninput="filterByProjectName(this.value)">
            </div>
          </div>

          <ul class="project-list">
            ${projects.length > 0 
              ? projects.map(project => `
                <li class="project-item" data-ides='${JSON.stringify(project.ides)}'>
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
