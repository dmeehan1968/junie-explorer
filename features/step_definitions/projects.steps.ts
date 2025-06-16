import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { ICustomWorld } from '../support/world.js'

// Project-specific Given steps
Given('a project has been used with multiple JetBrains IDEs', async function (this: ICustomWorld) {
  // This step assumes test data includes projects with multiple IDEs
  // The test data setup should ensure this condition is met
  expect(this.jetBrainsInstance).toBeDefined();
});

When('the user visits project {string}', async function (this: ICustomWorld, projectName: string) {
  await this.projectPage.visit(projectName);
});

// When steps for project interactions
When('the user clicks on a project link on the homepage', async function (this: ICustomWorld) {
  await this.homePage.clickFirstProjectLink();
});

When('the user visits the project details page', async function (this: ICustomWorld) {
  await this.projectPage.visit('narrowboats.30291293');
});

When('the user clicks on an issue in the list', async function (this: ICustomWorld) {
  await this.projectPage.clickOnFirstIssue();
});

// Then steps for project page assertions
Then('the user should be taken to a page for that specific project', async function (this: ICustomWorld) {
  const currentUrl = await this.projectPage.getCurrentUrl();
  expect(currentUrl).toContain('/project/');
});

Then('the user should see a page titled with the project name', async function (this: ICustomWorld) {
  const title = await this.projectPage.getPageTitle();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
});

Then('the user should see a list of issues available for that project', async function (this: ICustomWorld) {
  await expect(this.projectPage.isIssuesListVisible()).resolves.toEqual(true);
});

Then('the user should see icons for each IDE that was used with the project', async function (this: ICustomWorld) {
  await expect(this.projectPage.areIdeIconsVisible()).resolves.toEqual(true);
});

Then('the user should see a graph visualizing issue costs over time', async function (this: ICustomWorld) {
  await expect(this.projectPage.isCostOverTimeGraphVisible()).resolves.toEqual(true);
});

Then('the cost over time graph should not be displayed', async function (this: ICustomWorld) {
  await expect(this.projectPage.isCostOverTimeGraphNotDisplayed()).resolves.toEqual(true);
});

Then('the user should see a project summary table below the graph', async function (this: ICustomWorld) {
  await expect(this.projectPage.isProjectSummaryTableVisible()).resolves.toEqual(true);
});

Then('the summary table should display aggregated metrics for all issues', async function (this: ICustomWorld) {
  await expect(this.projectPage.doesSummaryTableDisplayAggregatedMetrics()).resolves.toEqual(true);
});

Then('the metrics should include input tokens, output tokens, cache tokens, cost, total time, and elapsed time', async function (this: ICustomWorld) {
  await expect(this.projectPage.doesSummaryTableDisplayAggregatedMetrics()).resolves.toEqual(true);
});

Then('all numeric values should be formatted with thousands separators', async function (this: ICustomWorld) {
  await expect(this.projectPage.areNumericValuesFormattedWithThousandsSeparators()).resolves.toEqual(true);
});

Then('the elapsed time should be formatted to show days, hours, and minutes, omitting any parts which are zero', async function (this: ICustomWorld) {
  await expect(this.projectPage.isElapsedTimeFormattedCorrectly()).resolves.toEqual(true);
});

Then('the user should see a list of all issues for that project', async function (this: ICustomWorld) {
  await expect(this.projectPage.isIssueListWithDetailsVisible()).resolves.toEqual(true);
});

Then('each issue should display its name and state', async function (this: ICustomWorld) {
  await expect(this.projectPage.doIssuesDisplayNameAndState()).resolves.toEqual(true);
});

Then('each issue should display metrics including created date, input tokens, output tokens, cache tokens, cost, and total time', async function (this: ICustomWorld) {
  await expect(this.projectPage.doIssuesDisplayMetrics()).resolves.toEqual(true);
});

Then('each issue should display its current state with appropriate styling', async function (this: ICustomWorld) {
  await expect(this.projectPage.doIssuesDisplayStateWithStyling()).resolves.toEqual(true);
});

Then('the user should be taken to a page for that specific issue', async function (this: ICustomWorld) {
  await expect(this.projectPage.getCurrentUrl()).resolves.toContain('/issue/');
});

Then('the user should see a message indicating no issues were found', async function (this: ICustomWorld) {
  await expect(this.projectPage.isNoIssuesMessageVisible()).resolves.toEqual(true);
});
