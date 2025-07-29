import express from 'express';

const router = express.Router();

// Not found route handler
router.use((req, res, next) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en" data-theme="light">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Page Not Found</title>
      <link rel="stylesheet" href="/css/app.css">
      <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
    </head>
    <body class="bg-base-200 p-5">
      <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-primary mb-5 pb-3 border-b-2 border-base-300">Page Not Found</h1>
        <p class="mb-5 text-base-content/70">The page you are looking for does not exist or is no longer available.</p>
        <p class="mb-5 text-base-content/70">The file system structure may have changed. <a href="/refresh" class="text-primary hover:text-primary-focus underline">Refresh</a> to update the app state.</p>
        <nav aria-label="breadcrumb">
          <div class="breadcrumbs text-sm">
            <ul>
              <li><a href="/" class="text-primary hover:text-primary-focus">Home</a></li>
            </ul>
          </div>
        </nav>
      </div>
    </body>
    </html>
  `);
});

export default router;