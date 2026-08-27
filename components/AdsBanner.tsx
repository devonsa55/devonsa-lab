import React from "react";
import type { MerchantInsight } from "@/types/insight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, TrendingDown, Minus, Zap, ArrowUpRight } from "lucide-react";

export interface AdsBannerProps {
  data: MerchantInsight;
  className?: string;
  onAction?: () => void;
}

export function AdsBanner({ data, className = "", onAction }: AdsBannerProps) {
  if (!data) return null;

  return (
    <section
      className={`preset-b3ZzpQduoy p-5 bg-gradient-to-br from-blue-500/10 via-slate-500/5 to-transparent dark:from-blue-950/40 dark:via-background rounded-2xl border border-blue-500/30 dark:border-blue-900/50 shadow-md backdrop-blur-xs transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg ${className}`}
      aria-label="Google Ads insight banner"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Column: Header, Headline & Details */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Blue circular badge with Campaign Target icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 border border-blue-600/30 text-blue-700 dark:text-blue-300 shadow-xs mt-0.5">
            <Target className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600/15 text-blue-800 dark:text-blue-300 border border-blue-600/30 gap-1 rounded-md">
                <Zap className="w-3 h-3 text-blue-600 fill-current" />
                Google Ads
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/60">
                Preset b3ZzpQduoy
              </Badge>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-snug">
              {data.headline}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.detail}
            </p>
          </div>
        </div>

        {/* Right Column: Mini Bar Chart, Metric & Action Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 pt-3 md:pt-0 border-t border-blue-500/20 md:border-t-0">
          {/* Mini Bar Chart with Emerald chart colors per preset b3ZzpQduoy */}
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trend
            </span>
            <MiniBarChart chart={data.chart} />
          </div>

          {/* Metric Value & Trend Badge */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {data.metric?.label}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-foreground font-mono">
                {data.metric?.value}
              </span>
              {data.metric?.trend && <TrendBadge trend={data.metric.trend} />}
            </div>
          </div>

          {/* Action CTA Button in Preset Primary Blue */}
          <div className="w-full sm:w-auto">
            <Button
              size="sm"
              onClick={onAction}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer gap-1.5"
            >
              <span>{data.action}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrendBadge({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge variant="outline" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 rounded-md">
        <TrendingUp className="w-3 h-3" />
        <span>Up</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 rounded-md">
        <TrendingDown className="w-3 h-3" />
        <span>Down</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground border-border rounded-md">
      <Minus className="w-3 h-3" />
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
      className="flex items-end gap-1 h-9 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
      aria-label="Campaign trend bar chart"
    >
      {values.map((val, idx) => {
        const normalized = range === 0 ? 0.5 : (val - min) / range;
        const heightPercent = Math.max(20, Math.round(normalized * 100));

        return (
          <div key={idx} className="group/bar relative flex items-end h-full justify-center">
            <div
              style={{ height: `${heightPercent}%` }}
              className="w-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-t-xs transition-all duration-200 cursor-pointer shadow-2xs"
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-popover text-popover-foreground border border-border text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-md whitespace-nowrap z-20">
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdsBanner;
