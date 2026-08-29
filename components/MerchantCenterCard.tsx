import React, { useId } from "react";
import type { MerchantInsight, VisualizationData } from "@/types/insight";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric?.trend;
  const vis = data.visualization;

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

      {/* Metric & Polymorphic Visualization Container */}
      <div className="border-t border-b border-[var(--border)] py-4 space-y-4">
        {/* Metric Header Row */}
        <div className="flex items-end justify-between gap-4">
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

          {/* Inline Sparkline when in trend_line mode or fallback */}
          {(!vis || vis.type === "trend_line") && (
            <div className="w-32 h-10 flex items-center justify-end">
              <EditorialSparkline chart={vis?.series || data.chart} gradientId={gradientId} />
            </div>
          )}
        </div>

        {/* Polymorphic Body Visualizers for non-trendline types */}
        {vis && vis.type !== "trend_line" && (
          <div className="pt-2 border-t border-[var(--border)]/60">
            {vis.title && (
              <span className="font-serif text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] block mb-2">
                {vis.title}
              </span>
            )}
            <EditorialVisualizer visualization={vis} />
          </div>
        )}
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

function EditorialVisualizer({ visualization }: { visualization: VisualizationData }) {
  if (visualization.type === "bar_comparison" && visualization.categories?.length) {
    const maxVal = Math.max(...visualization.categories.map((c) => c.value), 1);
    return (
      <div className="space-y-2">
        {visualization.categories.map((cat, idx) => {
          const pct = Math.min(100, Math.round((cat.value / maxVal) * 100));
          return (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between text-xs font-serif">
                <span className={cat.highlight ? "font-semibold text-[var(--card-foreground)]" : "text-[var(--muted-foreground)] italic"}>
                  {cat.label} {cat.highlight && "•"}
                </span>
                <span className="font-mono text-[11px] text-[var(--card-foreground)]">
                  {cat.formattedValue || cat.value}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    cat.highlight ? "bg-[var(--primary)]" : "bg-[var(--muted-foreground)]/60"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (visualization.type === "progress_gauge" && visualization.gauge) {
    const { current, target, unit = "%", status = "safe" } = visualization.gauge;
    const pct = Math.min(100, Math.max(0, Math.round((current / (target || 100)) * 100)));
    const statusColor =
      status === "critical"
        ? "text-rose-600 dark:text-rose-400"
        : status === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-serif">
          <span className="text-[var(--muted-foreground)] italic">
            Capacity Level: <strong className="font-mono not-italic">{current}{unit}</strong>
          </span>
          <span className={`text-[11px] uppercase tracking-wider font-semibold ${statusColor}`}>
            Status: {status}
          </span>
        </div>
        <div className="relative h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              status === "critical" ? "bg-rose-500" : status === "warning" ? "bg-amber-500" : "bg-[var(--primary)]"
            }`}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[var(--muted-foreground)]">
          <span>0{unit}</span>
          <span>Target: {target}{unit}</span>
        </div>
      </div>
    );
  }

  if (visualization.type === "breakdown_distribution" && visualization.distribution?.length) {
    const colors = [
      "bg-[var(--primary)]",
      "bg-[var(--chart-1)]",
      "bg-amber-500",
      "bg-slate-400",
    ];

    return (
      <div className="space-y-2.5">
        <div className="h-2 w-full flex rounded-full overflow-hidden bg-[var(--border)] gap-0.5">
          {visualization.distribution.map((seg, idx) => (
            <div
              key={idx}
              style={{ width: `${seg.percentage}%` }}
              className={`h-full ${colors[idx % colors.length]}`}
              title={`${seg.label}: ${seg.percentage}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-serif">
          {visualization.distribution.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
              <span>{seg.label}: <strong className="font-mono text-[var(--card-foreground)] not-italic">{seg.percentage}%</strong></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Graceful fallback to sparkline if any data series exists
  if (visualization.series?.length) {
    return (
      <div className="w-full h-12 flex items-center justify-center">
        <EditorialSparkline chart={visualization.series} gradientId="fallback-spark" />
      </div>
    );
  }

  return null;
}

function EditorialSparkline({ chart, gradientId }: { chart?: number[]; gradientId: string }) {
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
