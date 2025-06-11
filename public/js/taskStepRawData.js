// Initialize the raw data viewers when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to the toggle buttons
  const toggleButtons = document.querySelectorAll('.toggle-raw-data');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const stepIndex = this.getAttribute('data-step');
      const container = document.getElementById(`raw-data-${stepIndex}`);

      // Toggle visibility
      if (container.style.display === 'none') {
        container.style.display = 'table-row';

        // Initialize JSON viewer if not already done
        if (!container.getAttribute('data-initialized')) {
          const jsonRenderer = document.getElementById(`json-renderer-${stepIndex}`);
          $(jsonRenderer).jsonViewer(window.stepData[stepIndex], {
            collapsed: true,  // Start with collapsed view
            rootCollapsable: false,  // Don't allow collapsing the root object
            withQuotes: true,  // Show quotes around keys
            withLinks: false   // Don't convert URLs to links
          });
          container.setAttribute('data-initialized', 'true');
        }
      } else {
        container.style.display = 'none';
      }
    });
  });
});
