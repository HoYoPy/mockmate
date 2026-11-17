import type { HistoryRecord } from "@/lib/interview/types";

const STORAGE_KEY = "mockmate:history";

// 读取最近 12 次面试成绩，localStorage 不可用时返回空数组。
export function loadHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is HistoryRecord =>
        Boolean(item && typeof item.totalScore === "number")
    );
  } catch {
    return [];
  }
}

// 追加一条成绩并只保留最近 12 次，避免 localStorage 无限增长。
export function saveHistory(record: HistoryRecord): HistoryRecord[] {
  const history = [...loadHistory(), record].slice(-12);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage 不可用时静默失败
  }
  return history;
}
