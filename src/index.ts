import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import homeRoutes from './routes/homeRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { jetBrainsPath } from './utils/ideUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Register routes
app.use('/', homeRoutes);
app.use('/', projectRoutes);
app.use('/', issueRoutes);
app.use('/', taskRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`JetBrains Path: ${jetBrainsPath}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});
