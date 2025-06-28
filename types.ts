
import { Chat } from "@google/genai";

export enum AIMode {
  Chat = "EduTutor Chat",
  Summarize = "Text Summarizer",
  Quiz = "Quiz Generator",
  StudyNotes = "Study Notes Creator",
  Research = "Research Assistant",
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  sources?: WebSource[];
  isLoading?: boolean;
}

export interface ModeConfig {
  displayName: string;
  systemInstruction: string;
  inputPromptLabel: string; // e.g., "Enter text to summarize" or "Ask a question"
  placeholderText: string;
  sampleQuery?: string;
  requiresLargeInput?: boolean; // If true, textarea height might be larger
  useSearch?: boolean;
  responseShouldBeJSON?: boolean;
  parseJsonResponse?: <T,>(text: string) => T | null; // Generic JSON parser
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; // e.g. "A" or "Option 1"
  explanation?: string;
}

export interface QuizData {
    questions: QuizQuestion[];
}

// This is an example, actual structure from Gemini might vary.
// The prompt example implies direct array: `[{web: {uri: "", title: ""},  ... }]`
// So we'll use WebSource directly.
export interface GroundingChunk {
  web: WebSource;
  // Other properties like retrievalQuery, startIndex, endIndex might exist
}

export interface ActiveChat {
  chat: Chat;
  mode: AIMode;
}
