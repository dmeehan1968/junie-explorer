[2025-12-02 14:01] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Playwright tests failed due to unrelated suite matching",
    "ROOT CAUSE": "Using --grep \"context\" matched a processedEvents test that failed, unrelated to the change.",
    "PROJECT NOTE": "Prefer targeting specific test titles or files (e.g., ContextSizeChart or file path) instead of broad keywords like \"context\" which match processedEvents tests.",
    "NEW INSTRUCTION": "WHEN running Playwright with --grep THEN use exact test titles or file-specific patterns"
}

[2025-12-02 14:07] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Tests failed; log truncated hides failing details",
    "ROOT CAUSE": "Using head/tail truncated Playwright output so the actual failing tests and errors are missing.",
    "PROJECT NOTE": "Run `bunx playwright test --reporter=list` and/or `bunx playwright show-report` to inspect full failures; avoid piping to head/tail.",
    "NEW INSTRUCTION": "WHEN running tests with long output THEN capture full logs to a file and avoid truncation"
}

[2025-12-02 14:08] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Playwright tests exit 1 from server crash in isResponseEvent",
    "ROOT CAUSE": "isResponseEvent accesses event.type without null/object guard, throwing on null values.",
    "PROJECT NOTE": "Mirror the null-and-key guard used in isRequestEvent for isResponseEvent; JSON.stringify replacers can pass null values in eventsTable.tsx.",
    "NEW INSTRUCTION": "WHEN checking event.type in type guards THEN first ensure non-null object and 'type' in event"
}

[2025-12-02 14:15] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "TypeError in isRequestEvent on null input",
    "ROOT CAUSE": "isRequestEvent uses 'type' in event without guarding against null objects.",
    "PROJECT NOTE": "Fix src/schema/llmRequestEvent.ts by adding `event === null || typeof event !== 'object'` guard before checking 'type'.",
    "NEW INSTRUCTION": "WHEN calling isRequestEvent with unknown input THEN ensure null-and-object guard before 'type' check"
}

[2025-12-02 14:27] - Updated by Junie - Error analysis
{
    "TYPE": "logic bug",
    "TOOL": "-",
    "ERROR": "JSON replacer doesn't remove previousRequest field",
    "ROOT CAUSE": "eventsTable.tsx strips previousEvent instead of previousRequest, leaving circular refs via requestEvent/previousRequest chain.",
    "PROJECT NOTE": "Update src/components/eventsTable.tsx replacer to delete response.requestEvent and request.previousRequest before stringify.",
    "NEW INSTRUCTION": "WHEN creating JSON replacer for events THEN remove requestEvent and previousRequest properties"
}

[2025-12-02 14:40] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "get_file_structure",
    "ERROR": "Could not display file structure for TSX file",
    "ROOT CAUSE": "The file-structure tool doesn't support or failed to parse TSX content.",
    "PROJECT NOTE": "For src/components/*.tsx files, use open_entire_file to inspect component code.",
    "NEW INSTRUCTION": "WHEN get_file_structure returns unsupported or parsing failed THEN open_entire_file for the same path"
}

[2025-12-02 14:43] - Updated by Junie - Error analysis
{
    "TYPE": "env/setup",
    "TOOL": "bash",
    "ERROR": "Server curl produced no response/output",
    "ROOT CAUSE": "Server was backgrounded without readiness check; curl ran before server was ready.",
    "PROJECT NOTE": "The app listens on port 3000 via `bun src/index.ts`. Ensure the server is accepting connections before hitting `/api/...` endpoints.",
    "NEW INSTRUCTION": "WHEN launching server to query APIs THEN wait for ready log or retry until 200"
}

[2025-12-03 11:20] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Test expected hidden true but got undefined",
    "ROOT CAUSE": "Cumulative Cost dataset lacks a hidden property in prepareLlmEventGraphData.tsx.",
    "PROJECT NOTE": "Add `hidden: true` to the 'Cumulative Cost' dataset in src/utils/prepareLlmEventGraphData.tsx alongside its other properties.",
    "NEW INSTRUCTION": "WHEN changing default series visibility THEN set the hidden flag in dataset definitions"
}

