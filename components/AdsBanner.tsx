import React from "react";
import type { MerchantInsight } from "@/types/insight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconTarget,
  IconBolt,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconArrowUpRight,
} from "@tabler/icons-react";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  variant?: "card" | "horizontal";
  onAction?: () => void;
}

export function AdsBanner({ data, className = "", variant = "card", onAction }: AdsBannerProps) {
  if (!data) return null;

  // Horizontal wide strip layout (for full-width or wide containers)
  if (variant === "horizontal") {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-indigo-50/60 dark:from-blue-950/40 dark:via-background dark:to-indigo-950/30 p-6 shadow-lg shadow-blue-500/5 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:border-blue-300 ${className}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <IconTarget className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs gap-1">
                  <IconBolt className="w-3.5 h-3.5 fill-current" />
                  Google Ads Campaign
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                  Maia • Mist/Blue (b3ZzpQduoy)
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {data.headline}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {data.detail}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-6 shrink-0 pt-4 lg:pt-0 border-t border-blue-200/60 dark:border-blue-800/40 lg:border-t-0">
            <div className="flex flex-col items-start gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search Volume
              </span>
              <MiniBarChart chart={data.chart} />
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {data.metric?.label}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                  {data.metric?.value}
                </span>
                {data.metric?.trend && <TrendBadge trend={data.metric.trend} />}
              </div>
            </div>

            <Button
              onClick={onAction}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-2.5 px-5 rounded-full shadow-md shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer gap-1.5"
            >
              <span>{data.action}</span>
              <IconArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card layout (optimized for 2-column grid side-by-side)
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/90 via-sky-50/30 to-indigo-50/50 dark:from-blue-950/40 dark:via-background dark:to-indigo-950/30 shadow-lg shadow-blue-500/5 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:border-blue-300 flex flex-col justify-between ${className}`}
      aria-label="Google Ads campaign insight"
    >
      <div>
        {/* Maia Style Header with glowing soft pill badge */}
        <div className="p-5 pb-4 border-b border-blue-200/60 dark:border-blue-800/40 bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <IconTarget className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                Google Ads
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className="bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono rounded-full px-2.5 py-0.5 font-semibold">
                b3ZzpQduoy (Maia)
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
              {data.headline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {data.detail}
            </p>
          </div>

          {/* Metric & Mini Bar Chart in a rounded-2xl glass capsule */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/60 shadow-xs flex items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {data.metric?.label}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {data.metric?.value}
                </span>
                {data.metric?.trend && <TrendBadge trend={data.metric.trend} />}
              </div>
            </div>

            {/* Mini Bar Chart with Emerald chart colors per preset b3ZzpQduoy */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Activity
              </span>
              <MiniBarChart chart={data.chart} />
            </div>
          </div>
        </div>
      </div>

      {/* Maia Footer with rounded-full Royal Blue CTA button */}
      <div className="p-5 pt-3 border-t border-blue-200/60 dark:border-blue-800/40 bg-white/30 dark:bg-slate-900/20 flex flex-col gap-2">
        <Button
          onClick={onAction}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-2.5 rounded-full shadow-md shadow-blue-500/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer gap-2"
        >
          <span>{data.action}</span>
          <IconArrowUpRight className="w-4 h-4" />
        </Button>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          Delivered dynamically via Google Ads Campaign API
        </p>
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge className="gap-1 px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full shadow-2xs">
        <IconTrendingUp className="w-3.5 h-3.5 text-emerald-600" />
        <span>Up</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge className="gap-1 px-2 py-0.5 text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-full shadow-2xs">
        <IconTrendingDown className="w-3.5 h-3.5 text-rose-600" />
        <span>Down</span>
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
      <IconMinus className="w-3.5 h-3.5" />
      <span>Flat</span>
    </Badge>
  );
}

function MiniBarChart({ chart }: { chart?: number[] }) {
  const values = chart && chart.length > 0 ? chart : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return (
    <div
      className="flex items-end gap-1.5 h-10 px-2.5 py-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/30 shadow-inner"
      aria-label="Campaign trend bar chart"
    >
      {values.map((val, idx) => {
        const normalized = range === 0 ? 0.5 : (val - min) / range;
        const heightPercent = Math.max(25, Math.round(normalized * 100));

        return (
          <div key={idx} className="group/bar relative flex items-end h-full justify-center">
            <div
              style={{ height: `${heightPercent}%` }}
              className="w-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-all duration-200 cursor-pointer shadow-xs"
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 text-white border border-slate-700 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20">
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdsBanner;
