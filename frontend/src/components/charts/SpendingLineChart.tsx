"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export type Point = { date: string; value: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SpendingLineChart({
  data,
  className,
}: {
  data: Point[];
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const w = 320;
  const h = 140;
  const padX = 10;
  const padY = 14;

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const max = Math.max(1, ...values);
  const min = 0;

  const n = Math.max(2, data.length);
  const step = (w - padX * 2) / (n - 1);

  const pts = data.map((d, i) => {
    const x = padX + i * step;
    const t = (d.value - min) / (max - min);
    const y = h - padY - clamp(t, 0, 1) * (h - padY * 2);
    return { x, y };
  });

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area =
    line +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${(h - padY).toFixed(1)}` +
    ` L ${pts[0].x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;

  const idx = activeIndex ?? pts.length - 1;
  const active = pts[idx];
  const activeData = data[idx];

  function onMove(clientX: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * w;
    const i = Math.round((x - padX) / step);
    setActiveIndex(clamp(i, 0, data.length - 1));
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <div className="absolute left-2 top-2 rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200/70 backdrop-blur">
          <div className="font-semibold text-slate-900">{activeData.date}</div>
          <div className="mt-0.5 tabular-nums">฿{activeData.value.toFixed(2)}</div>
        </div>

        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-[160px] w-full"
          role="img"
          aria-label="Spending chart"
          onMouseLeave={() => setActiveIndex(null)}
          onMouseMove={(e) => {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            onMove(e.clientX, rect);
          }}
          onTouchMove={(e) => {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            onMove(e.touches[0].clientX, rect);
          }}
          onTouchEnd={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#fb7185" stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#f472b6" stopOpacity="0.9" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fb7185" stopOpacity="0.14" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g opacity="0.6">
            <line x1="0" y1={h - padY} x2={w} y2={h - padY} stroke="#e2e8f0" />
            <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#eef2ff" />
            <line x1="0" y1={padY} x2={w} y2={padY} stroke="#fdf2f8" />
          </g>

          <path d={area} fill="url(#areaGrad)" />
          <path
            d={line}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3.5"
            className="transition"
          />

          <line
            x1={active.x}
            y1={padY}
            x2={active.x}
            y2={h - padY}
            stroke="#fda4af"
            strokeOpacity="0.55"
          />

          <circle cx={active.x} cy={active.y} r="7" fill="#fff" fillOpacity="0.85" />
          <circle cx={active.x} cy={active.y} r="4" fill="#fb7185" />
        </svg>
      </div>
    </div>
  );
}
