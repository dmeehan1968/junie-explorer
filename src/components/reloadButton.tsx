import { Component, Html } from "@kitajs/html"

export const ReloadButton: Component = () => (
  <>
    <script src="/js/reloadPage.js" defer />
    <button id="reload-button" class="btn btn-primary" data-testid="reload-button" onclick="reloadPage()">
      <span class="loading loading-spinner loading-sm hidden"></span>
      <span>Reload</span>
    </button>
  </>
)