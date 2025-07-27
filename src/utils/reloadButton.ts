// Function to generate reload button HTML
export function ReloadButton(): string {
  return `
    <button id="reload-button" class="btn btn-primary" data-testid="reload-button" onclick="reloadPage()">
      <span class="loading loading-spinner loading-sm hidden"></span>
      <span>Reload</span>
    </button>
  `
}