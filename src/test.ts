import fs from 'fs-extra';
import { getIDEDirectories, jetBrainsPath } from './utils/ideUtils.js';

async function testDirectoryAccess() {
  try {
    console.log(`Testing access to: ${jetBrainsPath}`);

    // Use the getIDEDirectories function to get IDE directories
    const ideDirectories = await getIDEDirectories();

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
