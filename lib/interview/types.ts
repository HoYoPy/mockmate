export type Persona = "technical" | "hr" | "stress";

export interface InterviewConfig {
  persona: Persona;
  resume: string;
  jd: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ReportDimensionKey =
  | "technical"
  | "project"
  | "communication"
  | "fit"
  | "soft";

export interface ReportDimension {
  key: ReportDimensionKey;
  label: string;
  score: number;
  comment: string;
}

export interface InterviewReport {
  totalScore: number;
  summary: string;
  dimensions: ReportDimension[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface Question {
  id: string;
  category: string;
  job: string[];
  persona: Persona[];
  skills: string[];
  difficulty: number;
  keywords: string[];
  question: string;
  points: string[];
}

export interface GapAnalysis {
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  likelyQuestions: string[];
  suggestions: string[];
}

export interface HistoryRecord {
  date: string;
  totalScore: number;
  dimensions: { key: ReportDimensionKey; label: string; score: number }[];
}
