// Function to generate version banner HTML
import { Version } from "../jetbrains.js"

export function VersionBanner(version?: Version): string {
  if (!version) {
    return ''
  }
  
  return `
          <div class="version-banner" data-testid="version-banner">
            <div class="version-content">
              <span class="version-text">
                New version available: ${version.newVersion}
                (you have ${version.currentVersion})
              </span>
              <a href="${version.releaseUrl}" target="_blank" class="version-link" data-testid="version-link">View Release</a>
            </div>
          </div>
          `
}