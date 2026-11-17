import type { InterviewConfig, Question } from "@/lib/interview/types";

export interface RetrievedQuestion {
  id: string;
  category: string;
  question: string;
  points: string[];
  score: number;
}

type Vector = Record<string, number>;

interface CachedIndex {
  questions: Question[];
  corpusTokens: string[][];
  idf: Map<string, number>;
  docVectors: Vector[];
}

// 题库是静态数据，索引只构建一次并缓存在进程内，避免每次请求重复计算。
let cachedIndex: CachedIndex | null = null;

// 低成本的同义词扩展，缓解纯字面匹配对近义表达不敏感的问题。
const SYNONYMS: Record<string, string[]> = {
  前端: ["web", "react", "vue", "组件", "页面"],
  后端: ["接口", "服务端", "数据库", "api"],
  性能: ["优化", "首屏", "加载", "缓存"],
  数据库: ["sql", "索引", "事务"],
  团队: ["协作", "沟通", "分工"],
  压力: ["抗压", "加班", "情绪"],
  项目: ["经历", "难点", "成果", "负责"],
  ai: ["大模型", "llm", "agent", "rag", "人工智能"],
  react: ["组件", "前端", "hooks"],
  vue: ["组件", "前端", "响应式"],
  测试: ["单元测试", "质量", "用例"],
  安全: ["xss", "csrf", "隐私", "脱敏"],
  产品: ["需求", "用户", "场景", "优先级"]
};

/**
 * 字符 n-gram 分词：中文按连续二字切分，英文/数字按单词切分。
 * 这是一个离线、免费、serverless 友好的向量空间模型检索层。
 * 如需语义 embedding，可将本模块替换为 bge-small-zh-v1.5 的向量输出。
 */
function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens: string[] = [];

  const cjk = normalized.match(/[\u4e00-\u9fa5]+/g) ?? [];
  for (const segment of cjk) {
    const chars = Array.from(segment);
    if (chars.length === 1) {
      tokens.push(chars[0]);
    } else {
      for (let i = 0; i < chars.length - 1; i++) {
        tokens.push(chars[i] + chars[i + 1]);
      }
    }
  }

  const latin = normalized.match(/[a-z0-9]+/g) ?? [];
  tokens.push(...latin);

  return tokens;
}

function containsTerm(text: string, term: string): boolean {
  if (/^[a-z0-9]+$/i.test(term)) {
    return new RegExp(`\\b${term}\\b`, "i").test(text);
  }
  return text.includes(term);
}

function expandQuery(text: string): string {
  const lower = text.toLowerCase();
  const extra: string[] = [];
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (containsTerm(lower, key)) {
      extra.push(...values);
    }
  }
  return extra.length > 0 ? `${text} ${extra.join(" ")}` : text;
}

function dot(a: Vector, b: Vector): number {
  let sum = 0;
  for (const [key, value] of Object.entries(a)) {
    sum += value * (b[key] ?? 0);
  }
  return sum;
}

function norm(a: Vector): number {
  let sum = 0;
  for (const value of Object.values(a)) {
    sum += value * value;
  }
  return Math.sqrt(sum);
}

function cosine(a: Vector, b: Vector): number {
  const denominator = norm(a) * norm(b);
  if (denominator === 0) return 0;
  return dot(a, b) / denominator;
}

function toVector(tokens: string[], idf: Map<string, number>): Vector {
  const termFrequency = new Map<string, number>();
  for (const token of tokens) {
    termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1);
  }

  const vector: Vector = {};
  for (const [token, frequency] of termFrequency) {
    vector[token] = frequency * (idf.get(token) ?? 1);
  }
  return vector;
}

function buildIndex(questions: Question[]): CachedIndex {
  const corpusTokens = questions.map((question) =>
    tokenize(
      [
        question.question,
        ...question.skills,
        ...question.keywords,
        ...question.points,
        ...question.job,
        question.category
      ].join(" ")
    )
  );

  const documentFrequency = new Map<string, number>();
  for (const tokens of corpusTokens) {
    const seen = new Set(tokens);
    for (const token of seen) {
      documentFrequency.set(
        token,
        (documentFrequency.get(token) ?? 0) + 1
      );
    }
  }

  const total = questions.length;
  const idf = new Map<string, number>();
  for (const [token, frequency] of documentFrequency) {
    idf.set(token, Math.log((total + 1) / (frequency + 1)) + 1);
  }

  return {
    questions,
    corpusTokens,
    idf,
    docVectors: corpusTokens.map((tokens) => toVector(tokens, idf))
  };
}

function getIndex(questions: Question[]): CachedIndex {
  if (!cachedIndex || cachedIndex.questions !== questions) {
    cachedIndex = buildIndex(questions);
  }
  return cachedIndex;
}

export function retrieveQuestions(
  config: InterviewConfig,
  questions: Question[],
  limit = 6
): RetrievedQuestion[] {
  const queryText = [config.resume, config.jd].filter(Boolean).join("\n");
  const index = getIndex(questions);
  const queryVector = toVector(tokenize(expandQuery(queryText)), index.idf);

  const scored = questions
    .map((question, i) => {
      const similarity = cosine(queryVector, index.docVectors[i]);

      let keywordHits = 0;
      for (const keyword of question.keywords) {
        if (queryText.toLowerCase().includes(keyword.toLowerCase())) {
          keywordHits += 1;
        }
      }

      const personaBoost = question.persona.includes(config.persona) ? 0.05 : 0;
      const score =
        similarity * 0.85 + Math.min(keywordHits, 5) * 0.06 + personaBoost;

      return { question, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => ({
    id: entry.question.id,
    category: entry.question.category,
    question: entry.question.question,
    points: entry.question.points,
    score: entry.score
  }));
}
