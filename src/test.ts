import fs from 'fs-extra';

// Get username from environment variable
const username = process.env.USER;
const jetBrainsPath = `/Users/${username}/Library/Caches/JetBrains`;

async function testDirectoryAccess() {
  try {
    console.log(`Testing access to: ${jetBrainsPath}`);

    const exists = await fs.pathExists(jetBrainsPath);
    if (!exists) {
      console.error(`Path does not exist: ${jetBrainsPath}`);
      return;
    }

    console.log(`Path exists: ${jetBrainsPath}`);

    const directories = fs.readdirSync(jetBrainsPath, { withFileTypes: true });

    // Filter for directories only
    const ideDirectories = directories
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('JetBrains IDE directories found:');
    ideDirectories.forEach(dir => console.log(`- ${dir}`));

    console.log(`\nTotal directories found: ${ideDirectories.length}`);
  } catch (error) {
    console.error('Error testing directory access:', error);
  }
}

// Run the test
testDirectoryAccess();
