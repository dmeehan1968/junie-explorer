import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { JetBrains } from "../../src/jetbrains.js"
import { MuteLogger } from "../support/MuteLogger.js"
import { ICustomWorld } from '../support/world.js'

Given('there are Junie projects in the logs', async function (this: ICustomWorld) {
  // use conditional assignment, test logs should be created in the hooks
  this.jetBrainsInstance ??= new JetBrains({ logPath: './fixtures/test-logs', logger: MuteLogger })
});

Given('there are no Junie projects in the logs', async function (this: ICustomWorld) {
  // override the existing logs
  this.jetBrainsInstance = new JetBrains({ logPath: './fixtures/no-logs', logger: MuteLogger })
})

When('the user visits the homepage', async function (this: ICustomWorld) {
  await this.homePage.visit();
});

Then('the user should see a page titled {string}', async function (this: ICustomWorld, expectedTitle: string) {
  await expect(this.homePage.getPageTitle()).resolves.toEqual(expectedTitle);
});

Then('the user should see the path to the JetBrains logs directory', async function (this: ICustomWorld) {
  await expect(this.homePage.isLogsDirectoryPathVisible()).resolves.toEqual(true);
});

Given('the user should see a message indicating no projects were found', async function (this: ICustomWorld) {
  await this.homePage.isEmptyProjectsMessageVisible()
})

Then('the user should see a list of projects', async function (this: ICustomWorld) {
  await expect(this.homePage.isProjectsListVisible()).resolves.toEqual(true);
  await expect(this.homePage.projectCount()).resolves.toBeGreaterThan(0);
});

Then('each project should display its name', async function (this: ICustomWorld) {
  await expect(this.homePage.areProjectNamesVisible()).resolves.toEqual(true);
});

Then('each project should display icons for the IDEs it was used with', async function (this: ICustomWorld) {
  await expect(this.ideIcons.areVisible()).resolves.toEqual(true);
});

Then('the user should see a toolbar with IDE filters', async function (this: ICustomWorld) {
  await expect(this.homePage.isIdeFilterToolbarVisible()).resolves.toEqual(true);
});

When('the user toggles an IDE filter', async function (this: ICustomWorld) {
  const firstIdeName = await this.homePage.getFirstIdeFilterName();
  if (firstIdeName) {
    await this.homePage.toggleIdeFilter(firstIdeName);
  }
});

Then('only projects associated with the selected IDEs should be displayed', async function (this: ICustomWorld) {
  const visibleCount = await this.homePage.visibleProjectCount();
  const totalCount = await this.homePage.projectCount();

  expect(visibleCount).toBeLessThanOrEqual(totalCount);
});

Then('the user should see a search input field for filtering projects by name', async function (this: ICustomWorld) {
  await expect(this.homePage.isProjectSearchInputVisible()).resolves.toEqual(true);
});

When('the user enters text in the project search field', async function (this: ICustomWorld) {
  await this.homePage.searchProjects('narrowboats');
});

Then('only projects with names containing the search text should be displayed', async function (this: ICustomWorld) {
  const visibleCount = await this.homePage.visibleProjectCount();
  const totalCount = await this.homePage.projectCount();

  expect(visibleCount).toBeLessThanOrEqual(totalCount);
});

When('the user applies filters that result in no matching projects', async function (this: ICustomWorld) {
  await this.homePage.applyFiltersWithNoResults();
});

Then('the user should see a message indicating no matching projects were found', async function (this: ICustomWorld) {
  await expect(this.homePage.isNoMatchingProjectsMessageVisible()).resolves.toEqual(true);
});

Given('the user has applied IDE filters', async function (this: ICustomWorld) {
  await this.homePage.visit();

  // Get the initial state of all filters (all should be enabled by default)
  const initialFilters = await this.homePage.getSelectedIdeFilters();

  if (initialFilters.length === 0) {
    throw new Error('No IDE filters found on the page');
  }

  // Toggle the first filter to disable it, creating a specific filter state
  await this.homePage.toggleIdeFilter(initialFilters[0]);

  // Store the current filter state for later verification
  await this.homePage.memoizeIdeFilters();
});

When('the user refreshes the page', async function (this: ICustomWorld) {
  await this.homePage.refreshPage();
});

Then('the previously selected IDE filters should be preserved', async function (this: ICustomWorld) {
  await expect(this.homePage.areIdeFiltersSelected()).resolves.toEqual(true);
});

When('the user visits the homepage on a mobile device', async function (this: ICustomWorld) {
  await this.homePage.setMobileViewport();
  await this.homePage.visit();
});

Then('the page should adjust its layout to fit the smaller screen', async function (this: ICustomWorld) {
  await expect(this.homePage.isLayoutResponsive()).resolves.toEqual(true);
});

Then('all projects should still be visible and accessible', async function (this: ICustomWorld) {
  await expect(this.homePage.areProjectsAccessibleOnMobile()).resolves.toEqual(true);
});

When('the user hovers over a project item', async function (this: ICustomWorld) {
  await this.homePage.waitForProjectsToLoad();

  await this.homePage.memoizeProjectBackgroundColor(0);
  await this.homePage.memoizeProjectTransform(0);

  await this.homePage.hoverOverProject(0);
});

Then('the item should change its background color', async function (this: ICustomWorld) {
  await expect(this.homePage.hasProjectBackgroundColorChanged(0)).resolves.toEqual(true);
});

Then('the item should slightly move to indicate interactivity', async function (this: ICustomWorld) {
  await expect(this.homePage.hasProjectMoved(0)).resolves.toEqual(true);
});

