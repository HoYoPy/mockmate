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
