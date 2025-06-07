import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import homeRoutes from './routes/homeRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { jetBrainsPath } from './utils/ideUtils.js';
import { initializeAppState, refreshAppState } from './utils/appState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Add refresh endpoint
app.get('/refresh', async (req, res) => {
  await refreshAppState();
  res.redirect(req.headers.referer || '/');
});

// Register routes
app.use('/', homeRoutes);
app.use('/', projectRoutes);
app.use('/', issueRoutes);
app.use('/', taskRoutes);

// Add not found page (must be after routes)
app.use((req, res, next) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Page Not Found</title>
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body>
      <div class="container">
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist or is no longer available.</p>
        <p>The file system structure may have changed. <a href="/refresh">Refresh</a> to update the app state.</p>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/">Home</a></li>
          </ol>
        </nav>
      </div>
    </body>
    </html>
  `);
});

// Initialize app state and start the server
initializeAppState().then(() => {
  app.listen(PORT, () => {
    console.log(`JetBrains Path: ${jetBrainsPath}`);
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
