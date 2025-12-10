# Issues Table Search Feature Specification

## Overview

Add a search feature to the issues table that allows users to search across all issues within a project. The search will match against LLM request events, LLM response events, and issue UUIDs.

## Search Scope & Data Sources

### Searchable Content

1. **LLM Request Events** - Search matches anywhere in the JSON-stringified event
2. **LLM Response Events** - Search matches anywhere in the JSON-stringified event  
3. **Issue UUID** - Partial match on the issue ID

### Search Behavior

- **Case-insensitive** matching
- **No minimum** search term length (supports partial UUID matching)
- Search executes **only when user presses Enter**

## UI/UX Design

### Search Input Placement

- Search bar placed **above the issues table**
- Standard search input with placeholder text

### Search Results Display

- **Highlight matching rows** in the existing table (not filter/hide)
- Non-matching rows remain visible but unhighlighted
- Background color highlight (light yellow/amber) for matching rows

### Loading State

- Show a **loading indicator** while search is in progress
- First search may be slow due to lazy event loading

### Clear Search

- Show an **X button** when search has text
- Clearing search removes all highlights

### Result Count

- Display **"X of Y issues match"** near the search input when search is active

## Performance & Architecture

### Event Loading

- Events are already lazy-loaded and cached by the existing system
- No special preloading needed
- First search triggers event loading if not already loaded

### Search Execution

- **Server-side API endpoint** handles the search
- Returns list of matching issue IDs
- Client highlights rows based on returned IDs

### API Endpoint

```
GET /api/projects/:projectName/search?q=<search_term>
```

Response:
```json
{
  "query": "search term",
  "matchingIssueIds": ["uuid-1", "uuid-2", ...],
  "totalIssues": 10,
  "matchCount": 3
}
```

## Edge Cases & Feedback

### No Results Found

- Show **"No matching issues found"** message
- Keep all rows visible but unhighlighted

### Search Persistence

- Preserve search term in **session storage**
- Restore search state when returning to the project page
- Clear on explicit user action or session end

## Implementation Components

### Backend

1. **Search API Route** (`src/app/api/search.ts`)
   - Accept project name and search query
   - Load events for each issue in the project
   - JSON-stringify events and perform case-insensitive search
   - Return matching issue IDs

2. **Issue Search Method** (extend `Issue` class or utility)
   - Method to search within issue's events
   - Returns boolean indicating match

### Frontend

1. **Search Input Component** (`src/components/issueSearch.tsx`)
   - Search input with Enter key handler
   - Clear button (X)
   - Loading indicator
   - Result count display

2. **Client-side JavaScript** (`public/js/issueSearch.js`)
   - Handle Enter key press
   - Call search API
   - Apply/remove highlight classes to table rows
   - Manage session storage for persistence
   - Show/hide loading indicator

3. **CSS Styles** (in `public/css/app.css` or component)
   - `.issue-row-highlight` class for matching rows
   - Loading indicator styles

### Integration

1. **Issues Table Update** (`src/components/issuesTable.tsx`)
   - Add search component above table
   - Add data attributes to rows for targeting (e.g., `data-issue-id`)

2. **Project Routes Update** (`src/app/web/projectRoutes.tsx`)
   - Include search component in project page

## Test Strategy

### Unit Tests (Bun)

1. Search API endpoint tests
   - Returns correct matching IDs
   - Handles empty search
   - Handles no matches
   - Case-insensitive matching

2. Issue search utility tests
   - Matches in request events
   - Matches in response events
   - Matches UUID
   - No false positives

### Playwright Tests

1. Search input visibility and interaction
2. Enter key triggers search
3. Loading indicator appears/disappears
4. Matching rows are highlighted
5. Result count displays correctly
6. Clear button works
7. Session storage persistence
8. No results message

## Acceptance Criteria

- [x] Search input is visible above issues table
- [x] Pressing Enter executes search
- [x] Loading indicator shows during search
- [x] Matching rows are highlighted with background color
- [x] Result count shows "X of Y issues match"
- [x] Clear button removes search and highlights
- [x] Search persists in session storage
- [x] "No matching issues found" shows when no results
- [x] Search matches content in LLM request events
- [x] Search matches content in LLM response events
- [x] Search matches issue UUIDs (partial match supported)
