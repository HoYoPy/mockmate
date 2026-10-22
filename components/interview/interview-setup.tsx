"use client";

import { useRef } from "react";

import { PERSONAS } from "@/components/interview/constants";
import type { Persona } from "@/lib/interview/types";

interface InterviewSetupProps {
  persona: Persona;
  resume: string;
  jd: string;
  uploadingResume: boolean;
  recognizingImage: boolean;
  onPersonaChange: (persona: Persona) => void;
  onResumeChange: (value: string) => void;
  onJdChange: (value: string) => void;
  onResumeFile: (file: File) => void;
  onJdImage: (file: File) => void;
  onStart: () => void;
}

export default function InterviewSetup({
  persona,
  resume,
  jd,
  uploadingResume,
  recognizingImage,
  onPersonaChange,
  onResumeChange,
  onJdChange,
  onResumeFile,
  onJdImage,
  onStart
}: InterviewSetupProps) {
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const jdImageRef = useRef<HTMLInputElement>(null);

  return (
    <section className="fade-in-up rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-medium text-slate-700">选择面试官风格</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PERSONAS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onPersonaChange(item.value)}
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
        <div className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">我的简历</span>
            <div className="flex items-center gap-2">
              <input
                ref={resumeFileRef}
                type="file"
                accept=".txt,.md,.docx,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onResumeFile(file);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => resumeFileRef.current?.click()}
                disabled={uploadingResume}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingResume ? "解析中…" : "上传文件"}
              </button>
            </div>
          </div>
          <textarea
            value={resume}
            onChange={(event) => onResumeChange(event.target.value)}
            placeholder="粘贴简历文字：学校、专业、技能、项目经历、实习经历……"
            className="mt-2 h-40 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">岗位 JD</span>
            <div className="flex items-center gap-2">
              <input
                ref={jdImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onJdImage(file);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => jdImageRef.current?.click()}
                disabled={recognizingImage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {recognizingImage ? "识别中…" : "识别图片"}
              </button>
            </div>
          </div>
          <textarea
            value={jd}
            onChange={(event) => onJdChange(event.target.value)}
            placeholder="粘贴目标岗位描述，例如：前端开发工程师，要求掌握 React、TypeScript……"
            className="mt-2 h-40 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        开始模拟面试
      </button>
    </section>
  );
}
