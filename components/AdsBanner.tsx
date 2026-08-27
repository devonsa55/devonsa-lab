import React from "react";
import type { MerchantInsight } from "@/types/insight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconTarget,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconArrowUpRight,
} from "@tabler/icons-react";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  onAction?: () => void;
}

export function AdsBanner({ data, className = "", onAction }: AdsBannerProps) {
  if (!data) return null;

  return (
    <div
      className={`rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-6 shadow-sm flex flex-col justify-between h-full space-y-6 ${className}`}
      aria-label="Google Ads insight"
    >
      {/* Top Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
          <IconTarget className="w-3.5 h-3.5" />
          <span>Google Ads</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">Surface 2</span>
      </div>

      {/* Main Copy */}
      <div className="space-y-2 flex-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {data.headline}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {data.detail}
        </p>
      </div>

      {/* Metric & Mini Bar Chart */}
      <div className="flex items-end justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/50 shadow-2xs">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            {data.metric?.label}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {data.metric?.value}
            </span>
            <TrendBadge trend={data.metric?.trend} />
          </div>
        </div>

        {/* Mini Bar Chart */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Trend</span>
          <MiniBarChart chart={data.chart} />
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onAction}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl py-2.5 shadow-sm gap-2 cursor-pointer transition-colors"
      >
        <span>{data.action}</span>
        <IconArrowUpRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function TrendBadge({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 rounded-md">
        <IconTrendingUp className="w-3 h-3" />
        Up
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 rounded-md">
        <IconTrendingDown className="w-3 h-3" />
        Down
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md">
      <IconMinus className="w-3 h-3" />
      Flat
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
      className="flex items-end gap-1 h-9 px-2 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50"
      aria-label="Trend bar chart"
    >
      {values.map((val, idx) => {
        const normalized = range === 0 ? 0.5 : (val - min) / range;
        const heightPercent = Math.max(20, Math.round(normalized * 100));

        return (
          <div key={idx} className="group/bar relative flex items-end h-full justify-center">
            <div
              style={{ height: `${heightPercent}%` }}
              className="w-2 bg-blue-600 dark:bg-blue-400 rounded-xs transition-all duration-200 cursor-pointer"
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20">
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdsBanner;
