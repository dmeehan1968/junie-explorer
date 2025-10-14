/** @jsxImportSource @kitajs/html */
import { Children } from "@kitajs/html"

export type ConditionalProps = {
  condition: boolean
  children?: Children
}

export const Conditional = ({ condition, children }: ConditionalProps) => {
  return condition
    ? <>{children}</>
    : null
}