[2025-12-03 11:36] - Updated by Junie - Error analysis
{
    "TYPE": "logic bug",
    "TOOL": "-",
    "ERROR": "Toggle preserves hidden flags, hiding all token series",
    "ROOT CAUSE": "updateDatasetVisibility keeps original hidden state for tokens, which are default hidden, instead of only keeping cumulative hidden.",
    "PROJECT NOTE": "In src/utils/prepareLlmEventGraphData.tsx, remove hidden: true from non-cumulative token datasets; in public/js/taskEventLlmChart.js, only persist hidden for cumulative datasets when toggling.",
    "NEW INSTRUCTION": "WHEN toggling metric type THEN show selected-group datasets and keep only cumulative hidden"
}

[2025-12-03 13:41] - Updated by Junie - Error analysis
{
    "TYPE": "invalid args",
    "TOOL": "open",
    "ERROR": "Path not found; opened unintended file instead",
    "ROOT CAUSE": "An incorrect file path (public/js/projectSelection.js) was requested that doesn't exist in the repo.",
    "PROJECT NOTE": "Frontend files are primarily under src/components; verify paths before opening and prefer searching for filenames first.",
    "NEW INSTRUCTION": "WHEN open reports path not found THEN search repo for filename and open the found path"
}

[2025-12-06 09:41] - Updated by Junie - Error analysis
{
    "TYPE": "env/setup",
    "TOOL": "bash",
    "ERROR": "bun install ran outside repo; package.json not found",
    "ROOT CAUSE": "The command was executed from the home directory instead of the repository root.",
    "PROJECT NOTE": "Run release commands from the repo root (junie-explorer) so package.json is visible.",
    "NEW INSTRUCTION": "WHEN package manager reports no package.json THEN cd to repository root and rerun the command"
}

[2025-12-06 10:56] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "TypeScript errors in trajectoriesView.tsx during tsc --noEmit",
    "ROOT CAUSE": "Global type-checking surfaced unrelated TS issues outside the TaskCard test scope.",
    "PROJECT NOTE": "In src/components/trajectoriesView.tsx: current.event.answer is typed unknown (needs guard/cast) and getLabelMarkupFor returns Element where a string label is expected by toolCallDecorator; fix separately.",
    "NEW INSTRUCTION": "WHEN task scope is tests-only THEN skip global tsc and run Playwright tests only"
}

[2025-12-06 17:24] - Updated by Junie - Error analysis
{
    "TYPE": "invalid args",
    "TOOL": "open_entire_file",
    "ERROR": "File not found at path",
    "ROOT CAUSE": "Tried to open a non-existent API file without verifying its presence or location.",
    "PROJECT NOTE": "Events API routes live under src/app/api/events and are wired in index.ts (currently timeline and download). Add new routes there and verify filenames before opening.",
    "NEW INSTRUCTION": "WHEN open_entire_file returns path does not exist THEN list directory and open an existing candidate"
}

[2025-12-10 11:34] - Updated by Junie - Error analysis
{
    "TYPE": "invalid args",
    "TOOL": "bash",
    "ERROR": "bun test --grep didn't match any test files",
    "ROOT CAUSE": "Used a grep pattern that Bun interpreted as no-matching test files, so nothing ran.",
    "PROJECT NOTE": "Target tests by file path (e.g., src/app/api/search.test.ts) or ensure --grep matches describe/test titles.",
    "NEW INSTRUCTION": "WHEN bun test outputs 'did not match any test files' THEN run the specific test file path"
}

