import { createAIClient } from "@/lib/ai/client";
import { buildReportPrompt, parseReport } from "@/lib/interview/report";
import type { ChatMessage, InterviewConfig } from "@/lib/interview/types";

export const runtime = "nodejs";

interface ReportRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

export async function POST(req: Request) {
  const { messages, config } = (await req.json()) as ReportRequestBody;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const transcript = messages
    .map((message) => {
      const speaker = message.role === "user" ? "候选人" : "面试官";
      return `${speaker}：${message.content}`;
    })
    .join("\n");

  const completion = await createAIClient().chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: buildReportPrompt(config, transcript)
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const report = parseReport(raw);

  return Response.json(report);
}
