import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { createAIClient } from "@/lib/ai/client";
import { runAgentLoop } from "@/lib/interview/agent";
import { buildSystemPrompt } from "@/lib/interview/prompts";
import { retrieveQuestions } from "@/lib/rag";
import type { ChatMessage, InterviewConfig } from "@/lib/interview/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

const AGENT_INSTRUCTION =
  "你可以按需调用工具来规范面试流程：先用 evaluate_answer 评估上一轮回答，再用 pick_next_question 从题库选题，覆盖足够维度后用 finish_interview 收尾。每次只输出一个问题，不要一次问多个。";

async function streamPlain(
  history: ChatCompletionMessageParam[],
  model: string
): Promise<Response> {
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

export async function POST(req: Request) {
  try {
    const { messages, config } = (await req.json()) as ChatRequestBody;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const safeConfig: InterviewConfig = config ?? {
      persona: "technical",
      resume: "",
      jd: ""
    };

    const references = retrieveQuestions(safeConfig);
    const system = `${buildSystemPrompt(safeConfig, references)}\n\n${AGENT_INSTRUCTION}`;

    const history: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...messages.map(
        (m) =>
          ({ role: m.role, content: m.content }) as ChatCompletionMessageParam
      )
    ];

    let text = "";
    let agentFailed = false;
    try {
      text = await runAgentLoop(history, references, model);
    } catch {
      agentFailed = true;
    }

    if (!agentFailed && text) {
      return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // 工具调用失败时回退到普通流式对话，保证聊天不中断。
    return streamPlain(history, model);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}
