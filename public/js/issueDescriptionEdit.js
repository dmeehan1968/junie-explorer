// Issue Description Edit functionality
document.addEventListener('DOMContentLoaded', () => {
  const issueDescriptions = document.querySelectorAll('[data-issue-description-editable]')

  issueDescriptions.forEach(container => {
    const issueId = container.dataset.issueId
    const originalDescription = container.dataset.originalDescription
    const descriptionLink = container.querySelector('[data-testid="issue-description-link"]')
    const editButton = container.querySelector('[data-testid="edit-description-btn"]')

    if (!editButton || !descriptionLink) return

    let isEditing = false

    editButton.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (isEditing) return
      startEditing()
    })

    function startEditing() {
      isEditing = true
      // Get fresh reference to description link (may have been rebuilt after previous edit)
      const currentDescriptionLink = container.querySelector('[data-testid="issue-description-link"]')
      const currentText = currentDescriptionLink ? currentDescriptionLink.textContent.trim() : originalDescription

      const input = document.createElement('input')
      input.type = 'text'
      input.value = currentText
      input.className = 'input input-sm input-bordered w-full'
      input.placeholder = originalDescription
      input.dataset.testid = 'edit-description-input'

      const originalContent = container.innerHTML
      container.innerHTML = ''
      container.appendChild(input)
      input.focus()
      input.select()

      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          cancelEditing(originalContent)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          await saveDescription(input.value, originalContent)
        }
      })

      input.addEventListener('blur', async () => {
        // Small delay to allow click events to process
        setTimeout(async () => {
          if (isEditing) {
            await saveDescription(input.value, originalContent)
          }
        }, 100)
      })
    }

    function cancelEditing(originalContent) {
      isEditing = false
      container.innerHTML = originalContent
      reattachEventListeners()
    }

    async function saveDescription(newDescription, originalContent) {
      isEditing = false
      const trimmed = newDescription.trim()

      try {
        const response = await fetch(`/api/issues/${encodeURIComponent(issueId)}/description`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: trimmed })
        })

        if (!response.ok) {
          throw new Error('Failed to save description')
        }

        const result = await response.json()
        const displayDescription = result.description || originalDescription

        container.innerHTML = originalContent
        const link = container.querySelector('[data-testid="issue-description-link"]')
        if (link) {
          link.textContent = displayDescription
        }

        // Update the checkbox data-issue-name for compare modal
        const row = container.closest('tr')
        if (row) {
          const checkbox = row.querySelector('.issue-select')
          if (checkbox) {
            checkbox.dataset.issueName = displayDescription
          }
        }

        reattachEventListeners()
      } catch (error) {
        console.error('Error saving description:', error)
        container.innerHTML = originalContent
        reattachEventListeners()
      }
    }

    function reattachEventListeners() {
      const newEditButton = container.querySelector('[data-testid="edit-description-btn"]')
      if (newEditButton) {
        newEditButton.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (isEditing) return
          startEditing()
        })
      }
    }
  })
})
