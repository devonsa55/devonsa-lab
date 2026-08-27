import React from "react";
import type { MerchantInsight } from "@/types/insight";
import { IconArrowUpRight, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  onAction?: () => void;
}

export function AdsBanner({ data, className = "", onAction }: AdsBannerProps) {
  if (!data) return null;

  return (
    <div
      className={`rounded-none border-2 border-black dark:border-white bg-blue-600 text-white p-6 sm:p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.9)] flex flex-col justify-between h-full space-y-6 ${className}`}
      aria-label="Geometric Color Surface"
    >
      {/* Top Geometric Tag */}
      <div className="flex items-center justify-between border-b-2 border-white/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 text-black text-xs font-black uppercase px-2 py-0.5 rounded-none tracking-wider">
            Surface B — Geometric Visual
          </span>
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest text-blue-200">
          Sharp Square • Vivid Color
        </span>
      </div>

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
      <div className="rounded-none border-2 border-black dark:border-white bg-yellow-300 text-black p-4 flex items-end justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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

        {/* Square Geometric Bar Equalizer */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-black/60">Metric Curve</span>
          <SquareBarChart chart={data.chart} />
        </div>
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
