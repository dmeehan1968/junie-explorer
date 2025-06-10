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
│   ├── issue-cost-graph.feature # Issue cost graph requirements
│   ├── project-issues.feature # Project issues page requirements
│   ├── projects.feature     # Projects page requirements
│   ├── refresh-button.feature # Refresh button functionality requirements
│   ├── task-steps.feature   # Task steps page requirements
│   └── tasks.feature        # Tasks page requirements
├── public/                  # Static assets
│   ├── css/                 # CSS stylesheets
│   │   └── style.css        # Main stylesheet
│   └── js/                  # JavaScript files
│       └── issueGraph.js    # Client-side script for issue graph visualization
├── src/                     # Source code
│   ├── chart.d.ts           # Type definitions for chart library
│   ├── index.ts             # Main application entry point
│   ├── matterhorn.ts        # Interface definitions for data model
│   ├── test.ts              # Test utilities
│   ├── routes/              # Route handlers
│   │   ├── homeRoutes.ts    # Homepage route handler
│   │   ├── issueRoutes.ts   # Issue page route handler
│   │   ├── notFoundRoutes.ts # Not found page route handler
│   │   └── taskRoutes.ts    # Task page route handler
│   └── utils/               # Utility functions
│       ├── appState.ts      # Application state management
│       ├── jetBrainsPath.ts # JetBrains path utilities
│       └── timeUtils.ts     # Time and date utilities
├── dist/                    # Compiled JavaScript (generated)
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project readme
```

## Data Model
The application uses several interfaces defined in `matterhorn.ts`:
- `IDE`: Represents a JetBrains IDE installation
- `Project`: Represents a user project within an IDE
- `Issue`: Represents an issue within a project
- `Task`: Represents a task within an issue
- `Step`: Represents a step within a task
- `Metrics`: Contains processed metrics data for display

## Development Workflow
1. **Setup**: Clone the repository and run `npm install`
2. **Development**: Use `npm run dev` to start the development server
3. **Testing**: Use `npm test` to run the test script
4. **Building**: Use `npm run build` to compile TypeScript to JavaScript
5. **Production**: Use `npm start` to run the compiled application

## Requirements Documentation
Requirements for this project are documented using Gherkin feature files located in the `features/` directory. These files serve as a source of truth for the expected behavior of the application.

## Contributing

Check out [contribution](CONTRIBUTING.md) guidelines

## License
Apache 2.0 (See [License](LICENSE))
