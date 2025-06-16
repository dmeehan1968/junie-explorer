import { Then, When } from "@cucumber/cucumber"
import { expect } from "@playwright/test"
import { ICustomWorld } from "../support/world.js"

When('the user clicks on the {string} link in the breadcrumb navigation', async function (this: ICustomWorld, linkText: string) {
  await this.breadcrumb.click(linkText);
});


Then('the user should see breadcrumb navigation showing the current location', async function (this: ICustomWorld) {
  await expect(this.breadcrumb.isVisible()).resolves.toEqual(true);
});

Then('the user should be taken back to the homepage', async function (this: ICustomWorld) {
  expect(this.breadcrumb.url()).toMatch(/\/$|\/index/);
});