[2025-12-10 15:29] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "TypeScript errors persist in trajectoriesView.tsx",
    "ROOT CAUSE": "A JSX Element is passed to a prop typed as string, and event.answer remains unknown without a proper type guard.",
    "PROJECT NOTE": "Update src/components/toolCallDecorator.tsx to allow label: string | JSX.Element, and in src/components/trajectoriesView.tsx use isResponseEvent(current.event) to narrow before accessing answer.time.",
    "NEW INSTRUCTION": "WHEN passing JSX to ToolCallDecorator label THEN change label type to string | JSX.Element"
}

[2025-12-11 19:34] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Unknown LLM format for openai-gpt-5-2",
    "ROOT CAUSE": "The new OpenAI52 model wasn't added to the LLM union and transformer, causing parse failure.",
    "PROJECT NOTE": "Add OpenAI52 to src/schema/LLM.ts union, src/schema/LLMTransformer.ts routing, and src/Task.ts isGpt5ResponseEvent.",
    "NEW INSTRUCTION": "WHEN adding a new LLM schema THEN register it in LLM union and LLMTransformer"
}

[2025-12-12 09:24] - Updated by Junie - Error analysis
{
    "TYPE": "logic bug",
    "TOOL": "-",
    "ERROR": "createServer still reads PORT from process.env",
    "ROOT CAUSE": "createServer defaults are sourced from process.env instead of explicit options-only defaults.",
    "PROJECT NOTE": "In src/createServer.ts, remove process.env.PORT and process.env.JETBRAINS_LOG_PATH usage; default port to 3000 and pass JetBrains logPath via options.",
    "NEW INSTRUCTION": "WHEN createServer is called without port option THEN default to 3000 and ignore process.env"
}

[2025-12-12 10:18] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "Expected 200; API returned non-200 for PUT route",
    "ROOT CAUSE": "The new issues API route is not registered in the server, so the request 404s.",
    "PROJECT NOTE": "Add `app.use(apiIssues)` in src/app/junieExplorer.ts alongside existing api routes (apiSearch, apiStats) so /api/issues/:issueId/description is handled.",
    "NEW INSTRUCTION": "WHEN adding a new API router THEN register it in junieExplorer with app.use"
}

[2025-12-12 11:24] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "Module './IssueDescriptionStore' not found by tests",
    "ROOT CAUSE": "The test imports IssueDescriptionStore but the implementation file has not been created.",
    "PROJECT NOTE": "Add src/services/IssueDescriptionStore.ts so imports from src/services/IssueDescriptionStore.test.ts resolve.",
    "NEW INSTRUCTION": "WHEN bun test shows 'Cannot find module' for IssueDescriptionStore THEN create src/services/IssueDescriptionStore.ts with required API"
}

[2025-12-12 12:01] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "issueDescriptionStore property is undefined on JetBrains",
    "ROOT CAUSE": "JetBrains class lacks an issueDescriptionStore member and constructor initialization.",
    "PROJECT NOTE": "Add import for IssueDescriptionStore in src/jetbrains.ts and initialize this.issueDescriptionStore using existing home directory logic (e.g., os.homedir or current logPath/home derivation).",
    "NEW INSTRUCTION": "WHEN jetBrains.issueDescriptionStore is undefined in tests THEN add and initialize property in JetBrains constructor"
}

[2025-12-12 12:13] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "New tests failed; removal on original name not implemented",
    "ROOT CAUSE": "IssueDescriptionStore.setDescription lacks logic to accept originalName and delete when equal.",
    "PROJECT NOTE": "Update setDescription(issueId, description, originalName?) to trim and delete when description is empty or equals originalName; adjust API/router later to pass Issue.name.",
    "NEW INSTRUCTION": "WHEN setDescription receives originalName and trimmed equals originalName THEN delete the stored description"
}

