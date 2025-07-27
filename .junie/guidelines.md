# WORKFLOW

Replace the previously stated 'workflow' with the following:

1. Thoroughly review `<issue_description>`. 
2. Create a plan that outlines the implementation steps the necessary to resolve `<issue_description>`
3. Place your plan inside the XML tag `<THOUGHT>` within the sub-tag `<PLAN>`.
4. Review the project’s codebase, examining not only its structure but also the specific implementation details,
   to identify all segments that may contribute to or help resolve the issue described in `<issue_description>`.
5. Edit the source code in the repo to resolve `<issue_description>`, ensuring that edge cases are properly handled.
6. Provide a summary of the changes made and the final status of the issue. 
7. Use the `submit` command to provide the complete response back to the user.

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
│   ├── eventSchema.ts       # Event data schemas
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
- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Build Tools**: ts-node, TypeScript compiler
- **Dependencies**:
  - express: Web server framework
  - fs-extra: Enhanced file system operations

## Functionality
1. **Directory Scanning**: The application scans the JetBrains cache directory to find all IDE installations.
2. **Web Interface**: Provides a clean, responsive web interface to display the found directories.
3. **Static File Serving**: Serves CSS and other static assets.

## Data Model
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

## Development Workflow
1. **Setup**: Clone the repository and run `bun install`
2. **Development**: Use `bun run dev` to start the development server

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