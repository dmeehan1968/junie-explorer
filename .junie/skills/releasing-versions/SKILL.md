---
name: releasing-versions
description: Use when releasing a new version. It provides a automated workflow to update version numbers, update the changelog, and prepare for tagging.
---

# Release Version

## Overview

This skill provides a streamlined workflow for releasing a new version of Junie Explorer. It automates the
analysis of commits since the last release, updates version numbers in `package.json`, generates a new entry in
`CHANGELOG.md`, and prepares the repository for tagging.

## Workflow

When following these instructions, DO NOT write additional code or tests, DO NOT follow TDD process.
Perform these steps exactly.

1. Check the CHANGELOG.md for the most recently mentioned version
2. Use this version (Major.minor.patch) to look for git commits since a tag with the same version (version tags are
   prefixed `v`, e.g. v1.0.0)
3. If there are no changes since the last version tag, then your work is done.
4. Separate changes by version number (git tag) and increment the latest version (default patch) depending on the
   request
5. Update the package.json version to the new version
6. Update CHANGELOG.md to include a section listing the changes in this version (versions in descending order)

    - Use the first line of the commit and include the commit hash
    - Group each change under a sub-heading according to its type, e.g.
        - Added for new features.
        - Changed for changes in existing functionality.
        - Deprecated for soon-to-be removed features.
        - Removed for now removed features.
        - Fixed for any bug fixes.
        - Security in case of vulnerabilities.
        - etc

7. Make sure the latest version release date is today (use `date +%Y-%m-%d` CLI to get current)
8. Run `bun install` to update the package-lock.json
9. Commit CHANGELOG.md, package.json, and bun.lock
10. Add a tag with the new version (prefix the version with `v`, e.g. v1.0.0)
