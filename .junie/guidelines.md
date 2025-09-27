## Project Overview
Junie Explorer is a full-stack web application built with Bun and TypeScript (Express.js) that provides a simple interface to browse JetBrains IDE directories found in the user's cache folder. The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of all JetBrains IDE installations found on the system.

## Directory Structure
```
junie-explorer/
├── .junie/                                  # Project documentation and contributor guidelines
│   └── guidelines.md                        # Architecture, workflows, and directory map (this file)
├── CHANGELOG.md                             # Versioned list of notable changes
├── CODE_OF_CONDUCT.md                       # Community standards for contributors
├── CONTRIBUTING.md                          # How to contribute, run, and test the project
├── LICENSE                                  # License for using and distributing this software
├── README.md                                # Quick start and high‑level overview
├── bun.lock                                 # Bun dependency lockfile
├── cucumber.js                              # Cucumber test runner configuration
├── docs/                                    # Additional documentation
│   └── overview.md                          # Extended project overview and concepts
├── features/                                # Gherkin specs describing expected behavior
│   ├── homepage.feature                     # Requirements for the homepage view
│   ├── issue.feature                        # Requirements for issue detail flows
│   ├── projects.feature                     # Requirements for projects listing and filters
│   └── task.feature                         # Requirements for task, steps, and events views
├── fixtures/                                # Sample JetBrains cache/projects used for local dev/tests
├── package.json                             # Scripts, dependencies, and metadata
├── public/                                  # Static assets served by the web app
│   ├── css/
│   │   └── app.css                          # Compiled Tailwind CSS (build artefact; do not edit)
│   ├── icons/
│   │   └── favicon.png                      # Site favicon
│   ├── js/                                  # Frontend behaviors for charts, filters, and UI
│   │   ├── collapsibleSections.js           # Toggle expand/collapse for UI sections
│   │   ├── compareModal.js                  # Compare modal open/close and selection logic
│   │   ├── ideFilters.js                    # Client‑side filtering by IDE across projects
│   │   ├── imageModal.js                    # Display images in a modal with zoom/close
│   │   ├── issueGraph.js                    # Render per‑issue graphs (timeline/metrics)
│   │   ├── projectSelection.js              # Manage project selection and metrics chart rendering
│   │   ├── reloadPage.js                    # Trigger full page reloads from UI controls
│   │   ├── taskActionChart.js               # Draw charts for action/request counts over time
│   │   ├── taskEventChart.js                # Visualize task events timeline in Chart.js
│   │   ├── taskEventFilters.js              # Filter task events by type/source in UI
│   │   ├── taskEventLlmChart.js             # Plot LLM‑related task event metrics
│   │   ├── taskModelPerformanceChart.js     # Show per‑model performance series
│   │   ├── taskRawData.js                   # Utilities for exporting/inspecting raw task data
│   │   ├── themeSwitcher.js                 # Toggle light/dark themes and persist choice
│   │   └── trajectoryToggle.js              # Toggle visibility of trajectory blocks
│   └── version.txt                          # Version banner content (build artefact; do not edit)
├── reports/
│   └── cucumber-report.html                 # Generated acceptance test report (build artefact)
├── src/                                     # Application source code (TypeScript)
│   ├── app/                                 # HTTP API, server‑rendered pages, middleware
│   │   ├── api/                             # Express routers for JSON APIs
│   │   │   ├── events/                      # Event‑centric API endpoints (LLM/tool events)
│   │   │   ├── projects.ts                  # GET project metrics/graph data by grouping
│   │   │   ├── stats.ts                     # Live runtime stats/time‑series endpoints
│   │   │   └── trajectories/                # Task trajectory analytics APIs
│   │   │       ├── contextSize.ts           # Return context size series per provider/model
│   │   │       ├── download.ts              # Download trajectory data as a file/JSON
│   │   │       ├── index.ts                 # Register trajectory sub‑routes on a router
│   │   │       ├── modelPerformance.ts      # Summarize model performance with labels/reasoning
│   │   │       └── timeline.ts              # Chronological sequence of events for a task/issue
│   │   ├── junieExplorer.ts                 # App bootstrap: build Express app, mount routes
│   │   ├── middleware/                      # Reusable Express middlewares (entity lookup, etc.)
│   │   ├── types.ts                         # App‑specific Request/Response typings and helpers
│   │   └── web/                             # Server‑rendered routes returning HTML
│   │       ├── homeRoutes.tsx               # Homepage: list projects, filters, metrics chart
│   │       ├── notFoundRouteHandler.ts      # 404 handler for unmatched routes
│   │       ├── projectRoutes.tsx            # Per‑project and issue pages with navigation
│   │       ├── refreshRoutes.ts             # Route to refresh/rescan data and reload
│   │       ├── statsRoute.tsx               # Web page embedding runtime stats dashboard
│   │       ├── taskEventsRoute.tsx          # Task events page with charts and filters
│   │       └── taskTrajectoriesRoute.tsx    # Task trajectory visualization page
│   ├── bun/
│   │   └── public.ts                        # Bun VFS/static file handling (build artefact)
│   ├── components/                          # Server‑side rendered UI components (Kita JSX)
│   │   ├── appBody.tsx                      # Common <body> wrapper layout
│   │   ├── appHead.tsx                      # <head> with page title, scripts, and CSS
│   │   ├── appHeader.tsx                    # Header with actions (theme, stats, reload)
│   │   ├── breadcrumb.tsx                   # Breadcrumb navigation component
│   │   ├── collapseIcon.tsx                 # SVG icon for collapse state
│   │   ├── conditional.tsx                  # Conditional renderer to show/hide children
│   │   ├── expandIcon.tsx                   # SVG icon for expand state
│   │   ├── fileIOSection.tsx                # Panel showing worker file I/O metrics
│   │   ├── htmlPage.tsx                     # Full HTML document wrapper component
│   │   ├── ideSelection.tsx                 # IDE icons/selector built from discovered IDEs
│   │   ├── memorySection.tsx                # Panel for memory usage metrics
│   │   ├── projectMetricsChart.tsx          # Card container with canvas for projects chart
│   │   ├── projectMetricsChartOptions.tsx   # Radio/controls for chart display/grouping
│   │   ├── projectTable.tsx                 # Table of projects with metrics and actions
│   │   ├── reloadButton.tsx                 # Button to trigger a page refresh
│   │   ├── sortIcon.tsx                     # SVG sort indicator icon
│   │   ├── statsButton.tsx                  # Link/button to runtime stats page
│   │   ├── statusBadge.tsx                  # Badge showing task/issue status
│   │   ├── taskCard.tsx                     # Summary card for a single task
│   │   ├── themeSwitcher.tsx                # Toggle theme on server‑rendered pages
│   │   ├── toggleComponent.tsx              # Generic toggle UI control component
│   │   ├── versionBanner.tsx                # Display running app version in header
│   │   └── workersSection.tsx               # Panel summarizing worker pool metrics
│   ├── dashboard/                           # Static assets/templates for stats dashboard
│   ├── getMaxConcurrency.ts                 # Detect optimal worker concurrency based on CPU
│   ├── index.ts                             # Main entrypoint: start server and listen on PORT
│   ├── input.css                            # Tailwind input (source used for building CSS)
│   ├── jetbrains.ts                         # Orchestrates discovery, projects, metrics, icons
│   ├── schema/                              # Event and data schema definitions
│   │   ├── responseTextAppeared.ts          # Schema for response text appeared event
│   │   ├── stepMetaInfoAppearedEvent.ts     # Schema for step meta info appeared event
│   │   └── toolPrimitiveProperty.ts         # Schema for tool primitive property model
│   ├── schema.ts                            # Zod schemas: chains, tasks, steps, metrics
│   ├── stats/                               # Runtime statistics collection and types
│   ├── types.ts                             # Shared analysis/result types used across modules
│   ├── utils/                               # Utility helpers with no side‑effects
│   │   ├── escapeHtml.ts                    # Escape HTML special characters safely
│   │   ├── getLocaleFromRequest.ts          # Parse Accept‑Language and cookies to locale
│   │   ├── metricsUtils.ts                  # Aggregate/format token, cost, and time metrics
│   │   ├── themeCookie.ts                   # Read/write theme preference cookie
│   │   └── timeUtils.ts                     # Date/time formatting and range helpers
│   ├── workers/                             # Worker pool and event loading
│   │   ├── Job.ts                           # Job descriptor passed to workers
│   │   ├── JobScheduler.ts                  # Schedule and throttle jobs across the pool
│   │   ├── MetricsCollector.ts              # Collect per‑task/pool metrics (timings, I/O)
│   │   ├── PoolMetrics.ts                   # Types for worker/pool metrics reporting
│   │   ├── Response.ts                      # Generic worker response message shape
│   │   ├── WorkerEntry.ts                   # Worker file entry point type and helpers
│   │   ├── WorkerExecutionError.ts          # Error type for failures within a worker
│   │   ├── WorkerFileIOCollector.ts         # Track file I/O performed by workers
│   │   ├── WorkerManager.ts                 # High‑level pool manager orchestrating workers
│   │   ├── WorkerPool.ts                    # Worker pool implementation (spawns, queues jobs)
│   │   ├── WorkerPoolError.ts               # Error type for pool‑level errors
│   │   ├── WorkerPoolOptions.ts             # Options for tuning worker pool behavior
│   │   ├── WorkerSpawnError.ts              # Error type for worker spawn failures
│   │   ├── loadEvents.ts                    # Load task events from disk using the pool
│   │   ├── loadEventsInput.ts               # Input type for loadEvents worker task
│   │   ├── loadEventsOutput.ts              # Output type/result for loadEvents worker task
│   │   └── loadEventsWorker.ts              # Web worker that reads/returns events from files
│   ├── Issue.ts                             # Issue class: loads chain, aggregates tasks/metrics
│   ├── Project.ts                           # Project class: discovers issues, aggregates stats
│   ├── Step.ts                              # Step class: step data, metrics, and validation
│   └── Task.ts                              # Task class: events, trajectories, worker usage
├── tsconfig.json                            # TypeScript compiler configuration
├── dist/                                    # Compiled JavaScript (build artefact; do not edit)
└── node_modules/                            # Installed dependencies (do not edit)
```


