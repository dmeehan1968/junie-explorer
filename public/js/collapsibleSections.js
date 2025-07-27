// Collapsible sections functionality
document.addEventListener('DOMContentLoaded', function() {
  // Find all collapsible headers
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const section = this.parentElement;
      const toggle = this.querySelector('.collapsible-toggle');
      const content = section.querySelector('.collapsible-content');
      
      // Toggle the collapsed class and content visibility
      section.classList.toggle('collapsed');
      
      if (section.classList.contains('collapsed')) {
        // Collapsed state
        toggle.textContent = 'Click to expand';
        if (content) {
          content.classList.add('hidden');
        }
        // Update header to have full border radius when collapsed
        header.className = header.className.replace('rounded-t-lg', 'rounded-lg');
      } else {
        // Expanded state
        toggle.textContent = 'Click to collapse';
        if (content) {
          content.classList.remove('hidden');
        }
        // Update header to have top border radius only when expanded
        header.className = header.className.replace('rounded-lg', 'rounded-t-lg');
        
        // Check if this section contains the event timeline chart
        const chartCanvas = section.querySelector('#event-timeline-chart');
        if (chartCanvas && window.taskEventChart) {
          // Use setTimeout to ensure the section is fully expanded before resizing
          setTimeout(() => {
            window.taskEventChart.resize();
          }, 50);
        }
      }
    });
  });
});