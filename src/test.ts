import { jetBrainsPath } from './utils/jetBrainsPath.js';
import { initializeAppState, getIDEs } from './utils/appState.js';

function testDirectoryAccess() {
  try {
    console.log(`Testing access to: ${jetBrainsPath}`);

    // Initialize the app state
    initializeAppState();

    // Get IDE directories from the app state
    const ideDirectories = getIDEs();

    if (ideDirectories.length === 0) {
      console.log('No JetBrains IDE directories found.');
      return;
    }

    console.log('JetBrains IDE directories found:');
    ideDirectories.forEach(ide => console.log(`- ${ide.name}`));

    console.log(`\nTotal directories found: ${ideDirectories.length}`);
  } catch (error) {
    console.error('Error testing directory access:', error);
  }
}

// Run the test
testDirectoryAccess();