## Tech Stack
- **Runtime**: Bun (>=1.2.18) with Express.js web framework
- **Language**: TypeScript with ES modules
- **Build Tools**: 
  - Bun build system with cross-platform compilation
  - make-vfs for static asset bundling
  - TypeScript compiler for type checking
- **Core Dependencies**:
  - express: Web server framework
  - Tailwind CSS: Utility-first CSS framework
  - DaisyUI: Tailwind CSS component library
  - fs-extra: Enhanced file system operations
  - zod: Runtime type validation and schema parsing
  - marked: Markdown parsing and rendering
  - mime-types: MIME type utilities
  - semver: Semantic version parsing and comparison
  - poolifier-web-worker: Worker pool management for parallel processing

## Functionality
1. **JetBrains IDE Discovery**: Scans the JetBrains cache directory to find all IDE installations and their associated project data.
2. **Log Analysis & Processing**: Comprehensive analysis of JetBrains Junie log files with support for chains, tasks, steps, and events.
3. **Project Management**: Multi-IDE project discovery, issue tracking, and metrics calculation with lazy-loaded data access.
4. **Task & Step Analysis**: Detailed task management with step-by-step analysis, timing metrics, and performance tracking.
5. **Data Visualization**: Interactive charts and graphs for project metrics, issue trends, and task performance analysis.
6. **Event Tracking**: Event processing and trajectory analysis for AI agent interactions.
7. **Metrics & Reporting**: Aggregated statistics including token usage, costs, timing data, and request metrics.
8. **Worker-Based Processing**: Parallel processing using worker pools for efficient handling of large datasets.
9. **Multi-Language Support**: Internationalization support with locale-aware formatting and time utilities.
10. **Web Interface**: Responsive web interface with collapsible sections, filtering, and interactive data exploration.
11. **Static Asset Management**: Efficient static file serving using make-vfs bundling system.

