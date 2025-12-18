# Junie Explorer

## Project Overview
Junie Explorer is a full-stack web application built with [Bun](https://bun.com) and
[TypeScript](https://typescriptlang.org) that provides a simple interface to browse JetBrains 
IDE directories found in the user's cache folder. 

The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of 
all projects across IDE's found on the system.

### Features
- Lists all JetBrains Project logs found in `/Users/<username>/Library/Caches/JetBrains`
- Shows issues, tasks, events, trajectories, and steps within projects
- Shows raw JSON logs for each issue with expand/collapse for ease of navigation
- Provides metrics and statistics for issues and tasks
- **Issue Search**: Search issues by content or UUID with optional regex support
  - Press Enter or click the Search button to execute the search
  - Toggle regex mode to use regular expression patterns for advanced searching
  - Case-insensitive matching by default
  - Invalid regex patterns display a helpful error message
  - Search preferences are persisted in session storage
- **Issue Merging**: Merge related issues across different IDE instances or timeframes into a single view for better tracking.
  - Quick merge/unmerge actions directly from the issue list.
- **Inline Editing**: Edit issue descriptions inline to provide better context or titles for your logs.
- **Model Support**: Comprehensive schema support for the latest LLM models (OpenAI, Gemini, Grok).
- Task cards provide top-attached tabs for switching between **Trajectories** and **Events**, visually connected to the card header and covered by Playwright tests
- Task descriptions are constrained to a readable height (around 200px) with an expand/collapse toggle for long content, with tests ensuring the max-height and toggle behavior remain consistent
- **Task Refactoring**: The `Task` class has been refactored into an abstract base class with concrete implementations for AIA (`AiaTask`) and Chain (`ChainTask`) modes, using static factory functions (`fromAiaTask`, `fromJunieTask`) for better maintainability. To avoid circular dependency issues, the base class uses dynamic `require()` for these subclasses.
- Trajectories view includes a **Show All Diffs** toggle that controls whether message diffs include all messages or respect the model-specific `rewind` trimming
- LLM model parsing recognizes OpenAI GPT-5.2 (`openai-gpt-5-2`) in addition to existing supported models
- Includes a refresh button to update the data
- Responsive web interface
- Persists selected projects via cookies (migrated from local storage)

See the [Documentation](docs/overview.md) for details

### Tech Stack
- **Backend**: Bun with Express.js
- **Language**: TypeScript
- **Build Tools**: ts-node, TypeScript compiler
- **Dependencies**:
  - express: Web server framework
  - fs-extra: Enhanced file system operations
  - marked: Markdown parsing library

### External Development Dependencies
- Bun 1.3.0+ - Must be installed by the user

### Pre-built executables

Single File Executables are available from Junie Explorer 2.3+.  You can download these from the 
[Github Releases](https://github.com/dmeehan1968/junie-explorer/releases) page.

## Usage

### Port Conflicts

Junie Explorer uses port 3000 by default.

If you are running via the provided entrypoint (`bun run dev`, `bun start`, or the compiled executable), you can set
the desired port via an environment variable, e.g.:

```bash
PORT=4000 bun run dev
```

If you set the PORT to 0, a free port will be allocated.  This may be different on each invocation and is
shown on the server console once the server is running. e.g.

```text
Reading logs...
From: <pathname>
From: <pathname>
From: <pathname>
...
Server is running on http://localhost:60123
```

In unit tests prefer passing `port` into `createServer({ port })` instead of relying on `process.env.PORT`.

### Max Workers/Concurrency

By default, the application will use the main thread to load the logs. This is sufficient for most use cases, but
if you have a large number of logs, you can enable worker threads to improve performance, up to the maximum number
of CPU cores on your system.

Bash (entrypoint reads env once at startup):
```shell
CONCURRENCY=4 junie-explorer-apple-arm64
```

Windows PowerShell:
```shell
$Env:CONCURRENCY = 4
.\junie-explorer-windows-x64.exe
```

In unit tests prefer passing `concurrency` into `createServer({ concurrency })` instead of relying on `process.env.CONCURRENCY`.

- Setting CONCURRENCY to 0 will disable concurrency, all work is done on the main thread.
- Setting CONCURRENCY to 1 will enable a single worker, which has a slight performance penalty.
- You cannot set CONCURRENCY to a value greater than the number of CPU cores on your system, it will be adjusted down
  to match the number of cores.
- The more workers you use, the more memory you are likely to need.  If memory is an issue, constrain
  the maximum number of workers

### Log path

By default, Junie Explorer discovers JetBrains logs using its normal platform-specific defaults.

If you are running via the entrypoint, you can override the log root via `JETBRAINS_LOG_PATH`.

In unit tests prefer passing `jetBrainsLogPath` into `createServer({ jetBrainsLogPath })`.

##  Development

### Issue Cost Chart Data API

The Issue Cost chart now fetches its data from an API endpoint rather than using server-injected globals.

- Endpoint: `GET /api/projects/:projectId/issue-cost`
- Returns JSON in the shape:
  - `labels: string[]` — time bounds for the chart
  - `datasets: { label: string, data: { x: string, y: number }[], borderColor: string, backgroundColor: string, fill: boolean, tension: number }[]`
  - `timeUnit: 'hour' | 'day' | 'week' | 'month' | 'year'`
  - `stepSize: number`

The front-end script `public/js/issueCostChart.js` reads the project id from the document body attribute `data-project-id` and fetches from the endpoint above to render the chart.

This refactor removes the server-side method that previously injected `window.chartData` on the project page.

### Project Metrics Chart

The Project Metrics Chart on the home page has been enhanced to support:
- **Series Toggling**: Users can switch between viewing metrics aggregated by Project, broken down by Model, or broken down by AgentType.
- **Display Options**: Users can switch between Cost, Tokens, and TPS (Tokens Per Second) views.
- **AgentType Series**: When AgentType is selected as the series, the chart shows cost/tokens/TPS split between different agent types (Assistant, TaskSummarizer, Memorizer, ErrorAnalyzer, LanguageIdentifier, MemoryCompactor). This aggregates data from LLM response events grouped by the agent type detected from the request's system prompt.
- **TPS (Tokens Per Second)**: When TPS is selected as the display option, the chart displays as a line chart (instead of bar chart) and an Agent Type dropdown appears allowing filtering by agent type. The Agent dropdown is hidden when AgentType is selected as the series type, since the chart already shows all agent types. TPS is calculated as `outputTokens / (time / 1000)` from LLM response events.
- **Data Source**: Model and AgentType breakdown data is derived from `LlmResponseEvent` metrics.
- **API Support**: The `/api/projects/graph` endpoint accepts:
  - `breakdown=model` parameter to return detailed datasets by model
  - `breakdown=agentType` parameter to return detailed datasets by agent type
  - `display=tps` parameter to return TPS data instead of cost/tokens
  - `agentType=<type>` parameter to filter TPS data by agent type (defaults to 'Assistant', only used when breakdown is not agentType)
- **Loading State**: A loading indicator is displayed during data fetches (with 200ms delay).
- **Improved Visualization**: Better rendering of 'week' based groupings and ensures legends are visible for model-based and agent type views even for single projects.

### Worker Bundling

For the application to work correctly as a single-file executable, web workers must be bundled and embedded into the application.
The `build:worker` script transpiles `src/workers/loadEventsWorker.ts` into `public/loadEventsWorker.js`.
This file is then picked up by `make-vfs` during the `build:vfs` phase and embedded into the virtual file system.
`build:static` covers both the worker and the other public assets.
The application at runtime detects the presence of the bundled worker and loads it via a Blob URL, ensuring workers function correctly in the standalone executable.

## Development Workflow
1. **Setup**: Clone the repository and run `bun install`
2. **Development**: Use `bun run dev` to start the development server
3. **Testing**: Use `bun run test` to run the test script
4. **Production**: Use `bun run start` to run the compiled application

### Installation For Development
1. Install Bun ([Install Instruction](https://bun.com/docs/installation))
2. Clone the repository
3. Install dependencies:
```bash
bun install
```

### Run
To run the application in development mode:
```bash
bun run dev
```
This will start the server using `bunx`, which runs the TypeScript code without the need for transpiling.

## Testing

Before running the Playwright test suite for the first time on a machine, you **must install the browser binaries** that Playwright uses. After installing dependencies with `bun install`, run:

```bash
bun run playwright:install
```

This is equivalent to `npx playwright install` and will download the required browsers. If you see an error similar to:

```text
browserType.launch: Executable doesn't exist at .../chrome-headless-shell
```

it usually means the Playwright browsers have not been installed yet; rerun the command above.

To test the application functionality using Playwright (Component and E2E tests):
```bash
bun run test
```
This will run the Playwright test suite.  You can add Playwright CLI arguments to the end of this, for example
`bun run test --grep <pattern>` to run tests that match the specified pattern. 

**Recent Fixes**:
- Resolved an issue in `IssueRow` Playwright tests where multiple `dialog` event listeners were conflicting, causing "already handled" errors. Tests now use `page.once('dialog')` for more reliable interaction with confirmation dialogs.
- Updated `IssueRow` tests to align with the implementation of the unmerge button, which uses an `img` tag instead of an `svg` element for its icon.

To run native Bun unit tests:
```bash
bun test
```

Tests are co-located with the source code.

- Playwright Unit/Component tests: Named `<component>.pw.ts` or `<component>.pw.tsx`.
- Playwright End-to-end tests: Named `<feature>.e2e.ts`.
- Bun Unit tests: Named `<component>.test.ts` or `<component>.spec.ts`.

### JSX Import Source

All component, test, and DSL modules must include the following JSX import source:

`/** @jsxImportSource @kitajs/html */`

### Component DSL wrapper convention

Tests typically use a Domain-specific-language (DSL) to interact with the application.  This should be named
`<component>.dsl.ts`.  Use `.tsx` extension for DSL's containing JSX syntax.

All Playwright component DSLs that call `page.setContent` must:
- Render the component JSX and wrap it using `wrapHtml(body)` from `src/utils/wrapHtml.ts`
- Call `page.setContent` with the wrapped HTML
- Load the app stylesheet afterward with `await page.addStyleTag({ url: 'http://localhost:3000/css/app.css' })`

This standard wrapper ensures a consistent document structure and CSS across tests.

Notes:
- The Playwright config starts the dev server on port 3000 before tests run, so the stylesheet is available during tests. 
  If you run tests against a different port, update the DSL or environment accordingly.
- If you add a new component DSL, follow the same pattern for initial render and any update methods (e.g., `setProps`, `setTool`).

## Miscellaneous

### Directory Structure
```
junie-explorer/
├── .junie/                                  # Project documentation and configs
│   ├── guidelines.md                        # Architecture, workflows, and directory map
│   └── mcp/                                 # Model Context Protocol config
│       └── mcp.json                         # MCP service configuration
├── CHANGELOG.md                             # Versioned list of notable changes
├── CODE_OF_CONDUCT.md                       # Community standards for contributors
├── CONTRIBUTING.md                          # How to contribute, run, and test the project
├── LICENSE                                  # License for using and distributing this software
├── README.md                                # Quick start and high‑level overview
├── bun.lock                                 # Bun dependency lockfile
├── package.json                             # Scripts, dependencies, and metadata
├── playwright.config.ts                     # Playwright end‑to‑end test configuration
├── docs/                                    # Additional documentation
│   ├── overview.md                          # Extended project overview and concepts
│   └── images/                              # Screenshot assets used in docs
├── dist/                                    # Prebuilt executables (build artefacts)
├── fixtures/                                # Test data files used in testing
├── public/                                  # Static assets served by the web app
│   ├── css/
│   │   └── app.css                          # Compiled Tailwind CSS (build artefact; do not edit)
│   ├── icons/
│   │   ├── Anthropic.svg                    # Anthropic provider icon
│   │   ├── OpenAI.svg                       # OpenAI provider icon
│   │   └── favicon.png                      # Site favicon
│   ├── js/                                  # Frontend behaviors for charts, filters, and UI
│   │   ├── collapsibleSections.js           # Toggle expand/collapse for UI sections
│   │   ├── compareModal.js                  # Compare modal open/close and selection logic
│   │   ├── ideFilters.js                    # Client‑side filtering by IDE across projects
│   │   ├── imageModal.js                    # Display images in a modal with zoom/close
│   │   ├── issueCostChart.js                # Render per‑issue graphs (timeline/metrics)
│   │   ├── projectMetricsChart.js           # Manage project selection and metrics chart rendering
│   │   ├── reloadPage.js                    # Trigger full page reloads from UI controls
│   │   ├── statsPage.js                     # Runtime stats page client logic
│   │   ├── taskActionChart.js               # Draw charts for action/request counts over time
│   │   ├── taskContextSizeChart.js          # Plot task context size series
│   │   ├── taskEventChart.js                # Visualize task events timeline in Chart.js
│   │   ├── taskEventFilters.js              # Filter task events by type/source in UI
│   │   ├── taskEventLlmChart.js             # Plot LLM‑related task event metrics
│   │   ├── taskModelPerformanceChart.js     # Show per‑model performance series
│   │   ├── themeSwitcher.js                 # Toggle light/dark themes and persist choice
│   │   └── trajectoryToggle.js              # Toggle visibility of trajectory blocks
│   └── version.txt                          # Version banner content (build artefact; do not edit)
├── src/                                     # Application source code (TypeScript)
│   ├── app/                                 # HTTP API, server‑rendered pages, middleware
│   │   ├── api/                             # Express routers for JSON APIs
│   │   │   ├── events/                      # Event‑centric API endpoints (LLM/tool events)
│   │   │   │   ├── download.ts              # Download event data
│   │   │   │   ├── index.ts                 # Register event sub‑routes
│   │   │   │   └── timeline.ts              # Chronological sequence of events for a task/issue
│   │   │   ├── projects.ts                  # GET project metrics/graph data by grouping
│   │   │   ├── stats.ts                     # Live runtime stats/time‑series endpoints
│   │   │   └── trajectories/                # Task trajectory analytics APIs
│   │   │       ├── contextSize.ts           # Return context size series per provider/model
│   │   │       ├── download.ts              # Download trajectory data as a file/JSON
│   │   │       ├── index.ts                 # Register trajectory sub‑routes on a router
│   │   │       ├── modelPerformance.ts      # Summarize model performance with labels/reasoning
│   │   │       └── timeline.ts              # Chronological sequence of trajectory events
│   │   ├── junieExplorer.ts                 # App bootstrap: build Express app, mount routes
│   │   ├── middleware/                      # Reusable Express middlewares (entity lookup, etc.)
│   │   │   ├── entityLookupMiddleware.ts    # Entity lookup helper
│   │   │   ├── errorHandler.ts              # Error handler
│   │   │   └── serveStaticsFromBunVfsMiddleware.ts # Serve statics from Bun VFS
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
│   │   ├── chatMessageDecorator.tsx         # Decorate chat messages for display
│   │   ├── collapseIcon.tsx                 # SVG icon for collapse state
│   │   ├── conditional.tsx                  # Conditional renderer to show/hide children
│   │   ├── contextSizeSection.tsx           # Context size chart section
│   │   ├── costChart.tsx                    # Costs chart component
│   │   ├── divider.tsx                      # UI divider element
│   │   ├── expandIcon.tsx                   # SVG icon for expand state
│   │   ├── fileIOSection.tsx                # Panel showing worker file I/O metrics
│   │   ├── htmlPage.tsx                     # Full HTML document wrapper component
│   │   ├── ideSelection.tsx                 # IDE icons/selector built from discovered IDEs
│   │   ├── imageModal.tsx                   # Display images in a modal
│   │   ├── issueRow.tsx                     # Row for issues list
│   │   ├── issuesTable.tsx                  # Table of projects/issues
│   │   ├── memorySection.tsx                # Panel for memory usage metrics
│   │   ├── messageDecorator.tsx             # Decorate message content
│   │   ├── messageTrajectoriesSection.tsx   # Trajectories UI section
│   │   ├── modelPerformanceSection.tsx      # Model performance section
│   │   ├── multiPartMessage.tsx             # Render multi‑part message content
│   │   ├── processedEvents.tsx              # Render processed events list
│   │   ├── projectMetricsChart.tsx          # Card container with canvas for projects chart
│   │   ├── projectMetricsChartOptions.tsx   # Controls for chart display/grouping
│   │   ├── projectTable.tsx                 # Table of projects
│   │   ├── reloadButton.tsx                 # Button to trigger a page refresh
│   │   ├── sortIcon.tsx                     # SVG sort indicator icon
│   │   ├── statsButton.tsx                  # Link/button to runtime stats page
│   │   ├── statusBadge.tsx                  # Badge showing task/issue status
│   │   ├── taskCard.tsx                     # Summary card for a single task
│   │   ├── themeSwitcher.tsx                # Toggle theme on server‑rendered pages
│   │   ├── toggleComponent.tsx              # Generic toggle UI control component
│   │   ├── toolCallDecorator.tsx            # Decorate tool calls
│   │   ├── toolDecorator.tsx                # Decorate tool info
│   │   └── versionBanner.tsx                # Display running app version in header
│   ├── createServer.ts                      # App/server factory for dev and tests
│   ├── getMaxConcurrency.ts                 # Detect optimal worker concurrency based on CPU
│   ├── index.ts                             # Main entrypoint: start server and listen on PORT
│   ├── input.css                            # Tailwind input (source used for building CSS)
│   ├── jetbrains.ts                         # Orchestrates discovery, projects, metrics, icons
│   ├── playwright/                          # Playwright test utilities and scaffolding
│   ├── schema/                              # Event and data schema definitions
│   ├── schema.ts                            # Zod schemas: chains, tasks, steps, metrics
│   ├── stats/                               # Runtime statistics collection and types
│   ├── types.ts                             # Shared analysis/result types used across modules
│   ├── utils/                               # Utility helpers with no side‑effects
│   └── workers/                             # Worker pool and event loading
├── reports/                                 # Test/acceptance reports
├── test-results/                            # Playwright test output (artefact)
├── tsconfig.json                            # TypeScript compiler configuration
└── playwright.config.ts                     # Playwright test runner configuration
```

### Data Model

The new class-based data model with enhanced functionality:
- `JetBrains`: Main class that manages IDE installations and projects
- `Project`: Enhanced project class with multiple IDE support, refactored to use `IssueDiscoveryService` for improved separation of concerns
- `IssueDiscoveryService`: Interface for scanning the file system and discovering issues and tasks, enabling better testability of the `Project` class
- `ChainIssueDiscoveryService`: Implementation of `IssueDiscoveryService` for standard issues from `chain-*.json` files
- `AiaIssueDiscoveryService`: Implementation of `IssueDiscoveryService` for AIA tasks from `*-events.jsonl` files
- `CompositeIssueDiscoveryService`: Composite implementation of `IssueDiscoveryService` that combines results from multiple sources
- `Issue`: Abstract base class for issue management, with concrete implementations `ChainIssue` (file-based) and `AiaIssue` (memory-based from events)
- `Task`: Task class with agent state and session history
- `Step`: Step class with detailed content and statistics
- `Schema definitions` (schema.ts): Comprehensive Zod schemas including:
  - `JunieChain`: Chain metadata with state management
  - `JunieTask`: Task definitions with context and planning
  - `JunieStep`: Step definitions with reasoning and statistics
  - `AgentState`: Agent state management for AI interactions
  - `SummaryMetrics`: Aggregated metrics across projects and tasks

### JetBrains Cache File Structure

The application reads files from the JetBrains cache directory, which is located at:
- Windows: `%APPDATA%\..\Local\JetBrains`
- macOS: `/Users/<username>/Library/Caches/JetBrains`
- Linux: `~/.cache/JetBrains`

The files are organized in the following hierarchical structure:

```
JetBrains/
└── <IDE Name>/
    └── projects/
        └── <Project Name>/
            └── matterhorn/
                └── .matterhorn/
                    ├── events/
                    │   └── <issueId> <taskId>-events.jsonl
                    └── issues/
                        ├── chain-<issueId>.json
                        └── chain-<issueId>/
                            └── task-<index>.json
```

When loading the application state, the system:
1. Scans for all IDE directories in the JetBrains cache
2. For each IDE, scans for project directories
3. For each project, reads issue metadata files
4. For each issue, reads task metadata files
5. For each task, reads step data files
6. Merges projects that appear in multiple IDEs

This hierarchical structure allows the application to display a comprehensive view of all JetBrains projects, issues, tasks, and steps across different IDE installations.

## Contributing

Check out [contribution](CONTRIBUTING.md) guidelines

## License
Apache 2.0 (See [License](LICENSE))
