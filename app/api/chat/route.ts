import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { createAIClient } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/interview/prompts";
import type { ChatMessage, InterviewConfig } from "@/lib/interview/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

export async function POST(req: Request) {
  const { messages, config } = (await req.json()) as ChatRequestBody;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const system = buildSystemPrompt(
    config ?? { persona: "technical", resume: "", jd: "" }
  );

  const history: ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...messages.map(
      (m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam
    )
  ];

  const stream = await createAIClient().chat.completions.create({
    model,
    stream: true,
    temperature: 0.7,
    messages: history
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
