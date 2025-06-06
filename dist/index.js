"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Determines the content type of a file by examining its content
 * @param filePath Path to the file
 * @returns Object containing contentType and description
 */
function determineContentType(filePath) {
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
        }
        catch (e) {
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
    }
    catch (e) {
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
        }
        catch (err) {
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
function analyzeFile(filePath) {
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
function analyzeDirectory(dirPath) {
    const children = [];
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            children.push(analyzeDirectory(itemPath));
        }
        else if (stats.isFile()) {
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
    }
    catch (error) {
        console.error('Error during analysis:', error);
    }
}
// Run the analysis
analyzeFixtures();
