import { QUESTION_BANK } from "@/lib/interview/question-bank";
import type { InterviewConfig } from "@/lib/interview/types";

/**
 * 轻量检索增强生成（RAG）检索层。
 * 根据简历 + 岗位 JD 做关键词匹配，并结合面试官风格做加权，返回最相关的题目。
 * 生产环境可升级为 embedding + 向量检索（如 OpenAI embeddings / pgvector）。
 */
export function retrieveQuestions(config: InterviewConfig, limit = 6): string[] {
  const text = `${config.resume}\n${config.jd}`.toLowerCase();

  const scored = QUESTION_BANK.map((item) => {
    let score = item.personas.includes(config.persona) ? 2 : 0;
    for (const keyword of item.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, limit).map((entry) => entry.item.question);

  // 检索结果不足时，用面试官风格对应的通用题补齐，保证追问方向完整。
  if (picked.length < 3) {
    const fallback = QUESTION_BANK.filter((item) =>
      item.personas.includes(config.persona)
    ).map((item) => item.question);
    for (const question of fallback) {
      if (!picked.includes(question) && picked.length < limit) {
        picked.push(question);
      }
    }
  }

  return picked;
}
