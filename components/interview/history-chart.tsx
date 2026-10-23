"use client";

import type { HistoryRecord } from "@/lib/interview/types";

interface HistoryChartProps {
  history: HistoryRecord[];
}

export default function HistoryChart({ history }: HistoryChartProps) {
  if (history.length < 2) {
    return (
      <p className="text-xs text-slate-400">
        再完成 1 次面试后，这里会展示你的能力变化曲线。
      </p>
    );
  }

  const width = 320;
  const height = 120;
  const padding = 18;
  const scores = history.map((item) => item.totalScore);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;

  const points = scores
    .map((score, index) => {
      const x =
        padding +
        (index / (scores.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((score - min) / range) * (height - padding * 2);
      return [x, y] as const;
    })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-32 w-full"
      role="img"
      aria-label="面试成绩变化曲线"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {scores.map((score, index) => {
        const x =
          padding + (index / (scores.length - 1)) * (width - padding * 2);
        const y =
          height -
          padding -
          ((score - min) / range) * (height - padding * 2);
        return (
          <g key={index}>
            <circle cx={x} cy={y} r="3" fill="#2563eb" />
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
