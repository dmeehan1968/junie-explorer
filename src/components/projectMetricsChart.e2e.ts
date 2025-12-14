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
      await projectTable.selectRow('default.999999')
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

    test.describe('AgentType Series Option', () => {
      test('should have AgentType radio button option in Series', async ({ projectMetricsChart }) => {
        await expect(projectMetricsChart.radioButton('AgentType')).toBeVisible()
      })

      test('should be able to select AgentType series', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('AgentType').check()
        await expect(projectMetricsChart.radioButton('AgentType')).toBeChecked()
      })

      test('should show chart with AgentType series and Cost display', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('AgentType').check()
        await projectMetricsChart.radioButton('Cost').check()
        await expect(projectMetricsChart.container).toHaveScreenshot({ animations: "disabled" })
      })

      test('should show chart with AgentType series and Tokens display', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('AgentType').check()
        await projectMetricsChart.radioButton('Tokens').check()
        await expect(projectMetricsChart.container).toHaveScreenshot({ animations: "disabled" })
      })

      test('should show chart with AgentType series and TPS display', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('AgentType').check()
        await projectMetricsChart.radioButton('TPS').check()
        await expect(projectMetricsChart.container).toHaveScreenshot({ animations: "disabled" })
      })

      test('should hide agent type dropdown when AgentType series is selected', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('AgentType').check()
        await projectMetricsChart.radioButton('TPS').check()
        await expect(projectMetricsChart.agentTypeContainer).toBeHidden()
      })
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

    test.describe('TPS Display Option', () => {
      test('should have TPS radio button option', async ({ projectMetricsChart }) => {
        await expect(projectMetricsChart.radioButton('TPS')).toBeVisible()
      })

      test('should hide agent type dropdown when Cost is selected', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('Cost').check()
        await expect(projectMetricsChart.agentTypeContainer).toBeHidden()
      })

      test('should hide agent type dropdown when Tokens is selected', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('Tokens').check()
        await expect(projectMetricsChart.agentTypeContainer).toBeHidden()
      })

      test('should show agent type dropdown when TPS is selected', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('TPS').check()
        await expect(projectMetricsChart.agentTypeContainer).toBeVisible()
      })

      test('should default agent type to Agent', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('TPS').check()
        await expect(projectMetricsChart.agentTypeDropdown).toHaveValue('Assistant')
      })

      test('should have all agent type options', async ({ projectMetricsChart }) => {
        await projectMetricsChart.radioButton('TPS').check()
        const options = projectMetricsChart.agentTypeDropdown.locator('option')
        await expect(options).toHaveCount(6)
        await expect(options.nth(0)).toHaveText('Assistant')
        await expect(options.nth(1)).toHaveText('TaskSummarizer')
        await expect(options.nth(2)).toHaveText('Memorizer')
        await expect(options.nth(3)).toHaveText('ErrorAnalyzer')
        await expect(options.nth(4)).toHaveText('LanguageIdentifier')
        await expect(options.nth(5)).toHaveText('MemoryCompactor')
      })
    })
  })

  test('should show loading indicator during slow fetch', async ({ page, projectTable, projectMetricsChart }) => {
    // Intercept API call and delay it by 1000ms
    await page.route('**/api/projects/graph*', async route => {
      await new Promise(f => setTimeout(f, 1000));
      await route.continue();
    });

    // Select a project to trigger load
    await projectTable.selectRow('default.999999');

    // Check if loader is visible. It should appear after 200ms.
    const loader = page.locator('#chart-loader');
    await expect(loader).toBeVisible({ timeout: 2000 });

    // Check if loader is hidden after load completes
    await expect(loader).toBeHidden({ timeout: 5000 });
  })

})