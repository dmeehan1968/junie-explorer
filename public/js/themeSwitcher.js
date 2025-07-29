// Theme switcher functionality for DaisyUI
(function() {
  'use strict';

  // Get the current theme from localStorage or default to 'auto'
  function getCurrentTheme() {
    return localStorage.getItem('theme') || 'auto';
  }

  // Set theme on the html element
  function applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', theme);
    }
  }

  // Set theme and save to localStorage
  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }

  // Initialize theme on page load
  function initTheme() {
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    
    // Listen for system theme changes when in auto mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (getCurrentTheme() === 'auto') {
        applyTheme('auto');
      }
    });
  }

  // Make setTheme available globally
  window.setTheme = setTheme;

  // Initialize theme when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();