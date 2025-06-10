import fs from 'fs-extra';
import path from 'path';
import { Task } from './matterhorn.js';
import { jetBrainsPath } from './utils/jetBrainsPath.js';
import { initializeAppState, getMergedProjects } from './utils/appState.js';

function testTaskClass() {
  console.log('Testing Task class...');

  try {
    // Initialize app state to get projects
    console.log('Initializing app state...');
    initializeAppState();

    // Get all projects
    const projects = getMergedProjects();

    if (projects.length === 0) {
      console.log('No projects found. Cannot test Task class.');
      return;
    }

    console.log(`Found ${projects.length} projects.`);

    // Find a task file to test with
    let taskFilePath = null;
    let task = null;

    // Look through projects to find a task file
    projectLoop: for (const project of projects) {
      console.log(`Checking project: ${project.name}`);

      for (const issue of project.issues) {
        if (issue.tasks.length > 0) {
          // We found a task, now we need to find its file path
          const ideName = project.ides[0]; // Use the first IDE
          const projectName = project.name;
          const issueId = issue.id.id;
          const taskIndex = issue.tasks[0].id.index;

          const idePath = path.join(jetBrainsPath, ideName);
          const projectPath = path.join(idePath, 'projects', projectName);
          const issuePath = path.join(projectPath, 'matterhorn', '.matterhorn', 'issues', `chain-${issueId}`);
          
          if (fs.existsSync(issuePath)) {
            const taskFileName = `task-${taskIndex}.json`;
            const taskFilePath = path.join(issuePath, taskFileName);
            
            if (fs.existsSync(taskFilePath)) {
              console.log(`Found task file: ${taskFilePath}`);

              // Create a Task instance
              console.log('Creating Task instance...');
              task = new Task(taskFilePath);
              break projectLoop;
            }
          }
        }
      }
    }

    if (!task) {
      console.log('No task file found for testing.');
      return;
    }

    // Print basic properties
    console.log('\nBasic properties:');
    console.log(`ID: ${task.id.index}`);
    console.log(`Created: ${task.created}`);
    console.log(`Artifact Path: ${task.artifactPath}`);
    console.log(`Is Declined: ${task.isDeclined}`);
    console.log(`Plan: ${task.plan.length} items`);
    console.log(`Steps: ${task.steps.length} steps`);

    // Access lazy-loaded properties
    console.log('\nAccessing previousTasksInfo (first time):');
    console.time('previousTasksInfo-first');
    const previousTasksInfo = task.previousTasksInfo;
    console.timeEnd('previousTasksInfo-first');
    console.log(`Previous Tasks Info: ${previousTasksInfo ? 'Present' : 'Not present'}`);

    console.log('\nAccessing previousTasksInfo (second time, should be faster):');
    console.time('previousTasksInfo-second');
    const previousTasksInfo2 = task.previousTasksInfo;
    console.timeEnd('previousTasksInfo-second');
    console.log(`Previous Tasks Info: ${previousTasksInfo2 ? 'Present' : 'Not present'}`);

    console.log('\nAccessing finalAgentState:');
    console.time('finalAgentState');
    const finalAgentState = task.finalAgentState;
    console.timeEnd('finalAgentState');
    console.log(`Final Agent State: ${finalAgentState ? 'Present' : 'Not present'}`);

    console.log('\nAccessing sessionHistory:');
    console.time('sessionHistory');
    const sessionHistory = task.sessionHistory;
    console.timeEnd('sessionHistory');
    console.log(`Session History: ${sessionHistory ? 'Present' : 'Not present'}`);

    console.log('\nAccessing patch:');
    console.time('patch');
    const patch = task.patch;
    console.timeEnd('patch');
    console.log(`Patch length: ${patch ? patch.length : 0} characters`);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing Task class:', error);
  }
}

// Run the test
testTaskClass();