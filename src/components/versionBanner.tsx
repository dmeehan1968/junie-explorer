// Function to generate version banner HTML
import { Component, Html } from "@kitajs/html"
import { Version } from "../jetbrains.js"

export const VersionBanner: Component<{ version?: Version }> = ({ version }) => {
  if (!version) {
    return <></>
  }

  return (
    <div class="version-banner" data-testid="version-banner">
      <div class="version-content">
        <span class="version-text">
          New version available: {version.newVersion}
          (you have {version.currentVersion})
        </span>
        <a href={version.releaseUrl} target="_blank" class="version-link" data-testid="version-link">View Release</a>
      </div>
    </div>
  )
}