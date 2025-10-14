/** @jsxImportSource @kitajs/html */

import { Component, Html } from "@kitajs/html"

interface StatusBadgeProps {
  state: string
}

const getStateClass = (state: string): string => {
  const lowerState = state.toLowerCase()

  // Map states to colors based on original CSS
  const stateStyles: { [key: string]: string } = {
    'done': 'bg-green-100 text-green-700 border border-green-200',
    'completed': 'bg-green-100 text-green-700 border border-green-200',
    'finished': 'bg-teal-100 text-teal-700 border border-teal-200',
    'stopped': 'bg-red-100 text-red-800 border border-red-400',
    'failed': 'bg-red-200 text-red-500 border border-red-200',
    'in-progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'running': 'bg-blue-100 text-blue-700 border border-blue-200',
    'new': 'bg-yellow-100 text-orange-600 border border-yellow-200',
    'declined': 'bg-gray-100 text-gray-600 border border-gray-200',
  }

  return stateStyles[lowerState] || stateStyles[lowerState.replace(/\s+/g, '-')] || 'bg-gray-100 text-gray-600 border border-gray-200'
}

export const StatusBadge: Component<StatusBadgeProps> = ({ state }) => (
  <span class={`inline-block px-2 py-1 text-xs font-bold rounded ${getStateClass(state)} whitespace-nowrap`}>
    {state}
  </span>
)