// Event type filtering functionality for task details flex grid
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
  
  // Toggle the filter state
  eventTypeFilters[eventType] = !eventTypeFilters[eventType];
  
  // Update visual state
  const label = element.querySelector('label');
  if (eventTypeFilters[eventType]) {
    element.classList.remove('event-filter-disabled');
    if (label) {
      label.className = 'cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-secondary border border-secondary-300 text-secondary-content';
    }
  } else {
    element.classList.add('event-filter-disabled');
    if (label) {
      label.className = 'cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-neutral border border-neutral-300 text-neutral-content';
    }
  }
  
  // Update all/none toggle state
  updateAllNoneToggle();
  
  // Apply filters
  applyEventTypeFilters();
}

// Toggle all/none event types
function toggleAllEventTypes() {
  const allNoneElement = document.querySelector('.all-none-toggle');
  
  // Determine current state - if all are enabled, disable all; otherwise enable all
  const eventTypes = Object.keys(eventTypeFilters);
  const enabledCount = eventTypes.filter(type => eventTypeFilters[type]).length;
  const shouldEnableAll = enabledCount !== eventTypes.length;
  
  // Update all event type filters
  const eventFilters = document.querySelectorAll('.event-filter[data-event-type]');
  eventFilters.forEach(filter => {
    const eventType = filter.getAttribute('data-event-type');
    const label = filter.querySelector('label');
    
    eventTypeFilters[eventType] = shouldEnableAll;
    
    if (shouldEnableAll) {
      filter.classList.remove('event-filter-disabled');
      if (label) {
        label.className = 'cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-secondary border border-secondary-300 text-secondary-content';
        label.textContent = eventType + ''
      }
    } else {
      filter.classList.add('event-filter-disabled');
      if (label) {
        label.className = 'cursor-pointer text-sm py-1 px-2 rounded transition-all duration-300 bg-neutral border border-neutral-300 text-neutral-content';
      }
    }
  });
  
  // Update all/none toggle visual state
  const allNoneLabel = allNoneElement.querySelector('label');
  if (shouldEnableAll) {
    allNoneElement.classList.remove('event-filter-disabled');
    if (allNoneLabel) {
      allNoneLabel.className = 'cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-primary border border-primary-300 text-primary-content';
    }
  } else {
    allNoneElement.classList.add('event-filter-disabled');
    if (allNoneLabel) {
      allNoneLabel.className = 'cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-neutral border border-neutral-300 text-neutral-content';
    }
  }
  
  // Apply filters
  applyEventTypeFilters();
}

// Update all/none toggle based on individual filter states
function updateAllNoneToggle() {
  const allNoneElement = document.querySelector('.all-none-toggle');
  const allNoneLabel = allNoneElement.querySelector('label');
  
  const eventTypes = Object.keys(eventTypeFilters);
  const enabledCount = eventTypes.filter(type => eventTypeFilters[type]).length;
  
  if (enabledCount === eventTypes.length) {
    // All enabled
    allNoneElement.classList.remove('event-filter-disabled');
    if (allNoneLabel) {
      allNoneLabel.className = 'cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-primary border border-primary-300 text-primary-content';
    }
  } else if (enabledCount === 0) {
    // None enabled
    allNoneElement.classList.add('event-filter-disabled');
    if (allNoneLabel) {
      allNoneLabel.className = 'cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-neutral border border-neutral-300 text-neutral-content';
    }
  } else {
    // Some enabled - show as enabled since we have partial selection
    allNoneElement.classList.remove('event-filter-disabled');
    if (allNoneLabel) {
      allNoneLabel.className = 'cursor-pointer text-sm font-bold py-1 px-2 rounded transition-all duration-300 bg-primary border border-primary-300 text-primary-content';
    }
  }
}

// Apply event type filters to the events flex grid
function applyEventTypeFilters() {
  const eventItems = document.querySelectorAll('.events-grid .event-item');
  let visibleCount = 0;
  
  eventItems.forEach(item => {
    // The event type is stored in the data-event-type attribute
    const eventType = item.getAttribute('data-event-type');
    if (eventType) {
      const shouldShow = eventTypeFilters[eventType];
      
      if (shouldShow) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    }
  });
  
  // Show message if no events are visible
  const eventsGrid = document.querySelector('.events-grid');
  let noVisibleMessage = document.getElementById('no-visible-events-message');
  
  if (visibleCount === 0 && eventsGrid) {
    if (!noVisibleMessage) {
      noVisibleMessage = document.createElement('div');
      noVisibleMessage.id = 'no-visible-events-message';
      noVisibleMessage.className = 'p-4 text-center text-base-content/70';
      noVisibleMessage.textContent = 'No events match the selected filters';
      eventsGrid.parentNode.insertBefore(noVisibleMessage, eventsGrid.nextSibling);
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