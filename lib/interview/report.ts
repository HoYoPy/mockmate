import type {
  InterviewConfig,
  InterviewReport,
  ReportDimensionKey
} from "@/lib/interview/types";

const DIMENSION_LABELS: Record<ReportDimensionKey, string> = {
  technical: "技术能力",
  project: "项目经验",
  communication: "表达逻辑",
  fit: "岗位匹配",
  soft: "综合素质"
};

const DIMENSION_KEYS: ReportDimensionKey[] = [
  "technical",
  "project",
  "communication",
  "fit",
  "soft"
];

export function buildReportPrompt(
  config: InterviewConfig,
  transcript: string
): string {
  return [
    "你是一名资深面试评审专家。请根据下面的面试对话，对候选人进行结构化复盘评估。",
    '只输出一个合法 JSON，不要输出 Markdown、代码块或任何其他文字。',
    'JSON 结构必须是：{"totalScore": 0到100的整数, "summary": "总体评价", "dimensions": {"technical": {"score": 0到100, "comment": "..."}, "project": {"score": 0到100, "comment": "..."}, "communication": {"score": 0到100, "comment": "..."}, "fit": {"score": 0到100, "comment": "..."}, "soft": {"score": 0到100, "comment": "..."}}, "strengths": ["..."], "weaknesses": ["..."], "suggestions": ["..."]}',
    config.jd ? `\n岗位要求：\n${config.jd}` : "",
    config.resume ? `\n候选人简历：\n${config.resume}` : "",
    `\n面试对话记录：\n${transcript}`
  ]
    .filter(Boolean)
    .join("\n");
}

function clampScore(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  return [];
}

function extractJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型未返回合法 JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export function parseReport(raw: string): InterviewReport {
  const data = extractJsonObject(raw);
  const rawDimensions =
    (data.dimensions as Record<string, unknown> | undefined) ?? {};

  const dimensions = DIMENSION_KEYS.map((key) => {
    const item = (rawDimensions[key] as Record<string, unknown> | undefined) ?? {};
    return {
      key,
      label: DIMENSION_LABELS[key],
      score: clampScore(item.score ?? 0),
      comment: String(item.comment ?? "")
    };
  });

  return {
    totalScore: clampScore(data.totalScore ?? 0),
    summary: String(data.summary ?? ""),
    dimensions,
    strengths: asStringArray(data.strengths),
    weaknesses: asStringArray(data.weaknesses),
    suggestions: asStringArray(data.suggestions)
  };
}
