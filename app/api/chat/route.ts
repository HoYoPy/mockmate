import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { createAIClient } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/interview/prompts";
import { retrieveQuestions } from "@/lib/rag";
import type { ChatMessage, InterviewConfig } from "@/lib/interview/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

export async function POST(req: Request) {
  try {
    const { messages, config } = (await req.json()) as ChatRequestBody;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const safeConfig: InterviewConfig = config ?? {
      persona: "technical",
      resume: "",
      jd: ""
    };

    // RAG：根据简历 + 岗位检索高频面试题，注入系统提示词作为追问参考。
    const references = retrieveQuestions(safeConfig);
    const system = buildSystemPrompt(safeConfig, references);

    const history: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...messages.map(
        (m) =>
          ({ role: m.role, content: m.content }) as ChatCompletionMessageParam
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}
