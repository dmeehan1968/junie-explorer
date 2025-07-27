/**
 * Toggle the expansion state of trajectory content
 * @param {HTMLElement} button - The toggle button that was clicked
 */
function toggleContentExpansion(button) {
  // Find the content wrapper within the same container
  const container = button.parentElement;
  const contentWrapper = container.querySelector('.content-wrapper');
  const expandBtn = container.querySelector('.expand-btn');
  const collapseBtn = container.querySelector('.collapse-btn');
  
  if (!contentWrapper) {
    console.error('Content wrapper not found');
    return;
  }
  
  if (!expandBtn || !collapseBtn) {
    console.error('Expand or collapse button not found');
    return;
  }
  
  // Toggle the expanded class
  const isExpanded = contentWrapper.classList.contains('expanded');
  
  if (isExpanded) {
    // Collapse: remove expanded class and show expand button, hide collapse button
    contentWrapper.classList.remove('expanded');
    expandBtn.style.display = 'inline-block';
    collapseBtn.style.display = 'none';
  } else {
    // Expand: add expanded class and show collapse button, hide expand button
    contentWrapper.classList.add('expanded');
    expandBtn.style.display = 'none';
    collapseBtn.style.display = 'inline-block';
  }
}