[2025-12-14 11:48] - Updated by Junie - Error analysis
{
    "TYPE": "invalid args",
    "TOOL": "bash",
    "ERROR": "Multi-line bash command rejected; newlines are prohibited",
    "ROOT CAUSE": "The bash tool forbids newline-separated commands and requires a single-line grouped command.",
    "PROJECT NOTE": "When manually starting the app (bun src/index.ts on port 3000), issue a single-line grouped command and wait for readiness if querying endpoints.",
    "NEW INSTRUCTION": "WHEN executing multiple shell steps THEN chain with && or use a subshell without newlines"
}

[2025-12-18 09:15] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "Issue.fromLogPath/fromVirtual is not a function",
    "ROOT CAUSE": "Tests were added for new factory methods before implementing them in Issue.ts.",
    "PROJECT NOTE": "Implement static fromLogPath and fromVirtual in src/Issue.ts, make the constructor private, and update usages in src/Project.ts and existing tests.",
    "NEW INSTRUCTION": "WHEN bun test fails: Issue.fromLogPath is not a function THEN implement fromLogPath and fromVirtual in src/Issue.ts"
}

[2025-12-18 11:56] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Chain file JSON violated JunieChainSchema; Issue parse threw",
    "ROOT CAUSE": "The test wrote a minimal chain-*.json missing required fields expected by JunieChainSchema.",
    "PROJECT NOTE": "Chain files in issues/ must validate against src/schema JunieChainSchema; create fixtures that conform or reuse real samples.",
    "NEW INSTRUCTION": "WHEN creating chain-*.json fixtures in tests THEN generate data conforming to JunieChainSchema"
}

[2025-12-18 11:57] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "AIA task discovery test failed; issue key mismatch",
    "ROOT CAUSE": "AIA tasks use task.id (e.g., \"uuid 0\") instead of bare UUID from filename, so issues map keys don't match expected UUID.",
    "PROJECT NOTE": "Task.id may include an attempt suffix (e.g., \"<uuid> 0\"); prefer the UUID extracted via regex for identifiers when discovering tasks.",
    "NEW INSTRUCTION": "WHEN building AIA task identifiers from events THEN key issues by regex-extracted UUID, not task.id"
}

[2025-12-18 12:16] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "Cannot find module './ChainIssueDiscoveryService'",
    "ROOT CAUSE": "The test references ChainIssueDiscoveryService but the implementation file was not created/exported.",
    "PROJECT NOTE": "Add src/services/ChainIssueDiscoveryService.ts exporting class ChainIssueDiscoveryService that implements IssueDiscoveryService.discover.",
    "NEW INSTRUCTION": "WHEN tests import a non-existent service file THEN create the implementation exporting the expected class"
}

[2025-12-18 12:37] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "Issue.fromChainFile is undefined; factory methods not implemented",
    "ROOT CAUSE": "A new test asserts factory constructors, but Issue.ts lacks fromChainFile/fromAia implementations.",
    "PROJECT NOTE": "Implement static factories in src/Issue.ts as fromChainFile(logPath) and fromAia(id, created, task), aligning with the refactor to an abstract Issue and concrete AIA/Chain classes.",
    "NEW INSTRUCTION": "WHEN tests reference Issue.fromChainFile or Issue.fromAia THEN implement these static factories in src/Issue.ts"
}

[2025-12-18 12:48] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Playwright test failed on unmerge icon mismatch",
    "ROOT CAUSE": "The test expects a different unmerge icon/attributes than the implementation currently uses.",
    "PROJECT NOTE": "IssueRow uses public/icons/split-turn-down-right-svgrepo-com.svg for the unmerge button; update the Playwright assertion in src/components/issueRow.pw.ts to this asset and current aria/alt attributes.",
    "NEW INSTRUCTION": "WHEN Playwright test fails on icon filename mismatch THEN update expectations to current public/icons asset and attributes"
}

