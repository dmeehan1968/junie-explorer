import { Component, Html } from "@kitajs/html"

export const StatsButton: Component = () => (
  <button 
    class="btn btn-secondary" 
    data-testid="stats-button" 
    onclick="window.open('/stats', 'junie-explorer-stats')"
  >
    <span>Stats</span>
  </button>
)