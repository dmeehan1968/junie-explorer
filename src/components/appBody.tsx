import { Component, Html } from "@kitajs/html"

export const AppBody: Component = ({ children }) => (
  <body class="bg-base-200 p-5">
  <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
    {children}
  </div>
  </body>
)