/** @jsxImportSource @kitajs/html */

export const IssueSearch = ({ projectName }: { projectName: string }) => (
  <div class="flex items-center gap-3 mb-4" data-testid="issue-search">
    <div class="relative flex-1 max-w-md">
      <input
        type="text"
        id="issueSearchInput"
        class="input input-bordered w-full pr-10"
        placeholder="Search issues by content or UUID..."
        data-project-name={projectName}
        data-testid="issue-search-input"
      />
      <button
        id="clearSearchBtn"
        class="btn btn-ghost btn-sm btn-circle absolute right-1 top-1/2 -translate-y-1/2 hidden z-10"
        aria-label="Clear search"
        data-testid="clear-search-btn"
      >
        ✕
      </button>
    </div>
    <button
      id="submitSearchBtn"
      class="btn btn-primary btn-sm disabled:opacity-50"
      aria-label="Search"
      data-testid="submit-search-btn"
    >
      Search
    </button>
    <label class="flex items-center gap-1 cursor-pointer" data-testid="regex-label">
      <input
        type="checkbox"
        id="regexToggle"
        class="checkbox checkbox-sm"
        data-testid="regex-toggle"
      />
      <span class="text-sm">Use Regex?</span>
    </label>
    <span
      id="searchResultCount"
      class="text-sm text-base-content/70 hidden"
      data-testid="search-result-count"
    ></span>
    <span
      id="searchLoading"
      class="loading loading-spinner loading-sm hidden"
      data-testid="search-loading"
    ></span>
  </div>
)
