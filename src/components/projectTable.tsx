import { Component, Html } from "@kitajs/html"
import { JetBrains } from "../jetbrains.js"
import { Project } from "../Project.js"
import { Conditional } from "./conditional.js"
import { SortIcon } from "./sortIcon.js"

export const ProjectTable: Component<{ projects: Project[], jetBrains: JetBrains, locale?: string }> = ({
  projects,
  jetBrains,
  locale,
}) => {
  return (
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full bg-base-100" id="projects-table">
        <thead>
        <tr class="!bg-base-200">
          <Conditional condition={jetBrains!.hasMetrics}>
            <th class="w-12 text-center">
              <input type="checkbox" id="select-all-projects" onchange="toggleSelectAllProjects()"
                     class="checkbox checkbox-primary checkbox-sm" title="Select All"/>
            </th>
          </Conditional>
          <th>
            <div class="flex items-center gap-2">
              <span>Name</span>
              <button class="btn btn-ghost btn-xs" id="sort-name-btn" onclick="toggleNameSort()" title="Toggle sort"
                      aria-label="Toggle sort">
                <SortIcon direction="asc"/>
              </button>
              <label class="input input-sm relative">
                <input type="text" id="project-search-input" data-testid="project-search"
                       placeholder="Search projects..."
                       oninput="filterByProjectName(this.value);toggleSearchClearBtn()" class="grow w-64 pr-8"/>
                <button id="project-search-clear"
                        class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2 hidden"
                        title="Clear search" aria-label="Clear search" onclick="clearProjectSearch()">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
                       aria-hidden="true">
                    <path fill="currentColor"
                          d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 0 0 5.7 7.1L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"/>
                  </svg>
                </button>
              </label>
            </div>
          </th>
          <th class="text-right whitespace-nowrap w-0">
            <div class="flex items-center gap-2 justify-end">
              <span>Last Updated</span>
              <button class="btn btn-ghost btn-xs" id="sort-updated-btn" onclick="toggleUpdatedSort()"
                      title="Toggle sort" aria-label="Toggle sort">
                <SortIcon direction="desc"/>
              </button>
            </div>
          </th>
          <th class="text-right whitespace-nowrap w-0">Issues</th>
          <th class="text-right whitespace-nowrap w-0">IDEs</th>
        </tr>
        </thead>
        <tbody id="project-list" data-testid="projects-list">
        <Conditional condition={projects.length > 0}>
          {projects.map(async project =>
            <tr
              class="project-row cursor-pointer hover:!bg-accent transition-all duration-200 hover:translate-x-1 border-transparent hover:shadow-md"
              data-ides={JSON.stringify(project.ideNames)}>
              <Conditional condition={jetBrains.hasMetrics}>
                <td class="text-center align-top py-3 px-2">
                  <input type="checkbox"
                         id={`project-${encodeURIComponent(project.name)}`}
                         class="project-checkbox checkbox checkbox-primary checkbox-sm"
                         data-project-name={project.name}
                         onchange="handleProjectSelection(this)"
                         onclick="event.stopPropagation()"/>
                </td>
              </Conditional>
              <td class="w-full align-top py-3 px-2" role="link" tabindex="0"
                  onclick={`window.location.href='/project/${encodeURIComponent(project.name)}'`}
                  onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}`}>
                          <span class="project-name text-primary font-bold"
                                data-testid={`project-link-${project.name}`}>
                            {project.name}
                          </span>
              </td>
              <td class="text-right whitespace-nowrap w-0 align-top py-3 px-2"
                  data-updated-ts={`${project.lastUpdated ? project.lastUpdated.getTime() : 0}`} role="link"
                  tabindex="0" onclick={`window.location.href='/project/${encodeURIComponent(project.name)}'`}
                  onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}`}>
                      <span
                        class="text-sm text-base-content/70">{project.lastUpdated ? project.lastUpdated.toLocaleString(locale) : '-'}</span>
              </td>
              <td class="text-right whitespace-nowrap w-0 align-top py-3 px-2" role="link" tabindex="0"
                  onclick={`window.location.href='/project/${encodeURIComponent(project.name)}'`}
                  onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}`}>
                <span class="text-sm text-base-content/70">{(await project.issues).size}</span>
              </td>
              <td class="text-right whitespace-nowrap w-0 align-top py-3 px-2" role="link" tabindex="0"
                  onclick={`window.location.href='/project/${encodeURIComponent(project.name)}'`}
                  onkeydown={`if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/project/${encodeURIComponent(project.name)}'}`}>
                <div class="flex gap-1 justify-end" data-testid="ide-icons">
                  {project.ideNames.map(ide =>
                    <img src={jetBrains?.getIDEIcon(ide)} alt={ide} title={ide} class="w-6 h-6"/>,
                  )}
                </div>
              </td>
            </tr>,
          )}
        </Conditional>
        <Conditional condition={projects.length === 0}>
          <tr>
            <td colspan="5"
                class="p-4 text-center text-base-content/70"
                data-testid="empty-projects-message">
              No JetBrains projects found
            </td>
          </tr>
        </Conditional>
        </tbody>
      </table>
    </div>
  )
}