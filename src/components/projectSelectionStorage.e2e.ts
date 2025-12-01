import { expect } from "@playwright/test"
import { test } from './projectMetricsChart.dsl.js'

test.describe('Project Selection Storage', () => {
  
  test.beforeEach(async ({ projectMetricsChart }) => {
    await projectMetricsChart.navigateTo()
  })

  test('should save selection to cookies and not local storage', async ({ projectTable, page }) => {
    // Ensure clean state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Get first row
    const rows = await projectTable.getAllRows();
    if (rows.length === 0) throw new Error('No projects found to test');
    const firstRow = rows[0];

    // Select the first project
    // The DSL selectRow takes 1-based index
    await projectTable.selectRow(1);

    // Verify Cookie is set
    const cookies = await page.context().cookies();
    const selectionCookie = cookies.find(c => c.name === 'junie-explorer-selectedProjects');
    expect(selectionCookie, 'Cookie should be set').toBeDefined();
    
    // Verify cookie content
    const cookieValue = JSON.parse(decodeURIComponent(selectionCookie?.value || '{}'));
    const projectName = await firstRow.getNameText();
    expect(cookieValue[projectName]).toBe(true);

    // Verify LocalStorage is NOT set
    const lsValue = await page.evaluate(() => localStorage.getItem('junie-explorer-selectedProjects'));
    expect(lsValue, 'LocalStorage should not be used for writing').toBeNull();
  });

  test('should read from local storage if cookie is missing', async ({ projectTable, page }) => {
     // Clear cookies and local storage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    const rows = await projectTable.getAllRows();
    if (rows.length === 0) throw new Error('No projects found to test');
    const firstRow = rows[0];
    const projectName = await firstRow.getNameText();
    
    // Inject legacy setting into LocalStorage
    const legacyState = { [projectName]: true };
    await page.evaluate((state) => {
      localStorage.setItem('junie-explorer-selectedProjects', JSON.stringify(state));
    }, legacyState);

    // Reload page to trigger initialization
    await page.reload();

    // Assert checkbox is checked
    // Need to re-fetch rows after reload
    const rowsAfterReload = await projectTable.getAllRows();
    const firstRowAfterReload = rowsAfterReload[0];
    await expect(firstRowAfterReload.checkbox).toBeChecked();
  });

  test('should only save active selections to cookies', async ({ projectTable, page }) => {
    // Ensure clean state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Get rows
    const rows = await projectTable.getAllRows();
    if (rows.length < 2) throw new Error('Need at least 2 projects to test unselected state');

    const firstRow = rows[0];
    const secondRow = rows[1];

    // Select the first project
    await projectTable.selectRow(1);
    // Ensure second project is not selected
    await expect(secondRow.checkbox).not.toBeChecked();

    // Verify Cookie content
    const cookies = await page.context().cookies();
    const selectionCookie = cookies.find(c => c.name === 'junie-explorer-selectedProjects');
    expect(selectionCookie, 'Cookie should be set').toBeDefined();

    const cookieValue = JSON.parse(decodeURIComponent(selectionCookie?.value || '{}'));
    const firstProjectName = await firstRow.getNameText();
    const secondProjectName = await secondRow.getNameText();

    expect(cookieValue[firstProjectName]).toBe(true);
    expect(cookieValue[secondProjectName]).toBeUndefined();

    // Verify that the cookie object only has 1 key
    expect(Object.keys(cookieValue).length).toBe(1);

    // Select the second project
    await projectTable.selectRow(2);

    const cookies2 = await page.context().cookies();
    const selectionCookie2 = cookies2.find(c => c.name === 'junie-explorer-selectedProjects');
    const cookieValue2 = JSON.parse(decodeURIComponent(selectionCookie2?.value || '{}'));

    expect(cookieValue2[firstProjectName]).toBe(true);
    expect(cookieValue2[secondProjectName]).toBe(true);
    expect(Object.keys(cookieValue2).length).toBe(2);

    // Unselect the first project
    await projectTable.selectRow(1);

    const cookies3 = await page.context().cookies();
    const selectionCookie3 = cookies3.find(c => c.name === 'junie-explorer-selectedProjects');
    const cookieValue3 = JSON.parse(decodeURIComponent(selectionCookie3?.value || '{}'));

    expect(cookieValue3[firstProjectName]).toBeUndefined();
    expect(cookieValue3[secondProjectName]).toBe(true);
    expect(Object.keys(cookieValue3).length).toBe(1);
  });
});
