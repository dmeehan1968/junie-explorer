// Function to generate version banner HTML
import { Component, Html } from "@kitajs/html"
import { Version } from "../jetbrains.js"

export const VersionBanner: Component<{ version?: Version }> = ({ version }) => {
  if (!version) {
    return <></>
  }

  return (
    <div role="alert" class="alert alert-warning shadow-sm my-4" data-testid="version-banner">
      <div class="flex flex-wrap items-center gap-3 w-full">
        <span class="font-medium">
          New version available: {version.newVersion} (you have {version.currentVersion})
        </span>
        <a href={version.releaseUrl} target="_blank" class="btn btn-sm btn-warning" data-testid="version-link">View Release</a>
      </div>
    </div>
  )
}