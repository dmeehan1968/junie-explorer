/** @jsxImportSource @kitajs/html */

import { expect } from "@playwright/test"
import { test } from "./issueSearch.dsl"

test.describe('Issue Search', () => {

  test('search input is visible on project page', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await expect(issueSearch.searchContainer).toBeVisible()
    await expect(issueSearch.searchInput).toBeVisible()
  })

  test('submit button is visible on project page', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await expect(issueSearch.submitButton).toBeVisible()
  })

  test('clicking submit button triggers search and shows results', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.searchInput.fill('test')
    await issueSearch.submitButton.click()
    await issueSearch.waitForSearchComplete()
    
    await expect(issueSearch.resultCount).toBeVisible()
  })

  test('submit button is disabled while search is in progress', async ({ issueSearch, page }) => {
    await issueSearch.navigateTo()
    await issueSearch.searchInput.fill('test')
    
    // Track whether button was disabled during search
    let wasDisabledDuringSearch = false
    
    // Set up a mutation observer to detect disabled state
    await page.evaluate(() => {
      const btn = document.getElementById('submitSearchBtn')
      if (btn) {
        const observer = new MutationObserver(() => {
          if (btn.hasAttribute('disabled')) {
            (window as any).__buttonWasDisabled = true
          }
        })
        observer.observe(btn, { attributes: true, attributeFilter: ['disabled'] })
      }
    })
    
    await issueSearch.submitButton.click()
    await issueSearch.waitForSearchComplete()
    
    // Check if button was disabled at some point during search
    wasDisabledDuringSearch = await page.evaluate(() => (window as any).__buttonWasDisabled === true)
    
    expect(wasDisabledDuringSearch).toBe(true)
    
    // Button should be re-enabled after search completes
    await expect(issueSearch.submitButton).toBeEnabled()
  })

  test('submit button has visual distinction when disabled', async ({ issueSearch, page }) => {
    await issueSearch.navigateTo()
    await issueSearch.searchInput.fill('test')
    
    // Get the button's opacity when enabled
    const enabledOpacity = await issueSearch.submitButton.evaluate((btn) => {
      return window.getComputedStyle(btn).opacity
    })
    
    // Set up to capture disabled state opacity
    await page.evaluate(() => {
      const btn = document.getElementById('submitSearchBtn')
      if (btn) {
        const observer = new MutationObserver(() => {
          if (btn.hasAttribute('disabled')) {
            (window as any).__disabledOpacity = window.getComputedStyle(btn).opacity
          }
        })
        observer.observe(btn, { attributes: true, attributeFilter: ['disabled'] })
      }
    })
    
    await issueSearch.submitButton.click()
    await issueSearch.waitForSearchComplete()
    
    // Check that the disabled opacity was captured and is less than enabled opacity
    const disabledOpacity = await page.evaluate(() => (window as any).__disabledOpacity)
    
    expect(disabledOpacity).toBeDefined()
    expect(parseFloat(disabledOpacity)).toBeLessThan(parseFloat(enabledOpacity))
  })

  test('clear button is hidden when search input is empty', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await expect(issueSearch.clearButton).toBeHidden()
  })

  test('clear button appears when text is entered', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.searchInput.fill('test')
    await expect(issueSearch.clearButton).toBeVisible()
  })

  test('pressing Enter triggers search and shows results', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.searchInput.fill('test')
    await issueSearch.searchInput.press('Enter')
    await issueSearch.waitForSearchComplete()
    
    await expect(issueSearch.resultCount).toBeVisible()
  })

  test('search results count is displayed after search', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.search('test')
    await issueSearch.waitForSearchComplete()
    
    await expect(issueSearch.resultCount).toBeVisible()
    await expect(issueSearch.resultCount).toContainText(/\d+ of \d+ issues match/)
  })

  test('matching rows are highlighted after search', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.search('a')
    await issueSearch.waitForSearchComplete()
    
    const resultText = await issueSearch.resultCount.textContent()
    const matchCount = parseInt(resultText?.match(/(\d+) of/)?.[1] || '0')
    
    if (matchCount > 0) {
      const highlightedCount = await issueSearch.highlightedRows.count()
      expect(highlightedCount).toBe(matchCount)
    }
  })

  test('clear button removes highlights and hides result count', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.search('a')
    await issueSearch.waitForSearchComplete()
    
    await issueSearch.clearSearch()
    
    await expect(issueSearch.searchInput).toHaveValue('')
    await expect(issueSearch.clearButton).toBeHidden()
    await expect(issueSearch.resultCount).toBeHidden()
    
    const highlightedCount = await issueSearch.highlightedRows.count()
    expect(highlightedCount).toBe(0)
  })

  test('search is case-insensitive', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    
    await issueSearch.search('TEST')
    await issueSearch.waitForSearchComplete()
    const upperResult = await issueSearch.resultCount.textContent()
    
    await issueSearch.clearSearch()
    
    await issueSearch.search('test')
    await issueSearch.waitForSearchComplete()
    const lowerResult = await issueSearch.resultCount.textContent()
    
    expect(upperResult).toBe(lowerResult)
  })

})

test.describe('Regex Toggle', () => {

  test('regex toggle is visible on project page', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await expect(issueSearch.regexToggle).toBeVisible()
    await expect(issueSearch.regexLabel).toBeVisible()
    await expect(issueSearch.regexLabel).toContainText('Use Regex?')
  })

  test('regex toggle is unchecked by default', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await expect(issueSearch.regexToggle).not.toBeChecked()
  })

  test('regex toggle can be enabled', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.enableRegex()
    await expect(issueSearch.regexToggle).toBeChecked()
  })

  test('regex toggle can be disabled after enabling', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.enableRegex()
    await expect(issueSearch.regexToggle).toBeChecked()
    await issueSearch.disableRegex()
    await expect(issueSearch.regexToggle).not.toBeChecked()
  })

  test('search with regex enabled uses regex matching', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.enableRegex()
    // Search for UUID pattern using regex
    await issueSearch.search('[a-f0-9]{8}')
    await issueSearch.waitForSearchComplete()
    await expect(issueSearch.resultCount).toBeVisible()
  })

  test('invalid regex shows error message', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await issueSearch.enableRegex()
    // Invalid regex pattern (unclosed bracket)
    await issueSearch.search('[invalid')
    await issueSearch.waitForSearchComplete()
    await expect(issueSearch.resultCount).toContainText(/Invalid regex|error/i)
  })

})
