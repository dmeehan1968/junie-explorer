import express from 'express'
import { ReloadButton } from '../../components/reloadButton.js'
import { SortIcon } from '../../components/sortIcon.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { jetBrainsPath } from '../../utils/jetBrainsPath.js'
import { themeAttributeForHtml } from '../../utils/themeCookie.js'
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

function ProjectMetricsChart() {
  return `
    <div class="card bg-base-100 border border-base-300 shadow mb-5">
      <div class="card-body p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="card-title">Project Metrics</h2>
          ${ProjectMetricsChartOptions()}
        </div>
        <div id="projects-graph-container" class="h-96 p-2 bg-base-200 rounded-lg hidden">
          <canvas id="projectsMetricsChart"></canvas>
        </div>
      </div>
    </div>`
}

function ProjectMetricsChartOptions() {
  return `
    <div class="flex gap-2 items-center" id="project-chart-display">
      <div class="">Show: </div>
      <div class="join">
        <input class="join-item btn btn-sm" type="radio" id="display-both" value="both" name="display-option" aria-label="Both" onchange="handleDisplayOptionChange(this)">
        <input class="join-item btn btn-sm" type="radio" id="display-cost" value="cost" name="display-option" aria-label="Cost" onchange="handleDisplayOptionChange(this)">
        <input class="join-item btn btn-sm" type="radio" id="display-tokens" value="tokens" name="display-option" aria-label="Tokens" onchange="handleDisplayOptionChange(this)">
      </div>
    </div>
  `
}

