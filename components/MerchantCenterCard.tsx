import React, { useId } from "react";
import { MerchantInsight } from "@/types/insight";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric.trend;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <svg
              className="w-3.5 h-3.5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Merchant Center
          </span>
        </div>

        {/* Content Section */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            {data.headline}
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {data.detail}
          </p>
        </div>

        {/* Metric & Sparkline Chart Section */}
        <div className="mt-5 p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {data.metric.label}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.metric.value}
              </span>
              <TrendIndicator trend={trend} />
            </div>
          </div>

          {/* Sparkline Chart */}
          <div className="w-full sm:w-36 h-12 flex items-center justify-end">
            <SparklineChart chart={data.chart} gradientId={gradientId} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Action Button & Disclaimer */}
      <div className="mt-6 pt-2">
        <button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer text-sm"
        >
          {data.action}
        </button>
        <p className="text-xs text-slate-400 mt-2.5 text-center">
          AI-generated insights may display inaccurate results.
        </p>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60"
        title="Trending Up"
      >
        <svg
          className="w-3.5 h-3.5 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
          />
        </svg>
        <span>Up</span>
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60"
        title="Trending Down"
      >
        <svg
          className="w-3.5 h-3.5 text-rose-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
          />
        </svg>
        <span>Down</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"
      title="Flat"
    >
      <svg
        className="w-3.5 h-3.5 text-slate-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
      <span>Flat</span>
    </span>
  );
}

function SparklineChart({
  chart,
  gradientId,
}: {
  chart: number[];
  gradientId: string;
}) {
  if (!chart || chart.length === 0) {
    return null;
  }

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
    const x =
      chart.length > 1
        ? paddingX + (index / (chart.length - 1)) * availableWidth
        : width / 2;
    const y =
      range === 0
        ? height / 2
        : height - paddingBottom - ((val - min) / range) * availableHeight;
    return { x, y };
  });

  const linePath = points.reduce((acc, curr, index) => {
    return `${acc} ${index === 0 ? "M" : "L"} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }, "");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)},${height} L ${firstPoint.x.toFixed(1)},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Subtle area gradient fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Clean SVG sparkline line */}
      <path
        d={linePath}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Final data point dot */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#2563eb" />
    </svg>
  );
}

export default MerchantCenterCard;
