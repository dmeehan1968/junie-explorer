# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.8.0] - 2025-12-18
### Added
- Add inline issue description editing and persistence (4a4050b, 006f39b, 47d4eea)
- Add issue merging and unmerging functionality (b49f7b6, 036460f, 5763dd0, 5a0b8cd)
- Add support for new models in schema: Gemini 3 Flash, Grok 4.1 Fast, OpenAI GPT-5.2 (d61dc34, fce948d, 90bf173)
- Add `XAI.svg` icon (5f20236)
- Add support for task retrieval by index in `Issue` (7496667)
### Fixed
- Fix date handling in `IssuesTable` sorting and calculations (90c8fc7)
- Fix flaky DOM assertion in search test (fbafb0b)
- Fix failing tests due to new aia-only fixture (811a4f2)
### Changed
- Sort AIA issues and tasks explicitly by creation date (c5e8c93)
- Update `Task` to load and assign context from event records (27c1667, 60e29a9)
- Refactor `IssueDescriptionStore` dependency handling (1752a9b)
- Refactor concurrency configuration (859a87d)
- Update JetBrains cache directory resolution logic (66e34b4)
- Update Bun test instructions in guidelines (c009823)

## [3.7.0] - 2025-12-11

### Added
- Add issue search functionality with client-side and server-side integration (adecbba)
- Add regex support for issue search functionality (8865f0f)
- Add `Search` button for issue search and enhance submit behavior (0308131)
- Add `OpenAI4o` schema and integrate into transformer logic (3a3c760, ee5b1bb)
- Add AgentType chart series and TPS display support (a5dd354)
- Add event metrics chart data API and integrate with client-side fetch (a6527a7)
- Add "Show All Diffs" toggle to message trajectories (8f512c3)
- Add Mode column and implement corresponding row cell with icons (e474b10)
- Add support for optional `cost` field in schema and improve trajectory file handling (83adb93)
- Add support for alternative constructors and enhance path handling in `Issue` and `Task` (8bcfad6)

### Changed
- Update AgentType default and references to "Assistant" instead of "Agent" (cbc1722)
- Refactor `Task.ts` event matching logic (dc524b7)
- Refactor `Task.ts` response event matching logic (e866a12)
- Refactor `OpenAI51` and `OpenAI51CodexMax` schema inheritance (ced2f58)
- Refactor event line mapping logic in `loadEvents.ts` (f7cacea)
- Refactor event handling and type definitions in `trajectoriesView.tsx` and related components (930f68a)
- Update Task constructor to modify ID initialization (f6e9f13)
- Make Task.loadEvents public to allow AIA Issues to get event detail without caching events (9ae6ae7)
- For AIA tasks, derive issue name and state from events (d2a3887)
- Update CSS class usage and minor code cleanups in `issuesTable` (f3ea198)
- Update CSS class in issue row to fix hover styling behavior (704156f)
- Update CSS class for issue row to fix word wrapping behavior (c02ada1)
- Center-align table headers and row cells in `issuesTable` and `issueRow` (9cb526d)
- Hide AgentType dropdown when AgentType series is selected (2e7e745)
- Update `chatAssistant` locator to match correct test data ID (e4edfd0)
- Update regex pattern for `ErrorAnalyzer` AgentType in schema (c896d95)
- Added `cacheCreateInputTokens` to the context size formula (37925e4)
- Update taskCard tests and README (d0c8b4a)
- Skip global type-checking for tests-only tasks (d42bc85)

### Fixed
- Fix erroneous system message diff across agent types, remove redundant argument (9c241db)
- Hide result count during issue search execution (8e2fbd6)
- Remove debug `console.log` statement from event path filtering (0490dcf)
- Update error logging in `Task.ts` to improve readability (c357854)

## [3.6.0] - 2025-12-06

### Added
- Add `OpenAI51CodexMax` schema and refactor `OpenAI5` exports (7334d62)
- Add GitHub Actions workflow for Junie (22509a0)
- Add `.junie` workflow (6c2f42c)
- Add loading state and improve model-based metric visualization (f4db67a)
- Add series sorting, UI improvements, and chart reload refinements (13c5bca)
- Add "View by Model" toggle and update dataset breakdown for metrics chart (0d2c2c0)
- Add `MemoryCompactedEvent` to schema and event definitions (7c58227)
- Add `MemoryCompactor` to `AgentType` (3ae213c)
- Add cumulative cost and token datasets to event charts (941832d)

### Changed
- Refactor schema parsing to handle errors with `ctx.addIssue` (e85025d)
- Propagate event parsing errors and report in `Task.loadEvents` (4498e70)
- Update `AgentState.observations` schema definition (75979eb)
- Update TaskCard UI and functionality (a5972d3)
- Optimize metrics fetching and improve async handling for projects and issues (7a36132)
- Update E2E test snapshots for metrics chart view modes (d993406)
- Enhance `trajectoriesView` rendering and refine reasoning effort handling (8aad6a3)
- Enhance Event Metrics chart with detailed cost/token breakdown (c719723)
- Refactor `trajectoriesView` rendering and simplify message handling (36ef79b)
- Refactor/Update `AgentType` detection logic in `llmRequestEvent` schema (b4665fb, f1c7ddd, 25273e8)
- Remove "(Cost)" and "(Tokens)" suffixes from series labels in project metrics chart (bc617ac)
- Update README and simplify label rendering (f7b97dc)

