"use client";

import type { ChatMessage } from "@/lib/interview/types";

interface MessageBubbleProps {
  message: ChatMessage;
  loading: boolean;
  onSpeak: (text: string) => void;
}

export default function MessageBubble({
  message,
  loading,
  onSpeak
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-2 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && message.content && (
        <button
          type="button"
          onClick={() => onSpeak(message.content)}
          title="朗读"
          className="mt-1 shrink-0 rounded-md border border-slate-200 p-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
        >
          朗读
        </button>
      )}
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
        }`}
      >
        {message.content || (loading ? "正在思考…" : "")}
      </div>
    </div>
  );
}
