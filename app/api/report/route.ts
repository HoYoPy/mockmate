import { runWithFallback } from "@/lib/ai/client";
import { guardOutput } from "@/lib/ai/guard";
import { buildReportPrompt, parseReport } from "@/lib/interview/report";
import type {
  ChatMessage,
  InterviewConfig,
  InterviewReport
} from "@/lib/interview/types";

export const runtime = "nodejs";

interface ReportRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

function maskReport(report: InterviewReport): InterviewReport {
  const mask = (text: string) => guardOutput(text).text;
  return {
    ...report,
    summary: mask(report.summary),
    dimensions: report.dimensions.map((dimension) => ({
      ...dimension,
      comment: mask(dimension.comment)
    })),
    strengths: report.strengths.map(mask),
    weaknesses: report.weaknesses.map(mask),
    suggestions: report.suggestions.map(mask)
  };
}

export async function POST(req: Request) {
  try {
    const { messages, config } = (await req.json()) as ReportRequestBody;
    const transcript = messages
      .map((message) => {
        const speaker = message.role === "user" ? "候选人" : "面试官";
        return `${speaker}：${message.content}`;
      })
      .join("\n");

    const prompt = buildReportPrompt(config, transcript);

    const report = await runWithFallback(async (client, model) => {
      let raw = "";

      try {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        });
        raw = completion.choices[0]?.message?.content ?? "";
        return parseReport(raw);
      } catch {
        // 服务不支持 json_object 或解析失败时，去掉约束重试一次。
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }]
        });
        raw = completion.choices[0]?.message?.content ?? "";
        return parseReport(raw);
      }
    });

    return Response.json(maskReport(report));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}
