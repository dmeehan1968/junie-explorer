import { Then, When } from "@cucumber/cucumber"
import { expect } from "@playwright/test"
import { ICustomWorld } from "../support/world.js"

Then('the user should see a reload button in the header', async function (this: ICustomWorld) {
  await expect(this.reloadButton.isVisible()).resolves.toEqual(true);
});

When('the user clicks the reload button', async function (this: ICustomWorld) {
  await this.reloadButton.click();
});

Then('the reload button should indicate loading', async function (this: ICustomWorld) {
  await this.reloadButton.isLoading()
});

