# Junie Explorer

Junie Explorer is a full-stack web application built with Bun and TypeScript (Express.js) that provides a simple interface to browse JetBrains IDE directories found in the user's cache folder. The application scans the `/Users/<username>/Library/Caches/JetBrains` directory and displays a list of all JetBrains IDE installations found on the system.

## New in Tests

- Added unit tests and a Playwright DSL for `StatusBadge` component
  - Files:
    - `src/components/statusBadge.dsl.tsx`
    - `src/components/statusBadge.test.tsx`
  - Coverage:
    - Verifies base classes and text rendering
    - Validates class mappings for all known states
    - Ensures case-insensitivity and space-to-hyphen mapping (e.g., `"in progress"` → `in-progress`)
    - Asserts fallback styling for unknown states
    - Confirms dynamic updates when the `state` prop changes

## Running Tests

- Run the full test suite:

```bash
bun run test
```

- Run tests matching a pattern (e.g., `StatusBadge`):

```bash
bun run test --grep StatusBadge
```

- Open Playwright UI for interactive runs:

```bash
bun run test:ui
```

## Type Checking

Ensure the codebase is type-safe:

```bash
bunx tsc --noEmit
```

---

For general project overview, setup, and development workflow, see the sections below and the documentation in `.junie/guidelines.md` and `docs/overview.md`.
