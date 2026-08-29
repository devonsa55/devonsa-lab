import React from "react";
import type { MerchantInsight, VisualizationData } from "@/types/insight";
import { IconArrowUpRight, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  onAction?: () => void;
}

export function AdsBanner({ data, className = "", onAction }: AdsBannerProps) {
  if (!data) return null;

  const vis = data.visualization;

  return (
    <div
      className={`rounded-none border-2 border-black dark:border-white bg-blue-600 text-white p-6 sm:p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.9)] flex flex-col justify-between h-full space-y-6 ${className}`}
      aria-label="Geometric Color Surface"
    >
      {/* Main Copy */}
      <div className="space-y-2.5 flex-1">
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
          {data.headline}
        </h3>
        <p className="text-sm font-medium text-blue-100 leading-relaxed">
          {data.detail}
        </p>
      </div>

      {/* Vibrant Square Metric Box */}
      <div className="rounded-none border-2 border-black dark:border-white bg-yellow-300 text-black p-4 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {/* Metric Header Row */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/70 block">
              {data.metric?.label}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-black">
                {data.metric?.value}
              </span>
              <SquareTrendBadge trend={data.metric?.trend} />
            </div>
          </div>

          {/* Inline Square Equalizer for trend_line or default */}
          {(!vis || vis.type === "trend_line") && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-black/60">Metric Wave</span>
              <SquareBarChart chart={vis?.series || data.chart} />
            </div>
          )}
        </div>

        {/* Polymorphic Body Visualizers for non-trendline types */}
        {vis && vis.type !== "trend_line" && (
          <div className="pt-3 border-t-2 border-black/20">
            {vis.title && (
              <span className="text-[9px] font-black uppercase tracking-wider text-black/80 block mb-2">
                {vis.title}
              </span>
            )}
            <ConstructivistVisualizer visualization={vis} />
          </div>
        )}
      </div>

      {/* Sharp Square Button with Hard Shadow */}
      <button
        type="button"
        onClick={onAction}
        className="w-full rounded-none border-2 border-black dark:border-white bg-black hover:bg-zinc-800 text-white font-black text-sm uppercase tracking-wider py-3.5 px-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
      >
        <span>{data.action}</span>
        <IconArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConstructivistVisualizer({ visualization }: { visualization: VisualizationData }) {
  if (visualization.type === "bar_comparison" && visualization.categories?.length) {
    const maxVal = Math.max(...visualization.categories.map((c) => c.value), 1);

    return (
      <div className="space-y-2">
        {visualization.categories.map((cat, idx) => {
          const pct = Math.min(100, Math.round((cat.value / maxVal) * 100));
          return (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-mono font-black">
                <span className="uppercase text-black">{cat.label}</span>
                <span className={cat.highlight ? "bg-black text-yellow-300 px-1" : "text-black/80"}>
                  {cat.formattedValue || cat.value}
                </span>
              </div>
              <div className="h-3 w-full bg-black/15 border border-black/30 rounded-none overflow-hidden p-0.5">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-none transition-all duration-200 ${
                    cat.highlight ? "bg-black" : "bg-blue-600"
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

    const statusStyle =
      status === "critical"
        ? "bg-rose-600 text-white"
        : status === "warning"
        ? "bg-amber-600 text-white"
        : "bg-emerald-600 text-white";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-black">
          <span className="uppercase text-black">
            LEVEL: {current}{unit} / {target}{unit}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] uppercase ${statusStyle}`}>
            {status}
          </span>
        </div>
        <div className="h-4 w-full bg-black/20 border-2 border-black rounded-none p-0.5">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full rounded-none transition-all duration-300 ${
              status === "critical" ? "bg-rose-600" : status === "warning" ? "bg-amber-500" : "bg-black"
            }`}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono font-bold text-black/70">
          <span>0{unit}</span>
          <span>THRESHOLD: {target}{unit}</span>
        </div>
      </div>
    );
  }

  if (visualization.type === "breakdown_distribution" && visualization.distribution?.length) {
    const blockColors = ["bg-black", "bg-blue-600", "bg-rose-600", "bg-emerald-600"];

    return (
      <div className="space-y-2.5">
        <div className="h-4 w-full flex border-2 border-black rounded-none bg-black/20 overflow-hidden">
          {visualization.distribution.map((seg, idx) => (
            <div
              key={idx}
              style={{ width: `${seg.percentage}%` }}
              className={`h-full ${blockColors[idx % blockColors.length]} border-r border-black last:border-r-0`}
              title={`${seg.label}: ${seg.percentage}%`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono font-black">
          {visualization.distribution.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-black">
              <span className={`w-2.5 h-2.5 ${blockColors[idx % blockColors.length]} border border-black shrink-0`} />
              <span className="truncate uppercase">{seg.label}: {seg.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Graceful fallback to square equalizer if series exists
  if (visualization.series?.length) {
    return (
      <div className="w-full flex justify-end pt-1">
        <SquareBarChart chart={visualization.series} />
      </div>
    );
  }

  return null;
}

function SquareTrendBadge({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-emerald-600 text-white rounded-none">
        <IconTrendingUp className="w-3 h-3" />
        UP
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-rose-600 text-white rounded-none">
        <IconTrendingDown className="w-3 h-3" />
        DOWN
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black uppercase bg-black text-white rounded-none">
      <IconMinus className="w-3 h-3" />
      FLAT
    </span>
  );
}

function SquareBarChart({ chart }: { chart?: number[] }) {
  const values = chart && chart.length > 0 ? chart : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return (
    <div
      className="flex items-end gap-1 h-9 px-1.5 py-1 bg-black/10 border border-black/20 rounded-none"
      aria-label="Square trend chart"
    >
      {values.map((val, idx) => {
        const normalized = range === 0 ? 0.5 : (val - min) / range;
        const heightPercent = Math.max(20, Math.round(normalized * 100));

        return (
          <div key={idx} className="group/bar relative flex items-end h-full justify-center">
            <div
              style={{ height: `${heightPercent}%` }}
              className="w-2.5 bg-black hover:bg-blue-800 rounded-none transition-all duration-150 cursor-pointer"
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none shadow whitespace-nowrap z-20">
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdsBanner;
