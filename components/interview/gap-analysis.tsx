"use client";

import type { GapAnalysis } from "@/lib/interview/types";

interface GapAnalysisProps {
  gap: GapAnalysis | null;
  analyzing: boolean;
  onAnalyze: () => void;
}

export default function GapAnalysis({
  gap,
  analyzing,
  onAnalyze
}: GapAnalysisProps) {
  return (
    <section className="fade-in-up rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            简历 × 岗位差距分析
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            开始面试前，先看清你与目标岗位的匹配度、缺口技能和可能会被问的问题。
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzing}
          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? "分析中…" : gap ? "重新分析" : "开始分析"}
        </button>
      </div>

      {gap && (
        <div className="mt-5">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-semibold text-blue-600">
              {gap.matchScore}
            </span>
            <span className="text-sm text-slate-400">匹配度 / 100</span>
            <div className="h-2 flex-1 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${gap.matchScore}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{gap.summary}</p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-emerald-600">已匹配能力</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {gap.matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-rose-600">缺口技能</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {gap.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium text-slate-700">
              你可能会被问到
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {gap.likelyQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium text-slate-700">提升建议</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {gap.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
