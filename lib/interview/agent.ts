import type {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from "openai/resources/chat/completions";

import { createAIClient } from "@/lib/ai/client";
import type { RetrievedQuestion } from "@/lib/rag/vector-retriever";

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "evaluate_answer",
      description:
        "对候选人上一轮回答做隐式评估，记录回答深度、数据支撑和是否跑题，用于决定是否追问。",
      parameters: {
        type: "object",
        properties: {
          depth: { type: "number", description: "回答深度，0-100" },
          data_support: { type: "number", description: "数据或实例支撑，0-100" },
          on_topic: { type: "boolean", description: "是否跑题" },
          comment: { type: "string", description: "一句话评估" }
        },
        required: ["depth", "data_support", "on_topic", "comment"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pick_next_question",
      description:
        "从题库中按技能维度检索下一道面试题及其考察点，用于生成更贴近岗位的追问。",
      parameters: {
        type: "object",
        properties: {
          skill: {
            type: "string",
            description: "希望考察的技能维度，例如 前端、数据库、团队协作"
          }
        },
        required: ["skill"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "finish_interview",
      description:
        "当面试已经覆盖主要维度时调用，结束面试并输出礼貌收尾。",
      parameters: {
        type: "object",
        properties: {
          covered: {
            type: "array",
            items: { type: "string" },
            description: "本次面试已经覆盖的维度"
          }
        },
        required: ["covered"]
      }
    }
  }
];

function executeTool(
  name: string,
  args: Record<string, unknown>,
  references: RetrievedQuestion[]
): Record<string, unknown> {
  if (name === "evaluate_answer") {
    return {
      ok: true,
      note: "评估已记录，后续将据此决定追问方向"
    };
  }

  if (name === "pick_next_question") {
    const skill = String(args.skill ?? "").toLowerCase();
    const matched =
      references.find((item) => {
        const haystack = `${item.category} ${item.question} ${item.points.join(" ")}`.toLowerCase();
        return skill && haystack.includes(skill);
      }) ?? references[0];

    return matched
      ? { question: matched.question, points: matched.points }
      : { question: "", points: [] };
  }

  if (name === "finish_interview") {
    return { ok: true, note: "面试收尾" };
  }

  return { ok: false, note: `未知工具：${name}` };
}

export async function runAgentLoop(
  messages: ChatCompletionMessageParam[],
  references: RetrievedQuestion[],
  model: string
): Promise<string> {
  const client = createAIClient();
  const working = [...messages];
  const maxSteps = 4;

  for (let step = 0; step < maxSteps; step++) {
    const completion = await client.chat.completions.create({
      model,
      messages: working,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.7
    });

    const choice = completion.choices[0];
    if (!choice) return "";

    const message = choice.message;
    const toolCalls = message.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return message.content ?? "";
    }

    working.push(message as ChatCompletionMessageParam);

    console.log(
      `[agent:step:${step}] tools=${toolCalls
        .map((call) => call.function.name)
        .join(",")}`
    );

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      const result = executeTool(call.function.name, args, references);
      working.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result)
      } as ChatCompletionMessageParam);
    }
  }

  const last = working[working.length - 1];
  if (last?.role === "assistant") {
    const content = last.content;
    if (typeof content === "string" && content.trim()) {
      return content;
    }
    if (Array.isArray(content)) {
      const text = content
        .map((part) => ("text" in part ? part.text : ""))
        .join("");
      if (text.trim()) return text;
    }
  }

  return "面试官还在整理思路，请继续你的回答。";
}
