# Junie Explorer - Project Guidelines

## Project Overview
Junie Explorer is a full-stack web application built with Node.js and TypeScript that provides a simple interface to browse JetBrains IDE directories found in the user's cache folder. The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of all JetBrains IDE installations found on the system.

## Directory Structure
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
1. **Setup**: Clone the repository and run `npm install`
2. **Development**: Use `npm run dev` to start the development server
3. **Testing**: Use `npm test` to run the test script
4. **Building**: There is no build step, typescript can be run directly via loader ts-node/esm. tsconfig.json includes noEmit=true

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
1. Build the application with `npm run build`
2. Start the server with `npm start`
3. Access the application at `http://localhost:3000` (or configured port)

## Requirements Documentation
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

### Gherkin Scenarios
- Avoid lengthy 'then/and' steps, this indicates that the scenario is too complex and should be split into more focussed scenarios

### Release a version

- Check the CHANGELOG.md for the most recently mentioned version
- Use this version (Major.minor.patch) to look for git commits since a tag with the same version (version tags are prefixed `v`, e.g. v1.0.0)
- If there are no changes since the last version tag, then your work is done.
- Separate changes by version number (git tag) and increment the latest version (default patch) depending on the request
- Update the package.json version to the new version
- Update CHANGELOG.md to include the changes separated by version (use the first line of the commit and include the commit hash) 
- Make sure the latest version release date is today (use `date` CLI to get current)
- Run `npm install` to update the package-lock.json
- Commit CHANGELOG.md, package.json and package-lock.json
- Add a tag with the new version (prefix the version with `v`, e.g. v1.0.0)

## Future Enhancements
Potential areas for improvement:
- Add detailed views for individual IDE directories
- Implement project and issue browsing
- Add authentication for multi-user environments
- Enhance the UI with more interactive elements

# MCP Tools

- Use Jetbrains
- Use context7