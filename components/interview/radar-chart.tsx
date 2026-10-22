"use client";

import type { ReportDimension } from "@/lib/interview/types";

interface RadarChartProps {
  dimensions: ReportDimension[];
}

export default function RadarChart({ dimensions }: RadarChartProps) {
  const size = 300;
  const center = size / 2;
  const radius = 108;
  const count = dimensions.length;

  const angle = (index: number) =>
    (Math.PI * 2 * index) / count - Math.PI / 2;

  const point = (index: number, distance: number) => {
    const a = angle(index);
    return [center + Math.cos(a) * distance, center + Math.sin(a) * distance];
  };

  const polygonPoints = (ratio: number) =>
    dimensions
      .map((_, index) => point(index, radius * ratio).join(","))
      .join(" ");

  const dataPoints = dimensions
    .map((dimension, index) =>
      point(index, radius * (dimension.score / 100)).join(",")
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-64 w-64"
      role="img"
      aria-label="面试能力雷达图"
    >
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={polygonPoints(ratio)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {dimensions.map((_, index) => {
        const [x, y] = point(index, radius);
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={dataPoints}
        className="radar-data"
        fill="rgba(37, 99, 235, 0.18)"
        stroke="#2563eb"
        strokeWidth="2"
      />

      {dimensions.map((dimension, index) => {
        const [x, y] = point(index, radius * (dimension.score / 100));
        const [labelX, labelY] = point(index, radius + 28);
        return (
          <g key={dimension.key}>
            <circle cx={x} cy={y} r="4" fill="#2563eb" />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-600 text-[12px]"
            >
              {dimension.label} {dimension.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
