import React, { useId } from "react";
import { MerchantInsight } from "@/types/insight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconSparkles,
  IconBuildingStore,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconArrowRight,
  IconAlertTriangle,
  IconCheck,
  IconListDetails,
} from "@tabler/icons-react";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric.trend;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between overflow-hidden font-sans">
      <div>
        {/* Enterprise Diagnostics Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs">
              <IconBuildingStore className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <span>Merchant Center Next</span>
                <span className="text-zinc-400">/</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-normal">Pricing & Inventory</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">ID: merchant_8492</p>
            </div>
          </div>

          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold gap-1 rounded-md px-2 py-0.5">
            <IconAlertTriangle className="w-3 h-3 text-amber-600" />
            Action Required
          </Badge>
        </div>

        {/* Diagnostic Report Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <IconSparkles className="w-3.5 h-3.5" />
              Automated Diagnosis
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {data.headline}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-0.5">
              {data.detail}
            </p>
          </div>

          {/* Technical Data Card with Sparkline */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2">
              <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 tracking-wider">
                Telemetry Metric
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                7-Day Interval
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {data.metric.label}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                    {data.metric.value}
                  </span>
                  <TrendIndicator trend={trend} />
                </div>
              </div>

              {/* Sparkline Graph */}
              <div className="w-36 h-12 flex items-center justify-end">
                <SparklineChart chart={data.chart} gradientId={gradientId} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Actions Footer */}
      <div className="p-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm gap-2 cursor-pointer transition-colors">
          <IconCheck className="w-3.5 h-3.5" />
          <span>{data.action}</span>
        </Button>
        <button
          type="button"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <IconListDetails className="w-3.5 h-3.5" />
          <span>View in Catalog</span>
        </button>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 rounded-md">
        <IconTrendingUp className="w-3.5 h-3.5" />
        <span>+UP</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 rounded-md">
        <IconTrendingDown className="w-3.5 h-3.5" />
        <span>-DOWN</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-md">
      <IconMinus className="w-3.5 h-3.5" />
      <span>FLAT</span>
    </Badge>
  );
}

function SparklineChart({ chart, gradientId }: { chart: number[]; gradientId: string }) {
  if (!chart || chart.length === 0) return null;

  const width = 140;
  const height = 44;
  const paddingX = 4;
  const paddingTop = 6;
  const paddingBottom = 6;

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
          <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="#059669"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill="#059669" className="animate-pulse" />
    </svg>
  );
}

export default MerchantCenterCard;
