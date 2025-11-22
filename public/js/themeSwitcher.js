// Theme switcher functionality for DaisyUI
(function() {
  'use strict';

  // Timeout tracking for delayed preview
  let previewTimeout = null;

  // Get the current theme from cookie (preferred) or localStorage or default to 'auto'
  function getCurrentTheme() {
    // Try cookie first
    const cookie = document.cookie || '';
    const match = cookie.split(';').map(p => p.trim()).find(p => p.startsWith('junie-explorer-theme='));
    if (match) {
      const val = decodeURIComponent(match.split('=')[1] || '').trim();
      if (val) return val;
    }
    return 'auto';
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

  // Helper to check if element is effectively visible in the dropdown
  function isElementVisible(element) {
    if (element) {
      const dropdownContent = element.closest('.dropdown-content');
      if (dropdownContent) {
        const style = window.getComputedStyle(dropdownContent);
        // If opacity is effectively 0 or visibility is hidden, ignore the interaction
        if (style.opacity === '0' || style.visibility === 'hidden') {
          return false;
        }
      }
    }
    return true;
  }

  // Set theme and save to cookie
  function setTheme(theme, element) {
    if (!isElementVisible(element)) return;

    try {
      document.cookie = `junie-explorer-theme=${encodeURIComponent(theme)}; Max-Age=31536000; Path=/; SameSite=Lax`;
    } catch (e) {
      // ignore cookie errors
    }
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

  // Preview theme with 400ms delay (for hover)
  function previewTheme(theme, element) {
    if (!isElementVisible(element)) return;

    // Clear any existing timeout
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }
    
    // Set new timeout to apply theme after 400ms
    previewTimeout = setTimeout(() => {
      applyTheme(theme);
      previewTimeout = null;
    }, 400);
  }

  // Restore the saved theme (when leaving hover)
  function restoreTheme() {
    // Clear any pending preview
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      previewTimeout = null;
    }
    
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
  }

  // Make functions available globally
  window.setTheme = setTheme;
  window.previewTheme = previewTheme;
  window.restoreTheme = restoreTheme;

  // Initialize theme when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();