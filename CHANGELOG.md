# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2025-07-22

### Features
- Add new IDE names to `ideNameMap` in `jetbrains.ts` (closes #22) (b8b066c)
- Add `WaitingUserInput` state to `JunieChainSchema` (93661bd)
- Enable Markdown rendering for task trajectories (deb6312)

### Bug Fixes
- Fix start not working for windows (109dc94)

### Code Improvements
- Simplify server start condition (35bc338)
- Merge pull request #23 from yohannlog/main (54b0371)
- Improve task loading and enhance server initialization (17f1e3e)
- Revert "Enable Markdown rendering for task trajectories" (d09fcaa)
- Revert "Enhance `.content-wrapper` styles in `style.css`" (1939424)
- Revert "Escape single quotes consistently in `taskTrajectoriesRoute.ts`" (0462359)

### UI Improvements
- Escape single quotes consistently in `taskTrajectoriesRoute.ts` (aca6513)
- Enhance `.content-wrapper` styles in `style.css` (f5893d6)

## [2.3.0] - 2025-07-16

### Features
- Add support for Bun and improve module imports (28ff297)
- Migrate to Bun runtime and update project setup (8485e62)

### Code Improvements
- Update dependencies, enhance CSS, and extend role schema (974ed39)
- Update release process guidelines for Bun compatibility (3349a27)
- Add `bun.lock` file for Bun dependency management (b541994)
- Remove `package-lock.json` file (0145f4e)
- Remove `bun.lock` file (fb158ae)

## [2.2.0] - 2025-07-15

### Features
- Add task trajectories route for detailed visualization (57f068b)
- Add download routes and links for task events and trajectories (ff78109)
- Add schema validation for trajectory data and improve error handling (d0d9120)

### Code Improvements
- Extract `Trajectory` schema into a separate module (2f57f1c)
- Split `taskRoutes.ts` file in modules per route (8af2075)
- Refactor and centralize event and trajectory file path logic (63edeac)
- Refactor and tidy up `taskRoutes.ts` and adjust trajectory table styles (de01fcb)
- Enhance event schema with passthrough support for flexible properties (3f61c26)

### UI Improvements
- Update download link text and button styles for tasks (061dc5f)
- Trim trajectory content and set max width for content column (0466acd)
- Wrap trajectory content in a container and adjust styles (79510ad)
- Move inline styles for trajectories table to CSS file (43bb4f2)
- Rename button class for raw data toggle functionality (5d0582a)

### Documentation
- Update automated testing guidelines in documentation (8b91781)
- Update testing workflow and guidelines in documentation (0fdce11)

## [2.1.0] - 2025-07-08

### Features
- Add action timeline chart for visualizing agent actions (c5aac9c)
- Enhance action timeline with input parameter support and improved visualization (864ec53)
- Optimize action timeline chart for long labels and improved readability (3d3ba0e)

### Code Improvements
- Enhance event schema for agent action execution (65a9f11)

### UI Improvements
- Adjust container max-width to 1440px in `style.css` (b5566a7)
- Fix erroneous left margin on 'raw json' button (0b091c7)

## [2.0.2] - 2025-07-07

### Bug Fixes
- Fix token usage calculations and chart filter behavior (f3a2936)

## [2.0.1] - 2025-07-07

### Bug Fixes
- Restore step functionality due to log name change (761c706)

### Features
- Merge pull request #19 from dmeehan1968/feature/ui-for-events (da64cb8)

## [2.0.0] - 2025-07-07

### Features
- Add LLM event metrics chart to task events (dd78669)
- Add provider filtering and interaction to LLM event metrics chart (f150f1f)
- Add cost calculation and default values to event schema (775bf16)
- Display cost calculations and improve JSON column layout in task events table (3f633ac)
- Add collapsible sections for improved UI interaction (cc72746)

### Code Improvements
- Refactor metrics calculation and streamline event handling (826488e)
- Refactor Task and Event Handling Logic (c35780b)
- Add `McpInitStarted` and `McpInitFinished` event types to event schema (992dc1f, 5f20232)
- Add `ActionRequestBuildingFailed` event type to event schema (23ba6cb)
- Allow toggling visibility on rows with unset `style.display` (7d795ba)
- Adjust bar and circle rendering dimensions in TaskEventChart (bdf2095)

### Documentation
- Add guidelines for recommended MCP tools (4990723)

## [1.6.2] - 2025-06-20

### Documentation
- Update release guidelines to include package-lock.json handling (188e9bf)

### Code Improvements
- Refactor step representation handling with dedicated utilities (b558fb6)
- Enhance step representation output to be more readable (5a254e4)
- Enhance server startup logic and update README for port configuration (c9446fc)

## [1.6.1] - 2025-06-20

### Code Improvements
- Update package-lock.json to bump project version to 1.6.0 and update Node.js requirement (d765b68)
- Update README with Node Version Error handling instructions (550e4dc)
- Add Node.js and npm engine configuration files (e91f931)
- Update Node.js version requirement and fix README numbering (5fd0068)

### Bug Fixes
- Move task JSON viewer out of the link to prevent erroneous navigation when interacting with viewer (0ef71d9)

### UI Improvements
- Improve Markdown code block styling and add overflow handling (f59f64d)

## [1.6.0] - 2025-06-19

### Code Improvements
- Replace `calculateIssueSummary` and `calculateProjectMetrics` with pre-computed `metrics` (c889c1d)
- Simplify step metrics calculation and improve type consistency (6405e0c)
- Switch storage from sessionStorage to localStorage for filter and project selection data (2703158)
- Refactor `Issue` class with lazy loading and encapsulation for tasks and metrics (3d3d19c)

### Bug Fixes
- Fix case-sensitivity issue in project name search (closes #13) (2828025)

## [1.5.0] - 2025-06-18

### Testing Infrastructure
- Merge pull request #17 from dmeehan1968/feature/tests (5699263)
- Remove unused feature files for issue cost graph, project graph, and reload button (f2f6d80)
- Refactor project and issue step definitions for improved clarity and functionality (d856f36)
- Introduce `MuteLogger` and refactor logging for better flexibility (2224ba2)
- Add testability and prevent default handling across components (7e802e4)
- Add selectors and methods for task management in `IssuePage` (fc9cfb2)
- Add `IssuePage` class and update step definitions (157c6e8)
- Refactor breadcrumb and reload button features (a639bf9)
- Update and refactor issue details feature for improved clarity and modularity (11fa2df)
- Update and refactor project details feature and related step definitions (bdea108)
- Refactor `BasePage` and `HomePage` for reload button handling and IDE filter memoization (cb3efcc)
- Update and refactor homepage feature (6095014)
- Add project page support and step definitions (5d5c440)
- Update scenario tags in feature files (b449abd)
- Replace `@skip` tags with `@pending` and update test command (3d71332)
- Remove `@wip` tags and enhance hover effect validation (dc834d8)
- Enhance homepage feature with mobile responsiveness and hover effects (449eb82)
- Refactor `homepage.steps.ts` to streamline IDE filter handling (4a5232c)
- Remove redundant timeout from reload button step definition (dfc128d)
- Add support for no logs jetbrains instance (68d9a36)
- Remove unused imports in `hooks.ts` (175b650)
- Refactor server setup and enhance test environment (4ce60fb)
- Remove unused `.last-run.json`, update `homepage.feature`, and enhance Playwright methods (8c9d3fe)
- Update `homepage.feature` and improve Playwright methods (0ac9416)
- Remove `summary` formatter from Cucumber configuration (12bd1f4)
- Remove unused Cucumber report file (28d7aaa)
- Add `data-testid` attributes for testability and clean up unused test script (76ede63)
- Update HTML structure in Cucumber report script (54ee4ca)
- Add Playwright base page and Cucumber configuration (4532e10)
- Add project graph scenarios to feature file (550d16d)
- Remove redundant homepage scenarios (8116a57)

### Features
- Make `description` field optional in `AgentIssue` schema (57f3b7d)

### UI Improvements
- Remove unused `.issue-header` styles from `style.css` (987fb19)
- Remove project table styles from `style.css` (57f2937)
- Remove unused styles from `style.css` (7cac187)
- Fix misplaced HTML structure in issue and project routes (6fb5af2)

### Code Improvements
- Sort projects alphabetically in `jetbrains.ts` (1493803)

### Documentation
- Remove unused `test-jetbrains.ts` reference in documentation (25ec3d7)
- Update feature files to reference JetBrains logs directory (ee6a2cf)
- Update documentation to reference JetBrains logs directory (3bd5ac6)
- Update task steps representation image (519f6b3)
- Add detailed user guide and images for Junie Explorer (3bd5ac6)

## [1.4.0] - 2025-06-13

### Features
- Add trajectory retrieval and parsing to `Task.ts` (6d1a285)
- Replace Markdown viewer with Representations viewer for task steps (9bb63ff)
- Add Markdown data representation for task steps (a36c9e7)
- Add event retrieval and parsing to `Task.ts` (8ff5c72)
- Add scenarios to validate JSON viewer functionality in issue feature (c715d72)

### UI Improvements
- Add styles for representations viewer HTML formatting (34eff1b)
- Add Markdown container styles and escape HTML in Markdown rendering (a36c9e7)
- Add issue count to project links and adjust CSS styles (a971b92)

### Code Improvements
- Update log messages and remove redundant debug logs (7793fbb)
- Escape HTML in Markdown content except for code blocks (ee3d115)
- Sort tasks and steps by creation date and ID (9092de8)
- Sort issues by creation date in `Project.ts` (657d543)
- Update `JunieException` schema to allow flexible exception types (610d030)
- Enhance `JunieStepSchema` and refactor nullable properties (e59ec54)
- Add check for missing projects directory in `jetbrains.ts` (fc85b02)
- Remove deprecated `matterhorn.ts` file (455c389)
- Migrate `v2` files to root and enhance schema consistency (91a523f)
- Remove `appState.ts` and related references (158dcb9)
- Remove test files for `Task` and `Step` classes (ad91fac)
- Adjust time unit thresholds in `projectRoutes.ts` (93386eb)
- Refactor metrics time formatting in taskRoutes (88282a7)
- Remove `getIDEIcon` utility and refactor icon retrieval via `jetBrains` (1d74816)
- Update app to leverage JetBrains API and refactor task schemas (18f9629)
- Update routes for to use JetBrains state (6463fc8)
- Add reasoning field and adjust method visibility in core classes (01e2050)
- Add IDE names tracking for projects in `jetbrains.ts` (cd12e60)
- Add JetBrains instance initialization in `jetbrains.ts` (fa33556)
- Adjust encapsulation for `tasks`, `steps`, and `projects` (d73ed42)
- Refactor routes and improve formatting across router files (1221ea3)
- Fix formatting and add spacing adjustments in `index.ts` and `homeRoutes.ts` (6c8922b)
- Refactor statistics handling and schema validation in Step class (7326fc8)
- Refactor ID and access methods across core classes (f1dbc11)
- Add and refactor classes for enhanced metrics tracking and schema validation (686414e)
- Refactor metrics handling with detailed token breakdown (f92fb46)
- Add detailed metrics tracking and schema enhancements for Junie tasks and steps (0b3365e)
- Enable source maps and improve dev/test scripts (d3b33c4)
- Add Jetbrains schema and enhance project structure (eb9791e)
- Remove unused `steps` field from `matterhorn.ts` (a971b92)
- Simplify and streamline JSON responses for tasks and steps (dbb97f4)

## [1.3.0] - 2025-06-11

### Features
- Add raw data viewer for tasks with dynamic API fetching (6b534c9)
- Add raw data viewer for task steps (9fcdcad)
- Fetch step data dynamically via API in `taskStepRawData.js` (dba0cc9)
- Update raw data viewer to enhance UX (af5a5ac)

### Bug Fixes
- Handle errors when parsing step descriptions in `matterhorn.ts` (efa4f99)
- Escape HTML in issue names across routes and templates (67327ef)

### Code Improvements
- Restrict task endpoint to return only public fields (187c19a)
- Limit JSON viewer height, improve styles, and update feature scenario (5824d38)

### Documentation
- Document JetBrains cache file structure in README (9a52fe0)

## [1.2.0] - 2025-06-10

### Features
- Add project cost graph functionality (4334396)
- Add lazy-loading for improved performance (906a05d)
- Group data points by time unit for improved chart accuracy (5529e6f)
- Add display option toggles for project metrics graph (ab5a635)
- Add project selection and metrics graph functionality (e1c315a)
- Add `Task` class with lazy-loading and testing utilities (31952b6)
- Add `Step` class and update step processing logic (ef55899)

### UI Improvements
- Improve graph container visibility and animations (ba48602)
- Add summary icon to task steps (cd0ced4)
- Add styling for preformatted code blocks in markdown sections (d1ee4fb)
- Update branding to "Junie Explorer" (3c13d77)

### Code Improvements
- Sort issues by creation date when merging projects (af10dd8)

## [1.1.2] - 2025-06-10

### Bug Fixes
- Resolve excess memory usage (closes #1) (9dee746)

### Code Improvements
- Refactor: enhance memory usage tracking and simplify state management (370f443)
- Refactor: simplify file system operations and streamline state management (18dd0f1)

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
