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
  
  // SVG icons for expand and collapse states
  const expandIcon = `<svg 
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#000000"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8" />
    <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
    <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
    <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
  </svg>`;
  
  const collapseIcon = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 20L15 15M15 15V19M15 15H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 20L9 15M9 15V19M9 15H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 4L15 9M15 9V5M15 9H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 4L9 9M9 9V5M9 9H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  
  // Toggle the expanded class
  const isExpanded = contentWrapper.classList.contains('expanded');
  
  if (isExpanded) {
    // Collapse: remove expanded class
    contentWrapper.classList.remove('expanded');
    button.innerHTML = expandIcon;
    button.title = 'Expand content';
  } else {
    // Expand: add expanded class
    contentWrapper.classList.add('expanded');
    button.innerHTML = collapseIcon;
    button.title = 'Collapse content';
  }
}