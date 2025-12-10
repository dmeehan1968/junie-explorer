document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('issueSearchInput')
  const clearBtn = document.getElementById('clearSearchBtn')
  const resultCount = document.getElementById('searchResultCount')
  const loadingSpinner = document.getElementById('searchLoading')
  const regexToggle = document.getElementById('regexToggle')

  if (!searchInput) return

  const projectName = searchInput.dataset.projectName
  const STORAGE_KEY = `issueSearch_${projectName}`
  const REGEX_STORAGE_KEY = `issueSearchRegex_${projectName}`

  const savedSearch = sessionStorage.getItem(STORAGE_KEY)
  const savedRegex = sessionStorage.getItem(REGEX_STORAGE_KEY)

  if (savedRegex === 'true' && regexToggle) {
    regexToggle.checked = true
  }

  if (savedSearch) {
    searchInput.value = savedSearch
    performSearch(savedSearch)
  }

  searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim()
      sessionStorage.setItem(STORAGE_KEY, query)
      await performSearch(query)
    }
  })

  searchInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', !searchInput.value)
  })

  if (regexToggle) {
    regexToggle.addEventListener('change', () => {
      sessionStorage.setItem(REGEX_STORAGE_KEY, regexToggle.checked.toString())
      const query = searchInput.value.trim()
      if (query) {
        performSearch(query)
      }
    })
  }

  clearBtn.addEventListener('click', () => {
    searchInput.value = ''
    clearBtn.classList.add('hidden')
    resultCount.classList.add('hidden')
    sessionStorage.removeItem(STORAGE_KEY)
    clearHighlights()
  })

  async function performSearch(query) {
    if (!query) {
      clearHighlights()
      resultCount.classList.add('hidden')
      return
    }

    loadingSpinner.classList.remove('hidden')
    clearBtn.classList.toggle('hidden', !query)

    try {
      const useRegex = regexToggle?.checked || false
      const url = `/api/projects/${encodeURIComponent(projectName)}/search?q=${encodeURIComponent(query)}&regex=${useRegex}`
      const response = await fetch(url)
      const data = await response.json()

      clearHighlights()

      if (data.error) {
        resultCount.textContent = data.error
        resultCount.classList.remove('hidden')
        return
      }

      if (data.matchingIssueIds && data.matchingIssueIds.length > 0) {
        data.matchingIssueIds.forEach(issueId => {
          const row = document.querySelector(`tr[data-issue-id="${issueId}"]`)
          if (row) {
            row.classList.add('issue-row-highlight')
          }
        })
      }

      resultCount.textContent = `${data.matchCount} of ${data.totalIssues} issues match`
      resultCount.classList.remove('hidden')
    } catch (error) {
      console.error('Search failed:', error)
      resultCount.textContent = 'Search failed'
      resultCount.classList.remove('hidden')
    } finally {
      loadingSpinner.classList.add('hidden')
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.issue-row-highlight').forEach(row => {
      row.classList.remove('issue-row-highlight')
    })
  }
})
