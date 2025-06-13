const express = require('express');
const path = require('path');

// Test script to verify current functionality works
const app = express();

// Serve static files
app.use(express.static('public'));

// Import routes
const homeRoutes = require('./dist/routes/homeRoutes.js').default;
const projectRoutes = require('./dist/routes/projectRoutes.js').default;
const issueRoutes = require('./dist/routes/issueRoutes.js').default;
const taskRoutes = require('./dist/routes/taskRoutes.js').default;
const notFoundRoutes = require('./dist/routes/notFoundRoutes.js').default;

// Use routes
app.use('/', homeRoutes);
app.use('/', projectRoutes);
app.use('/', issueRoutes);
app.use('/', taskRoutes);
app.use('/', notFoundRoutes);

const PORT = process.env.PORT || 3001;

console.log('Testing current functionality...');
console.log('Starting server on port', PORT);

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('You can test the current functionality before refactoring');
});