Essential Commands (Darwin/macOS environment):

Project Setup:
- bun install

Development:
- bun run dev   # start development server

Build & Run:
- bun run build
- bun start      # start server on PORT (default 3000)

Quality (if configured in package.json):
- bun run typecheck   # TypeScript type checking
- bun run lint        # Linting (if eslint configured)
- bun run format      # Formatting (if prettier configured)

Release (per project guidelines):
- Update version in package.json and CHANGELOG.md
- bun install         # update bun.lock
- git add CHANGELOG.md package.json bun.lock
- git commit -m "chore(release): vX.Y.Z"
- git tag vX.Y.Z

Utilities (macOS):
- date                # current date for CHANGELOG
- ls, cd, grep, find  # file navigation/search
- git status / git diff / git log --oneline

Notes:
- Use PORT env var to set server port
- USER env var used to construct JetBrains cache path
