// Collapsible sections functionality
document.addEventListener('DOMContentLoaded', function() {
  // Find all collapsible headers
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const section = this.parentElement;
      const toggle = this.querySelector('.collapsible-toggle');
      
      // Toggle the collapsed class
      section.classList.toggle('collapsed');
      
      // Update the toggle text
      if (section.classList.contains('collapsed')) {
        toggle.textContent = 'Click to expand';
      } else {
        toggle.textContent = 'Click to collapse';
        
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