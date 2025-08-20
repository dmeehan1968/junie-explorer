import { Component, Html } from "@kitajs/html"

// AppBody now forwards arbitrary attributes (e.g., data-project-id) to the <body>
export const AppBody: Component = ({ children, ...props }: any) => (
  <body {...props} class="bg-base-200 p-5">
    <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
      {children}
    </div>
  </body>
)