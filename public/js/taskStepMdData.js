// Initialize the MD data viewers when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to the toggle MD buttons
  const toggleButtons = document.querySelectorAll('.toggle-md-data');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const stepIndex = this.getAttribute('data-step');
      const container = document.getElementById(`md-data-${stepIndex}`);

      // Toggle visibility
      if (container.style.display === 'none') {
        container.style.display = 'table-row';

        // Initialize MD viewer if not already done
        if (!container.getAttribute('data-initialized')) {
          const mdRenderer = document.getElementById(`md-renderer-${stepIndex}`);

          // Show loading indicator
          mdRenderer.innerHTML = 'Loading...';

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
              mdRenderer.innerHTML = data;
              container.setAttribute('data-initialized', 'true');
            })
            .catch(error => {
              console.error('Error fetching step representations:', error);
              mdRenderer.innerHTML = 'Error loading representations. Please try again.';
            });
        }
      } else {
        container.style.display = 'none';
      }
    });
  });
});