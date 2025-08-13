Project: Junie Explorer
Purpose: A Bun + TypeScript (Express.js) web app to browse JetBrains IDE directories in the user's cache, analyze Junie logs (chains, tasks, steps, events), compute metrics, and present them via a responsive web UI with charts and filters.

Tech Stack:
- Runtime: Bun (>=1.2.18) with Express.js
- Language: TypeScript, ES modules
- UI: Tailwind CSS + DaisyUI; client-side charts and UI scripts in public/js
- Validation: zod
- FS: fs-extra
- Workers: poolifier-web-worker
- Others: marked, mime-types, semver

Code Structure (high-level):
- src/: main application code
  - app/web: HTTP routes (home, project, issue, task events, trajectories)
  - components: small HTML/SVG component helpers (breadcrumb, icons, badges, banners)
  - utils: helpers (escapeHtml, locale, jetBrainsPath resolution, metrics, time, version banner)
  - workers: background workers (loadEvents)
  - Core classes: JetBrains, Project, Issue, Task, Step
  - Schemas: schema.ts (+ schema subfiles), trajectorySchema.ts, chart.d.ts, types.ts
  - createServer.ts, index.ts: server startup
- public/: static assets (css, js, icons, version.txt)
- features/: Gherkin requirements docs
- docs/: overview docs
- dist/: build output (do not edit)
- .junie/: project tooling configs

Notable Functionality:
- JetBrains cache discovery under /Users/<username>/Library/Caches/JetBrains
- Log ingestion and validation (Zod)
- Metrics aggregation across tasks, steps, issues, projects
- Interactive charts and filtering on the web UI
- Worker-based event processing
- Internationalization utilities (locale/time)

Configuration:
- PORT env var for server port (default 3000)
- USER env var for username (for cache path)
- TypeScript configured via tsconfig.json

Entrypoints:
- Development: `bun run dev`
- Build: `bun run build`
- Start: `bun start` and open http://localhost:3000
- Single-file executable via `bun --compile` in build step
