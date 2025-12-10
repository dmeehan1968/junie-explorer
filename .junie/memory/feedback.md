[2025-12-01 17:51] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "code search",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN user asks usage of an identifier THEN Search repository for identifier references and summarize contexts, modules, and usage patterns"
}

[2025-12-02 14:12] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "tests analysis",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN task requests investigating failing tests THEN run tests, analyze failures, map to recent changes, report findings, no code changes"
}

[2025-12-02 14:27] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "events serialization",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN serializing or rendering event objects THEN omit requestEvent and previousRequest to avoid cycles"
}

[2025-12-02 14:46] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "events serialization",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN preparing event objects for API or JSON viewer THEN delete requestEvent and previousRequest before serializing or rendering"
}

[2025-12-02 17:34] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "charts metrics",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN preparing chart datasets THEN add cumulative cost and cumulative tokens datasets"
}

[2025-12-03 09:08] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "charts metrics",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN calculating cumulative tokens dataset THEN sum inputTokens, outputTokens, cacheCreateInputTokens only"
}

[2025-12-03 11:34] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "charts metrics",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN cost/token view toggle is clicked THEN preserve dataset hidden states; do not auto-enable Cumulative Cost dataset"
}

[2025-12-03 11:36] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "charts metrics",
    "ERROR": "Toggle hides all series",
    "NEW INSTRUCTION": "WHEN cost/token view toggle is clicked THEN keep non-cumulative datasets visible and cumulative hidden"
}

[2025-12-03 13:05] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "charts metrics",
    "ERROR": "Toggle mislabeled; selected-project filter ignored; series split by project+model",
    "NEW INSTRUCTION": "WHEN view option equals model THEN aggregate by model across selected projects; do not include project in series"
}

[2025-12-03 13:18] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "charts interaction",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN view-option changes or project selection changes THEN refetch graph with breakdown and rebuild chart datasets"
}

[2025-12-03 18:36] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "UI layout",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN implementing TaskCard tabs THEN render connected tabs as a top-attached card header, not inside body"
}

[2025-12-03 18:40] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "UI styling",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN rendering TaskCard tabs THEN increase tab text size and match card rounded gray border"
}

[2025-12-03 18:42] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "UI styling",
    "ERROR": "Tabs small text and mismatched border",
    "NEW INSTRUCTION": "WHEN rendering TaskCard tabs THEN increase tab text size and apply rounded gray card border"
}

[2025-12-03 19:20] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "UI layout",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN updating TaskCard UI THEN use DaisyUI top-attached tabs and 200px description with ToggleComponent expand/collapse"
}

[2025-12-03 19:32] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "UI styling",
    "ERROR": "Tabs share full-width container; no distinct active/inactive styles",
    "NEW INSTRUCTION": "WHEN rendering TaskCard tabs THEN render individually bordered tabs with distinct active/inactive backgrounds"
}

[2025-12-03 19:33] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "UI styling",
    "ERROR": "Tabs merged; expand/collapse icon not visible",
    "NEW INSTRUCTION": "WHEN rendering TaskCard description THEN position ToggleComponent top-right overlay above content"
}

[2025-12-03 19:38] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "UI styling",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN rendering TaskCard tabs THEN apply rounded corners and card border; remove bottom border for active tabs"
}

[2025-12-03 19:39] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "UI styling",
    "ERROR": "Tabs lack card-matching borders; active tabs still show bottom border",
    "NEW INSTRUCTION": "WHEN rendering TaskCard tabs THEN Apply rounded corners and matching card borders; remove bottom border on active tabs"
}

[2025-12-05 15:24] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "error handling",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN handling errors in loadEvents THEN propagate EventParserErrors-like details to caller, not only console.log"
}

[2025-12-05 15:38] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "error handling",
    "ERROR": "Mixed success/error return and missing propagation while logging required",
    "NEW INSTRUCTION": "WHEN errors occur in Task.loadEvents THEN log error, propagate EventParserErrors-like details, do not return events with errors"
}

[2025-12-05 16:15] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "schema validation",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN safeParse throws in loadEvents THEN audit schema refinements/transforms for thrown errors and replace with ctx.addIssue"
}

[2025-12-05 16:33] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "tests fixing",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN task requests running tests and fixing errors THEN run tests, fix failures, rerun, summarize changes"
}

[2025-12-06 10:41] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "UI toggle",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN Show All Diffs toggle is enabled THEN skip slice(0, -rewind) in getMessageDiffs"
}

[2025-12-06 10:55] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "tests update",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN task requests updating tests to match implementation THEN modify tests to reflect current behavior, avoid code changes"
}

[2025-12-06 16:23] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "charts metrics",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN view option equals agent type THEN aggregate datasets by agent type across selected projects; exclude project from series"
}

[2025-12-06 16:43] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "charts rendering",
    "ERROR": "TPS uses bar chart",
    "NEW INSTRUCTION": "WHEN display option equals tps THEN render TPS datasets as line series"
}

[2025-12-06 17:23] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "data flow",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN user asks server-to-client data flow THEN Trace handlers and client consumption; summarize endpoints, payload shape, and props."
}

[2025-12-06 17:52] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "performance analysis",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN user asks to improve loadEvents performance THEN profile loadEvents, report bottlenecks, propose targeted optimizations"
}

[2025-12-06 17:58] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "file streaming",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN implementing loadEvents file reading THEN use readline with createReadStream to parse and validate lines incrementally"
}

[2025-12-06 18:06] - Updated by Junie
{
    "TYPE": "new instructions",
    "CATEGORY": "performance optimization",
    "ERROR": "-",
    "NEW INSTRUCTION": "WHEN task requests implementing improvements 5 and 6 THEN use single-pass parsing in loadEvents and map-based matching in Task.loadEvents"
}

[2025-12-10 15:15] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "UI styling",
    "EXPECTATION": "The Search button should look visually different when disabled.",
    "NEW INSTRUCTION": "WHEN Search button is disabled THEN add disabled attribute and btn-disabled class"
}