## Data Model
The application uses a comprehensive class-based data model with enhanced functionality for managing JetBrains IDE data and AI agent interactions:

### Core Classes
- **`JetBrains`** (src/jetbrains.ts): Main orchestration class that manages IDE installations, projects discovery, metrics aggregation, memory reporting, version checking, and provides utility methods for path resolution and IDE icon management.

- **`Project`** (src/Project.ts): Project management class with multi-IDE support that handles issue discovery, metrics calculation, log path management, and provides lazy-loaded access to project issues and aggregated statistics.

- **`Issue`** (src/Issue.ts): Issue management class that loads and validates chain data using JunieChainSchema, manages task collections, calculates aggregated metrics from tasks, and provides access to issue metadata (ID, name, creation date, state, errors).

- **`Task`** (src/Task.ts): Comprehensive task management class with advanced features including:
  - Worker pool management for parallel processing
  - Step collection and management
  - Event loading and processing with worker threads
  - Trajectory data handling
  - Agent state and session history management
  - Metrics calculation and aggregation
  - Support for task context, planning, and previous task information

- **`Step`** (src/Step.ts): Detailed step management class that handles individual step data including:
  - Timing information (start/end times)
  - Reasoning and statistics tracking
  - Comprehensive metrics (tokens, costs, timing, requests)
  - Lazy-loaded content, dependencies, and descriptions
  - JSON schema validation using JunieStepSchema

### Schema Definitions
Comprehensive Zod schemas for data validation and type safety (src/schema.ts):

