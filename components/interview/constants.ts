import type { Persona } from "@/lib/interview/types";

export const PERSONAS: { value: Persona; label: string; desc: string }[] = [
  { value: "technical", label: "技术面", desc: "技术栈、项目细节、解决思路" },
  { value: "hr", label: "HR 面", desc: "沟通、动机、职业规划与软素质" },
  { value: "stress", label: "压力面", desc: "追问细节、制造压力场景" }
];
