document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('issueSearchInput')
  const clearBtn = document.getElementById('clearSearchBtn')
  const resultCount = document.getElementById('searchResultCount')
  const loadingSpinner = document.getElementById('searchLoading')

  if (!searchInput) return

  const projectName = searchInput.dataset.projectName
  const STORAGE_KEY = `issueSearch_${projectName}`

  const savedSearch = sessionStorage.getItem(STORAGE_KEY)
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
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      clearHighlights()

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
