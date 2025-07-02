// Event type filtering functionality
let eventTypeFilters = {};

// Initialize event type filters
function initializeEventTypeFilters() {
  const eventFilters = document.querySelectorAll('.event-filter[data-event-type]');
  eventFilters.forEach(filter => {
    const eventType = filter.getAttribute('data-event-type');
    eventTypeFilters[eventType] = true; // Default to all enabled
    
    // Add click event listener to the label
    const label = filter.querySelector('label');
    if (label) {
      label.addEventListener('click', function(e) {
        e.preventDefault();
        toggleEventTypeFilter(filter);
      });
    }
  });
  
  // Add click event listener to the all/none toggle label
  const allNoneToggle = document.querySelector('.all-none-toggle');
  if (allNoneToggle) {
    const label = allNoneToggle.querySelector('label');
    if (label) {
      label.addEventListener('click', function(e) {
        e.preventDefault();
        toggleAllEventTypes();
      });
    }
  }
  
  applyEventTypeFilters();
}

// Toggle individual event type filter
function toggleEventTypeFilter(element) {
  const eventType = element.getAttribute('data-event-type');
  const checkbox = element.querySelector('input[type="checkbox"]');
  
  // Toggle the filter state
  eventTypeFilters[eventType] = !eventTypeFilters[eventType];
  checkbox.checked = eventTypeFilters[eventType];
  
  // Update visual state
  if (eventTypeFilters[eventType]) {
    element.classList.remove('event-filter-disabled');
  } else {
    element.classList.add('event-filter-disabled');
  }
  
  // Update all/none checkbox state
  updateAllNoneCheckbox();
  
  // Apply filters
  applyEventTypeFilters();
}

// Toggle all/none event types
function toggleAllEventTypes() {
  const allNoneCheckbox = document.getElementById('all-none-checkbox');
  const allNoneElement = document.querySelector('.all-none-toggle');
  const shouldEnableAll = !allNoneCheckbox.checked;
  
  // Update all event type filters
  const eventFilters = document.querySelectorAll('.event-filter[data-event-type]');
  eventFilters.forEach(filter => {
    const eventType = filter.getAttribute('data-event-type');
    const checkbox = filter.querySelector('input[type="checkbox"]');
    
    eventTypeFilters[eventType] = shouldEnableAll;
    checkbox.checked = shouldEnableAll;
    
    if (shouldEnableAll) {
      filter.classList.remove('event-filter-disabled');
    } else {
      filter.classList.add('event-filter-disabled');
    }
  });
  
  // Update all/none checkbox
  allNoneCheckbox.checked = shouldEnableAll;
  if (shouldEnableAll) {
    allNoneElement.classList.remove('event-filter-disabled');
  } else {
    allNoneElement.classList.add('event-filter-disabled');
  }
  
  // Apply filters
  applyEventTypeFilters();
}

// Update all/none checkbox based on individual filter states
function updateAllNoneCheckbox() {
  const allNoneCheckbox = document.getElementById('all-none-checkbox');
  const allNoneElement = document.querySelector('.all-none-toggle');
  
  const eventTypes = Object.keys(eventTypeFilters);
  const enabledCount = eventTypes.filter(type => eventTypeFilters[type]).length;
  
  if (enabledCount === eventTypes.length) {
    // All enabled
    allNoneCheckbox.checked = true;
    allNoneElement.classList.remove('event-filter-disabled');
  } else if (enabledCount === 0) {
    // None enabled
    allNoneCheckbox.checked = false;
    allNoneElement.classList.add('event-filter-disabled');
  } else {
    // Some enabled
    allNoneCheckbox.checked = true;
    allNoneElement.classList.remove('event-filter-disabled');
  }
}

// Apply event type filters to the events table
function applyEventTypeFilters() {
  const eventRows = document.querySelectorAll('.events-table tbody tr');
  let visibleCount = 0;
  
  eventRows.forEach(row => {
    const eventTypeCell = row.querySelector('.event-type-col');
    if (eventTypeCell) {
      const eventTypeText = eventTypeCell.textContent.trim().replace('(parseError)', '').trim();
      const shouldShow = eventTypeFilters[eventTypeText];
      
      if (shouldShow) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    }
  });
  
  // Show message if no events are visible
  const eventsTable = document.querySelector('.events-table');
  let noVisibleMessage = document.getElementById('no-visible-events-message');
  
  if (visibleCount === 0 && eventsTable) {
    if (!noVisibleMessage) {
      noVisibleMessage = document.createElement('div');
      noVisibleMessage.id = 'no-visible-events-message';
      noVisibleMessage.className = 'no-events';
      noVisibleMessage.textContent = 'No events match the selected filters';
      eventsTable.parentNode.insertBefore(noVisibleMessage, eventsTable.nextSibling);
    }
    noVisibleMessage.style.display = '';
  } else if (noVisibleMessage) {
    noVisibleMessage.style.display = 'none';
  }
}

// Initialize filters when the page loads
document.addEventListener('DOMContentLoaded', function() {
  initializeEventTypeFilters();
});