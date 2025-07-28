/**
 * Initialize toggle buttons visibility based on content overflow
 * Should be called after the page loads to hide buttons for non-overflowing content
 */
function initializeToggleButtons() {
  const toggleButtons = document.querySelectorAll('.content-toggle-btn');
  
  toggleButtons.forEach(button => {
    const container = button.parentElement;
    const contentWrapper = container.querySelector('.content-wrapper');
    
    if (contentWrapper && contentWrapper.scrollHeight <= contentWrapper.clientHeight) {
      // Hide the button if content doesn't overflow
      button.classList.add('hidden');
    }
  });
}

/**
 * Toggle the expansion state of trajectory content
 * @param {HTMLElement} button - The toggle button that was clicked
 */
function toggleContentExpansion(button) {
  // Find the content wrapper within the same container
  const container = button.parentElement;
  const contentWrapper = container.querySelector('.content-wrapper');
  const expandIcon = button.querySelector('.expand-icon');
  const collapseIcon = button.querySelector('.collapse-icon');
  
  if (!contentWrapper) {
    console.error('Content wrapper not found');
    return;
  }
  
  if (!expandIcon || !collapseIcon) {
    console.error('Expand or collapse icon not found');
    return;
  }
  
  // Toggle the expanded class and button state
  const isExpanded = contentWrapper.classList.contains('expanded');
  
  if (isExpanded) {
    // Collapse: remove expanded class and show expand icon, hide collapse icon
    contentWrapper.classList.remove('expanded');
    expandIcon.classList.remove('hidden');
    collapseIcon.classList.add('hidden');
    button.setAttribute('data-expanded', 'false');
    button.setAttribute('title', 'Expand content');
  } else {
    // Expand: add expanded class and show collapse icon, hide expand icon
    contentWrapper.classList.add('expanded');
    expandIcon.classList.add('hidden');
    collapseIcon.classList.remove('hidden');
    button.setAttribute('data-expanded', 'true');
    button.setAttribute('title', 'Collapse content');
  }
}

// Initialize toggle buttons when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeToggleButtons);