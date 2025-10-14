import { expect } from "@playwright/test"
import { test } from "./themeSwitcher.dsl.js"

const expectedThemes = [
  'Auto','Light','Dark','Cupcake','Bumblebee','Emerald','Corporate','Synthwave','Retro','Cyberpunk','Valentine','Halloween','Garden','Forest','Aqua','Lofi','Pastel','Fantasy','Wireframe','Black','Luxury','Dracula','CMYK','Autumn','Business','Acid','Lemonade','Night','Coffee','Winter','Dim','Nord','Sunset'
]

test.describe('ThemeSwitcher', async () => {

  for (const { location, url } of [
    { location: 'Home', url: '/' },
    { location: 'Project', url: '/project/default.999999' },
    { location: 'Trajectories', url: '/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/trajectories' },
    { location: 'Events', url: '/project/default.999999/issue/d9210e84-2af4-4e45-a383-cee37492c8e6/task/0/events' },
    { location: 'Stats', url: '/stats' },
  ]) {
    test(`${location} should have a theme switcher button`, async ({ themeSwitcher }) => {
      await themeSwitcher.navigateTo(url)
      await expect(themeSwitcher.dropdownButton.isVisible()).resolves.toEqual(true)
    })
  }

  test('should list all themes in the theme switcher dropdown', async ({ themeSwitcher }) => {
    await themeSwitcher.navigateTo('/')

    await test.step('open dropdown', async () => {
      await themeSwitcher.openDropdown()
      await expect(themeSwitcher.dropdownMenu).toBeVisible()
    })

    await test.step('check theme count', async () => {
      const count = await themeSwitcher.allThemeItems.count()
      expect(count).toBe(expectedThemes.length)
    })

    await test.step('check theme names', async () => {
      // Ensure each expected theme item exists
      for (const theme of expectedThemes) {
        await expect(themeSwitcher.themeItem(theme)).toBeVisible()
      }
    })

  })

  test('hover should preview theme without persisting until clicked', async ({ themeSwitcher, page }) => {
    await themeSwitcher.navigateTo('/')

    const initialTheme = await themeSwitcher.currentTheme
    expect(initialTheme).toEqual('light')

    await test.step('open dropdown', async () => {
      await themeSwitcher.openDropdown()
      await expect(themeSwitcher.dropdownMenu).toBeVisible()
    })

    await test.step('preview cupcake theme', async () => {
      await themeSwitcher.hoverTheme('Cupcake')
      await page.waitForTimeout(600) // wait for 400ms delayed preview to apply
      await expect(themeSwitcher.currentTheme).resolves.toBe('cupcake')
    })

    await test.step('initial theme restores on mouse out', async () => {
      await themeSwitcher.moveMouseOut()
      await page.waitForTimeout(100)
      await expect(themeSwitcher.currentTheme).resolves.toBe(initialTheme)
    })

    await test.step('initial theme preserved on reload', async () => {
      await page.reload()
      await expect(themeSwitcher.currentTheme).resolves.toBe(initialTheme)
    })

  })

  test('click should set and persist theme across reload', async ({ themeSwitcher, page }) => {
    await themeSwitcher.navigateTo('/')

    // default should be 'light'
    await expect(themeSwitcher.currentTheme).resolves.toBe('light')

    await test.step('open dropdown', async () => {
      await themeSwitcher.openDropdown()
      await expect(themeSwitcher.dropdownMenu).toBeVisible()
    })

    await test.step('switch to cupcake', async () => {
      await themeSwitcher.clickTheme('Cupcake')
      await expect(themeSwitcher.currentTheme).resolves.toBe('cupcake')
    })

    await test.step('cupcake preserved on refresh', async () => {
      await page.reload()
      await expect(themeSwitcher.currentTheme).resolves.toBe('cupcake')
    })

  })
})
