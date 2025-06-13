# Junie Explorer - Project Guidelines

## Project Overview
Junie Explorer is a full-stack web application built with Node.js and TypeScript that provides a simple interface to browse JetBrains IDE directories found in the user's cache folder. The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of all JetBrains IDE installations found on the system.

## Features
- Lists all JetBrains IDE directories found in `/Users/<username>/Library/Caches/JetBrains`
- Displays projects within each IDE
- Shows issues, tasks, and steps within projects
- Provides metrics and statistics for issues and tasks
- Includes a refresh button to update the data
- Responsive web interface

## Tech Stack
- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Build Tools**: ts-node, TypeScript compiler
- **Dependencies**:
  - express: Web server framework
  - fs-extra: Enhanced file system operations
  - marked: Markdown parsing library

## External Dependencies
- Node.js (v20 or higher) - Must be installed by the user
- npm (v6 or higher)

## Installation
1. Install Node JS (>=v20) ([Download](https://nodejs.org/en/download))
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode
To run the application in development mode:
```bash
npm run dev
```
This will start the server using ts-node, which compiles and runs TypeScript code on-the-fly.

### Production Mode
To build and run the application in production mode:

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Testing
To test the application functionality:
```bash
npm test
```
This will run a test script that checks if the JetBrains directory exists and lists all IDE directories found there.

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
│   ├── schema.ts        # Zod schemas for data validation
│   └── test-jetbrains.ts # Test file for JetBrains classes
├── dist/                    # Compiled JavaScript (generated)
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project readme
```

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

## JetBrains Cache File Structure
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

## Development Workflow
1. **Setup**: Clone the repository and run `npm install`
2. **Development**: Use `npm run dev` to start the development server
3. **Testing**: Use `npm test` to run the test script
4. **Building**: Use `npm run build` to compile TypeScript to JavaScript
5. **Production**: Use `npm start` to run the compiled application

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

## Contributing

Check out [contribution](CONTRIBUTING.md) guidelines

## License
Apache 2.0 (See [License](LICENSE))
