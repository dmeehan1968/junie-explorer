import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { ICustomWorld } from './world.js';
import { createServer } from '../../src/index.js';
import { JetBrains } from '../../src/jetbrains.js';
import { Server } from 'http';
import path from 'path';
import os from 'os';

// Global server instance for all tests
let globalServer: Server;
let globalJetBrainsInstance: JetBrains;
let globalServerPort: number;

BeforeAll(async function () {
  // Create a custom JetBrains instance with the test log path
  globalJetBrainsInstance = new JetBrains(process.env.JETBRAINS_LOG_PATH);

  // Use a different port than the default to avoid conflicts
  globalServerPort = 3001;

  // Create and start the server
  const { app } = createServer({
    jetBrainsInstance: globalJetBrainsInstance,
    port: globalServerPort,
    preload: true
  });

  // Start the server
  globalServer = app.listen(globalServerPort);

  // Wait a moment for the server to start
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log(`Test server started on port ${globalServerPort}`);
});

AfterAll(async function () {
  if (globalServer) {
    await new Promise<void>((resolve, reject) => {
      globalServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('Test server stopped');
  }
});

Before(async function (this: ICustomWorld) {
  // Set the global server info in the world instance
  this.server = globalServer;
  this.jetBrainsInstance = globalJetBrainsInstance;
  this.serverPort = globalServerPort;

  // Initialize browser and page
  await this.init();
});

After(async function (this: ICustomWorld) {
  await this.cleanup();
});
