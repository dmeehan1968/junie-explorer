import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { ICustomWorld } from '../support/world.js'

// Project-specific Given steps
Given('a project has been used with multiple JetBrains IDEs', async function (this: ICustomWorld) {
  // This step assumes test data includes projects with multiple IDEs
  // The test data setup should ensure this condition is met
  expect(this.jetBrainsInstance).toBeDefined();
});

Given('there are issues for a specific JetBrains project', async function (this: ICustomWorld) {
  // This step assumes test data includes projects with issues
  // The test data setup should ensure this condition is met
  expect(this.jetBrainsInstance).toBeDefined();
});

Given('there are no issues for a specific JetBrains project', async function (this: ICustomWorld) {
  // This step assumes test data includes projects without issues
  // The test data setup should ensure this condition is met
  expect(this.jetBrainsInstance).toBeDefined();
});

Given('the user is on a project details page', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }
  // Navigate to a test project details page
  await this.projectPage.visitProjectDetailsPage('narrowboats.30291293');
});

// When steps for project interactions
When('the user clicks on a project link on the homepage', async function (this: ICustomWorld) {
  if (!this.homePage) {
    throw new Error('HomePage not initialized');
  }
  // Click on the first project link
  await this.homePage.clickFirstProjectLink();
});

When('the user visits the project details page', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }
  await this.projectPage.visitProjectDetailsPage('narrowboats.30291293');
});

When('the user clicks on the {string} link in the breadcrumb navigation', async function (this: ICustomWorld, linkText: string) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  if (linkText === 'Projects') {
    await this.projectPage.clickProjectsLinkInBreadcrumb();
  } else {
    // Handle other breadcrumb links as needed
    await this.projectPage.click(`[data-testid="breadcrumb-${linkText.toLowerCase()}"]`);
  }
});

When('the user clicks on an issue in the list', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }
  await this.projectPage.clickOnFirstIssue();
});

// Then steps for project page assertions
Then('the user should be taken to a page for that specific project', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const currentUrl = await this.projectPage.getCurrentUrl();
  expect(currentUrl).toContain('/project/');
});

Then('the user should see a page titled with the project name', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const title = await this.projectPage.getPageTitle();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
});

Then('the user should see a list of issues available for that project', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isVisible = await this.projectPage.isIssuesListVisible();
  expect(isVisible).toBe(true);
});

Then('the user should see icons for each IDE that was used with the project', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const areVisible = await this.projectPage.areIdeIconsVisible();
  expect(areVisible).toBe(true);
});

Then('the user should see breadcrumb navigation showing the current location', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isVisible = await this.projectPage.isBreadcrumbNavigationVisible();
  expect(isVisible).toBe(true);
});

Then('the user should be taken back to the homepage', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const currentUrl = await this.projectPage.getCurrentUrl();
  expect(currentUrl).toMatch(/\/$|\/index/);
});

Then('the page should redirect to the refresh route', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const currentUrl = await this.projectPage.getCurrentUrl();
  expect(currentUrl).toContain('/refresh');
});

Then('the user should see a graph visualizing issue costs over time', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isVisible = await this.projectPage.isCostOverTimeGraphVisible();
  expect(isVisible).toBe(true);
});

Then('no cost over time graph should be displayed', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isNotDisplayed = await this.projectPage.isCostOverTimeGraphNotDisplayed();
  expect(isNotDisplayed).toBe(true);
});

Then('the user should see a project summary table below the graph', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isVisible = await this.projectPage.isProjectSummaryTableVisible();
  expect(isVisible).toBe(true);
});

Then('the summary table should display aggregated metrics for all issues', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const hasMetrics = await this.projectPage.doesSummaryTableDisplayAggregatedMetrics();
  expect(hasMetrics).toBe(true);
});

Then('the metrics should include input tokens, output tokens, cache tokens, cost, total time, and elapsed time', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const hasMetrics = await this.projectPage.doesSummaryTableDisplayAggregatedMetrics();
  expect(hasMetrics).toBe(true);
});

Then('all numeric values should be formatted with thousands separators', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const areFormatted = await this.projectPage.areNumericValuesFormattedWithThousandsSeparators();
  expect(areFormatted).toBe(true);
});

Then('the elapsed time should be formatted to show days, hours, and minutes, omitting any parts which are zero', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isFormatted = await this.projectPage.isElapsedTimeFormattedCorrectly();
  expect(isFormatted).toBe(true);
});

Then('the user should see a list of all issues for that project', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isVisible = await this.projectPage.isIssueListWithDetailsVisible();
  expect(isVisible).toBe(true);
});

Then('each issue should display its name and state', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const hasNameAndState = await this.projectPage.doIssuesDisplayNameAndState();
  expect(hasNameAndState).toBe(true);
});

Then('each issue should display metrics including created date, input tokens, output tokens, cache tokens, cost, and total time', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const hasMetrics = await this.projectPage.doIssuesDisplayMetrics();
  expect(hasMetrics).toBe(true);
});

Then('each issue should display its current state with appropriate styling', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const hasStyled = await this.projectPage.doIssuesDisplayStateWithStyling();
  expect(hasStyled).toBe(true);
});

Then('the user should be taken to a page for that specific issue', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const currentUrl = await this.projectPage.getCurrentUrl();
  expect(currentUrl).toContain('/issue/');
});

Then('the user should see a message indicating no issues were found', async function (this: ICustomWorld) {
  if (!this.projectPage) {
    throw new Error('ProjectPage not initialized');
  }

  const isVisible = await this.projectPage.isNoIssuesMessageVisible();
  expect(isVisible).toBe(true);
});
