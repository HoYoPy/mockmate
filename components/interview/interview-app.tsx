"use client";

import { FormEvent, useRef, useState } from "react";

import type {
  ChatMessage,
  InterviewConfig,
  Persona
} from "@/lib/interview/types";

const PERSONAS: { value: Persona; label: string; desc: string }[] = [
  { value: "technical", label: "技术面", desc: "技术栈、项目细节、解决思路" },
  { value: "hr", label: "HR 面", desc: "沟通、动机、职业规划与软素质" },
  { value: "stress", label: "压力面", desc: "追问细节、制造压力场景" }
];

export default function InterviewApp() {
  const [persona, setPersona] = useState<Persona>("technical");
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const config: InterviewConfig = { persona, resume, jd };

  async function streamReply(nextMessages: ChatMessage[]) {
    setLoading(true);
    setMessages([...nextMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, config })
      });

      if (!res.ok || !res.body) {
        throw new Error(`请求失败：${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = {
            ...last,
            content: last.content + chunk
          };
          return copy;
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          ...last,
          content: `发生错误：${message}`
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text }
    ];
    setMessages(nextMessages);
    setInput("");
    void streamReply(nextMessages);
  }

  function handleStart() {
    setStarted(true);
    setMessages([]);
    void streamReply([]);
  }

  function handleReport() {
    if (loading) return;
    const text =
      "请现在基于以上面试过程，输出一份结构化复盘报告。";
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text }
    ];
    setMessages(nextMessages);
    void streamReply(nextMessages);
  }

  function handleReset() {
    setStarted(false);
    setMessages([]);
    setInput("");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          MockMate · AI 智能面试教练
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          上传简历与岗位 JD，选择面试官风格，开始多轮模拟面试并生成复盘报告。
        </p>
      </header>

      {!started ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-medium text-slate-700">选择面试官风格</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {PERSONAS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPersona(item.value)}
                  className={`rounded-lg border p-4 text-left transition ${
                    persona === item.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="block font-medium">{item.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">我的简历</span>
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="粘贴简历文字：学校、专业、技能、项目经历、实习经历……"
                className="mt-2 h-40 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">岗位 JD</span>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="粘贴目标岗位描述，例如：前端开发工程师，要求掌握 React、TypeScript……"
                className="mt-2 h-40 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            开始模拟面试
          </button>
        </section>
      ) : (
        <section className="flex min-h-[70vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <span className="text-sm font-medium text-slate-700">
              {PERSONAS.find((p) => p.value === persona)?.label} · 进行中
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReport}
                disabled={loading || messages.length === 0}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                生成复盘报告
              </button>
              <button
                type="button"
                onClick={handleReset}
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
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.content || (loading ? "正在思考……" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
      )}
    </main>
  );
}
