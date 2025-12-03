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

