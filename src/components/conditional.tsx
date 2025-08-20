import { Html, Component } from "@kitajs/html"

export const Conditional: Component<{ condition: boolean }> = ({ condition, children }) => {
  return condition ? <>{children}</> : <></>
}