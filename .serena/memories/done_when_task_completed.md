When a task is completed:
1) Ensure minimal necessary changes focused on the issue description.
2) Keep user informed with UPDATE sections (plan/progress/next step) and follow tool usage rules.
3) If code changed, ensure TypeScript compiles and server starts locally.
4) Update relevant docs/comments if behavior changed.
5) For release tasks: bump package.json version, update CHANGELOG.md with commit summaries and today’s date, run bun install to refresh bun.lock, commit files, add version tag prefix with v.
6) Do not edit build artifacts in dist/ or generated CSS in public/css.
7) Submit final summary of changes and status via submit tool.
