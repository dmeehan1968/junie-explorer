import * as fs from 'fs';
import * as path from 'path';

// Define interfaces for our analysis results
interface FileAnalysis {
  path: string;
  type: string;
  contentType: string;
  size: number;
  description: string;
}

interface DirectoryAnalysis {
  path: string;
  type: 'directory';
  children: (FileAnalysis | DirectoryAnalysis)[];
}

/**
 * Determines the content type of a file by examining its content
 * @param filePath Path to the file
 * @returns Object containing contentType and description
 */
function determineContentType(filePath: string): { contentType: string; description: string } {
  try {
    // Try to read the file as text first
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });

    // Check if it's JSON
    try {
      JSON.parse(fileContent);
      return { 
        contentType: 'JSON', 
        description: 'JSON data structure' 
      };
    } catch (e) {
      // Not JSON, continue checking
    }

    // Check if it's XML
    if (fileContent.trim().startsWith('<?xml') || fileContent.trim().startsWith('<') && fileContent.includes('</')) {
      return { 
        contentType: 'XML', 
        description: 'XML document' 
      };
    }

    // Check if it's plain text
    if (/^[\x20-\x7E\s]*$/.test(fileContent)) {
      return { 
        contentType: 'Text', 
        description: 'Plain text content' 
      };
    }

    // If we got here but the file has text content, it's some other text format
    return { 
      contentType: 'Text', 
      description: 'Text content (format unknown)' 
    };
  } catch (e) {
    // If we can't read as text, it's likely binary
    try {
      // Read a small sample to check binary signatures
      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      // Check for common binary formats by signature
      if (buffer.toString('hex', 0, 2) === '1f8b') {
        return { contentType: 'Binary', description: 'GZIP compressed data' };
      }

      if (buffer.toString('hex', 0, 4) === '504b0304') {
        return { contentType: 'Binary', description: 'ZIP archive' };
      }

      // Add more binary format checks as needed

      // Default binary
      return { 
        contentType: 'Binary', 
        description: 'Binary data (format unknown)' 
      };
    } catch (err) {
      return { 
        contentType: 'Unknown', 
        description: 'Unable to determine content type' 
      };
    }
  }
}

/**
 * Analyzes a file to determine its type and content
 * @param filePath Path to the file
 * @returns FileAnalysis object
 */
function analyzeFile(filePath: string): FileAnalysis {
  const stats = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase();

  // Determine file type based on extension
  let fileType = extension ? extension.substring(1) : 'unknown';

  // Determine content type by examining the file
  const { contentType, description } = determineContentType(filePath);

  return {
    path: filePath,
    type: fileType,
    contentType,
    size: stats.size,
    description
  };
}

/**
 * Recursively analyzes a directory and its contents
 * @param dirPath Path to the directory
 * @returns DirectoryAnalysis object
 */
function analyzeDirectory(dirPath: string): DirectoryAnalysis {
  const children: (FileAnalysis | DirectoryAnalysis)[] = [];

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      children.push(analyzeDirectory(itemPath));
    } else if (stats.isFile()) {
      children.push(analyzeFile(itemPath));
    }
  }

  return {
    path: dirPath,
    type: 'directory',
    children
  };
}

/**
 * Main function to analyze the fixtures directory
 */
function analyzeFixtures() {
  const fixturesPath = path.join(__dirname, '..', 'fixtures');

  if (!fs.existsSync(fixturesPath)) {
    console.error(`Fixtures directory not found at ${fixturesPath}`);
    return;
  }

  console.log('Starting analysis of fixtures directory...');

  try {
    const analysis = analyzeDirectory(fixturesPath);

    // Output the analysis results
    console.log(JSON.stringify(analysis, null, 2));

    // Save the analysis to a file
    const outputPath = path.join(__dirname, '..', 'fixtures-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

    console.log(`Analysis complete. Results saved to ${outputPath}`);
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the analysis
analyzeFixtures();
