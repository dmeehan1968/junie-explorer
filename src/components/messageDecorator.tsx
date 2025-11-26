/** @jsxImportSource @kitajs/html */

import { Component, Children } from "@kitajs/html"
import { CollapseIcon } from "./collapseIcon"
import { ExpandIcon } from "./expandIcon"
import { ToggleComponent } from "./toggleComponent"

export interface MessageDecoratorProps {
  klass: string
  testId: string
  left: boolean
  label?: Children
  content: Children
}

export const MessageDecorator: Component<MessageDecoratorProps> = (props) => {
  return (
    <div class={`relative mb-8 ${props.left ? 'mr-48' : 'ml-48'}`}>
      <ToggleComponent
        expandIcon={<ExpandIcon/>}
        collapseIcon={<CollapseIcon/>}
        testId={props.testId}
      />
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow z-50">
          {props.label}
        </h3>
        <div
          class={`rounded shadow pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap wrap-break-word transition-all duration-300 ease-in-out ${props.klass}`}>
          {props.content}
        </div>
      </div>
    </div>
  )
}