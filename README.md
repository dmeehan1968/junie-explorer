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
- Includes a refresh button to update the data
- Responsive web interface

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
- Bun 1.2.18+ - Must be installed by the user

### Pre-built executables

Single File Executables are available from Junie Explorer 2.3+.  You can download these from the 
[Github Releases](https://github.com/dmeehan1968/junie-explorer/releases) page.

## Usage

### Port Conflicts

Junie Explorer uses port 3000 by default.  If this conflicts with other apps on your system, you can set the desired
port via an environment variable, which can be added to the command line, e.g.:

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

### Memory Reporting

Enabled memory usage statistics after each reload with the `MEMORY_REPORT={truthy}` environment variable (works with
both binaries and the development mode)

```shell
MEMORY_REPORT=true junie-explorer-apple-arm64
```

You will get a table printed after each scan of the logs showing the history of memory use (i.e. after hitting 'reload'
on any of the pages):

```text
Memory usage (MB):
┌──────────────────────────┬──────────────┬────────────────┬──────────────────┬──────────────────┬──────────────────────┐
│                          │ arrayBuffers │ external       │ heapTotal        │ heapUsed         │ rss                  │
├──────────────────────────┼──────────────┼────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│ 2025-07-24T11:13:55.317Z │ 0.00         │ 1.99           │ 7.02             │ 5.30             │ 68.61                │
│ 2025-07-24T11:14:14.765Z │ 0.94 (+0.94) │ 34.39 (+32.40) │ 159.36 (+152.34) │ 42.71 (+37.41)   │ 3,239.38 (+3,170.77) │
│ 2025-07-24T11:15:13.297Z │ 0.46 (-0.48) │ 24.77 (-9.62)  │ 126.02 (-33.34)  │ 246.88 (+204.17) │ 3,842.45 (+603.08)   │
└──────────────────────────┴──────────────┴────────────────┴──────────────────┴──────────────────┴──────────────────────┘
```

The memory usage is taken immediately after the scanning of logs, and likely before garbage collection can occur, but its
not guaranteed to be a reflection of peak memory usage.

### Max Workers

When loading the logs, concurrent workers are used to improve performance.  By default, the maximum concurrency
supported by your system will be used (CPU cores).  If you want to limit the concurrency to avoid interference
with other processes, you can use the CONCURRENCY environment variable:

```shell
CONCURRENCY=4 junie-explorer-apple-arm64
```

- Setting CONCURRENCY to 0 will disable concurrency.
- Setting CONCURRENCY to 1 will disable concurrency, but a worker is still used which will add a performance penalty
about doubling the time taken to process the logs.
- You cannot set CONCURRENCY to a value greater than the number of CPU cores on your system, it will be adjusted down
  to match the number of cores.
- The more workers you use, the more memory you are likely to need.  If memory is an issue, constrain
the maximum number of workers

##  Development

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
This will start the server using ts-node, which compiles and runs TypeScript code on-the-fly.

## Testing
To test the application functionality:
```bash
npm test
```
This will run a test script that checks if the JetBrains directory exists and lists all IDE directories found there.

## Miscellaneous

### Directory Structure
```
junie-explorer/
├── .junie/                  # Project documentation and guidelines
│   └── guidelines.md        # Project guidelines and documentation
├── features/                # Gherkin feature files for requirements documentation
│   ├── homepage.feature     # Homepage requirements specification
│   ├── projects.feature     # Projects page requirements
│   ├── issue.feature        # Issue page requirements
│   └── task.feature         # Task page requirements
├── public/                  # Static assets
│   ├── css/                 # CSS stylesheets
│   │   └── style.css        # Main stylesheet
│   └── js/                  # JavaScript files
│       ├── ideFilters.js    # Client-side script for IDE filtering
│       ├── issueGraph.js    # Client-side script for issue graph visualization
│       ├── projectSelection.js # Client-side script for project selection
│       ├── reloadPage.js    # Client-side script for page reloading
│       ├── taskRawData.js   # Client-side script for task raw data handling
│       ├── taskStepGraph.js # Client-side script for task step graph visualization
│       └── taskStepRawData.js # Client-side script for task step raw data handling
├── src/                     # Source code
│   ├── bun                  # Bun static assets
│   │   └── public.ts        # Generated by build:static, contains ./public files suitable for single file executable
│   ├── chart.d.ts           # Type definitions for chart library
│   ├── index.ts             # Main application entry point
│   ├── types.ts             # Type definitions
│   ├── routes/              # Route handlers
│   │   ├── homeRoutes.ts    # Homepage route handler
│   │   ├── issueRoutes.ts   # Issue page route handler
│   │   ├── notFoundRoutes.ts # Not found page route handler
│   │   ├── projectRoutes.ts # Project page route handler
│   │   └── taskRoutes.ts    # Task page route handler
│   ├── utils/               # Utility functions
│   │   ├── escapeHtml.ts    # HTML escaping utilities
│   │   ├── jetBrainsPath.ts # JetBrains path utilities
│   │   ├── metricsUtils.ts  # Metrics calculation utilities
│   │   └── timeUtils.ts     # Time and date utilities
│   ├── Issue.ts         # Issue class implementation
│   ├── Project.ts       # Project class implementation
│   ├── Step.ts          # Step class implementation
│   ├── Task.ts          # Task class implementation
│   ├── jetbrains.ts     # Main JetBrains class implementation
│   └── schema.ts        # Zod schemas for data validation
├── dist/                    # Compiled JavaScript (generated)
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project readme
```

### Data Model

The new class-based data model with enhanced functionality:
- `JetBrains`: Main class that manages IDE installations and projects
- `Project`: Enhanced project class with multiple IDE support
- `Issue`: Issue class with comprehensive metadata handling
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
├── <IDE Name>/ (e.g., WebStorm, IntelliJIdea)
│   └── projects/
│       └── <Project Name>/
│           └── matterhorn/
│               └── .matterhorn/
│                   ├── issues/
│                   │   ├── chain-<issueId>.json (issue metadata)
│                   │   └── chain-<issueId>/
│                   │       └── task-<index>.json (task metadata)
│                   └── <taskArtifactPath>/
│                       └── step_<number>.<type> (step data files)
```

When loading the application state, the system:
1. Scans for all IDE directories in the JetBrains cache
2. For each IDE, scans for project directories
3. For each project, reads issue metadata files
4. For each issue, reads task metadata files
5. For each task, reads step data files
6. Merges projects that appear in multiple IDEs

This hierarchical structure allows the application to display a comprehensive view of all JetBrains projects, issues, tasks, and steps across different IDE installations.

## Acceptance Tests
Requirements for this project are documented using Gherkin feature files located in the `features/` directory. These files serve as a source of truth and documentation for the expected behavior of the application.

### Feature Files
- Feature files use the Gherkin syntax to describe application behavior in a human-readable format
- Each feature file contains scenarios that outline specific user interactions and expected outcomes
- The `features/homepage.feature` file describes the expected behavior of the application's homepage
- The `features/projects.feature` file describes the expected behavior of the project details page
- The `features/issue.feature` file describes the expected behavior of the issue details page
- The `features/task.feature` file describes the expected behavior of the task details page

### Using Feature Files
- Feature files should be consulted when implementing new features or modifying existing ones
- They serve as acceptance criteria for the application's functionality
- No step definitions or testing tools should be created at this time - the feature files are purely for documentation purposes
- When implementing features, developers should ensure their code satisfies all scenarios described in the relevant feature files
- When code changes are made, make sure that the relevant feature files are updated to reflect new functionality

## Contributing

Check out [contribution](CONTRIBUTING.md) guidelines

## License
Apache 2.0 (See [License](LICENSE))
