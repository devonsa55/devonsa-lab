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
} from "@tabler/icons-react";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric.trend;

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Nova Header: Flat, clean, structured zinc design */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <IconSparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <IconBuildingStore className="w-4 h-4 text-emerald-600" />
              Merchant Center
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-md">
              b7kBsBkh7b (Nova)
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
              {data.headline}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              {data.detail}
            </p>
          </div>

          {/* Metric & Sparkline Chart */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {data.metric.label}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                  {data.metric.value}
                </span>
                <TrendIndicator trend={trend} />
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="w-36 h-12 flex items-center justify-end">
              <SparklineChart chart={data.chart} gradientId={gradientId} />
            </div>
          </div>
        </div>
      </div>

      {/* Nova Footer with structured solid Emerald button */}
      <div className="p-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col gap-2">
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm gap-2 cursor-pointer transition-colors">
          <span>{data.action}</span>
          <IconArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
          AI-generated insights may display inaccurate results.
        </p>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 rounded-md">
        <IconTrendingUp className="w-3.5 h-3.5" />
        <span>Up</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 rounded-md">
        <IconTrendingDown className="w-3.5 h-3.5" />
        <span>Down</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-md">
      <IconMinus className="w-3.5 h-3.5" />
      <span>Flat</span>
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
