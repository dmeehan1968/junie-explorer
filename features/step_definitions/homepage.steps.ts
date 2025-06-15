import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/world.js';

// Background steps
Given('the application has access to the JetBrains logs directory', async function (this: ICustomWorld) {
  // This step assumes the application is running and has access to the logs directory
  // In a real test environment, we might want to verify this by checking if the server is running
  // For now, we'll just mark this as a precondition that should be met
  expect(this.homePage).toBeDefined();
});

Given('the user has a web browser', async function (this: ICustomWorld) {
  // This step is satisfied by our browser initialization in the hooks
  expect(this.page).toBeDefined();
  expect(this.browser).toBeDefined();
});

// Common steps used across scenarios
Given('there are JetBrains projects in the logs', async function (this: ICustomWorld) {
  // This step assumes that the application has projects to display
  // In a real test environment, we might want to set up test data
  // For now, we'll assume the application has access to real or mock data
  expect(this.homePage).toBeDefined();
});

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
