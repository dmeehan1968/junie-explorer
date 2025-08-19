export interface ToggleComponentOptions {
  expandIcon: string
  collapseIcon: string
  testIdPrefix?: string
  index: number
}

/**
 * Creates a reusable toggle component that replaces expand/collapse buttons
 * with a single button that toggles state
 * @param options - Configuration options for the toggle component
 * @returns HTML string representing the toggle component
 */
export function ToggleComponent(options: ToggleComponentOptions): string {
  const {
    expandIcon,
    collapseIcon,
    testIdPrefix = 'toggle',
    index
  } = options

  const testId = `${testIdPrefix}-${index}`

  return `
    <button 
      class="content-toggle-btn absolute top-2 right-2 z-10 bg-white/50 hover:bg-white/100 border border-gray-300 rounded p-1 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" 
      onclick="toggleContentExpansion(this)" 
      data-testid="${testId}"
      data-expanded="false"
      title="Toggle content"
    >
      <span class="expand-icon">${expandIcon}</span>
      <span class="collapse-icon hidden">${collapseIcon}</span>
    </button>
  `
}