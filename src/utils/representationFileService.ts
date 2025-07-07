import fs from 'fs-extra';
import path from 'path';
import { Step } from '../Step.js';

// File operations utilities
export class RepresentationFileService {
  static findRepresentationFile(step: Step, task: any): string {
    const root = path.join(
      step.logPath, 
      '../../representations', 
      task.id, 
      `step_${step.id.toString().padStart(2, '0')}.{*{swe,chat}_next*,junie_single_step_{chat,issue}}`
    );
    
    const files = fs.globSync(root);
    
    if (files.length === 0) {
      throw new Error('No representation files found');
    }
    
    if (files.length > 1) {
      throw new Error('More than one representation file found');
    }
    
    return files[0];
  }

  static readRepresentationFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Error reading representation file: ${error}`);
    }
  }
}