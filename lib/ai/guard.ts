export interface GuardResult {
  safe: boolean;
  text: string;
  reason?: string;
}

const SENSITIVE_RULES: {
  name: string;
  regex: RegExp;
  replacement: string;
}[] = [
  { name: "手机号", regex: /1[3-9]\d{9}/g, replacement: "[手机号]" },
  {
    name: "邮箱",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: "[邮箱]"
  },
  { name: "身份证", regex: /\b\d{17}[\dXx]\b/g, replacement: "[身份证号]" },
  { name: "密钥", regex: /\bsk-[A-Za-z0-9_-]{10,}\b/g, replacement: "[密钥]" },
  { name: "银行卡", regex: /\b\d{16,19}\b/g, replacement: "[银行卡号]" }
];

const BLOCKED_WORDS = [
  "自杀",
  "自残",
  "跳楼",
  "割腕",
  "色情",
  "淫秽",
  "卖淫",
  "裸照",
  "恐怖袭击",
  "制造炸弹",
  "贩毒",
  "杀人",
  "枪支弹药"
];

const INSULT_WORDS = ["傻逼", "白痴", "废物", "蠢货", "去死", "垃圾人", "没脑子", "滚蛋"];

export function maskSensitive(text: string): string {
  let result = text;
  for (const rule of SENSITIVE_RULES) {
    result = result.replace(rule.regex, rule.replacement);
  }
  return result;
}

export function guardUserInput(text: string): GuardResult {
  const masked = maskSensitive(text);
  const blocked = BLOCKED_WORDS.find((word) => masked.includes(word));
  if (blocked) {
    return { safe: false, text: "", reason: `检测到违规内容（${blocked}）` };
  }
  return { safe: true, text: masked };
}

export function guardOutput(text: string): GuardResult {
  let result = maskSensitive(text);
  const blocked = BLOCKED_WORDS.find((word) => result.includes(word));
  if (blocked) {
    return { safe: false, text: "（该内容已被安全策略拦截）", reason: `检测到违规内容（${blocked}）` };
  }
  for (const word of INSULT_WORDS) {
    result = result.split(word).join("[不友好用语]");
  }
  return { safe: true, text: result };
}
