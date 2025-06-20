// Types and interfaces
interface ThoughtContent {
  'Previous Step'?: string;
  Plan?: string;
  Command?: string;
}

export interface ParsedRepresentation {
  thoughtContent: string;
  resultContent: string;
  parsedSections: ThoughtContent;
}

// Content parsing utilities
export class RepresentationParser {
  private static extractTagContent(content: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private static splitContentSections(content: string): { thought: string; result: string } {
    const splitPattern = /(?<thought>[\s\S]*?)^-{8,}$\n(?<result>[\s\S]*)/m;
    const contentParts = content.match(splitPattern);
    
    return {
      thought: contentParts?.groups?.thought || content,
      result: contentParts?.groups?.result || ''
    };
  }

  static parseRepresentationContent(content: string): ParsedRepresentation {
    const { thought, result } = this.splitContentSections(content);
    
    const parsedSections: ThoughtContent = {
      'Previous Step': this.extractTagContent(thought, 'PREVIOUS_STEP'),
      Plan: this.extractTagContent(thought, 'PLAN'),
      Command: this.extractTagContent(thought, 'COMMAND'),
    };

    return {
      thoughtContent: thought,
      resultContent: result,
      parsedSections
    };
  }
}