// Initialize the raw data viewers when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to the toggle buttons
  const toggleButtons = document.querySelectorAll('.toggle-raw-data');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const taskId = this.getAttribute('data-task');
      const container = document.getElementById(`raw-data-${taskId}`);

      // Toggle visibility
      if (container.style.display === 'none') {
        container.style.display = 'block';

        // Initialize JSON viewer if not already done
        if (!container.getAttribute('data-initialized')) {
          const jsonRenderer = document.getElementById(`json-renderer-${taskId}`);

          // Show loading indicator
          jsonRenderer.innerHTML = 'Loading...';

          // Get the current URL path components
          const pathParts = window.location.pathname.split('/');
          const projectName = pathParts[2];
          const issueId = pathParts[4];

          // Fetch the task data from the API
          fetch(`/api/project/${projectName}/issue/${issueId}/task/${taskId}`)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(data => {
              // Initialize the JSON viewer with the fetched data
              $(jsonRenderer).jsonViewer(data, {
                collapsed: true,  // Start with collapsed view
                rootCollapsable: false,  // Don't allow collapsing the root object
                withQuotes: false,  // Show quotes around keys
                withLinks: false,  // Don't convert URLs to links
              });

              container.setAttribute('data-initialized', 'true');
            })
            .catch(error => {
              console.error('Error fetching task data:', error);
              jsonRenderer.innerHTML = 'Error loading data. Please try again.';
            });
        }
      } else {
        container.style.display = 'none';
      }
    });
  });
});