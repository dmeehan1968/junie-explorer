/** @jsxImportSource @kitajs/html */

import { Component, Html, Children } from "@kitajs/html"

export interface ToggleComponentProps {
  expandIcon: Children
  collapseIcon: Children
  testId?: string
  index: number
}

export const ToggleComponent: Component<ToggleComponentProps> = ({ 
  expandIcon, 
  collapseIcon, 
  testId = 'toggle',
}) => {

  return (
    <button 
      class="content-toggle-btn absolute top-2 right-2 z-10 bg-white/50 hover:bg-white/100 border border-gray-300 rounded p-1 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" 
      onclick="toggleContentExpansion(this)" 
      data-testid={testId}
      data-expanded="false"
      title="Toggle content"
    >
      <span class="expand-icon">{expandIcon}</span>
      <span class="collapse-icon hidden">{collapseIcon}</span>
    </button>
  )
}