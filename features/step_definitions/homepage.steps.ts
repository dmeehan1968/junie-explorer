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
