
import { AIMode, ModeConfig, QuizData } from './types';

export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";

const parseQuizJson = (jsonString: string): QuizData | null => {
  let cleanedJsonString = jsonString.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJsonString.match(fenceRegex);
  if (match && match[1]) {
    cleanedJsonString = match[1].trim();
  }

  try {
    const parsed = JSON.parse(cleanedJsonString);
    // Basic validation for QuizData structure
    if (parsed && Array.isArray(parsed.questions)) {
        // Further validation for each question can be added here if necessary
        return parsed as QuizData;
    }
    if (Array.isArray(parsed)) { // Sometimes it returns an array of questions directly
        return { questions: parsed } as QuizData;
    }
    console.warn("Parsed JSON does not match QuizData structure:", parsed);
    return null;
  } catch (error) {
    console.error("Failed to parse quiz JSON:", error, "Raw string:", jsonString);
    return null;
  }
};


export const MODE_CONFIGS: Record<AIMode, ModeConfig> = {
  [AIMode.Chat]: {
    displayName: "EduTutor Chat",
    systemInstruction: "You are EduTutor AI, a friendly, encouraging, and knowledgeable AI assistant for students of all levels. Explain concepts clearly, concisely, and helpfully. Use markdown for formatting when appropriate (e.g., lists, bolding key terms).",
    inputPromptLabel: "Ask a question or discuss a topic",
    placeholderText: "e.g., Explain photosynthesis in simple terms.",
    sampleQuery: "What are the main causes of World War 1?",
  },
  [AIMode.Summarize]: {
    displayName: "Text Summarizer",
    systemInstruction: "You are a highly skilled text summarization AI. Your task is to summarize the provided text accurately and concisely for a student. Focus on the key points and main ideas. The summary should be easy to understand.",
    inputPromptLabel: "Paste text to summarize",
    placeholderText: "Paste a long article or notes here...",
    requiresLargeInput: true,
    sampleQuery: "Summarize this for me: [Paste a long text here]",
  },
  [AIMode.Quiz]: {
    displayName: "Quiz Generator",
    systemInstruction: "You are an AI that generates educational quizzes. Based on the user's topic or provided text, create a series of multiple-choice questions. Each question should have 4 options (A, B, C, D) and a clearly indicated correct answer. Also provide a brief explanation for the correct answer. Respond ONLY with a JSON object adhering to this structure: { \"questions\": [ { \"question\": \"str\", \"options\": [\"str\", \"str\", \"str\", \"str\"], \"correctAnswer\": \"str (e.g. A)\", \"explanation\": \"str\" } ] }.",
    inputPromptLabel: "Enter a topic or paste text for a quiz",
    placeholderText: "e.g., The Solar System, or paste notes on Mitosis.",
    sampleQuery: "Create a 5-question quiz on the basics of Python programming.",
    responseShouldBeJSON: true,
    parseJsonResponse: parseQuizJson,
  },
  [AIMode.StudyNotes]: {
    displayName: "Study Notes Creator",
    systemInstruction: "You are an AI specialized in creating structured study notes. From the given topic or text, generate clear, organized notes. Use bullet points, headings, key term definitions, and concise explanations. The notes should be easy to review and learn from. Use markdown for formatting.",
    inputPromptLabel: "Enter a topic or paste text for study notes",
    placeholderText: "e.g., Key concepts of calculus, or paste a chapter from a textbook.",
    sampleQuery: "Generate study notes for the French Revolution.",
  },
  [AIMode.Research]: {
    displayName: "Research Assistant",
    systemInstruction: "You are a Research Assistant AI. Use Google Search to find up-to-date information and answer the user's questions comprehensively. Cite your sources clearly. Use markdown for formatting.",
    inputPromptLabel: "Ask a research question",
    placeholderText: "e.g., What are the latest advancements in renewable energy?",
    sampleQuery: "Who won the Nobel Prize in Physics in 2023 and for what?",
    useSearch: true,
  },
};
