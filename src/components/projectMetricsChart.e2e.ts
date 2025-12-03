import { expect } from "@playwright/test"
import { test } from './projectMetricsChart.dsl.js'


test.describe('ProjectMetricsChart', () => {

  test.beforeEach(async ({ projectMetricsChart}) => {

    await projectMetricsChart.navigateTo()
  })

  test('should hide chart with no projects selected', async ({ projectMetricsChart }) => {
    await expect(projectMetricsChart.container).toBeHidden()
  })

  test.describe('one selected project', () => {

    test.beforeEach(async ({ projectTable }) => {
      await projectTable.selectRow(1)
    })

    test('should show chart with one project selected', async ({ projectMetricsChart, projectTable }) => {
      await expect(projectMetricsChart.container).toBeVisible()
    })

    test('should default to show by cost', async ({ projectMetricsChart }) => {
      await projectMetricsChart.radioButton('Cost').isChecked()
    })

    test('should default to group by auto', async ({ projectMetricsChart }) => {
      await projectMetricsChart.radioButton('Auto').isChecked()
    })

    test('should have View by Model option', async ({ projectMetricsChart }) => {
      await projectMetricsChart.radioButton('Model').check()
      await expect(projectMetricsChart.radioButton('Model')).toBeChecked()
    })

    test('should show chart with View by Model', async ({ projectMetricsChart }) => {
      await projectMetricsChart.radioButton('Model').check()
      await expect(projectMetricsChart.container).toHaveScreenshot({ animations: "disabled" })
    })

    for (const displayBy of ['Cost', 'Tokens']) {
      test.describe.parallel(`Display By ${displayBy}`, async () => {
        for (const groupBy of ['Auto', 'Hour', 'Day', 'Week', 'Month']) {
          test.describe(`Group By ${groupBy}`, async () => {
            test('should show chart', async ({ projectMetricsChart}) => {
              await projectMetricsChart.radioButton(displayBy).check()
              await projectMetricsChart.radioButton(groupBy).check()
              await expect(projectMetricsChart.container).toHaveScreenshot({ animations: "disabled" })
            })
          })
        }
      })
    }
  })

  test('should show loading indicator during slow fetch', async ({ page, projectTable, projectMetricsChart }) => {
    // Intercept API call and delay it by 1000ms
    await page.route('**/api/projects/graph*', async route => {
      await new Promise(f => setTimeout(f, 1000));
      await route.continue();
    });

    // Select a project to trigger load
    await projectTable.selectRow(1);

    // Check if loader is visible. It should appear after 200ms.
    const loader = page.locator('#chart-loader');
    await expect(loader).toBeVisible({ timeout: 2000 });

    // Check if loader is hidden after load completes
    await expect(loader).toBeHidden({ timeout: 5000 });
  })

})