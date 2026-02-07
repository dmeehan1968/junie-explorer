import { Component, Html } from "@kitajs/html"

// AppBody now forwards arbitrary attributes (e.g., data-project-id) to the <body>
export const AppBody: Component = ({ children, ...props }: any) => (
  <body {...props} class="bg-base-200 p-5">
    <div id="loadingOverlay" class="fixed inset-0 bg-base-300/50 backdrop-blur-[2px] z-[9999] hidden flex items-center justify-center">
      <div class="bg-base-100 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <span class="font-bold text-lg">Processing...</span>
      </div>
    </div>
    <div class="max-w-[1440px] mx-auto bg-base-100 p-8 rounded-lg shadow-lg">
      {children}
    </div>
  </body>
)