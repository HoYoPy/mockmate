import type { GapAnalysis, InterviewConfig } from "@/lib/interview/types";

export function buildGapPrompt(config: InterviewConfig): string {
  return [
    "你是一名资深职业规划与面试评审专家。请分析候选人的简历和目标岗位 JD 之间的差距。",
    '只输出一个合法 JSON，不要输出 Markdown、代码块或任何其他文字。',
    'JSON 结构必须是：{"matchScore": 0到100的整数, "summary": "总体匹配度评价", "matchedSkills": ["已经匹配的技能"], "missingSkills": ["缺失或不足的技能"], "suggestions": ["针对性提升建议"]}',
    `\n岗位 JD：\n${config.jd}`,
    `\n候选人简历：\n${config.resume}`
  ].join("\n");
}

function clampScore(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型未返回合法 JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export function parseGap(raw: string, likelyQuestions: string[]): GapAnalysis {
  const data = extractJson(raw);
  return {
    matchScore: clampScore(data.matchScore ?? 0),
    summary: String(data.summary ?? ""),
    matchedSkills: asStringArray(data.matchedSkills),
    missingSkills: asStringArray(data.missingSkills),
    likelyQuestions,
    suggestions: asStringArray(data.suggestions)
  };
}
