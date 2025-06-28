declare module "@google/genai" {
  export interface GoogleGenAIOptions {
    apiKey: string;
  }

  export interface GenAIConfig {
    thinkingConfig: {
      thinkingBudget: number;
    };
    responseMimeType: string;
  }

  export interface AIContentPart {
    text: string;
  }

  export interface AIContent {
    role: string;
    parts: AIContentPart[];
  }

  export interface GenerateContentResponse {
    choices?: Array<{
      message?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  }

  export class GoogleGenAI {
    constructor(options: GoogleGenAIOptions);
    models: {
      generateContent(args: {
        model: string;
        config: GenAIConfig;
        contents: AIContent[];
      }): Promise<GenerateContentResponse>;
      generateContentStream(args: {
        model: string;
        config: GenAIConfig;
        contents: AIContent[];
      }): AsyncIterable<{ text: string }>;
    };
  }
}
