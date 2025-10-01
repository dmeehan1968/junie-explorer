import { expect } from "@playwright/test"
import { test } from "./reloadButton.dsl.js"

test.describe('ReloadButton', async () => {

  for (const { location, url } of [
    { location: 'Home', url: '/' },
    { location: 'Project', url: '/project/default.999999' },
    { location: 'Trajectories', url: '/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories' },
    { location: 'Events', url: '/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/events' },
    { location: 'Stats', url: '/stats' },
  ]) {
    test(`${location} page should have a visible reload button`, async ({ reloadButton }) => {
      await reloadButton.navigateTo(url)
      await expect(reloadButton.isVisible).resolves.toEqual(true)
    })
  }

})