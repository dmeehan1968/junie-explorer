// Function to generate version banner HTML
import { Version } from "../jetbrains.js"

export function VersionBanner(version?: Version): string {
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