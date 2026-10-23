import { runWithFallback } from "@/lib/ai/client";
import { guardOutput } from "@/lib/ai/guard";
import { buildGapPrompt, parseGap } from "@/lib/interview/gap";
import { retrieveQuestions } from "@/lib/rag";
import type { InterviewConfig } from "@/lib/interview/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { config } = (await req.json()) as { config: InterviewConfig };

    // RAG：检索与岗位最相关的题目，作为“你可能会被问到”的候选。
    const likelyQuestions = retrieveQuestions(config, 5).map(
      (item) => item.question
    );
    const prompt = buildGapPrompt(config);

    const gap = await runWithFallback(async (client, model) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }]
        });
        return parseGap(
          completion.choices[0]?.message?.content ?? "",
          likelyQuestions
        );
      } catch {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }]
        });
        return parseGap(
          completion.choices[0]?.message?.content ?? "",
          likelyQuestions
        );
      }
    });

    const mask = (text: string) => guardOutput(text).text;
    return Response.json({
      ...gap,
      summary: mask(gap.summary),
      matchedSkills: gap.matchedSkills.map(mask),
      missingSkills: gap.missingSkills.map(mask),
      likelyQuestions: gap.likelyQuestions.map(mask),
      suggestions: gap.suggestions.map(mask)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}
