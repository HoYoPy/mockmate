import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import {
  createClient,
  getModelConfigs,
  runWithFallback
} from "@/lib/ai/client";
import { guardOutput, guardUserInput } from "@/lib/ai/guard";
import { runAgentLoop } from "@/lib/interview/agent";
import { buildSystemPrompt } from "@/lib/interview/prompts";
import { retrieveQuestions } from "@/lib/rag";
import type { ChatMessage, InterviewConfig } from "@/lib/interview/types";

export const runtime = "nodejs";

const MAX_OUTPUT_CHARS = 3000;
const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache",
  Connection: "keep-alive"
};

const AGENT_INSTRUCTION =
  "你可以按需调用工具来规范面试流程：先用 evaluate_answer 评估上一轮回答，再用 pick_next_question 从题库选题，覆盖足够维度后用 finish_interview 收尾。每次只输出一个问题，不要一次问多个。";

function encodeSSE(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(text)}\n\n`);
}

function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const safe = guardOutput(text);
  const output = safe.text.slice(0, MAX_OUTPUT_CHARS);
  const chunkSize = 3;

  const readable = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < output.length; i += chunkSize) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(output.slice(i, i + chunkSize))}\n\n`)
        );
      }
      controller.close();
    }
  });

  return new Response(readable, { headers: SSE_HEADERS });
}

async function streamFallback(
  history: ChatCompletionMessageParam[]
): Promise<Response> {
  for (const config of getModelConfigs()) {
    const client = createClient(config);
    try {
      const stream = await client.chat.completions.create({
        model: config.model,
        stream: true,
        temperature: 0.7,
        messages: history
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let total = 0;
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content ?? "";
              if (!delta) continue;
              const safe = guardOutput(delta);
              if (safe.safe && total + safe.text.length <= MAX_OUTPUT_CHARS) {
                controller.enqueue(encodeSSE(safe.text));
                total += safe.text.length;
              }
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(readable, { headers: SSE_HEADERS });
    } catch {
      // 当前模型失败，尝试下一个 fallback
    }
  }

  throw new Error("所有模型均不可用");
}

export async function POST(req: Request) {
  try {
    const { messages, config } = (await req.json()) as ChatRequestBody;
    const safeConfig: InterviewConfig = config ?? {
      persona: "technical",
      resume: "",
      jd: ""
    };

    const references = retrieveQuestions(safeConfig);
    const system = `${buildSystemPrompt(safeConfig, references)}\n\n${AGENT_INSTRUCTION}`;

    const guardedMessages: ChatMessage[] = [];
    for (const message of messages) {
      if (message.role === "user") {
        const guarded = guardUserInput(message.content);
        if (!guarded.safe) {
          return Response.json({ error: guarded.reason }, { status: 400 });
        }
        guardedMessages.push({ role: "user", content: guarded.text });
      } else {
        guardedMessages.push(message);
      }
    }

    const history: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...guardedMessages.map(
        (m) =>
          ({ role: m.role, content: m.content }) as ChatCompletionMessageParam
      )
    ];

    let finalText: string | null = null;
    try {
      finalText = await runWithFallback((client, model) =>
        runAgentLoop(client, model, history, references)
      );
    } catch {
      finalText = null;
    }

    if (finalText) {
      return streamText(finalText);
    }

    return await streamFallback(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}

interface ChatRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}
