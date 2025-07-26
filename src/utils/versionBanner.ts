// Function to generate version banner HTML
export function VersionBanner(version: { tag_name: string; html_url: string } | undefined): string {
  if (!version) {
    return ''
  }
  
  return `
          <div class="version-banner" data-testid="version-banner">
            <div class="version-content">
              <span class="version-text">New version available: ${version.tag_name}</span>
              <a href="${version.html_url}" target="_blank" class="version-link" data-testid="version-link">View Release</a>
            </div>
          </div>
          `
}