### Fixed
- Reinstate `MemoryCompactedEvent` in event schema (5486223)
- Handle `WorkerExecutionError` during event loading in Task (9451d88)
- Preserve cumulative dataset hidden states and improve provider default selection (2f4cdfe)
- Exclude `cacheInputTokens` from cumulative tokens dataset (f0f4459)

## [3.5.0] - 2025-12-02

### Added
- Add `AnthropicClaude45Opus` support in LLM schema and transformer (da84763)
- Add `AgentType` enum and schema, refactor logic to use `AgentType` for event categorization (f6a5492)
- Add `MemoryExtractedEvent` to schema definitions (689f8ca)
- Add `MemoryReflectionCompletedEvent` to schema definitions (92a1609)
- Add `Gemini3Pro` model support (f4f2bbf)
- Add `CODE` as a valid type in `JunieTaskContext` schema (5999342)
- Add tooltips for assistant provider icons in `IssueRow` (71b59d6)
- Add message diffs to the trajectories view to see message history corruptions (4f1d38d)
- Add Cumulative Cost Dataset to LLM Event Graph (adb3fb9)
- Add e2e tests for project selection storage using cookies (96505ab)
- Add literal `provider` field to LLM schema definitions to override string (29044d7)
- Add `.idea/junie.xml` for IntelliJ project configuration (bcdd4ea)

### Changed
- Switch to stream-based rendering to support Suspense (c459581)
- Persist project selection using cookies instead of local storage (2ec61b5)
- Update UI provider selection to use "all" instead of "both" (5160d2a)
- Restore model grouping by refactoring `AgentType` handling and implement `makeGroupName` utility (87b5b4f)
- Calculate request/previousRequest during loading and remove `getPreviousRequestRecord` (9d87a56)
- Refactor `getPreviousRequestRecord` and restore GPT-5 token calculation logic (c9564f3)
- Refactor `AutoSelectedLlm` to `openAI5` across the schema and transformer (b1bbe8e)
- Restore calculation of assistantProviders (88155f9)
- Update `getMessageDiffs` to handle `LlmRequestEvent` types only (b9973b9)
- Refactor summary metrics initialization and aggregation to remove duplication and introduce costs per token type (0dd5477)
- Refactor `processedEvents.tsx` to improve variable clarity (b6edcf3)
- Update dependencies and lock file (2513fa1, 827b034)
- Refactor test files for naming convention alignment (477cd15)
- Update `.junie/guidelines.md` with file renaming best practice (aa31b5a)
- Update release guidelines for clarity and strict adherence (5bca23e)
- Update log message for skipped JetBrains projects (63bcb55)

### Fixed
- Fix load events worker not being bundled into Bun SFE (8748c0a)
- Fix ghost interactions in theme switcher dropdown (0d0be87)
- Fix cache token exclusion for OpenAI51, and refine cache and cache create for all OpenAI (b0ac599)
- Handle missing `JetBrains` instance in `homeRoutes` (0c11edd)
- Fix checkbox rendering in `projectTable.tsx` (6365dcc)
- Handle type guards, fix null checks, and refine `getMessageDiffs` rendering (b234973)
- Fix styles and improve table rendering in `projectTable.tsx` (8c8ecea)

### Removed
- Remove 'Show raw JSON' toggles and related functionality (af41433)
- Remove circular references during event serialization (cacb2c0)
- Prune circular references during event serialization (f92fbc1)
- Remove unused JetBrains reference in `JunieExplorer` and update `entityLookupMiddleware` (0e105b5)
- Remove commented-out code in `Project.ts` (f32a327)
- Remove `.js` extensions from imports for modern module compatibility (9b6af6e)
- Remove obsolete `test:cucumber` script from package.json (16b324f)
- Remove erroneous await for project metrics (0baca65)
- Disable Junie semantic search (48d1fdc)

### Schema
- Make `observations` optional in `agentStateUpdatedEvent` schema (28094d7)
- Update `schema.ts` to add default values for `isDeclined` and `plan` (b6eaaca)

### UI
- Add `tabular-nums` class to project table for better numeric alignment (1f16c47)
- Throw errors when preconditions for tests are not met in `projectSelectionStorage.e2e.ts` (e02ca6c)

## [3.4.1] - 2025-11-14

### Added
- Add `OpenAI51` schema and update references (aa5f21a)

### Changed
- Refactor `AgentActionExecutionFinished` schema for reusability and consistency (4af0dbd)

## [3.4.0] - 2025-11-04

### Added
- Add `EventTimelineSection` DSL and tests for Playwright integration (3b3eb88)
- Add `EventsTable` DSL and tests for Playwright integration (06e0954)
- Add `EventStatisticsSection` DSL and tests for Playwright integration (09ea759)
- Add `EventMetricsSection` DSL and tests for Playwright integration (782a89a)
- Add `ToolDecorator`, `ToolDecoratorDSL`, and Playwright tests for `ToolDecorator` functionality (2aeb12e)
- Add `ToolCallDecorator`, `ToolCallDecoratorDSL`, and Playwright tests (55ff2af)
- Add HTML wrapper and stylesheet support to `ToolCallDecoratorDSL` (5d1e843)
- Add HTML wrapper and stylesheet loading into component DSLs (0ed24af)
- Add `ExpandIconDSL` and tests (3ef7b9f)
- Add `CollapseIconDSL` and tests (92b3320)
- Add `ContextSizeDSL` and tests (192ab30)
- Add `ModelPerformanceDSL` and tests (edb7a35)
- Add `ActionTimelineDSL` and tests (ebaac18)
- Add `TaskCardDSL` and tests for task card functionality (26c911b)
- Add snapshot test for `CostChart` component (849b1a6)
- Add Playwright tests for metrics chart and project table (ac52a72, 9d2fd6d, 1c72bd2, 91fa35c)
- Add unit testing guidelines and DSL example to documentation (4b1ba9f)

