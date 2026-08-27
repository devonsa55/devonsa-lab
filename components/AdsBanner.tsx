import React from "react";
import type { MerchantInsight } from "@/types/insight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconArrowUpRight,
  IconX,
  IconCircleCheck,
  IconChartBar,
} from "@tabler/icons-react";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  variant?: "card" | "horizontal";
  onAction?: () => void;
}

export function AdsBanner({ data, className = "", variant = "card", onAction }: AdsBannerProps) {
  if (!data) return null;

  // Horizontal wide campaign strip layout
  if (variant === "horizontal") {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 shadow-xl shadow-blue-500/20 backdrop-blur-md transition-all duration-300 hover:shadow-2xl ${className}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/20 shadow-inner">
              <GoogleAdsColorIcon />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  +4.2% OptiScore
                </Badge>
                <span className="text-xs text-blue-100 font-medium">Campaign Opportunity</span>
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug">
                {data.headline}
              </h3>
              <p className="text-xs text-blue-100/90 leading-relaxed max-w-2xl">
                {data.detail}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-6 shrink-0 pt-4 lg:pt-0 border-t border-white/15 lg:border-t-0">
            <div className="flex flex-col items-start gap-1 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Auction Activity
              </span>
              <MiniBarChart chart={data.chart} inverted />
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                {data.metric?.label}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black tracking-tight text-white font-mono">
                  {data.metric?.value}
                </span>
                {data.metric?.trend && <TrendBadge trend={data.metric.trend} inverted />}
              </div>
            </div>

            <Button
              onClick={onAction}
              className="bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-sm py-3 px-6 rounded-full shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer gap-2"
            >
              <span>{data.action}</span>
              <IconArrowUpRight className="w-4 h-4 text-blue-700" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card layout (Maia / Mist & Blue recommendation card)
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 border-blue-500/20 dark:border-blue-700/40 bg-gradient-to-b from-blue-50/90 via-sky-50/40 to-white dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 shadow-xl shadow-blue-500/10 backdrop-blur-md transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl flex flex-col justify-between ${className}`}
      aria-label="Google Ads campaign recommendation"
    >
      <div>
        {/* Recommendation Header */}
        <div className="p-4 px-5 border-b border-blue-100 dark:border-blue-900/40 bg-blue-500/10 dark:bg-blue-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GoogleAdsColorIcon />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Google Ads
              </div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                Smart Campaign Optimizer
              </p>
            </div>
          </div>

          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs gap-1">
            <IconCircleCheck className="w-3 h-3" />
            +3.8% Lift
          </Badge>
        </div>

        {/* Opportunity Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <IconChartBar className="w-3.5 h-3.5" />
              Live Auction Signal
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
              {data.headline}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
              {data.detail}
            </p>
          </div>

          {/* Maia Capsule with Bar Chart & Metric */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/60 shadow-sm flex items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {data.metric?.label}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {data.metric?.value}
                </span>
                {data.metric?.trend && <TrendBadge trend={data.metric.trend} />}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bid Activity
              </span>
              <MiniBarChart chart={data.chart} />
            </div>
          </div>
        </div>
      </div>

      {/* Maia Action Buttons */}
      <div className="p-5 pt-3 border-t border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 flex items-center justify-between gap-3">
        <Button
          onClick={onAction}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-full shadow-md shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer gap-2"
        >
          <span>{data.action}</span>
          <IconArrowUpRight className="w-3.5 h-3.5" />
        </Button>
        <button
          type="button"
          className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer px-2 py-1"
        >
          <IconX className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>
      </div>
    </div>
  );
}

function GoogleAdsColorIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
      G
    </div>
  );
}

function TrendBadge({ trend, inverted = false }: { trend: "up" | "down" | "flat"; inverted?: boolean }) {
  if (trend === "up") {
    return (
      <Badge
        className={`gap-0.5 px-2 py-0.5 text-[10px] font-black rounded-full ${
          inverted
            ? "bg-emerald-400 text-slate-950"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
        }`}
      >
        <IconTrendingUp className="w-3 h-3" />
        <span>UP</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge
        className={`gap-0.5 px-2 py-0.5 text-[10px] font-black rounded-full ${
          inverted
            ? "bg-rose-400 text-slate-950"
            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
        }`}
      >
        <IconTrendingDown className="w-3 h-3" />
        <span>DOWN</span>
      </Badge>
    );
  }

  return (
    <Badge
      className={`gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
        inverted ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
      }`}
    >
      <IconMinus className="w-3 h-3" />
      <span>FLAT</span>
    </Badge>
  );
}

function MiniBarChart({ chart, inverted = false }: { chart?: number[]; inverted?: boolean }) {
  const values = chart && chart.length > 0 ? chart : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return (
    <div
      className={`flex items-end gap-1 h-9 px-2 py-1 rounded-xl border ${
        inverted
          ? "bg-black/20 border-white/20"
          : "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30"
      }`}
      aria-label="Auction activity bar chart"
    >
      {values.map((val, idx) => {
        const normalized = range === 0 ? 0.5 : (val - min) / range;
        const heightPercent = Math.max(25, Math.round(normalized * 100));

        return (
          <div key={idx} className="group/bar relative flex items-end h-full justify-center">
            <div
              style={{ height: `${heightPercent}%` }}
              className={`w-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs ${
                inverted ? "bg-emerald-300 hover:bg-white" : "bg-emerald-500 hover:bg-emerald-400"
              }`}
            />
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
