import React, { useId } from "react";
import type { MerchantInsight } from "@/types/insight";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric?.trend;

  return (
    <div className="font-serif border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-7 shadow-xs flex flex-col justify-between h-full space-y-6 text-zinc-900 dark:text-zinc-100 rounded-sm">
      {/* Top Editorial Masthead Tag */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-xs tracking-wider text-zinc-500 dark:text-zinc-400">
            Surface A — Editorial Dispatch
          </span>
        </div>
        <span className="font-serif text-[11px] uppercase tracking-widest text-zinc-400">
          Monochrome • Serif
        </span>
      </div>

      {/* Main Editorial Copy */}
      <div className="space-y-3 flex-1">
        <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug">
          {data.headline}
        </h3>
        <p className="font-serif text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
          {data.detail}
        </p>
      </div>

      {/* Monochrome Metric & Sparkline Box */}
      <div className="border-t border-b border-zinc-200 dark:border-zinc-800 py-4 flex items-end justify-between gap-4">
        <div>
          <span className="font-serif text-xs uppercase tracking-widest text-zinc-400 block">
            {data.metric?.label}
          </span>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="font-serif text-3xl font-normal text-zinc-900 dark:text-zinc-100 tracking-tight">
              {data.metric?.value}
            </span>
            <span className="font-serif italic text-xs text-zinc-500">
              {trend === "up" ? "(Increasing)" : trend === "down" ? "(Decreasing)" : "(Steady)"}
            </span>
          </div>
        </div>

        {/* Minimalist Monochrome Sparkline */}
        <div className="w-32 h-10 flex items-center justify-end">
          <MonochromeSparkline chart={data.chart} gradientId={gradientId} />
        </div>
      </div>

      {/* Minimalist Editorial Button */}
      <button
        type="button"
        className="w-full font-serif text-sm tracking-wide bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 py-3 px-4 transition-colors cursor-pointer text-center"
      >
        {data.action} →
      </button>
    </div>
  );
}

function MonochromeSparkline({ chart, gradientId }: { chart?: number[]; gradientId: string }) {
  if (!chart || chart.length === 0) return null;

  const width = 120;
  const height = 36;
  const paddingX = 4;
  const paddingTop = 4;
  const paddingBottom = 4;

  const min = Math.min(...chart);
  const max = Math.max(...chart);
  const range = max - min;

  const availableWidth = width - 2 * paddingX;
  const availableHeight = height - paddingTop - paddingBottom;

  const points = chart.map((val, index) => {
    const x = chart.length > 1 ? paddingX + (index / (chart.length - 1)) * availableWidth : width / 2;
    const y = range === 0 ? height / 2 : height - paddingBottom - ((val - min) / range) * availableHeight;
    return { x, y };
  });

  const linePath = points.reduce((acc, curr, index) => {
    return `${acc} ${index === 0 ? "M" : "L"} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }, "");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)},${height} L ${firstPoint.x.toFixed(1)},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-800 dark:text-zinc-200"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" className="fill-zinc-900 dark:fill-zinc-100" />
    </svg>
  );
}

export default MerchantCenterCard;