export const homeRouteHandler = async (req: AppRequest, res: AppResponse) => {
  const locale = getLocaleFromRequest(req)

  try {
    const { jetBrains } = req
    const projects = [...(await jetBrains?.projects ?? []).values()]

    // Get all unique IDE names from all projects
    const allIdes = new Set<string>()
    projects.forEach(project => {
      project.ideNames.forEach(ide => allIdes.add(ide))
    })

    // Sort IDE names alphabetically
    const uniqueIdes: string[] = Array.from(allIdes).sort()

    // Generate HTML
    const html: string = `
      <!DOCTYPE html>
      <html lang="en" ${themeAttributeForHtml(req.headers.cookie)}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Junie Explorer</title>
        <link rel="stylesheet" href="/css/app.css">
        <link rel="icon" href="/icons/favicon.png" type="image/png">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script>
          // Define the projects data as a global variable
          window.projectsData = ${JSON.stringify(projects.map(p => ({ name: p.name, ides: p.ideNames })))};
        </script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/ideFilters.js"></script>
        <script src="/js/projectSelection.js"></script>
        <script src="/js/reloadPage.js"></script>
      </head>
      <body class="bg-base-200 p-5">
        <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
            <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer</h1>
            <div class="flex items-center gap-3">
              ${ThemeSwitcher()}
              ${ReloadButton()}
            </div>
          </div>
          ${VersionBanner(jetBrains?.version)}
          <p class="mb-5 text-base-content/70" data-testid="logs-directory-path">Projects found in: ${jetBrainsPath}</p>

          ${!jetBrains!.hasMetrics
      ? `
                <div class="bg-base-content/10 p-4 rounded mb-4">
                  The Junie logs do not contain token or cost metrics, which means that the projects were most
                  likely created by the Junie General Availability (GA) plugin which does not collect metrics.
                </div>
              `
      : ``
    }

          ${jetBrains!.hasMetrics ? ProjectMetricsChart() : ''}

          <div class="flex flex-wrap gap-3 mb-5 p-3 bg-base-200 rounded" data-testid="ide-filter-toolbar">
            <div class="font-medium text-base-content flex items-center">Filter by IDE</div>
            ${uniqueIdes.map(ide => `
              <div class="ide-filter cursor-pointer transition-all duration-300 p-1 rounded hover:bg-base-300" data-testid="ide-filter" data-ide="${ide}" onclick="toggleIdeFilter(this)">
                <img src="${jetBrains?.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-8 h-8" />
              </div>
            `).join('')}
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra w-full bg-base-100" id="projects-table">
              <thead>
                <tr class="!bg-base-200">
                  ${jetBrains!.hasMetrics ? `
                    <th class="w-12 text-center">
                      <input type=\"checkbox\" id=\"select-all-projects\" onchange=\"toggleSelectAllProjects()\" class=\"checkbox checkbox-primary checkbox-sm\" title=\"Select All\"> 
                    </th>
                  ` : ''}
                  <th>
                    <div class="flex items-center gap-2">
                      <span>Name</span>
                      <button class="btn btn-ghost btn-xs" id="sort-name-btn" onclick="toggleNameSort()" title="Toggle sort" aria-label="Toggle sort">
                        ${SortIcon('asc')}
                      </button>
                      <label class="input input-sm relative">
                        <input type="text" id="project-search-input" data-testid="project-search" placeholder="Search projects..." oninput="filterByProjectName(this.value);toggleSearchClearBtn()" class="grow w-64 pr-8">
                        <button id="project-search-clear" class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2 hidden" title="Clear search" aria-label="Clear search" onclick="clearProjectSearch()">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 0 0 5.7 7.1L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"/></svg>
                        </button>
                      </div>
                    </label>
                  </th>
                  <th class="text-right whitespace-nowrap w-0">
                    <div class="flex items-center gap-2 justify-end">
                      <span>Last Updated</span>
                      <button class="btn btn-ghost btn-xs" id="sort-updated-btn" onclick="toggleUpdatedSort()" title="Toggle sort" aria-label="Toggle sort">
                        ${SortIcon('desc')}
                      </button>
                    </div>
                  </th>
                  <th class="text-right whitespace-nowrap w-0">Issues</th>
                  <th class="text-right whitespace-nowrap w-0">IDEs</th>
                </tr>
              </thead>
              <tbody id="project-list" data-testid="projects-list">
                ${projects.length > 0
      ? (await Promise.all(projects.map(async project => `
                    <tr class="project-row cursor-pointer hover:!bg-accent transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md" data-ides='${JSON.stringify(project.ideNames)}'>
                      ${jetBrains!.hasMetrics ? `
                        <td class="text-center align-top py-3 px-2">
                          <input type=\"checkbox\" id=\"project-${encodeURIComponent(project.name)}\" class=\"project-checkbox checkbox checkbox-primary checkbox-sm\" data-project-name=\"${project.name}\" onchange=\"handleProjectSelection(this)\" onclick=\"event.stopPropagation()\">
                        </td>
                      ` : ''}
                      <td class="w-full align-top py-3 px-2" role="link" tabindex="0" onclick="window.location.href='/project/${encodeURIComponent(project.name)}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}">
                        <span class="project-name text-primary font-bold" data-testid="project-link-${project.name}">
                          ${project.name}
                        </span>
                      </td>
                      <td class="text-right whitespace-nowrap w-0 align-top py-3 px-2" data-updated-ts="${project.lastUpdated ? project.lastUpdated.getTime() : 0}" role="link" tabindex="0" onclick="window.location.href='/project/${encodeURIComponent(project.name)}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}">
                        <span class="text-sm text-base-content/70">${project.lastUpdated ? project.lastUpdated.toLocaleString(locale) : '-'}</span>
                      </td>
                      <td class="text-right whitespace-nowrap w-0 align-top py-3 px-2" role="link" tabindex="0" onclick="window.location.href='/project/${encodeURIComponent(project.name)}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}">
                        <span class="text-sm text-base-content/70">${(await project.issues).size}</span>
                      </td>
                      <td class="text-right whitespace-nowrap w-0 align-top py-3 px-2" role="link" tabindex="0" onclick="window.location.href='/project/${encodeURIComponent(project.name)}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}">
                        <div class="flex gap-1 justify-end" data-testid="ide-icons">
                          ${project.ideNames.map(ide => `
                            <img src="${jetBrains?.getIDEIcon(ide)}" alt="${ide}" title="${ide}" class="w-6 h-6" />
                          `).join('')}
                        </div>
                      </td>
                    </tr>
                  `))).join('')
      : '<tr><td colspan="5" class="p-4 text-center text-base-content/70" data-testid="empty-projects-message">No JetBrains projects found</td></tr>'
    }
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error generating homepage:', error)
    res.status(500).send('An error occurred while generating the homepage')
  }
}

// Homepage route (now shows projects instead of IDEs)
router.get('/', homeRouteHandler)

export default router
