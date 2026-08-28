import React, { useId } from "react";
import type { MerchantInsight } from "@/types/insight";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric?.trend;

  return (
    <div
      style={{ borderRadius: "var(--radius, 0.625rem)" }}
      className="theme-serif-card font-serif border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] p-6 sm:p-7 shadow-xs flex flex-col justify-between h-full space-y-6"
    >
      {/* Main Editorial Copy */}
      <div className="space-y-3 flex-1">
        <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[var(--card-foreground)] leading-snug">
          {data.headline}
        </h3>
        <p className="font-serif text-sm text-[var(--muted-foreground)] leading-relaxed italic">
          {data.detail}
        </p>
      </div>

      {/* Metric & Sparkline Box */}
      <div className="border-t border-b border-[var(--border)] py-4 flex items-end justify-between gap-4">
        <div>
          <span className="font-serif text-xs uppercase tracking-widest text-[var(--muted-foreground)] block">
            {data.metric?.label}
          </span>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="font-serif text-3xl font-normal text-[var(--card-foreground)] tracking-tight">
              {data.metric?.value}
            </span>
            <span className="font-serif italic text-xs text-[var(--muted-foreground)]">
              {trend === "up" ? "(Increasing)" : trend === "down" ? "(Decreasing)" : "(Steady)"}
            </span>
          </div>
        </div>

        {/* Minimalist Sparkline with Chart Token */}
        <div className="w-32 h-10 flex items-center justify-end">
          <ThemeSparkline chart={data.chart} gradientId={gradientId} />
        </div>
      </div>

      {/* Styled Primary Editorial Button */}
      <button
        type="button"
        style={{ borderRadius: "calc(var(--radius, 0.625rem) * 0.75)" }}
        className="w-full font-serif text-sm tracking-wide bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] py-3 px-4 transition-opacity cursor-pointer text-center font-medium shadow-xs"
      >
        {data.action} →
      </button>
    </div>
  );
}

function ThemeSparkline({ chart, gradientId }: { chart?: number[]; gradientId: string }) {
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
          <stop offset="0%" stopColor="var(--chart-1, #10b981)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-1, #10b981)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="var(--chart-1, currentColor)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill="var(--chart-1, currentColor)" />
    </svg>
  );
}

export default MerchantCenterCard;
