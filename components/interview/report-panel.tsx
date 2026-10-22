"use client";

import RadarChart from "@/components/interview/radar-chart";
import type { InterviewReport } from "@/lib/interview/types";

interface ReportPanelProps {
  report: InterviewReport;
}

export default function ReportPanel({ report }: ReportPanelProps) {
  return (
    <section className="fade-in-up rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">面试复盘报告</h2>
          <p className="mt-1 text-sm text-slate-500">{report.summary}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-semibold text-blue-600">
            {report.totalScore}
          </span>
          <span className="text-sm text-slate-400"> / 100</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
        <RadarChart dimensions={report.dimensions} />
        <div className="space-y-3">
          {report.dimensions.map((dimension) => (
            <div key={dimension.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{dimension.label}</span>
                <span className="text-slate-500">{dimension.score}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${dimension.score}%` }}
                />
              </div>
              {dimension.comment && (
                <p className="mt-1 text-xs text-slate-500">
                  {dimension.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-medium text-emerald-600">亮点</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {report.strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-amber-600">待改进</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {report.weaknesses.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-blue-600">改进建议</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {report.suggestions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
