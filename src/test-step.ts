import fs from 'fs-extra';
import path from 'path';
import { Step } from './matterhorn.js';
import { jetBrainsPath } from './utils/jetBrainsPath.js';
import { initializeAppState, getMergedProjects } from './utils/appState.js';

function testStepClass() {
  console.log('Testing Step class...');

  try {
    // Initialize app state to get projects
    console.log('Initializing app state...');
    initializeAppState();

    // Get all projects
    const projects = getMergedProjects();

    if (projects.length === 0) {
      console.log('No projects found. Cannot test Step class.');
      return;
    }

    console.log(`Found ${projects.length} projects.`);

    // Find a step file to test with
    let stepFilePath = null;
    let step = null;

    // Look through projects to find a step file
    projectLoop: for (const project of projects) {
      console.log(`Checking project: ${project.name}`);

      for (const issue of project.issues) {
        for (const task of issue.tasks) {
          if (task.steps.length > 0) {
            // We found a step, now we need to find its file path
            const ideName = project.ides[0]; // Use the first IDE
            const projectName = project.name;
            const taskArtifactPath = task.artifactPath;

            const idePath = path.join(jetBrainsPath, ideName);
            const projectPath = path.join(idePath, 'projects', projectName);
            const matterhornPath = path.join(projectPath, 'matterhorn', '.matterhorn');
            const stepsPath = path.join(matterhornPath, taskArtifactPath);

            if (fs.existsSync(stepsPath)) {
              const files = fs.readdirSync(stepsPath, { withFileTypes: true });
              const stepFile = files.find(file => 
                file.isFile() && file.name.match(/step_\d+\..*(swe_next|chat_next).*$/));

              if (stepFile) {
                stepFilePath = path.join(stepsPath, stepFile.name);
                console.log(`Found step file: ${stepFilePath}`);

                // Create a Step instance
                console.log('Creating Step instance...');
                step = new Step(stepFilePath);
                break projectLoop;
              }
            }
          }
        }
      }
    }

    if (!step) {
      console.log('No step file found for testing.');
      return;
    }

    // Print basic properties
    console.log('\nBasic properties:');
    console.log(`ID: ${step.id}`);
    console.log(`Title: ${step.title}`);
    console.log(`Start Time: ${step.startTime}`);
    console.log(`End Time: ${step.endTime}`);

    // Access lazy-loaded properties
    console.log('\nAccessing description (first time):');
    console.time('description-first');
    const description = step.description;
    console.timeEnd('description-first');
    console.log(`Description length: ${description.length} characters`);

    console.log('\nAccessing description (second time, should be faster):');
    console.time('description-second');
    const description2 = step.description;
    console.timeEnd('description-second');
    console.log(`Description length: ${description2.length} characters`);

    console.log('\nAccessing dependencies:');
    console.time('dependencies');
    const dependencies = step.dependencies;
    console.timeEnd('dependencies');
    console.log(`Dependencies: ${JSON.stringify(dependencies)}`);

    console.log('\nAccessing content:');
    console.time('content');
    const content = step.content;
    console.timeEnd('content');
    console.log(`Content keys: ${Object.keys(content).join(', ')}`);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing Step class:', error);
  }
}

// Run the test
testStepClass();