[2025-12-18 12:55] - Updated by Junie - Error analysis
{
    "TYPE": "missing implementation",
    "TOOL": "bash",
    "ERROR": "Export 'ChainTask' not found in Task.ts",
    "ROOT CAUSE": "Tests import ChainTask and AiaTask but Task.ts does not export them yet.",
    "PROJECT NOTE": "src/Task.ts currently exports only Task; add abstract/base and concrete classes (AIA/Chain) and export them with static factories fromAiaTask/fromJunieTask.",
    "NEW INSTRUCTION": "WHEN bash shows \"Export named 'ChainTask' not found\" THEN export ChainTask, AiaTask, and factories in Task.ts"
}

[2025-12-18 13:21] - Updated by Junie - Error analysis
{
    "TYPE": "logic bug",
    "TOOL": "-",
    "ERROR": "Circular import causes 'Task' before initialization",
    "ROOT CAUSE": "Task.ts imports AiaTask/ChainTask while those import Task, creating a module cycle that breaks class initialization order.",
    "PROJECT NOTE": "In src/Task.ts, remove top-level imports of ./AiaTask and ./ChainTask. Move factory logic (fromAiaTask/fromJunieTask) to a separate module (e.g., src/TaskFactories.ts) or use dynamic imports inside factories to break the cycle.",
    "NEW INSTRUCTION": "WHEN circular import between Task and subclasses THEN move factories to a separate module"
}

[2025-12-18 13:22] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "ENOENT: dummy/path file not found during test",
    "ROOT CAUSE": "The test passed a non-existent path to fromJunieTask, which synchronously reads the file.",
    "PROJECT NOTE": "Task.fromJunieTask reads a chain file from disk; use a real fixture under issues/ conforming to JunieChainSchema or mock fs.",
    "NEW INSTRUCTION": "WHEN tests call fromJunieTask with a path THEN create a valid temp file or mock fs to avoid ENOENT"
}

[2026-01-30 20:29] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Dev process terminated by SIGTERM during restart",
    "ROOT CAUSE": "pkill killed the running dev server, producing SIGTERM messages before the new server started.",
    "PROJECT NOTE": "Setting JETBRAINS_CACHE_PATH has no effect; the app uses JetBrains({ logPath }) via server options. Start the server with the fixtures path passed into createServer/JetBrains, not via env.",
    "NEW INSTRUCTION": "WHEN server logs show SIGTERM after pkill THEN start server anew and wait for readiness before curl"
}

[2026-01-31 18:41] - Updated by Junie - Error analysis
{
    "TYPE": "invalid args",
    "TOOL": "agent_skill_read_doc",
    "ERROR": "Skill 'release-version' not found; documentation path null",
    "ROOT CAUSE": "The agent requested documentation for a skill name that is not registered.",
    "PROJECT NOTE": "Skills are project-registered; list available skills in this repo before selecting one.",
    "NEW INSTRUCTION": "WHEN agent_skill_read_doc reports skill not found THEN list available skills and choose a valid name"
}

[2026-02-05 17:48] - Updated by Junie - Error analysis
{
    "TYPE": "env/setup",
    "TOOL": "bash",
    "ERROR": "Connection refused when curling port 4445",
    "ROOT CAUSE": "The server was not listening on port 4445; dev start ignored PORT and/or wasn’t ready.",
    "PROJECT NOTE": "The app typically listens on port 3000 via `bun src/index.ts`; PORT env may be ignored. Use port 3000 and wait for readiness before hitting /api endpoints.",
    "NEW INSTRUCTION": "WHEN curl to custom port returns connection refused THEN use port 3000 and wait for readiness"
}

[2026-02-05 18:06] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Download API tests failed (2 failing assertions)",
    "ROOT CAUSE": "Only the events download route was updated; the trajectories download route still lacks aligned params/wildcard/mergeParams, so encoded issueId paths don’t match middleware and return 404.",
    "PROJECT NOTE": "Ensure both events and trajectories download routers use :projectId (not :projectName), include '/task/:taskId*' in middleware paths, and initialize routers with { mergeParams: true }.",
    "NEW INSTRUCTION": "WHEN adding or fixing /task/:taskId download routes THEN align params with entityLookupMiddleware and add '*' and mergeParams"
}

