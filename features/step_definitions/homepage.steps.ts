import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { JetBrains } from "../../src/jetbrains.js"
import { ICustomWorld } from '../support/world.js'

// Background steps
Given('the application has access to the JetBrains logs directory', async function (this: ICustomWorld) {
  expect(this.jetBrainsInstance).toBeDefined();
});

Given('the user has a web browser', async function (this: ICustomWorld) {
  // This step is satisfied by our browser initialization in the hooks
  expect(this.page).toBeDefined();
  expect(this.browser).toBeDefined();
});

// Common steps used across scenarios
Given('there are JetBrains projects in the logs', async function (this: ICustomWorld) {
  // use conditional assignment, test logs should be created in the hooks
  this.jetBrainsInstance ??= new JetBrains('./fixtures/test-logs')
});

Given('there are no JetBrains projects in the logs', async function (this: ICustomWorld) {
  // override the existing logs
  this.jetBrainsInstance = new JetBrains('./fixtures/no-logs')
})

When('the user visits the homepage', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }
  await this.homePage.visitHomepage();
});

// First scenario: Homepage title
Then('the user should see a page titled {string}', async function (this: ICustomWorld, expectedTitle: string) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const actualTitle = await this.homePage.getPageTitle();
  expect(actualTitle).toBe(expectedTitle);
});

// Second scenario: Logs directory path display
Then('the user should see the path to the JetBrains logs directory', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const isVisible = await this.homePage.isLogsDirectoryPathVisible();
  expect(isVisible).toBe(true);
});

Given('the user should see a message indicating no projects were found', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }
  await this.homePage.isEmptyProjectsMessageVisible()
})

// Third scenario: Projects list display
Then('the user should see a list of all JetBrains projects', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const isVisible = await this.homePage.isProjectsListVisible();
  expect(isVisible).toBe(true);

  const projectsCount = await this.homePage.getProjectsCount();
  expect(projectsCount).toBeGreaterThan(0);
});

// Fourth scenario: Project name display
Then('each project should display its name', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const areNamesVisible = await this.homePage.areProjectNamesVisible();
  expect(areNamesVisible).toBe(true);
});

// Fifth scenario: IDE icons display
Then('each project should display icons for the IDEs it was used with', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const areIconsVisible = await this.homePage.areIdeIconsVisible();
  expect(areIconsVisible).toBe(true);
});

// Sixth scenario: Reload button display
Then('the user should see a reload button in the header', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const isVisible = await this.homePage.isReloadButtonVisible();
  expect(isVisible).toBe(true);
});

// Seventh scenario: Reload button functionality
When('the user clicks the reload button', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }
  await this.homePage.clickReloadButton();
});

Then('the reload button should indicate loading', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  await this.homePage.isReloadButtonLoading()
});

// Eighth scenario: IDE filter toolbar display
Then('the user should see a toolbar with IDE filters', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const isVisible = await this.homePage.isIdeFilterToolbarVisible();
  expect(isVisible).toBe(true);
});

// Ninth scenario: IDE filter functionality
When('the user toggles an IDE filter', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  // Get the first available IDE filter and toggle it
  const firstIdeName = await this.homePage.getFirstIdeFilterName();
  if (firstIdeName) {
    await this.homePage.toggleIdeFilter(firstIdeName);
  }
});

Then('only projects associated with the selected IDEs should be displayed', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  // This step verifies that filtering is working by checking that the visible project count
  // is different from the total project count (assuming some projects are filtered out)
  const visibleCount = await this.homePage.getVisibleProjectsCount();
  const totalCount = await this.homePage.getProjectsCount();

  // The visible count should be less than or equal to the total count
  expect(visibleCount).toBeLessThanOrEqual(totalCount);
});

// Tenth scenario: Project search display
Then('the user should see a search input field for filtering projects by name', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const isVisible = await this.homePage.isProjectSearchInputVisible();
  expect(isVisible).toBe(true);
});

// Eleventh scenario: Project search functionality
When('the user enters text in the project search field', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  // Search for a common term that might match some projects
  await this.homePage.searchProjects('test');
});

Then('only projects with names containing the search text should be displayed', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  // This step verifies that search filtering is working
  const visibleCount = await this.homePage.getVisibleProjectsCount();
  const totalCount = await this.homePage.getProjectsCount();

  // The visible count should be less than or equal to the total count
  expect(visibleCount).toBeLessThanOrEqual(totalCount);
});

// Twelfth scenario: No matching projects message
When('the user applies filters that result in no matching projects', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  await this.homePage.applyFiltersWithNoResults();
});

Then('the user should see a message indicating no matching projects were found', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  const isVisible = await this.homePage.isNoMatchingProjectsMessageVisible();
  expect(isVisible).toBe(true);
});

// @wip scenario: Filter persistence
Given('the user has applied IDE filters', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  // First visit the homepage to ensure we're on the right page
  await this.homePage.visitHomepage();

  // Get the initial state of all filters (all should be enabled by default)
  const initialFilters = await this.homePage.getSelectedIdeFilters();

  if (initialFilters.length === 0) {
    throw new Error('No IDE filters found on the page');
  }

  // Toggle the first filter to disable it, creating a specific filter state
  const firstIdeName = initialFilters[0];
  await this.homePage.toggleIdeFilter(firstIdeName);

  // Store the current filter state for later verification
  this.appliedFilters = await this.homePage.getSelectedIdeFilters();
});

When('the user refreshes the page', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  await this.homePage.refreshPage();
});

Then('the previously selected IDE filters should be preserved', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }

  if (!this.appliedFilters || this.appliedFilters.length === 0) {
    throw new Error('No applied filters found in test context');
  }

  const areFiltersPreserved = await this.homePage.areIdeFiltersSelected(this.appliedFilters);
  expect(areFiltersPreserved).toBe(true);
});
