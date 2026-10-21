import type { InterviewConfig, Persona } from "./types";

const PERSONA_LABEL: Record<Persona, string> = {
  technical: "技术面试官",
  hr: "HR 面试官",
  stress: "压力面试官"
};

/**
 * 构建模拟面试的系统提示词。
 * 后续做 Agent 时，可以把「追问策略」拆成独立工具，并接入简历检索结果。
 */
export function buildSystemPrompt(config: InterviewConfig): string {
  const persona = PERSONA_LABEL[config.persona];

  const parts = [
    `你是「${persona}」，正在对一名应届生候选人进行模拟面试。`,
    "请像真实面试官一样：先做简短开场，然后围绕岗位职责和候选人简历逐题提问；根据回答进行针对性追问，控制节奏，一次只问一个问题。",
    "面试过程中记录候选人的关键表现。当候选人要求复盘时，输出结构化复盘报告，包含：总体评分（0-100）、亮点、待改进点、改进建议。",
    config.jd ? `\n【岗位要求】\n${config.jd}` : "",
    config.resume ? `\n【候选人简历】\n${config.resume}` : "",
    config.persona === "stress"
      ? "\n【风格要求】适当追问细节、制造压力场景，但保持专业，不进行人身攻击。"
      : ""
  ];

  return parts.filter(Boolean).join("\n");
}