[2026-02-05 18:11] - Updated by Junie - Error analysis
{
    "TYPE": "logic bug",
    "TOOL": "-",
    "ERROR": "AiaTask download URL uses issueId with attempt suffix",
    "ROOT CAUSE": "The frontend builds the download href with issue.id that includes a space + attempt (e.g., \"<uuid> 0\"), producing a %20 in the path and mismatching backend lookup/file resolution.",
    "PROJECT NOTE": "In src/app/web/taskTrajectoriesRoute.tsx (TaskCard actionsHtml), do not use issue.id directly for URLs on AIA tasks; extract the bare UUID (e.g., via regex) before encodeURIComponent.",
    "NEW INSTRUCTION": "WHEN issue.id matches '<uuid> <number>' THEN use only the UUID part in URL params"
}

[2026-02-05 18:13] - Updated by Junie - Error analysis
{
    "TYPE": "logic bug",
    "TOOL": "-",
    "ERROR": "AiaTask URL uses issue.id with attempt suffix",
    "ROOT CAUSE": "AIA tasks have issue.id like '<uuid> <attempt>' so encodeURIComponent(issue.id) inserts %20 and backend lookup/file path mismatches.",
    "PROJECT NOTE": "Fix download link in src/app/web/taskTrajectoriesRoute.tsx (TaskCard actionsHtml): derive a bare UUID for AIA issues (e.g., issue.id.match(/^[0-9a-f-]{36}/)?.[0]) instead of using issue.id directly.",
    "NEW INSTRUCTION": "WHEN issue.id contains space and trailing attempt THEN use only the UUID part in URLs"
}

[2026-02-07 18:27] - Updated by Junie - Error analysis
{
    "TYPE": "env/setup",
    "TOOL": "bash",
    "ERROR": "Playwright run was killed by SIGKILL",
    "ROOT CAUSE": "Launching Playwright browsers exceeded environment resource limits, triggering a forced kill.",
    "PROJECT NOTE": "When running Playwright locally/CI, limit workers and narrow scope to a file or test title to reduce resource usage.",
    "NEW INSTRUCTION": "WHEN invoking Playwright via bash THEN add --workers=1 and run a single test file"
}

[2026-02-07 18:28] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Used Bun test runner for Playwright tests",
    "ROOT CAUSE": "The test file was executed with `bun test`, which conflicts with Playwright's test runner and caused a suite initialization error.",
    "PROJECT NOTE": "Playwright E2E tests in this repo run via `bunx playwright test` (files often end with .pw.ts); Bun's test runner is for unit tests only.",
    "NEW INSTRUCTION": "WHEN running a .pw.ts Playwright file THEN use bunx playwright test --workers=1 <file>"
}

[2026-02-07 19:03] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Playwright test failed: no issue rows found",
    "ROOT CAUSE": "The new test assumes rows exist immediately after navigation without awaiting table render.",
    "PROJECT NOTE": "Issues table renders asynchronously; after navigateToProject('default.999999'), wait for 'tr[data-issue-id]' to appear before querying rows.",
    "NEW INSTRUCTION": "WHEN reading issuesTable rows in tests THEN wait for 'tr[data-issue-id]' to be visible first"
}

[2026-02-07 19:05] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Bun test script exited 1 though Playwright passed",
    "ROOT CAUSE": "Using the repo's \"bun run test\" wrapper returned a non-zero code despite 7 passed, likely due to the wrapper/webserver lifecycle rather than test failures.",
    "PROJECT NOTE": "Playwright E2E (.pw.ts) should be run via `bunx playwright test` directly; the test wrapper may return non-zero due to its server process handling.",
    "NEW INSTRUCTION": "WHEN Playwright shows all tests passed but wrapper exits 1 THEN run bunx playwright test directly"
}

