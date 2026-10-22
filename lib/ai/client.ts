import OpenAI from "openai";

export interface ModelConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
}

function getPrimaryConfig(): ModelConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY，请在环境变量中配置");
  }

  return {
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  };
}

function getFallbackConfigs(): ModelConfig[] {
  const raw = process.env.OPENAI_FALLBACKS;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is { apiKey: string; baseURL?: string; model: string } =>
          Boolean(item && item.apiKey && item.model)
      )
      .map((item) => ({
        apiKey: item.apiKey,
        baseURL: item.baseURL,
        model: item.model
      }));
  } catch {
    return [];
  }
}

export function getModelConfigs(): ModelConfig[] {
  return [getPrimaryConfig(), ...getFallbackConfigs()];
}

export function createClient(config: ModelConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || undefined,
    timeout: 30_000,
    maxRetries: 0
  });
}

export async function runWithFallback<T>(
  fn: (client: OpenAI, model: string) => Promise<T>
): Promise<T> {
  const configs = getModelConfigs();
  let lastError: unknown;

  for (const config of configs) {
    try {
      return await fn(createClient(config), config.model);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