### Changed
- Update README.md and documentation structure; clarify JSX import source and new tests (8bbc434, a279582, 458b1b5, d61ac7e)
- Refactor and modularize TaskCard test suites (2728148)
- Extract components for event metrics, timeline, statistics, and filtering (f9c6a59)
- Refactor tests and DSLs to align with E2E structure and unit tests where appropriate (761a18b, 9491e0a, 865147f, 0863bbe, f6e1c41, 8aafc7e, 93bb330, c3e90b7, bc69621, 0af30e3, 174e93b, aff45f9, e636b28, 5ac570f, b265d0a, ec4f248)
- Update Playwright scripts to use `bunx` and adjust dependencies (c3171ea, 85fdc10)
- Update JSX configuration and simplify `ChatMessageDecorator` (fdfc94a)
- Extract context chart inline script to own module (d8a0a5d)
- Extract task trajectories sections to own modules (6cbc850)
- Do check for updates in the background and log errors (0dc3c6f)
- Wrap `MessageDecorator` with `Conditional` for content validation (79aebaf)
- Add dividers and session jump link to Message Trajectories Section (ed3c7a4)
- Inline `renderWithWrapper` into `ToolCallDecoratorDSL` and extract HTML wrapping to utilities (923de55, 48be6bd)
- Refactor project table and introduce metrics chart DSL with tests (91fa35c)
- Refactor test assertions to use `toContainClass` instead of `toHaveClass` (c2ed70d)

### Removed
- Remove unused server-side `projectsData` script injection (7ff7e9b)
- Remove unused memory reporting and JetBrains unused utilities (c450e81)
- Remove unused `mcp.json` configuration (81bbc9e)
- Remove `llm-token-filters` and associated token visibility logic (c09bf8c)
- Remove unused and redundant methods from `ProjectTableDSL` (c3ba202)
- Remove Cucumber test support files and features (c72a2ad)
- Remove `ToolUseDecorator` and inline logic into `ToolCallDecorator` (11fea21)

### Fixed
- Update `AgentActionExecutionFinished` schema for flexible result handling (06a09fd)
- Update `reasoning_effort` field in `llmRequestEvent` schema (1a47712)
- Add `cached` field to `llmResponseEvent` schema (3e4a6d8)
- Add `cacheInputTokens` to charts and improve combined token calculations (125a148)
- Optimize JSX mapping and conditional rendering in `taskTrajectoriesRoute.tsx` (fbd32e7)
- Preload JetBrains instance in tests and clean up conditional rendering (a22250e)
- Improve project table tests and browser settings (60794ee, 04d2c3f)
- Refactor row DSLs and improve locator usage (0f27e4a)

### Security
- N/A

### Chore/Meta
- Refactor concurrency handling and improve logging/metrics readability (7e8cc47)
- Add OpenAI 41 and PairedGroupEvent support to schemas (61dd460)
- Playwright dependency refactors and code style updates across DSL files (85fdc10)

## [3.3.1] - 2025-10-03

### Added
- Add `SerializableEventSerializationError` to event schema (338d626)
- Add `EmptyToolParametersSchema` and `PredefinedTool` type to schema (87af2e3)

### Changed
- Refactor `projectRoutes.tsx` and extract reusable components (dfe172b)
- Update styles and structure of `versionBanner` (64f0305)
- Add transformation logic for `CANCELED` status in `JuniePlanSchema` (b49e888)

## [3.3.0] - 2025-09-30

### Added
- Add support for AnthropicSonnet45 in schema and transformer (ba4ea3d)
- Add `CANCELLED` status to `JuniePlanSchema` (31ec4f2)

### Changed
- Switch to `<img>` for IDE icons in `projectRoutes.tsx` (d92305e)

### Fixed
- Fix conditional logic and metrics display in project table (2ed760e)
- Fix LLM icon rendering for better dark/light mode compatibility (cef02e1)

### Removed
- Remove `jetBrainsPath` utility and related references (aed9383)

## [3.2.0] - 2025-09-19

### Added
- Add assistant provider aggregation and display to the project table (c96fe61)
- Add unique assistant provider icons and tooltips to project table (97690a8)
- Add assistant provider handling to tasks and UI display (2139fa2)
- Add test IDs to `projectTable` and update test script configuration (01e2e9c)
- Add task boundary handling for context size chart (9b30fef)
- Add option to include all tasks in issue for Context Size chart (75d5184)
- Add grouping option to Project Metrics chart (bff5c65)
- Add description and reasoning to contextSize API and update visualization (ce7a76a)
- Add Context Size Over Time section to Task Trajectories (0826679)
- Add version control guidelines to documentation (322f3bc)

