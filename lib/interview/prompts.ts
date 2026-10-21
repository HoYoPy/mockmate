import type { InterviewConfig, Persona } from "./types";

const PERSONA_LABEL: Record<Persona, string> = {
  technical: "技术面试官",
  hr: "HR 面试官",
  stress: "压力面试官"
};

/**
 * 构建模拟面试的系统提示词。
 * references 是 RAG 检索到的参考题库，用于增强面试官的追问方向。
 */
export function buildSystemPrompt(
  config: InterviewConfig,
  references: { question: string; points?: string[] }[] = []
): string {
  const persona = PERSONA_LABEL[config.persona];

  const parts = [
    `你是「${persona}」，正在对一名应届生候选人进行模拟面试。`,
    "面试流程：先做一句简短开场，然后围绕岗位职责和候选人简历设计 4-6 个递进问题；每次只问一个问题，并根据回答进行针对性追问。",
    "追问策略：如果回答空泛，要求给出具体例子、数据和结果；如果回答完整，就切换到下一个维度；全程保持专业，不进行人身攻击。",
    config.jd ? `\n【岗位要求】\n${config.jd}` : "",
    config.resume ? `\n【候选人简历】\n${config.resume}` : ""
  ];

  if (references.length > 0) {
    parts.push(
      `\n【检索到的高频面试题（围绕考察点自然追问，不要照搬原题）】\n${references
        .map((item, index) => {
          const points = item.points && item.points.length > 0
            ? `（考察点：${item.points.join("、")}）`
            : "";
          return `${index + 1}. ${item.question}${points}`;
        })
        .join("\n")}`
    );
  }

  if (config.persona === "stress") {
    parts.push(
      "\n【风格要求】适当制造压力、追问细节和矛盾点，但只针对回答内容，不攻击个人。"
    );
  }

  return parts.filter(Boolean).join("\n");
}
