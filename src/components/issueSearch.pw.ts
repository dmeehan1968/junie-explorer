/** @jsxImportSource @kitajs/html */

import { expect } from "@playwright/test"
import { test } from "./issueSearch.dsl"

test.describe('Issue Search', () => {

  test('search input is visible on project page', async ({ issueSearch }) => {
    await issueSearch.navigateTo()
    await expect(issueSearch.searchContainer).toBeVisible()
    await expect(issueSearch.searchInput).toBeVisible()
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
