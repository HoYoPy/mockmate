"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useRef, useState } from "react";

import ChatPanel from "@/components/interview/chat-panel";
import { PERSONAS } from "@/components/interview/constants";
import GapAnalysisPanel from "@/components/interview/gap-analysis";
import InterviewSetup from "@/components/interview/interview-setup";
import { loadHistory, saveHistory } from "@/lib/storage/history";
import type {
  ChatMessage,
  GapAnalysis,
  HistoryRecord,
  InterviewConfig,
  InterviewReport,
  Persona
} from "@/lib/interview/types";

const ReportPanel = dynamic(
  () => import("@/components/interview/report-panel"),
  {
    ssr: false,
    loading: () => (
      <p className="py-4 text-center text-sm text-slate-400">正在加载报告…</p>
    )
  }
);

export default function InterviewApp() {
  const [persona, setPersona] = useState<Persona>("technical");
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [listening, setListening] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [recognizingImage, setRecognizingImage] = useState(false);
  const [gap, setGap] = useState<GapAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

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
        let message = `请求失败：${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // 忽略非 JSON 响应
        }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const append = (text: string) => {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + text };
          return copy;
        });
      };

      const consumeEvents = (chunk: string) => {
        const events = chunk.split("\n\n");
        for (const event of events) {
          const dataLine = event
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const text = JSON.parse(dataLine.slice(6)) as string;
            if (text) append(text);
          } catch {
            // 忽略无法解析的事件
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const boundary = buffer.lastIndexOf("\n\n");
        if (boundary === -1) continue;
        consumeEvents(buffer.slice(0, boundary + 2));
        buffer = buffer.slice(boundary + 2);
      }
      if (buffer) consumeEvents(buffer);
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
    setReport(null);
    void streamReply([]);
  }

  async function handleReport() {
    if (loading || reporting || messages.length === 0) return;
    setReporting(true);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, config })
      });

      if (!res.ok) {
        let message = `生成报告失败：${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // 忽略非 JSON 响应
        }
        throw new Error(message);
      }

      const data = (await res.json()) as InterviewReport;
      setReport(data);
      setHistory(
        saveHistory({
          date: new Date().toISOString(),
          totalScore: data.totalScore,
          dimensions: data.dimensions.map((dimension) => ({
            key: dimension.key,
            label: dimension.label,
            score: dimension.score
          }))
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setReport({
        totalScore: 0,
        summary: message,
        dimensions: [],
        strengths: [],
        weaknesses: [],
        suggestions: []
      });
    } finally {
      setReporting(false);
    }
  }

  function handleReset() {
    setStarted(false);
    setMessages([]);
    setInput("");
    setReport(null);
  }

  async function handleGapAnalysis() {
    if (!resume.trim() && !jd.trim()) {
      alert("请先填写简历或岗位 JD");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });

      if (!res.ok) {
        let message = `分析失败：${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // 忽略非 JSON 响应
        }
        throw new Error(message);
      }

      const data = (await res.json()) as GapAnalysis;
      setGap(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleVoice() {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (event: unknown) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => unknown;
    };

    const SpeechRecognition =
      win.SpeechRecognition ??
      (win.webkitSpeechRecognition as unknown as typeof win.SpeechRecognition);

    if (!SpeechRecognition) {
      alert("当前浏览器不支持语音输入，请使用 Chrome 或 Edge。");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onresult = (event: unknown) => {
      const resultEvent = event as {
        results: Array<Array<{ transcript: string }>>;
      };
      const text = resultEvent.results[0]?.[0]?.transcript ?? "";
      if (text) {
        setInput((prev) => (prev ? `${prev}${text}` : text));
      }
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  async function handleResumeFile(file: File) {
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "解析失败");
      setResume((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
    } catch (error) {
      alert(error instanceof Error ? error.message : "解析失败");
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleJdImage(file: File) {
    setRecognizingImage(true);
    try {
      const Tesseract = (await import("tesseract.js")).default as {
        createWorker: (lang: string) => Promise<{
          recognize: (image: File) => Promise<{ data: { text: string } }>;
          terminate: () => Promise<unknown>;
        }>;
      };
      const worker = await Tesseract.createWorker("chi_sim");
      const result = await worker.recognize(file);
      await worker.terminate();
      const text = (result.data?.text ?? "").trim();
      if (!text) throw new Error("未识别到文字");
      setJd((prev) => (prev ? `${prev}\n\n${text}` : text));
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "图片识别失败，请使用 Chrome/Edge 并保持联网"
      );
    } finally {
      setRecognizingImage(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.filter((voice) => voice.lang.toLowerCase().startsWith("zh"));
    const preferred = [
      "xiaoxiao",
      "xiaoyi",
      "yunxi",
      "yunyang",
      "natural",
      "online",
      "普通话",
      "中文",
      "zh-cn"
    ];
    const pool = zh.length > 0 ? zh : voices;
    let voice = pool[0] ?? null;
    for (const key of preferred) {
      const match = pool.find((item) => item.name.toLowerCase().includes(key));
      if (match) {
        voice = match;
        break;
      }
    }
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "zh-CN";
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  const personaLabel =
    PERSONAS.find((item) => item.value === persona)?.label ?? "面试官";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          MockMate · AI 智能面试教练
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          上传简历与岗位 JD，选择面试官风格，开始多轮模拟面试并生成能力雷达图复盘。
        </p>
      </header>

      {!started ? (
        <div className="space-y-5">
          <InterviewSetup
            persona={persona}
            resume={resume}
            jd={jd}
            uploadingResume={uploadingResume}
            recognizingImage={recognizingImage}
            onPersonaChange={setPersona}
            onResumeChange={setResume}
            onJdChange={setJd}
            onResumeFile={handleResumeFile}
            onJdImage={handleJdImage}
            onStart={handleStart}
          />
          <GapAnalysisPanel
            gap={gap}
            analyzing={analyzing}
            onAnalyze={handleGapAnalysis}
          />
        </div>
      ) : (
        <div className="space-y-5">
          <ChatPanel
            personaLabel={personaLabel}
            messages={messages}
            input={input}
            loading={loading}
            listening={listening}
            reporting={reporting}
            onInputChange={setInput}
            onSend={handleSubmit}
            onVoice={toggleVoice}
            onReport={handleReport}
            onReset={handleReset}
            onSpeak={speak}
          />
          {report && <ReportPanel report={report} history={history} />}
        </div>
      )}
    </main>
  );
}
