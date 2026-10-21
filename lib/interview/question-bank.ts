import type { Persona } from "@/lib/interview/types";

export interface InterviewQuestion {
  id: string;
  category: "技术" | "项目" | "行为" | "压力" | "职业规划";
  personas: Persona[];
  keywords: string[];
  question: string;
}

/**
 * 内置面试题库。生产环境可替换为向量数据库（embedding 检索），
 * 这里用关键词评分做一个轻量、离线可用的 RAG 检索层。
 */
export const QUESTION_BANK: InterviewQuestion[] = [
  {
    id: "tech-01",
    category: "技术",
    personas: ["technical"],
    keywords: ["前端", "react", "vue", "javascript", "typescript", "组件"],
    question: "能讲一下你项目里组件是如何拆分的吗？为什么这样拆？"
  },
  {
    id: "tech-02",
    category: "技术",
    personas: ["technical"],
    keywords: ["前端", "性能", "优化", "懒加载", "缓存", "首屏"],
    question: "你做过哪些前端性能优化？具体指标提升了多少？"
  },
  {
    id: "tech-03",
    category: "技术",
    personas: ["technical"],
    keywords: ["后端", "接口", "数据库", "sql", "索引", "缓存"],
    question: "如果接口响应很慢，你会从哪些方面定位和优化？"
  },
  {
    id: "tech-04",
    category: "技术",
    personas: ["technical", "stress"],
    keywords: ["算法", "数据结构", "复杂度", "链表", "排序"],
    question: "选一个你熟悉的算法，讲清楚它的时间复杂度和适用场景。"
  },
  {
    id: "project-01",
    category: "项目",
    personas: ["technical", "hr"],
    keywords: ["项目", "负责", "难点", "架构", "技术选型"],
    question: "介绍一个你最满意或最有挑战的项目，你具体负责哪部分？"
  },
  {
    id: "project-02",
    category: "项目",
    personas: ["technical", "stress"],
    keywords: ["项目", "难点", "bug", "问题", "解决", "复盘"],
    question: "项目里遇到过最难的问题是什么？你是怎么定位和解决的？"
  },
  {
    id: "project-03",
    category: "项目",
    personas: ["hr", "stress"],
    keywords: ["团队", "协作", "分工", "冲突", "沟通"],
    question: "团队合作中出现过分歧吗？你是怎么处理的？"
  },
  {
    id: "behave-01",
    category: "行为",
    personas: ["hr"],
    keywords: ["自我介绍", "优势", "缺点", "性格"],
    question: "请用 1 分钟做一个自我介绍，突出你和这个岗位的匹配点。"
  },
  {
    id: "behave-02",
    category: "行为",
    personas: ["hr"],
    keywords: ["压力", "加班", "失败", "挫折", "抗压"],
    question: "讲一次你承受较大压力并最终完成的经历。"
  },
  {
    id: "behave-03",
    category: "行为",
    personas: ["hr"],
    keywords: ["目标", "规划", "学习", "成长", "复盘"],
    question: "你平时如何学习新技术？有没有形成自己的学习方法？"
  },
  {
    id: "career-01",
    category: "职业规划",
    personas: ["hr"],
    keywords: ["职业规划", "目标", "方向", "三年", "五年"],
    question: "你未来 3-5 年的职业规划是什么？"
  },
  {
    id: "career-02",
    category: "职业规划",
    personas: ["hr", "stress"],
    keywords: ["选择", "公司", "岗位", "为什么", "匹配"],
    question: "你为什么选择这个岗位和我们公司？你最大的顾虑是什么？"
  },
  {
    id: "stress-01",
    category: "压力",
    personas: ["stress"],
    keywords: ["质疑", "缺点", "不足", "失败", "为什么"],
    question: "从刚才的回答看，你的项目经验其实很浅，你凭什么觉得能胜任？"
  },
  {
    id: "stress-02",
    category: "压力",
    personas: ["stress"],
    keywords: ["冲突", "拒绝", "沟通", "说服", "反对"],
    question: "如果团队负责人坚决反对你的方案，你会怎么做？"
  }
];
