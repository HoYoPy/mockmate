import OpenAI from "openai";

/**
 * 创建 OpenAI 兼容客户端。
 * 通过 OPENAI_BASE_URL 可切换 DeepSeek、智谱、通义千问等兼容服务。
 */
export function createAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY，请在环境变量中配置");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined
  });
}
