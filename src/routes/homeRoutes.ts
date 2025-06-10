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
        <script>
          // Initialize IDE filters from session storage or default to all selected
          function initializeFilters() {
            const ideFilters = {};
            const storedFilters = sessionStorage.getItem('ideFilters');

            // Get all IDE elements
            const ideElements = document.querySelectorAll('.ide-filter');

            if (storedFilters) {
              // Use stored filters
              const parsedFilters = JSON.parse(storedFilters);
              ideElements.forEach(element => {
                const ide = element.getAttribute('data-ide');
                if (ide && parsedFilters[ide] !== undefined) {
                  ideFilters[ide] = parsedFilters[ide];
                  if (!parsedFilters[ide]) {
                    element.classList.add('ide-filter-disabled');
                  }
                } else {
                  ideFilters[ide] = true; // Default to selected
                }
              });
            } else {
              // Default: all IDEs selected
              ideElements.forEach(element => {
                const ide = element.getAttribute('data-ide');
                if (ide) {
                  ideFilters[ide] = true;
                }
              });
            }

            // Apply filters
            applyFilters(ideFilters);

            return ideFilters;
          }

          // Toggle IDE filter
          function toggleIdeFilter(element) {
            const ide = element.getAttribute('data-ide');
            const ideFilters = window.ideFilters || {};

            // Toggle the filter state
            ideFilters[ide] = !ideFilters[ide];

            // Update the visual state
            if (ideFilters[ide]) {
              element.classList.remove('ide-filter-disabled');
            } else {
              element.classList.add('ide-filter-disabled');
            }

            // Save to session storage
            sessionStorage.setItem('ideFilters', JSON.stringify(ideFilters));

            // Apply filters to the project list
            applyFilters(ideFilters);

            // Update global state
            window.ideFilters = ideFilters;
          }

          // Apply filters to the project list
          function applyFilters(ideFilters) {
            const projectItems = document.querySelectorAll('.project-item');

            projectItems.forEach(item => {
              const projectIdes = JSON.parse(item.getAttribute('data-ides') || '[]');
              const shouldShow = projectIdes.some(ide => ideFilters[ide]);

              if (shouldShow) {
                item.style.display = '';
              } else {
                item.style.display = 'none';
              }
            });
          }

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

          // Initialize filters when the page loads
          window.onload = function() {
            window.ideFilters = initializeFilters();
          };
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
          .ide-filter-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 4px;
          }
          .ide-filter {
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 5px;
            border-radius: 4px;
          }
          .ide-filter:hover {
            background-color: #eef7ff;
          }
          .ide-filter img {
            width: 30px;
            height: 30px;
          }
          .ide-filter-disabled img {
            filter: grayscale(100%) opacity(50%);
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

          <div class="ide-filter-toolbar">
            ${uniqueIdes.map(ide => `
              <div class="ide-filter" data-ide="${ide}" onclick="toggleIdeFilter(this)">
                <img src="${getIDEIcon(ide)}" alt="${ide}" title="${ide}" />
              </div>
            `).join('')}
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
