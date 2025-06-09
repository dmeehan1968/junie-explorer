import os from 'os';
import path from 'path';

// Get username from environment variable or OS
const username = process.env.USER || os.userInfo().username;

// Determine platform-specific path
let jetBrainsPath: string;

switch (process.platform) {
  case 'win32': // Windows
    jetBrainsPath = path.join(process.env.APPDATA || '', '..', 'Local', 'JetBrains', 'Cache');
    break;
  case 'darwin': // macOS
    jetBrainsPath = path.join('/Users', username, 'Library', 'Caches', 'JetBrains');
    break;
  default: // Linux and others
    jetBrainsPath = path.join(os.homedir(), '.cache', 'JetBrains');
    break;
}

// Export the path for use in other modules
export { jetBrainsPath }
