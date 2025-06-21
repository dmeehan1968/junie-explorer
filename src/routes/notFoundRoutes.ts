import express from 'express';

const router = express.Router();

// Not found route handler
router.use((req, res, next) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Page Not Found</title>
      <link rel="stylesheet" href="/css/style.css">
      <link rel="icon" href="/icons/favicon.svg" sizes="any" type="image/svg+xml">
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

export default router;