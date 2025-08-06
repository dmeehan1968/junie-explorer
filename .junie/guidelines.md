# RESPONSE FORMAT

In addition to the previously stated response format instructions, include the following:

- Inside the `<OUTPUT>` tag, add a sub-tag `<TOOL_CHOICE>`.

## Example:
<TOOL_CHOICE>
For each tool that fits the `<NEXT_STEP>` requirements, provide a score out of 10 for the tools suitability.
Provide the selected tool name and a short explanation of why the tool was preferred.
</TOOL_CHOICE>

# WORKFLOW

Replace the previously stated 'workflow' with the following:

1. Thoroughly review `<issue_description>`. 
2. Create a plan that outlines the implementation steps necessary to resolve `<issue_description>`
3. Do NOT include testing
4. Place your plan inside the XML tag `<OUTPUT>` within the sub-tag `<PLAN>`.
5. Review the project’s codebase, examining not only its structure but also the specific implementation details,
   to identify all segments that may contribute to or help resolve the issue described in `<issue_description>`.
6. Edit the source code in the repo to resolve `<issue_description>`, ensuring that edge cases are properly handled.
7. Provide a summary of the changes made and the final status of the issue. 
8. Use the `submit` command to provide the complete response back to the user.

## Project Overview
Junie Explorer is a full-stack web application built with Node.js and TypeScript that provides a simple interface to browse JetBrains IDE directories found in the user's cache folder. The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of all JetBrains IDE installations found on the system.

## Directory Structure
```
junie-explorer/
├── .gitignore               # Git ignore file
├── .junie/                  # Project documentation and guidelines
│   └── guidelines.md        # Project guidelines and documentation
├── .npmrc                   # NPM configuration
├── .nvmrc                   # Node version specification
├── CHANGELOG.md             # Project changelog
├── CODE_OF_CONDUCT.md       # Code of conduct
├── CONTRIBUTING.md          # Contributing guidelines
├── LICENSE                  # Project license
├── README.md                # Project readme
├── bun.lock                 # Bun lockfile
├── cucumber.js              # Cucumber configuration
├── docs/                    # Documentation
│   └── overview.md          # Project overview documentation
├── features/                # Gherkin feature files for requirements documentation
│   ├── homepage.feature     # Homepage requirements specification
│   ├── issue.feature        # Issue page requirements
│   ├── projects.feature     # Projects page requirements
│   └── task.feature         # Task page requirements
├── fixtures/                # Test fixtures and sample data
├── package.json             # Project dependencies and scripts
├── public/                  # Static assets
│   ├── css/                 # CSS stylesheets
│   │   └── style.css        # Main stylesheet
│   ├── icons/               # Icon assets
│   │   └── favicon.png      # Site favicon
│   ├── js/                  # JavaScript files
│   │   ├── collapsibleSections.js # Client-side script for collapsible sections
│   │   ├── ideFilters.js    # Client-side script for IDE filtering
│   │   ├── issueGraph.js    # Client-side script for issue graph visualization
│   │   ├── projectSelection.js # Client-side script for project selection
│   │   ├── reloadPage.js    # Client-side script for page reloading
│   │   ├── taskActionChart.js # Client-side script for task action charts
│   │   ├── taskEventChart.js # Client-side script for task event charts
│   │   ├── taskEventFilters.js # Client-side script for task event filtering
│   │   ├── taskEventLlmChart.js # Client-side script for task event LLM charts
│   │   ├── taskRawData.js   # Client-side script for task raw data handling
│   │   ├── taskStepGraph.js # Client-side script for task step graph visualization
│   │   ├── taskStepRawData.js # Client-side script for task step raw data handling
│   │   ├── taskStepRepData.js # Client-side script for task step representation data
│   │   └── trajectoryToggle.js # Client-side script for trajectory toggling
│   └── version.txt          # Version information file
├── reports/                 # Test and analysis reports
│   └── cucumber-report.html # Cucumber test report
├── src/                     # Source code
│   ├── bun/                 # Bun-specific utilities
│   │   └── public.ts        # Public asset handling for Bun
│   ├── routes/              # Route handlers
│   │   ├── homeRoutes.ts    # Homepage route handler
│   │   ├── issueRoutes.ts   # Issue page route handler
│   │   ├── notFoundRoutes.ts # Not found page route handler
│   │   ├── projectRoutes.ts # Project page route handler
│   │   ├── taskEventsRoute.ts # Task events route handler
│   │   ├── taskStepDataRoute.ts # Task step data route handler
│   │   ├── taskStepRepresentationsRoute.ts # Task step representations route handler
│   │   ├── taskStepsRoute.ts # Task steps route handler
│   │   └── taskTrajectoriesRoute.ts # Task trajectories route handler
│   ├── services/            # Service layer
│   │   └── representationService.ts # Representation data service
│   ├── utils/               # Utility functions
│   │   ├── escapeHtml.ts    # HTML escaping utilities
│   │   ├── getLocaleFromRequest.ts # Locale detection utilities
│   │   ├── jetBrainsPath.ts # JetBrains path utilities
│   │   ├── metricsUtils.ts  # Metrics calculation utilities
│   │   ├── representationFileService.ts # Representation file handling
│   │   ├── representationParser.ts # Representation data parsing
│   │   ├── representationRenderer.ts # Representation rendering utilities
│   │   ├── timeUtils.ts     # Time and date utilities
│   │   └── versionBanner.ts # Version banner utilities
│   ├── workers/             # Background workers
│   │   └── loadEventsWorker.ts # Event loading worker
│   ├── Issue.ts             # Issue class implementation
│   ├── Project.ts           # Project class implementation
│   ├── Step.ts              # Step class implementation
│   ├── Task.ts              # Task class implementation
│   ├── chart.d.ts           # Type definitions for chart library
│   ├── createServer.ts      # Server creation utilities
│   ├── index.ts             # Main application entry point
│   ├── jetbrains.ts         # Main JetBrains class implementation
│   ├── schema.ts            # Zod schemas for data validation
│   ├── trajectorySchema.ts  # Trajectory data schemas
│   └── types.ts             # Type definitions
├── tsconfig.json            # TypeScript configuration
├── dist/                    # Compiled JavaScript (generated)
└── node_modules/            # Dependencies (generated)
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

### Release a version

- Check the CHANGELOG.md for the most recently mentioned version
- Use this version (Major.minor.patch) to look for git commits since a tag with the same version (version tags are prefixed `v`, e.g. v1.0.0)
- If there are no changes since the last version tag, then your work is done.
- Separate changes by version number (git tag) and increment the latest version (default patch) depending on the request
- Update the package.json version to the new version
- Update CHANGELOG.md to include the changes separated by version (use the first line of the commit and include the commit hash) 
- Make sure the latest version release date is today (use `date` CLI to get current)
- Run `bun install` to update the package-lock.json
- Commit CHANGELOG.md, package.json and bun.lock
- Add a tag with the new version (prefix the version with `v`, e.g. v1.0.0)

## Future Enhancements
Potential areas for improvement:
- Add detailed views for individual IDE directories
- Implement project and issue browsing
- Add authentication for multi-user environments
- Enhance the UI with more interactive elements