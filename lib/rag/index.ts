import questionBank from "@/data/question-bank.json";

import { retrieveQuestions as retrieve } from "@/lib/rag/vector-retriever";
import type { InterviewConfig, Question } from "@/lib/interview/types";

export function retrieveQuestions(config: InterviewConfig, limit = 6) {
  return retrieve(config, questionBank as Question[], limit);
}
