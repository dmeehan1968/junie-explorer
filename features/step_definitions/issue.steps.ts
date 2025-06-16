import { When } from "@cucumber/cucumber"
import { ICustomWorld } from "../support/world.js"

When('the user visits project {string} issue {string}', async function (this: ICustomWorld, projectName: string, issueId: string) {

  await this.issuePage.visit(`projects/${projectName}/issue/${issueId}`);

});