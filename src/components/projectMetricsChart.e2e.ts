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

})