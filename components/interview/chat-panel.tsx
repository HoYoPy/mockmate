"use client";

import { FormEvent, useEffect, useState } from "react";

import MessageBubble from "@/components/interview/message-bubble";
import type { ChatMessage } from "@/lib/interview/types";

const THINKING_PHASES = [
  "正在理解你的回答…",
  "正在从题库选题…",
  "正在组织语言…"
];

interface ChatPanelProps {
  personaLabel: string;
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  listening: boolean;
  reporting: boolean;
  onInputChange: (value: string) => void;
  onSend: (event: FormEvent) => void;
  onVoice: () => void;
  onReport: () => void;
  onReset: () => void;
  onSpeak: (text: string) => void;
}

export default function ChatPanel({
  personaLabel,
  messages,
  input,
  loading,
  listening,
  reporting,
  onInputChange,
  onSend,
  onVoice,
  onReport,
  onReset,
  onSpeak
}: ChatPanelProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setPhaseIndex(0);
    const timer = setInterval(() => {
      setPhaseIndex((index) => (index + 1) % THINKING_PHASES.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [loading]);

  return (
    <section className="fade-in-up flex min-h-[62vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <span className="text-sm font-medium text-slate-700">
          {personaLabel} · 进行中
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReport}
            disabled={loading || reporting || messages.length === 0}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reporting ? "正在生成报告…" : "结束并生成复盘报告"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
          >
            重新开始
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">面试官正在准备开场……</p>
        )}
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            loading={loading && index === messages.length - 1}
            onSpeak={onSpeak}
          />
        ))}
      </div>

      <div className="border-t border-slate-200 px-5 py-2">
        <p className="min-h-5 text-xs text-slate-400">
          {loading ? THINKING_PHASES[phaseIndex] : " "}
        </p>
      </div>

      <form
        onSubmit={onSend}
        className="flex items-center gap-2 border-t border-slate-200 p-4"
      >
        <button
          type="button"
          onClick={onVoice}
          disabled={loading}
          title="语音输入"
          className={`shrink-0 rounded-lg border p-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
            listening
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {listening ? "聆听中" : "语音"}
        </button>
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="输入你的回答……"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </section>
  );
}
