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
      class="content-toggle-btn transition-all duration-200 ease-in-out hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" 
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