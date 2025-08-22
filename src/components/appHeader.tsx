import { Children, Component, Html } from "@kitajs/html"

export const AppHeader: Component<{ actions: Children, title?: string }> = ({ actions, title }) => {
  return (
    <div class="flex justify-between items-start mb-5 pb-3 border-b-2 border-base-300">
      <h1 class="text-3xl font-bold text-primary flex-1 mr-8">Junie Explorer{title ? `: ${title}` : ''}</h1>
      <div class="flex items-center gap-3">
        {actions}
      </div>
    </div>
  )
}