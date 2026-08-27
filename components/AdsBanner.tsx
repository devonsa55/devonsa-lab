import React from "react";
import type { MerchantInsight } from "@/types/insight";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  onAction?: () => void;
}

function CampaignTargetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function TrendBadge({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <svg
          className="w-3 h-3 text-emerald-700 stroke-[2.5]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M7 17L17 7M17 7H7M17 7V17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Up</span>
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <svg
          className="w-3 h-3 text-rose-700 stroke-[2.5]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M7 7l10 10M17 17H7M17 17V7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Down</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <svg
        className="w-3 h-3 text-slate-600 stroke-[2.5]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Flat</span>
    </span>
  );
}

function MiniBarChart({ chart }: { chart?: number[] }) {
  const values = chart && chart.length > 0 ? chart : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return (
    <div
      className="flex items-end gap-1 h-9 px-1.5 py-1 bg-emerald-100/50 rounded-lg border border-emerald-200/60"
      aria-label="Campaign trend bar chart"
    >
      {values.map((val, idx) => {
        // Calculate height percentage with a minimum of 18% for visibility
        const normalized = range === 0 ? 0.5 : (val - min) / range;
        const heightPercent = Math.max(18, Math.round(normalized * 100));

        return (
          <div
            key={idx}
            className="group/bar relative flex items-end h-full justify-center"
          >
            <div
              style={{ height: `${heightPercent}%` }}
              className="w-2 sm:w-2.5 bg-emerald-500 group-hover/bar:bg-emerald-600 rounded-t-[2px] transition-all duration-200 cursor-pointer"
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900/90 text-white text-[10px] font-medium font-mono px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-20">
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdsBanner({ data, className = "", onAction }: AdsBannerProps) {
  if (!data) return null;

  return (
    <section
      className={`p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow ${className}`}
      aria-label="Google Ads insight banner"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Header, Headline & Details */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Green circular badge with Campaign Target icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 shadow-2xs mt-0.5">
            <CampaignTargetIcon className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100/90 text-emerald-800 border border-emerald-300/70">
                Google Ads
              </span>
            </div>

            <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 tracking-tight leading-snug">
              {data.headline}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
              {data.detail}
            </p>
          </div>
        </div>

        {/* Right Column: Mini Bar Chart, Metric & Action Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 sm:gap-5 shrink-0 pt-2 md:pt-0 border-t border-emerald-200/50 md:border-t-0">
          {/* Mini Bar Chart */}
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-800/70">
              Trend
            </span>
            <MiniBarChart chart={data.chart} />
          </div>

          {/* Metric Value & Trend Badge */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-800/70">
              {data.metric?.label}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-emerald-950">
                {data.metric?.value}
              </span>
              {data.metric?.trend && <TrendBadge trend={data.metric.trend} />}
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={onAction}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors shadow-xs shrink-0 cursor-pointer text-center"
            >
              {data.action}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdsBanner;
