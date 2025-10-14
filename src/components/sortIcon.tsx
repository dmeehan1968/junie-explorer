/** @jsxImportSource @kitajs/html */

import { Html, Component } from "@kitajs/html"

export type SortDirection = 'asc' | 'desc'

/**
 * Reusable sort icon component used for table header sort buttons.
 * Matches the icon style used for the Name column.
 */
export const SortIcon: Component<{ direction: 'asc' | 'desc'}> = ({ direction }) => {
  if (direction === 'asc') {
    // Ascending icon (same as used for Name asc)
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="3" y="5" width="6" height="4" rx="1" fill="currentColor"/>
      <rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/>
      <rect x="3" y="15" width="14" height="4" rx="1" fill="currentColor"/>
      <rect x="20" y="10" width="2" height="8" rx="1" fill="currentColor"/>
      <polygon points="21,5 23,10 19,10" fill="currentColor"/>
    </svg>
  }
  // Descending icon (same as used for Name desc)
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <rect x="3" y="5" width="14" height="4" rx="1" fill="currentColor"/>
    <rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/>
    <rect x="3" y="15" width="6" height="4" rx="1" fill="currentColor"/>
    <rect x="20" y="6" width="2" height="8" rx="1" fill="currentColor"/>
    <polygon points="19,14 23,14 21,19" fill="currentColor"/>
  </svg>
}
