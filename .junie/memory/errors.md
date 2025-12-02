[2025-12-02 14:01] - Updated by Junie - Error analysis
{
    "TYPE": "tool failure",
    "TOOL": "bash",
    "ERROR": "Playwright tests failed due to unrelated suite matching",
    "ROOT CAUSE": "Using --grep \"context\" matched a processedEvents test that failed, unrelated to the change.",
    "PROJECT NOTE": "Prefer targeting specific test titles or files (e.g., ContextSizeChart or file path) instead of broad keywords like \"context\" which match processedEvents tests.",
    "NEW INSTRUCTION": "WHEN running Playwright with --grep THEN use exact test titles or file-specific patterns"
}

