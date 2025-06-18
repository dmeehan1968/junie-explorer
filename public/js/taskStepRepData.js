// Initialize the REP data viewers when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to the toggle REP buttons
  const toggleButtons = document.querySelectorAll('.toggle-rep-data');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const stepIndex = this.getAttribute('data-step');
      const container = document.getElementById(`rep-data-${stepIndex}`);

      // Toggle visibility
      if (container.style.display === 'none') {
        container.style.display = 'table-row';

        // Initialize REP viewer if not already done
        if (!container.getAttribute('data-initialized')) {
          const repRenderer = document.getElementById(`rep-renderer-${stepIndex}`);

          // Show loading indicator
          repRenderer.innerHTML = 'Loading...';

          // Get the current URL path components
          const pathParts = window.location.pathname.split('/');
          const projectName = pathParts[2];
          const issueId = pathParts[4];
          const taskId = pathParts[6];

          // Fetch the step representations from the API
          fetch(`/api/project/${projectName}/issue/${issueId}/task/${taskId}/step/${stepIndex}/representations`)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(data => {
              // Display the HTML content directly
              console.log(data)
              repRenderer.innerHTML = data;
              container.setAttribute('data-initialized', 'true');
            })
            .catch(error => {
              console.error('Error fetching step representations:', error);
              repRenderer.innerHTML = 'Error loading representations. Please try again.';
            });
        }
      } else {
        container.style.display = 'none';
      }
    });
  });
});