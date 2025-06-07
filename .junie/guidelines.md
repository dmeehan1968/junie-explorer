# Junie Explorer - Project Guidelines

## Project Overview
Junie Explorer is a full-stack web application built with Node.js and TypeScript that provides a simple interface to browse JetBrains IDE directories found in the user's cache folder. The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of all JetBrains IDE installations found on the system.

## Directory Structure
```
junie-explorer/
├── .junie/                  # Project documentation and guidelines
├── features/                # Gherkin feature files for requirements documentation
│   └── homepage.feature     # Homepage requirements specification
├── public/                  # Static assets
│   └── css/                 # CSS stylesheets
│       └── style.css        # Main stylesheet
├── src/                     # Source code
│   ├── index.ts             # Main application entry point
│   ├── matterhorn.ts        # Interface definitions
│   ├── test.ts              # Test utilities
│   ├── routes/              # Route handlers
│   │   └── homeRoutes.ts    # Homepage route handler
│   └── utils/               # Utility functions
│       └── ideUtils.ts      # IDE directory utilities
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
The application uses several interfaces defined in `matterhorn.ts`:
- `IDE`: Represents a JetBrains IDE installation
- `Project`: Represents a user project within an IDE
- `Issue`: Represents an issue within a project
- `Task`: Represents a task within an issue
- `Step`: Represents a step within a task
- `JunieMetrics`: Contains raw metrics data
- `Metrics`: Contains processed metrics data for display

## Development Workflow
1. **Setup**: Clone the repository and run `npm install`
2. **Development**: Use `npm run dev` to start the development server
3. **Testing**: Use `npm test` to run the test script
4. **Building**: Use `npm run build` to compile TypeScript to JavaScript
5. **Production**: Use `npm start` to run the compiled application

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

### Using Feature Files
- Feature files should be consulted when implementing new features or modifying existing ones
- They serve as acceptance criteria for the application's functionality
- No step definitions or testing tools should be created at this time - the feature files are purely for documentation purposes
- When implementing features, developers should ensure their code satisfies all scenarios described in the relevant feature files
- When code changes are made, make sure that the relevant feature files are updated to reflect new functionality

## Future Enhancements
Potential areas for improvement:
- Add detailed views for individual IDE directories
- Implement project and issue browsing
- Add authentication for multi-user environments
- Enhance the UI with more interactive elements
