/**
 * Toggle the expansion state of trajectory content
 * @param {HTMLElement} button - The toggle button that was clicked
 */
function toggleContentExpansion(button) {
  // Find the content wrapper within the same container
  const container = button.parentElement;
  const contentWrapper = container.querySelector('.content-wrapper');
  
  if (!contentWrapper) {
    console.error('Content wrapper not found');
    return;
  }
  
  // Toggle the expanded class
  const isExpanded = contentWrapper.classList.contains('expanded');
  
  if (isExpanded) {
    // Collapse: remove expanded class
    contentWrapper.classList.remove('expanded');
    button.textContent = '⇅';
    button.title = 'Expand content';
  } else {
    // Expand: add expanded class
    contentWrapper.classList.add('expanded');
    button.textContent = '⇈';
    button.title = 'Collapse content';
  }
}