import { NextFunction } from "express"
import { themeAttributeForHtml } from "../../utils/themeCookie.js"
import { AppError, AppRequest, AppResponse } from "../types.js"

export function errorHandler(err: any, req: AppRequest, res: AppResponse, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).send(`
        <!DOCTYPE html>
        <html lang="en" ${themeAttributeForHtml(req.headers.cookie)}>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${err.message}</title>
          <link rel="stylesheet" href="/css/app.css">
          <link rel="icon" href="/icons/favicon.png" sizes="any" type="image/png">
        </head>
        <body class="bg-base-200 p-5">
          <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
            <h1 class="text-3xl font-bold text-primary mb-5 pb-3 border-b-2 border-base-300">${err.message}</h1>
            ${err.status === 500 ? `<pre class="mb-5 text-sm text-base-content/70"><code>${err.stack}</code></pre>` : ''}
            <nav aria-label="breadcrumb">
              <div class="breadcrumbs text-sm">
                <ul>
                  <li><a href="/" class="text-primary hover:text-primary-focus">Home</a></li>
                </ul>
              </div>
            </nav>
          </div>
        </body>
        </html>`)
  }
  console.error(err)
  res.status(500).send('Internal Server Error')
}