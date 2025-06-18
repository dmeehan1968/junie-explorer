import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { ICustomWorld } from '../support/world.js'

// Project-specific Given steps
Given('a project', async function (this: ICustomWorld) {
  this.currentProject = 'default.999999'
  this.currentIssue = '4f066129-2524-4032-8356-5f52fa6e531d'
});

Given('a project has been used with multiple JetBrains IDEs', async function (this: ICustomWorld) {
  this.currentProject = 'multiple-ide.999999'
  this.currentIssue = '4e3d73fe-0ce8-474b-815d-24b641c2197d'
});

Given('a project without issues', async function (this: ICustomWorld) {
  this.currentProject = 'no-issues.999999'
})

Given('a project without tasks', async function (this: ICustomWorld) {
  this.currentProject = 'no-tasks.999999'
  this.currentIssue = '4f066129-2524-4032-8356-5f52fa6e531d'
});

When('the user visits the project', async function (this: ICustomWorld) {
  if (!this.currentProject) {
    throw new Error('No project selected for the current step');
  }
  await this.projectPage.visit(this.currentProject);
});

// When steps for project interactions
When('the user clicks on the project link', async function (this: ICustomWorld) {
  if (!this.currentProject) {
    throw new Error('No project selected for the current step');
  }
  await this.homePage.clickProjectName(this.currentProject);
});

When('the user visits the project details page', async function (this: ICustomWorld) {
  await this.projectPage.visit('default.999999');
});

When('the user clicks on an issue in the list', async function (this: ICustomWorld) {
  this.currentIssue = await this.projectPage.clickOnFirstIssue();
});

// Then steps for project page assertions
Then('the user should be taken to a page for that specific project', async function (this: ICustomWorld) {
  const currentUrl = await this.projectPage.getCurrentUrl();
  expect(currentUrl).toContain(`/project/${this.currentProject}`);
});

Then('the user should see a page titled with the project name', async function (this: ICustomWorld) {
  const title = await this.projectPage.getPageTitle();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
});

Then('the user should see a list of issues available for that project', async function (this: ICustomWorld) {
  await expect(this.projectPage.isIssuesListVisible()).resolves.toEqual(true);
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
  await expect(this.projectPage.getCurrentUrl()).resolves.toContain(`/project/${this.currentProject}/issue/${this.currentIssue}`);
});

Then('the user should see a message indicating no issues were found', async function (this: ICustomWorld) {
  await expect(this.projectPage.isNoIssuesMessageVisible()).resolves.toEqual(true);
});