### Changed
- Refactor assistant provider aggregation logic and reuse across components (ca7ed9b)
- Enhance assistant provider data handling and UI display (df3a2e0)
- Add `capabilities` enhancements and pricing logic refinement to LLM schema (4177937)
- Update directory structure in guidelines documentation (5930e89)
- Update ContextSizeSection to conditionally display "Include all tasks" toggle (e79625b)
- Update Project Metrics chart to conditionally display legend (3823137)
- Simplify and unify dataset stacking logic for Project Metrics chart (dcda999)
- Set 'cost' as the default option for project metrics display (b854de0)
- Update Project Metrics chart to stacked bar chart (2d45edf)

### Fixed
- Handle improper type coercion in `taskTrajectoriesRoute` (42523fd)
- Set default value for `type` field in `ToolParametersSchema` (f4cb769)
- Fix hourly grouping and improved tooltip formats to Project Metrics chart (4933043)

### Removed
- Remove worker stats reporting (20fc9e2)

## [3.1.2] - 2025-09-05

### Added
- Add action count to ActionTimeline section (c851a7d)
- Support `anyOf` in McpToolParameters schema (d83ac03)

### Security
- Escape HTML content in taskTrajectoriesRoute (742cdb8)

## [3.1.1] - 2025-08-29

### Added
- Add optional fields to agent interaction schemas (7411ef6)

### Changed
- Update guidelines.md to include "etc" in commit types (e7c1d5d)
- Update MCP configuration and guidelines (6b29ff3, 9f47c84)

## [3.1.0] - 2025-08-29

### Added
- Add support for `openai-gpt4.1-mini` model (df9bef1)
- Add modal-based messaging and abort functionality for reloadPage (313f6fb)
- Add file I/O statistics collection and visualization (a25c52d)
- Add worker file I/O stats collection and integration (54e67e2)
- Add detailed real-time system stats tracking and UI enhancements (7aed6ee)
- Add support for dynamic period selection and historical data loading in stats API and UI (a82b0a8)
- Add incremental data loading and real-time chart updates (17c43a5)
- Add reasoning effort display in chat assistant responses (31c3785)
- Add reasoning effort details to model performance metrics (58a16fa)
- Display model latency in chat assistant responses (e847670)
- Add task ID display in task card layout (a2d0116)
- Add Serena configuration (fac1083)
- Add summarizer response events (2089de6)

### Changed
- Update MCP configuration and guidelines (72eb193)
- Escape HTML content in taskTrajectoriesRoute (a10358b, 9ae0408, 77a94f2)
- Update MemorySection and FileIOSection with explicit Component typing (930adf7)
- Refactor HtmlPage component to improve markup clarity (5cd0d49)
- Move reloadPage script injection to the component (0ac18fc)
- Update guidelines to include handling truncated tool command outputs (5e536bd)
- Update memory and stats formatting for improved clarity and accuracy (02a0184)
- Align section layouts for consistent height and vertical centering (b5d3ccf)
- Refactor section layouts for consistent design and improved readability (9af11f3)
- Improve layout and padding in stat sections (ee59e56)
- Refactor stats page components for modularity and improve File I/O chart visualization (2872d29)
- Extend file I/O monitoring with base class and worker integration (6578da9)
- Update Chart.js configuration to enhance interactivity (6452e83)
- Fix heap usage percentage calculation to handle division by zero (c31e4ee)
- Optimize incremental data fetching in stats API and enhance logic for period-based filtering (5587b1c)
- Refactor stats page and chart logic for improved data handling and UI updates (75d8a93)
- Integrate enhanced statistics collection and real-time chart updates (f0272f4)
- Refactor `WorkerPool` into modular components for improved management (e4873d2)
- Enhance worker pool metrics, stats logging, and structure (a8f70ab)
- Rename worker metrics for clarity and consistency (88c9560)
- Refactor `WorkerPool` with separate idle and busy worker queues (b91238e)
- Add input/output interfaces for `WorkerPool` and refactor worker message handling (86816ab)
- Add `workerCount` metric to `WorkerPool` and update stats logging (91879c0)
- Handle zero `minConcurrency` and refactor concurrency logic (924360a)
- Add optional `name` property to `WorkerPool` for improved logging and metrics (4c238d3)
- Refactor `WorkerPool` initialization and improve error handling (c9dc7ca)
- Rename WorkerPool metrics for clarity and fix timer type (80dbe99)
- Refactor `WorkerPool` initialization formatting in `Task.ts` (ebf20da)
- Handle `WORKER_STATS` gracefully when set to 0 or fractional values (f3bc220)
- Enable worker stats and track failed executions in `WorkerPool` (a95a7a3)
- Replace `@poolifier/poolifier-web-worker` with a custom `WorkerPool` (2490a04)
- Update `@poolifier/poolifier-web-worker` package (d3ed7d5)
- Allow `AppBody` to forward arbitrary attributes (31733c7)
- Fix search clear button rendering (6626877)
- Add PowerShell-specific example for setting CONCURRENCY in README (8e753ef)
- Set default value for `contentChoices` in LLM response event schema (fff1fab)
- Fix model performance latency/tps buttons (d02efbc)
- Convert task trajectories route to JSX components (3290f04)
- Refactor task events route and integrate JSX components (70a7165)
- Refactor project routes to optimize JSX component usage (2da5ae0)
- Modularize project routes and integrate JSX components (63094ff)
- Refactor components to return JSX (a9c91df)
- Modularize home route components by extracting JSX elements (ae94187)
- Convert components to support JSX and integrate `@kitajs/html` (8db1b2a)
- Add JSX and HTML plugin configuration (8a29123)
- Update import path for `ToggleComponent` (faa4498)
- Improve task card layout and add task ID display (a2d0116)

