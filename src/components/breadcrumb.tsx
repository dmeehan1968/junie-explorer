import { Component, Html } from "@kitajs/html"

export interface BreadcrumbItem {
  label: string
  href?: string
  testId?: string
}

export interface BreadcrumbOptions {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumb: Component<BreadcrumbOptions> = ({ items, className = 'bg-base-200 mb-5' }) => {
  return (
    <nav aria-label="breadcrumb" data-testid="breadcrumb-navigation" class={className}>
      <div class="breadcrumbs rounded-md px-3 py-2">
        <ul>
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            
            if (isLast || !item.href) {
              return (
                <li class="text-base-content/70" data-testid={item.testId}>
                  {item.label}
                </li>
              )
            } else {
              return (
                <li>
                  <a href={item.href} class="text-primary hover:text-primary-focus" data-testid={item.testId}>
                    {item.label}
                  </a>
                </li>
              )
            }
          })}
        </ul>
      </div>
    </nav>
  )
}