- **`JunieChain`**: Chain metadata with UUID identification, state management, and error handling
- **`JunieTask`**: Task definitions with context, planning, agent state, and session history
- **`JunieStep`**: Step definitions with reasoning, statistics, content, and dependencies
- **`AgentState`**: Agent state management for AI interactions including issue context and observations
- **`SessionHistory`**: Session tracking for viewed files, imports, created files, and code sections
- **`SummaryMetrics`**: Aggregated metrics interface for tokens, costs, and timing across projects and tasks
- **`JunieStatistics`**: Detailed statistics schema for performance and usage tracking
- **`StepContent`**: Content structure for LLM responses, action requests, and results
- **`PreviousTasksInfo`**: Context from previous tasks including agent state and file modifications

### Additional Schemas
- **Event Schemas** (src/schema/*.ts): Event data structures for tracking application events and activities
- **Trajectory Schemas** (src/trajectorySchema.ts): Trajectory and error schemas for agent interaction tracking
- **Analysis Types** (src/types.ts): Statistical analysis interfaces including aggregates, step statistics, and task analysis structures

## Development Workflow
1. **Setup**: Clone the repository and run `bun install`
2. **Development**: Use `bun run dev` to start the development server

## Single File Executable
- Uses `bun --compile` to create a single executable file for each target platform

## Code Conventions
- Use TypeScript interfaces for type definitions
- Export interfaces that need to be used across files
- Use async/await for asynchronous operations
- Use ES modules (import/export) syntax

## Configuration
- TypeScript is configured in `tsconfig.json`
- The application uses environment variables:
  - `PORT`: The port to run the server on (defaults to 3000)
  - `USER`: The system username (used to construct the path to JetBrains cache)

## Deployment
The application is designed to be run locally, but could be deployed to a server if needed:
1. Build the application with `bun run build`
2. Start the server with `bun start`
3. Access the application at `http://localhost:3000` (or configured port)

## Requirements Documentation
Requirements for this project are documented using Gherkin feature files located in the `features/` directory. These files serve as a source of truth and documentation for the expected behavior of the application.

## Unit Testing

- Uses Playwright as an end-to-end test runner
- Test suites are organized according to feature/UI Component
- Test suites a per-feature domain-specific language (DSL) to abstract the Playwright API and make the tests more human readable

Example DSL (named `<component>.dsl.ts` and co-located with the component)
```ts
import { Page } from "@playwright/test"
import { test as base } from "playwright/test"

export class ComponentNameDSL {
  constructor(private readonly page: Page) {
  }

  // Navigate to the page that contains the element (default to at least one page on which it appears)
  navigateTo(url: string = '/') {
    return this.page.goto(url)
  }
  
  // utility functions to manipulate the page
  async search(text: string) {
    await (await this.searchInput).fill(text)
  }  
  
  // element getters return Locator
  get nameColumn() {
    return this.page.locator('table td:nth-child(1)')
  }
  
  get searchInput() {
    return this.page.locator('input#search')
  }
}

// Always export a test function that supplied the DSL as a parameter
export const test = base.extend<{ componentName: ComponentNameDSL }>({
  componentName: async ({ page }, use) => {
    await use(new ComponentNameDSL(page))
  }
})

```

Example Test (named `<component>.test.ts` and co-located with the component)
```ts
import { test, expect } from "@playwright/test"
import { test } from "./<component>.dsl.js"

test.describe('ComponentName', async () => {
  
  test('should be visible', async ({ componentName }) => {
    await expect(componentName.id).toBeVisible()
  })
  
  // etc.
})
```
## Version Control

Do NOT commit changes unless explicitly requested.  If in any doubt, ask the user for confirmation

### Release a version

- Check the CHANGELOG.md for the most recently mentioned version
- Use this version (Major.minor.patch) to look for git commits since a tag with the same version (version tags are prefixed `v`, e.g. v1.0.0)
- If there are no changes since the last version tag, then your work is done.
- Separate changes by version number (git tag) and increment the latest version (default patch) depending on the request
- Update the package.json version to the new version
- Update CHANGELOG.md to include a section listing the changes in this version (versions in descending order)
  - Use the first line of the commit and include the commit hash
  - Group each change under a sub-heading according to its type, e.g. 
    - Added for new features. 
    - Changed for changes in existing functionality. 
    - Deprecated for soon-to-be removed features. 
    - Removed for now removed features. 
    - Fixed for any bug fixes. 
    - Security in case of vulnerabilities.
    - etc
- Make sure the latest version release date is today (use `date` CLI to get current)
- Run `bun install` to update the package-lock.json
- Commit CHANGELOG.md, package.json, and bun.lock
- Add a tag with the new version (prefix the version with `v`, e.g. v1.0.0)

## Future Enhancements
Potential areas for improvement:
- Add detailed views for individual IDE directories
- Implement project and issue browsing
- Add authentication for multi-user environments
- Enhance the UI with more interactive elements