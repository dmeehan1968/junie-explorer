// Trajectory toggle functionality for individual content sections
function toggleContentExpansion(button) {
  const isExpanded = button.getAttribute('data-expanded') === 'true';
  const expandIcon = button.querySelector('.expand-icon');
  const collapseIcon = button.querySelector('.collapse-icon');
  const contentWrapper = button.parentElement.querySelector('.content-wrapper');
  
  if (!contentWrapper) {
    console.warn('Content wrapper not found for toggle button');
    return;
  }
  
  if (isExpanded) {
    // Collapse the content
    contentWrapper.classList.remove('expanded')
    button.setAttribute('data-expanded', 'false');
    button.setAttribute('title', 'Expand content');
    expandIcon.classList.remove('hidden');
    collapseIcon.classList.add('hidden');
  } else {
    // Expand the content
    contentWrapper.classList.add('expanded')
    button.setAttribute('data-expanded', 'true');
    button.setAttribute('title', 'Collapse content');
    expandIcon.classList.add('hidden');
    collapseIcon.classList.remove('hidden');
  }
}

// Function to check content height and hide toggles for content that doesn't exceed 200px
function initializeToggleVisibility() {
  const toggleButtons = document.querySelectorAll('.content-toggle-btn');
  
  toggleButtons.forEach(button => {
    const contentWrapper = button.parentElement.querySelector('.content-wrapper');
    
    if (!contentWrapper) {
      return;
    }
    
    // Temporarily remove max-height to get natural height
    const originalMaxHeight = contentWrapper.style.maxHeight;
    const originalOverflow = contentWrapper.style.overflow;
    
    contentWrapper.style.maxHeight = 'none';
    contentWrapper.style.overflow = 'visible';
    
    // Get the natural height of the content
    const naturalHeight = contentWrapper.scrollHeight;
    
    // Restore original styles
    contentWrapper.style.maxHeight = originalMaxHeight;
    contentWrapper.style.overflow = originalOverflow;
    
    // Hide toggle button if content height is 200px or less
    if (naturalHeight <= 200) {
      button.style.display = 'none';
      // Also remove the max-height constraint since toggle is not needed
      contentWrapper.style.maxHeight = 'none';
      contentWrapper.style.overflow = 'visible';
    }
  });
}

// Initialize toggle visibility on page load
document.addEventListener('DOMContentLoaded', initializeToggleVisibility);

// Make the function globally available
window.toggleContentExpansion = toggleContentExpansion;