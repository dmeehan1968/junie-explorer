import { JetBrains } from '../jetbrains.js';
import { RepresentationParser } from '../utils/representationParser.js';
import { RepresentationRenderer } from '../utils/representationRenderer.js';
import { RepresentationFileService } from '../utils/representationFileService.js';

// Main service class
export class RepresentationService {
  static async getStepRepresentation(
    jetBrains: JetBrains,
    projectName: string,
    issueId: string,
    taskId: string,
    stepIndex: string
  ): Promise<string> {
    // Validate and get entities
    const project = await jetBrains.getProjectByName(projectName);
    const issue = await project?.getIssueById(issueId);
    const task = await issue?.getTaskById(taskId);
    const step = task?.getStepById(parseInt(stepIndex, 10));

    if (!project || !issue || !task || !step) {
      throw new Error('Step not found');
    }

    // Find and read representation file
    const filePath = RepresentationFileService.findRepresentationFile(step, task);
    const content = RepresentationFileService.readRepresentationFile(filePath);

    // Parse and render content
    const parsed = RepresentationParser.parseRepresentationContent(content);
    return await RepresentationRenderer.renderRepresentation(parsed);
  }
}
