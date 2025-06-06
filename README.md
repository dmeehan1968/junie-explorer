# JetBrains IDE Explorer

A simple full-stack application using Node.js and TypeScript that displays JetBrains IDE directories found in the user's cache folder.

## Features

- Lists all JetBrains IDE directories found in `/Users/<username>/Library/Caches/JetBrains`
- Simple, responsive web interface
- Built with Express.js and TypeScript

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

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

To test the directory access functionality:

```bash
npm test
```

This will run a simple test script that checks if the JetBrains directory exists and lists all IDE directories found there.

## Project Structure

- `src/index.ts` - Main server file
- `src/matterhorn.ts` - Interface definitions
- `public/css/style.css` - Stylesheet for the frontend

## License

Private