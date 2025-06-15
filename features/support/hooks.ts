import { Before, After } from '@cucumber/cucumber';
import { ICustomWorld } from './world.js';

Before(async function (this: ICustomWorld) {
  await this.init();
});

After(async function (this: ICustomWorld) {
  await this.cleanup();
});
