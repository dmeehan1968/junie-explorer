/** @jsxImportSource @kitajs/html */
import { Children } from "@kitajs/html"

export type DividerProps = {
  id: string
  children?: Children
}

export const Divider = (props: DividerProps) => (
  <div id={props.id} class={'divider divider-secondary m-8'}>
    <span class={'text-lg bg-secondary text-secondary-content rounded p-2'}>{props.children}</span>
  </div>
)
