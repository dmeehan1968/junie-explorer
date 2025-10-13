/** @jsxImportSource @kitajs/html */

export const Divider = (props: { id: string, children: JSX.Element }) => (
  <div id={props.id} class={'divider divider-secondary m-8'}>
    <span class={'text-lg bg-secondary text-secondary-content rounded p-2'}>{props.children}</span>
  </div>
)