### Removed
- Remove `/api/stats/test-io` endpoint (dd47079)
- Remove `/api/stats/current` and refactor stats handling for improved efficiency (57e8b6e)
- Remove `busy` property from `WorkerEntry` in `WorkerPool` (4ee5dcd)
- Remove reloading at task level, as tasks now show issue level detail that should be reloaded (ee8872e)
- Remove redundant console log in modelPerformance.ts (53667ea)
- Remove redundant `synthetic_submit` exclusion logic from `AgentActionExecutionFinished` event handling (e847670)
- Remove Serena MCP (cdbc2fa)

## [3.0.0] - 2025-08-12

- Allow `required` field in `McpToolParameters` schema to be nullable (b45f67c)
- Fix in-place reversal of events with shallow copy (68e74e1)
- Suppress output for synthetic_submit action and its response which comes before the initial context (6ec26ab)
- Refactor token visualization and event handling in task events chart (6e4a9b0)
- Add description to model performance dataset and tooltip display (closes #36) (bbabace)
- Persist selected issues in localStorage for compare modal for any selection change (3133536)
- Fix refresh logic (646e9f3)
- Update `llm-latency` references to `model-performance` (0f8feba)
- Remove debug logging from `entityLookupMiddleware` (889e334)
- Remove `notFoundRoutes` and improve routing modularity (82d9ce2)
- Modularize task events API and update routing (2c4571f)
- Modularize task trajectories API and update routing (01e3551)
- Modularize project graph API and refactor `homeRoutes` (52b678b)
- Introduce JetBrains instance and improve modularity (882e133)
- Introduce `JunieExplorer` and modularize server initialization (d6d9bbb)
- Conditionally render download button based on `hasMetrics` (d3103da)
- Update guidelines to handle read-only mode (9390978)
- Ensure `images` presence check includes non-empty arrays (21ca996)
- Handle unprocessed images in tool result events (cd480e9)
- Fix trajectory generation by using response and action outcome events (a799023)
- Fix trajectory generation by using response and action outcome events (985999c)
- Extract `ActionToExecute` schema for reusability and update related types (a0e5d56)
- Enhance table layout and interactivity in project list (3cf8e1c)
- Fix conditional rendering for project selection checkboxes in table (94adc09)
- Add clear search button to project list filter (fcc1acb)
- Increase sort icon size and update project name styling (cad8c06)
- Extract reusable sort icon component and update existing sort visuals (b07942b)
- Add sorting by last updated with persistence and locale support (9b0b3c3)
- Enhance accessibility and sorting visuals in project list (65e49a8)
- Add `lastUpdated` field and enhance issue sorting in `Project` (33d230a)
- Refine table layout and enhance project list styling (fc70f0b)
- Add table-based project list with sorting and enhanced functionality (9b8bc24)
- Revamp Project Metrics chart styling and layout (3da1b84)
- Revamp radio button layout for display options in home routes (e2136a1)
- Make project route links keyboard accessible (3470736)
- Remove representation-related services and update documentation (48afaa6)
- Refactor file path handling and add existence checks in `Issue` and `Project` (e5c07e2)
- Update project details and directory structure in guidelines (61d4ac1)
- Enhance issue description styling and task count visibility in project routes (1622ba8)
- Add conditional rendering for token/sec metrics in model performance (3caa935)
- Update page titles and headers to include consistent project-based naming (1edd521)
- Improve `TaskCard` radio button layout for better styling and readability (8e073e3)
- Rename "Model Time" to "Latency" in task trajectories (b8c2784)
- Rename "LLM Latency" to "Model Performance" across task trajectories (e7c243d)
- Remove redundant breadcrumb labels in task routes (4b7c5cc)
- Update multipart message rendering to support per-part customization (bdbec36)
- Add image modal for full-size image viewing in task trajectories (6370091)
- Refactor `MultiPartChatMessage` schema and update message rendering logic (48e2184)
- Convert `TaskCard` task switcher to use radio buttons (dccb7ca)
- Use radio buttons for `TaskCard` tab navigation (e25af88)
- Remove unused imports and deprecated localStorage theme management (58a7312)
- Move theme selection from local storage to cookies to resolve flash of theme on page load (eee6059)
- Remove `issueRoutes` and migrate relevant logic to `taskEventsRoute` (210c303)
- Update `TaskCard` navigation and button styles (28eee36)
- Change `TaskCard` button rendering order to make Trajectories first (f133933)
- Enhance `TaskCard` with improved title logic and task descriptions (e33562b)
- Update issue links to conditionally include task navigation (0d6ec72)
- Update `TaskCard` task switcher button styles and structure (64740e8)
- Add navigation buttons to `TaskCard` for task switching (305cf58)
- Refactor `TaskCard` to handle asynchronous metrics (62a9a4c)
- Add support for rendering actions in `TaskCard` (710c369)
- Add reusable `TaskCard` component and integrate it into routes (f150ddb)
- Revamp LLM provider filter logic and UI improvements (8d97507)
- Update guidelines for XML tag usage in plans (e91e993)
- Update groupName logic for LLM schema transformation (574704d)
- Conditionally render compare UI elements based on metrics (2e6bd41)
- Add cost metric to Compare Modal charts (bf136cb)
- Update metric button states and improve accessibility in Compare Modal (28e5681)
- Set default active metric to 'time' in Compare Modal (8adee35)
- Change time to mm:ss Compare Modal charts (be5d2ed)
- Exclude checkbox from link in project issues (70429b9)
- Add metric button group and persist issue selections in Compare Modal (ca370d0)
- Extract compare modal logic into a standalone script for reusability (bf867cb)
- Add issue comparison feature with chart visualization (c54ed0b)
- Add issue comparison feature with chart visualization (5c2f0a1)
- Refactor LLM latency chart provider selection logic (640b8c4)
- Refactor LLM latency provider filters and metric toggle UI (09c1c6a)
- Add support for latency and tokens/s toggle in LLM metrics (efdcd16)
- Add `openai-gpt-5` to jbai enum in `AutoSelectedLlm.ts` (11fb4c6)
- Refactor `Issue.ts` and `Task.ts` constructors for initialization consistency (bfbbfec)
- Enable task queue, and disable task stealing in `Task.ts` (2902356)
- Refactor `jetbrains.ts` memory reporting and update `index.ts` server configuration (7bf8de2)
- Update guidelines to reflect XML tag change (efc798d)
- Resolve return statement in `jetbrains.ts` for proper function handling (fb8f02d)
- Add debug logging to `createServer` for reloading details (7fa540f)
- Add conditional token and cost metric display handling (9709381)
- Remove console.log statements for cleaner code (ef72ddd)
- Update README.md title for clarity (7c6ee59)
- Set z-index for task label to ensure proper stacking order (3319ed2)
- Refactor `taskTrajectoriesRoute` tool rendering and enhance UI layout (04c6314)
- Update graph behavior to improve visibility handling (b442c04)
- Refactor LLM schema and event handling logic (9c56335)
- Add `reload` methods and implement dynamic refresh logic (closes #24) (459d6e2)
- Add `GrazieModel1` schema and update LLM handling logic (f80d671)
- Combine provider and model details in LLM response event handling (0f8bc4a)
- Add `isSummarizer` boolean to `AbstractLLM` schema (cd1e861)
- Combine provider and model details in latency computation (e4c1464)
- Refactor tool parameter schema reduction logic (107cec2)
- Refine tool schema and enhance tool rendering in `taskTrajectoriesRoute` (2dd4cd4)
- Enhance tool schema and improve parameter rendering in `taskTrajectoriesRoute` (1063244)
- Add tools content rendering in `taskTrajectoriesRoute` (8e13d7a)
- Update `.junie/guidelines.md` with response format and workflow changes (75479c9)
- Add `mcp.json` configuration for `filesystem-extended` (96c2bfd)
- Improve parameter rendering in `taskTrajectoriesRoute` (68f63ec)
- Add `AutoSelectedLlm` schema and extend LLM feature support (6c74f09)
- Update error type in `loadEvents` worker for JSON parsing failures (ba95bc7)
- Fix parentheses consistency in cost calculation and remove unnecessary null checks (51c6ef6)
- Update padding for collapsible content in `taskTrajectoriesRoute` (4f766f4)
- Set fixed height for LLM latency chart in `taskTrajectoriesRoute` (fe65b90)
- Make metrics charts conditional on at least one metric in all data or at project/task level (ac9d5d3)
- Fix incorrect input parameter handling in `taskTrajectoriesRoute` (09f5b9c)
- Add Chart.js integration and enhance LLM latency chart (9e8743b)
- Remove unnecessary console logs in `taskTrajectoriesRoute` (76cf003)
- Simplify code and update margin, imports, and event handling in `taskTrajectoriesRoute` (dcd89f0)
- Update collapsible section background styling in `taskTrajectoriesRoute` (b0bf1a2)
- Enhance styling and reusability in `taskTrajectoriesRoute` (e815bbf)
- Refactor latency calculation logic for task events (0b6e26d)
- Add tooltip functionality for latency chart (643db01)
- Update latency chart and section label (41928f6)
- Add LLM request latency chart and API endpoint (abdded4)
- Remove unused `ToolUseAnswerDecorator` function (361796d)
- Refactor message rendering logic for improved reusability (0a7d352)
- Restore trajectory toggle functionality with content expansion handling (3c074fc)
- Flatten events to LlmRequestEvent only in `taskTrajectoriesRoute` (5229c5b)
- Update styling and margins in `taskTrajectoriesRoute` (f1ca25e)
- Remove task details filters and merge task trajectories logic into a new `taskTrajectoriesRoute` (0884dd9)
- Remove task step and trajectory-related routes and scripts (7f68d4c)
- Move task trajectories download route to `taskDetailsRoute` (aee2329)
- Move action timeline chart and api endpoint to taskDetailsRoute (c5d735b)
- Refactor action events filtering and mapping in `taskEventsRoute` (7cc807f)
- Adjust margin for LlmRequestEvent and LlmResponseEvent wrappers in `taskDetailsRoute` (e789b08)
- Render task description using Markdown in `taskDetailsRoute` (3b993b2)
- Update `taskDetailsRoute` for improved structure, styling, and clarity (38c8e8a)
- Refactor: Consolidate decorators and improve structure in `taskDetailsRoute` (1c33bbe)
- Refine HTML structure and visual styling in `taskDetailsRoute` (aecf3cc)
- Adjust padding and add section headers in `taskDetailsRoute` (c93b3d7)
- Update API routes and fetch URLs for task event endpoints (138a13e)
- Fetch and render timeline events dynamically on section expand (a7e53e6)
- Fetch and render action events dynamically on timeline expand (53e44b6)
- Add section headers and improve HTML structure in `taskDetailsRoute` (7979719)
- Remove event formatting utilities and associated dependencies (f9781b7)
- Simplify HTML structure in `taskDetailsRoute` (71b471d)
- Refactor: Extract expandable/collapsible SVG icons and cleanup layout (3a6836d)
- Wrap `<pre>` elements with a `<div>` container for improved layout structure (fe09ff3)
- Add toggle UI for expandable/collapsible content in tool and chat decorators (83c691d)
- Refactor schemas and decorators for tool usage handling (edcf985)
- Add `isSummarizer` field and enhance event handling for non-summarizer models (e2c1058)
- Improve error handling when checking for updates fails due to server error (4e5a1ef)
- Remove `TaskDetailFlexGrid` and `TaskDetailRow` components, update event rendering logic (94390a0)
- Refactor event formatting logic and improve maintainability (68df4de)
- Add support for additional message types in `eventFormatters.ts` (63e78b7)
- Add type inference and enhance `LlmRequestFormatter` functionality (8a173f1)
- Add `TaskDetailFlexGrid` and event type filters for improved UI and functionality (132c85c)
- Add `LlmRequestFormatter` to enhance event formatting (9beef72)
- Refactor: Move UI components to `components` directory (0e51cda)
- Add `createEventFormatter` to enhance event formatting in task details (0754863)
- Extract task detail row rendering into a reusable function (9554ccb)
- Add event type filters to task details route (6dd7f9e)
- Refactor task details route for improved maintainability and performance (18aff58)
- Add task details route and integrate route into application (12bad27)
- Upgrade to Zod v4 and refactor schemas for improved maintainability (1afd86c)
- Add new schemas and refactor `inputParams` handling for enhanced flexibility (670c2c9)
- Remove `eventSchema.ts` file (47d77a0)
- Make `toolId` nullable in `AIToolUseAnswerChoice` schema (90b7a19)
- Refactor schema definitions to use `.looseObject` for improved clarity and maintainability (7a7cbad)
- Refactor `eventSchema.ts` and modularize schema definitions (8fa355c)
- Upgrade to Zod v4 and refactor schemas for improved maintainability (cca228f)
- Refactor `eventSchema.ts` to extend Matterhorn-specific LLM support (5eb5b4d)
- Refactor `eventSchema.ts` to support additional LLM models and dynamic response handling (54ab21b)
- Update error logging in `loadEvents.ts` (5fd8dd5)
- Update JetBrains log path resolution for macOS (closes #35) (19d8bdc)

## [2.6.2] - 2025-08-04

### Bug Fixes
- Fix for log format changes in Junie 252.264.5 (29d7a3c)
- Handle missing step directory in Task.ts (7001084)

## [2.6.1] - 2025-07-30

### Code Improvements
- Rename MAX_WORKERS to CONCURRENCY, disable worker usage when CONCURRENCY is 0 (0e6f568)
- Refactor promise initialization and improve event handling logic (41921fa)
- Refactor event loading logic and improve worker pool handling (74f85e4)

### Build System
- Ignore version.txt from version control (7e47da9)

## [2.6.0] - 2025-07-29

### Features
- Add theme switcher functionality and integrate across routes (11f96b7)
- Add support for additional themes and improve theme management (235c8a8)
- Add hover-based theme preview support to theme switcher (0c389e0)

### UI Improvements
- Expand theme dropdown layout for better accessibility (c4652f9)
- Update color classes for theme consistency across routes (ba023dc)
- Refactor theme switcher to improve scalability and reduce redundancy (b4fecb1)
- Update background and table styles for improved consistency (955f22c)
- Update table structure and button positioning in `taskStepsRoute.ts` (7ed5b27)
- Update table and header classes for improved consistency and styling (0dc5b91)
- Update task step container background colors for improved clarity (ed2c4ee)
- Update role-based background colors and task description styling (5a445cd)
- Update table class in `taskEventsRoute.ts` for improved styling consistency (66d7a87)
- Update task description styles for consistency across routes (d5f9805)
- Refactor status badge rendering across routes (ef45f20)
- Update button styles and remove unused `.btn-secondary` CSS (c628116)
- Introduce reusable Breadcrumb component and improve styles across routes (f9939d6)
- Update table class styles and refine `prose` CSS definitions (426b043)
- Update button styling and add role-based row background colors (124a1d6)
- Update table layouts and improve row styling (beeb274)
- Update table layouts and improve toggle button styling (3b3a983)
- Update buttons and improve content expansion styling (9b22f07)
- Refactored trajectories and steps routes to use Tailwind and DaisyUI (1910125)
- Hide expand/collapse button when the content doesn't overflow the permitted height (c62c13f)
- Introduce reusable toggle component and improve styling consistency (39db634)
- Update max-width styling (86b94a3)
- Refactor task events UI and improve styling consistency (dd67ff9)
- Refactor issue details UI and improve styling consistency (3b96855)
- Refactor project issues table and enhance UI/UX consistency (d7c867c)
- Enhance UI consistency in IDE filter toolbar (906af64)
- Improve project list handling and input styles (0a6b9a4)
- Refine checkbox and radio inputs for consistent sizing (bcc781c)
- Enhance UI/UX and code consistency with Tailwind CSS utilities (39a3a73)

### Code Improvements
- Update `taskRawData.js` to use class-based visibility toggling (67d0f90)
- Improve `Task.ts` lazy-loading and caching behavior (431f39c)
- Remove `app.css` file from VCS (7f47e7d)
- Refactor trajectory row rendering for maintainability (b456c76)
- Add TypeScript compiler settings to project configuration (6ce66b1)
- Add source exclusions to input.css for improved file handling (5703d0d)
- Use utility function for reload button rendering in `homeRoutes.ts` (0bb180d)
- Make reload button asynchronous with improved UX (1e9e4ac)
- Revert poolifier-web-worker workaround due to upstream fix (8a6c867)

### Documentation
- Refine development guidelines with updated steps and exclusions (76f9078)

### Dependencies
- Add Tailwind CSS to the project for utility-first styling (b4e5e08)

## [2.5.1] - 2025-07-28

### Features
- Add version checking and update mechanism (b050829)
- Add version banner with link to latest release (6b1ba70)
- Add version banner across all routes (096f200)
- Add content toggle buttons for trajectory rows in taskTrajectoriesRoute (4d2ec81)
- Add SVG icons for content toggle buttons in taskTrajectoriesRoute (35967c8)
- Dynamically display issue count in project summary header (be1c031)

### UI Improvements
- Make issue rows clickable and enhance UI for improved usability (b7da9bf)
- Refactor content toggle functionality and improve UX (8b52292)

### Code Improvements
- Refactor build script and worker thread handling, update path aliasing (b34d728)
- Fix tasks 'Raw Json' button, remove custom `toJSON` and `[inspect.custom]` implementations for cleaner codebase (9fc4ddc)
- Update version interface and refactor version banner rendering (closes #27) (86bc52d)
- Refactor version banner rendering (9cb6357)

### Documentation
- Update `.junie/guidelines.md` with revised tech stack and expanded functionality details (3f82e1a)
- Update `.junie/guidelines.md` with expanded class and schema documentation (d8e272b)
- Update project structure documentation and directory layout (a2265f6)
- Reorganize and simplify development guidelines (c6f3da1)
- Reorder and refine guideline steps for resolving `<issue_description>` (4bcc24d)
- Update guidelines for resolving `<issue_description>` (8022fc0)
- Update README.md to reflect changes in project description and features (f2f085c)

## [2.5.0] - 2025-07-26

### Features
- Introduce worker pool for parallel event loading (d24ac3b)
- Add `@types/bun` dependency for improved type support (ed096e4)

### Performance Improvements
- Make events handling fully asynchronous (6df6ede)
- Make task metrics fully asynchronous (e0e8a07)
- Optimize metrics aggregation logic (991caef)
- Make issues and metrics retrieval fully asynchronous (89eae86, 2414377)
- Make project issues and metrics asynchronous (0329bdc)
- Make project and metrics management asynchronous (0d35b19)
- Make `createServer` asynchronous (7d34b7b)
- Lazy-load and optimize `_issues` handling in `Project` class (c544231)
- Refactor metrics and events handling in `Task` class (f349915)
- Refactor and optimize event loading and parsing (5d10d77)
- Deduplicate and sort event types retrieval (d512661)

### UI Improvements
- Fix date/time formatting to use browser locale (8a63d7b)
- Refactor project issues table styling and structure (3f96065)
- Update project summary and styling for issue table improvements (d175711)
- Enhance issues table with timestamp and improved styling (0387a77)
- Streamline project issues into a single table (f2ca670)

### Code Improvements
- Remove commented-out debug statement and enhance documentation (513af32)
- Log resolved paths for debugging purposes in `Project` class (43924a8)
- Remove commented-out debug logs in `Issue` and `Task` classes (2b24c5e)
- Comment out debug logs and refactor event parsing logic (62f8082)
- Fix task metrics reference in `issueRoutes.ts` (11ef54b)
- Remove unused memory usage logging in `preload` (3272b85)

### Documentation
- Update `.junie/guidelines.md` to include new workflow instructions (05e7212)
- Update `.junie/guidelines.md` to reflect transition to Bun for local development (158b805)

### Bug Fixes
- Fix rebase on main (4b5aae4)

## [2.4.3] - 2025-07-24

### Bug Fixes
- Fix validation error on null agentState (4f50811)

### Code Improvements
- Allow `.passthrough()` on all schemas for flexible property handling (5236726)

### Documentation
- Update README.md formatting and add memory reporting documentation (6351b07)

## [2.4.2] - 2025-07-24

### Features
- Add the MEMORY_REPORT environment variable to print memory usage after each reload (0675490)

### Code Improvements
- Add `bun install` to `dev` and `build` scripts in `package.json` (ca52886)
- Update error event structure for unparsed JSON lines (ec43338)
- Remove `escapeHtml` from issue label in `projectRoutes.ts` (8a3346d)

## [2.4.1] - 2025-07-23

### Code Improvements
- Refactor server initialization into `createServer.ts` (8504e30)
- Relax type constraint for `inputParams.value` in `eventSchema` (e88cc14)

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
