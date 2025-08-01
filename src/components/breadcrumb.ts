import { escapeHtml } from '../utils/escapeHtml.js'

export interface BreadcrumbItem {
  label: string
  href?: string
  testId?: string
}

export interface BreadcrumbOptions {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Generates HTML for breadcrumb navigation
 * @param options - Breadcrumb configuration options
 * @returns HTML string for breadcrumb navigation
 */
export function Breadcrumb(options: BreadcrumbOptions): string {
  const { items, className = 'bg-base-200 mb-5' } = options

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1
    const label = escapeHtml(item.label)
    
    if (isLast || !item.href) {
      // Last item or item without href - not clickable
      return `<li class="text-base-content/70"${item.testId ? ` data-testid="${item.testId}"` : ''}>${label}</li>`
    } else {
      // Clickable item
      return `<li><a href="${item.href}" class="text-primary hover:text-primary-focus"${item.testId ? ` data-testid="${item.testId}"` : ''}>${label}</a></li>`
    }
  }).join('')

  return `
    <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation" class="${className}">
      <div class="breadcrumbs rounded-md px-3 py-2">
        <ul>
          ${breadcrumbItems}
        </ul>
      </div>
    </nav>
  `
}