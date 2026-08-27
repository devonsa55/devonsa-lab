import React, { useId } from "react";
import { MerchantInsight } from "@/types/insight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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
  const trend = data.metric?.trend;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
      {/* Top Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <IconBuildingStore className="w-3.5 h-3.5" />
          <span>Merchant Center</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">Surface 1</span>
      </div>

      {/* Main Copy */}
      <div className="space-y-2 flex-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
          {data.headline}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {data.detail}
        </p>
      </div>

      {/* Metric & Sparkline */}
      <div className="flex items-end justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
            {data.metric?.label}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {data.metric?.value}
            </span>
            <TrendBadge trend={trend} />
          </div>
        </div>

        {/* Minimal Sparkline */}
        <div className="w-28 h-10 flex items-center justify-end">
          <SparklineChart chart={data.chart} gradientId={gradientId} />
        </div>
      </div>

      {/* Action Button */}
      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl py-2.5 shadow-sm gap-2 cursor-pointer transition-colors">
        <span>{data.action}</span>
        <IconArrowRight className="w-4 h-4" />
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
    <Badge variant="outline" className="gap-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-md">
      <IconMinus className="w-3 h-3" />
      Flat
    </Badge>
  );
}

function SparklineChart({ chart, gradientId }: { chart?: number[]; gradientId: string }) {
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
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#10b981" />
    </svg>
  );
}

export default MerchantCenterCard;
