import { Component, Html } from "@kitajs/html"

export const IdeSelection: Component<{ ides: { name: string, src: string }[] }> = ({ ides }) => {
  return (
    <div class="flex flex-wrap gap-3 mb-5 p-3 bg-base-200 rounded" data-testid="ide-filter-toolbar">
      <div class="font-medium text-base-content flex items-center">Filter by IDE</div>
      {ides.map(ide =>
        (<div class="ide-filter cursor-pointer transition-all duration-300 p-1 rounded hover:bg-base-300"
              data-testid="ide-filter" data-ide={ide.name} onclick="toggleIdeFilter(this)">
          <img src={ide.src} alt={ide.name} title={ide.name} class="w-8 h-8"/>
        </div>),
      )}
    </div>
  )
}