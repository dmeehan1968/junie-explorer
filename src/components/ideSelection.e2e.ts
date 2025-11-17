import { expect } from "@playwright/test"
import { test } from "./ideSelection.dsl"

// Tests for the 'filter by IDE' feature using the IdeSelection toolbar
// Structure and semantics follow the ThemeSwitcher tests and reuse ProjectTable DSL

test.describe('IdeSelection (Filter by IDE)', () => {

  test.beforeEach(async ({ ideSelection }) => {
    await ideSelection.navigateTo('/')
    // Ensure a clean filter state for each test
    await ideSelection.enableAllIdes()
  })

  test('toolbar should be visible with one or more IDE buttons', async ({ ideSelection }) => {
    await expect(ideSelection.toolbar).toBeVisible()
    const buttonCount = await ideSelection.allIdeButtons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })

  test('selecting a single IDE should filter table rows to only matching entries', async ({ ideSelection, page }) => {
    const ideNames = await ideSelection.listIdeNames()
    expect(ideNames.length).toBeGreaterThan(0)

    const target = ideNames[0]

    // Enable only the target IDE
    await ideSelection.enableOnlyIde(target)

    // Wait until all visible rows include the target IDE
    await ideSelection.waitUntilRowsIncludeAnyIdes([target])

    // There should be one or more visible rows
    await expect(ideSelection.visibleProjectRowCount).resolves.toBeGreaterThan(0)

    // And all visible rows should include the target IDE
    await ideSelection.waitUntilRowsIncludeAnyIdes([target])
  })

  test('enabling a second IDE should broaden the filter (OR behavior)', async ({ ideSelection }) => {
    const ideNames = await ideSelection.listIdeNames()
    expect(ideNames.length).toBeGreaterThan(1)

    const [first, second] = ideNames

    // Start with only first IDE enabled
    await ideSelection.enableOnlyIde(first)
    await ideSelection.waitUntilRowsIncludeAnyIdes([first])
    const countWithFirst = await ideSelection.visibleProjectRowCount

    // Now enable a second IDE
    await ideSelection.enableIde(second)

    // Rows should include either first or second IDE
    await ideSelection.waitUntilRowsIncludeAnyIdes([first, second])
    const countWithFirstOrSecond = await ideSelection.visibleProjectRowCount

    // The number of visible rows should be >= the count with only the first IDE
    expect(countWithFirstOrSecond).toBeGreaterThanOrEqual(countWithFirst)
  })

  test('enabling all IDEs should show all project rows and hide no-match message', async ({ ideSelection, page }) => {
    // First, limit to only one IDE
    const ideNames = await ideSelection.listIdeNames()
    const target = ideNames[0]
    await ideSelection.enableOnlyIde(target)
    await ideSelection.waitUntilRowsIncludeAnyIdes([target])

    // Then enable all again
    await ideSelection.enableAllIdes()

    // Wait for all rows to be visible again (visible count equals total count)
    const total = await ideSelection.totalProjectRowCount
    await page.waitForFunction(() => {
      const all = Array.from(document.querySelectorAll('#projects-table tbody tr'))
      const visible = all.filter(r => (r as HTMLElement).offsetParent !== null)
      return all.length > 0 && visible.length === all.length
    })

    const visible = await ideSelection.visibleProjectRowCount
    expect(visible).toEqual(total)

    // "no matching projects" message should be hidden
    await expect(ideSelection.noMatchingProjects).toBeHidden()
  })
})
