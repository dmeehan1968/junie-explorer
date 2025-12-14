document.addEventListener('DOMContentLoaded', () => {
  const updateMergeButtonVisibility = () => {
    const rows = Array.from(document.querySelectorAll('tr[data-issue-id]'))
    
    rows.forEach((row, index) => {
      const mergeUpBtn = row.querySelector('.merge-up-btn')
      const mergeDownBtn = row.querySelector('.merge-down-btn')
      
      if (!mergeUpBtn || !mergeDownBtn) return
      
      const prevRow = rows[index - 1]
      const nextRow = rows[index + 1]
      
      const prevIsAIA = prevRow?.querySelector('[data-is-aia="true"]')
      const nextIsAIA = nextRow?.querySelector('[data-is-aia="true"]')
      
      mergeUpBtn.style.display = prevIsAIA ? '' : 'none'
      mergeDownBtn.style.display = nextIsAIA ? '' : 'none'
    })
  }
  
  updateMergeButtonVisibility()
  
  const handleMerge = async (targetIssueId, sourceIssueId, projectName) => {
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/issues/${encodeURIComponent(targetIssueId)}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourceIssueId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to merge issues')
      }
      
      window.location.reload()
    } catch (error) {
      console.error('Merge failed:', error)
      alert(`Failed to merge issues: ${error.message}`)
    }
  }

  const handleUnmerge = async (issueId, projectName) => {
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/issues/${encodeURIComponent(issueId)}/unmerge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unmerge issue')
      }
      
      window.location.reload()
    } catch (error) {
      console.error('Unmerge failed:', error)
      alert(`Failed to unmerge issue: ${error.message}`)
    }
  }
  
  document.addEventListener('click', (event) => {
    const mergeUpBtn = event.target.closest('.merge-up-btn')
    const mergeDownBtn = event.target.closest('.merge-down-btn')
    const unmergeBtn = event.target.closest('.unmerge-btn')
    
    if (mergeUpBtn) {
      event.stopPropagation()
      event.preventDefault()
      const row = mergeUpBtn.closest('tr[data-issue-id]')
      const rows = Array.from(document.querySelectorAll('tr[data-issue-id]'))
      const index = rows.indexOf(row)
      const prevRow = rows[index - 1]
      
      if (prevRow) {
        const sourceIssueId = row.dataset.issueId
        const targetIssueId = prevRow.dataset.issueId
        const projectName = mergeUpBtn.dataset.projectName
        
        if (confirm(`Merge this issue into the issue above?`)) {
          handleMerge(targetIssueId, sourceIssueId, projectName)
        }
      }
      return
    }
    
    if (mergeDownBtn) {
      event.stopPropagation()
      event.preventDefault()
      const row = mergeDownBtn.closest('tr[data-issue-id]')
      const rows = Array.from(document.querySelectorAll('tr[data-issue-id]'))
      const index = rows.indexOf(row)
      const nextRow = rows[index + 1]
      
      if (nextRow) {
        const sourceIssueId = nextRow.dataset.issueId
        const targetIssueId = row.dataset.issueId
        const projectName = mergeDownBtn.dataset.projectName
        
        if (confirm(`Merge the issue below into this issue?`)) {
          handleMerge(targetIssueId, sourceIssueId, projectName)
        }
      }
      return
    }

    if (unmergeBtn) {
      event.stopPropagation()
      event.preventDefault()
      const row = unmergeBtn.closest('tr[data-issue-id]')
      const issueId = row.dataset.issueId
      const projectName = unmergeBtn.dataset.projectName
      
      if (confirm(`Unmerge this issue? All tasks will be split into individual issues.`)) {
        handleUnmerge(issueId, projectName)
      }
      return
    }
  })
})
