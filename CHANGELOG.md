# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-06-10

### Features
- Add project summary with aggregate metrics for all issues (008ea31)
- Add project summary metrics table to project details page (9789b86)

## [1.1.0] - 2025-06-10

### Features
- Add project search functionality to the homepage (48ccfa6)
- Add IDE filtering functionality to homepage (589e9d7)
- Extract IDE filtering logic into a reusable script (c60fad7)
- Extract reload page logic into a standalone script (c517705)
- Add "Filter by IDE" label to filtering toolbar (2468e76)

### UI Improvements
- Reorder issue table columns for consistent state display (8fa0eda)
- Improve project and IDE UI structure (58d5034)
- Remove IDE list from homepage, merge projects across IDE's (e5e29e7)
- Move inline styles to `style.css` (398d26a)

### Code Improvements
- Split `taskRoutes.ts` into `issueRoutes.ts` and `escapeHtml.ts` (c076b4f)
- Simplify project route structure (b8f2a0e)
- Remove project routes and unused legacy scripts (e5238ba)
- Remove legacy IDE-based routes and methods (64a7743)

### Documentation
- Update documentation and scripts organization (e1f75fb)
- Add new scenarios for homepage features (c1adab2)
- Add new scenarios for project details page features (c9eed4b)
- Remove deprecated task and issue feature files (022f4dc)
- Add feature file for issue details page (ac0b33c)
- Add feature file for task details page (f4947fc)
- Update README and guidelines for feature file changes (5b73e48)
- Clarify version tagging guidelines in release process (81046e8)

## [1.0.4] - 2025-06-10

### UI Improvements
- Remove artifact path from task details (e1b9880)
- Enhance task details layout and styling (da2e347)
- Revamp task plan rendering and styles (d710b35)

### Documentation
- Add contribution guidelines improvements (99de8ba)

## [1.0.3] - 2025-06-09

### Documentation
- Update changelog release guidelines (b47d575)
- Add changelog preparation guidelines (faa4790)

### Code Improvements
- Remove unused file and cleanup imports (bb2a72e)

## [1.0.2] - 2025-06-09

### UI Improvements
- Remove bottom border from first row cells in steps table (15b9816)
- Add vertical borders to specific columns in second header row of steps table (df7a821)
- Improve header styling in steps table (fe4ba44)
- Revamp metrics table headers and structure (598ffc1)

### Code Improvements
- Extract and centralize metrics calculation logic (f60f862)

## [1.0.1] - 2025-06-09

### Bug Fixes
- Escape HTML in Markdown-rendered task descriptions (53c6f36)
- Update JetBrains cache directory path resolution for Windows (61315fa)

### Code Improvements
- Remove unused imports and redundant code (5c76c3e)
- Delete outdated formatter implementations (a361a2e)
- Remove redundant JetBrains module and cache entries (a40325c)

## [1.0.0] - Initial Release

- Initial stable release of Junie Explorer
