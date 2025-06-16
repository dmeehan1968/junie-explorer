import { Given, Then, When } from "@cucumber/cucumber"
import { expect } from "@playwright/test"
import { ICustomWorld } from "../support/world.js"

When('the user visits project {string} issue {string}', async function (this: ICustomWorld, projectName: string, issueId: string) {
  await this.issuePage.visit(`projects/${projectName}/issue/${issueId}`);
});

Given('the user visits issue {string}', async function (this: ICustomWorld, issueId: string) {
  await this.issuePage.visit(`issue/${issueId}`);
});

Then('the user should see a page titled with the issue name', async function (this: ICustomWorld) {
  const title = await this.issuePage.getPageTitle();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
});

Then('the user should see a list of tasks available for that issue', async function (this: ICustomWorld) {
  await expect(this.issuePage.isTasksListVisible()).resolves.toEqual(true);
});

Then('the user should be taken back to the project page', async function (this: ICustomWorld) {
  const currentUrl = await this.issuePage.getCurrentUrl();
  expect(currentUrl).toMatch(/\/projects?\/[^\/]+\/?$/);
});

Then('the user should see the issue creation date', async function (this: ICustomWorld) {
  await expect(this.issuePage.isIssueDateVisible()).resolves.toEqual(true);
});

Then('the user should see the issue state with appropriate styling', async function (this: ICustomWorld) {
  await expect(this.issuePage.isIssueStateVisible()).resolves.toEqual(true);
});

Then('the user should see a list of all tasks for that issue', async function (this: ICustomWorld) {
  await expect(this.issuePage.areTaskDetailsVisible()).resolves.toEqual(true);
});

Then('each task should display its ID and creation date', async function (this: ICustomWorld) {
  await expect(this.issuePage.areTaskDetailsVisible()).resolves.toEqual(true);
});

Then('each task should display metrics including input tokens, output tokens, cache tokens, cost, and total time', async function (this: ICustomWorld) {
  await expect(this.issuePage.areTaskMetricsVisible()).resolves.toEqual(true);
});

Then('the task description should be displayed with Markdown formatting', async function (this: ICustomWorld) {
  await expect(this.issuePage.isTaskDescriptionVisible()).resolves.toEqual(true);
});

When('the user clicks on a task in the list', async function (this: ICustomWorld) {
  await this.issuePage.clickOnFirstTask();
});

Then('the user should be taken to a page for that specific task', async function (this: ICustomWorld) {
  const currentUrl = await this.issuePage.getCurrentUrl();
  expect(currentUrl).toContain('/task/');
});

Then('the user should see a message indicating no tasks were found', async function (this: ICustomWorld) {
  await expect(this.issuePage.isNoTasksMessageVisible()).resolves.toEqual(true);
});

Then('each task should display a JSON button', async function (this: ICustomWorld) {
  await expect(this.issuePage.areJsonButtonsVisible()).resolves.toEqual(true);
});

When('the user clicks on the JSON button for a task', async function (this: ICustomWorld) {
  await this.issuePage.clickJsonButton();
});

Then('a JSON viewer should be displayed showing the raw task data', async function (this: ICustomWorld) {
  await expect(this.issuePage.isJsonViewerVisible()).resolves.toEqual(true);
});

Then('the JSON data should be initially displayed in a collapsed view', async function (this: ICustomWorld) {
  await expect(this.issuePage.isJsonViewerCollapsed()).resolves.toEqual(true);
});

Given('the user has opened the JSON viewer for a task', async function (this: ICustomWorld) {
  await this.issuePage.clickJsonButton();
  await expect(this.issuePage.isJsonViewerVisible()).resolves.toEqual(true);
});

When('the user clicks on the JSON button again', async function (this: ICustomWorld) {
  await this.issuePage.clickJsonButton();
});

Then('the JSON viewer should be hidden', async function (this: ICustomWorld) {
  await expect(this.issuePage.isJsonViewerVisible()).resolves.toEqual(false);
});
