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
        if (chartCanvas && !window.taskEvents) {
          // Fetch event timeline data when the event timeline is expanded
          const pathParts = window.location.pathname.split('/');
          const projectName = decodeURIComponent(pathParts[2]);
          const issueId = decodeURIComponent(pathParts[4]);
          const taskId = decodeURIComponent(pathParts[6]);

          fetch(`/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/events/timeline`)
            .then(response => response.json())
            .then(data => {
              // Convert ISO strings back to Date objects
              window.taskEvents = data.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }));
              
              // Initialize the event chart if it hasn't been created yet
              if (!window.taskEventChart) {
                window.taskEventChart = new TaskEventChart('event-timeline-chart', window.taskEvents);
              }
            })
            .catch(error => {
              console.error('Error fetching timeline events:', error);
            });
        } else if (chartCanvas && window.taskEventChart) {
          // Use setTimeout to ensure the section is fully expanded before resizing
          setTimeout(() => {
            window.taskEventChart.resize();
          }, 50);
        }
        
        // Check if this section contains the action timeline chart
        const actionChartCanvas = section.querySelector('#action-timeline-chart');
        if (actionChartCanvas && !window.taskActionEvents) {
          // Fetch action events data when the action timeline is expanded
          const pathParts = window.location.pathname.split('/');
          const projectName = decodeURIComponent(pathParts[2]);
          const issueId = decodeURIComponent(pathParts[4]);
          const taskId = decodeURIComponent(pathParts[6]);

          fetch(`/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/timeline`)
            .then(response => response.json())
            .then(data => {
              // Convert ISO strings back to Date objects
              window.taskActionEvents = data.map(e => ({
                ...e,
                timestamp: new Date(e.timestamp)
              }));
              
              // Initialize the action chart if it hasn't been created yet
              if (!window.taskActionChart) {
                window.taskActionChart = new TaskActionChart('action-timeline-chart', window.taskActionEvents);
              }
            })
            .catch(error => {
              console.error('Error fetching action events:', error);
            });
        }
      }
    });
  });
});