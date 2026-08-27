import React, { useId } from "react";
import { MerchantInsight } from "@/types/insight";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, Minus, Store, ArrowRight } from "lucide-react";

export interface MerchantCenterCardProps {
  data: MerchantInsight;
}

export function MerchantCenterCard({ data }: MerchantCenterCardProps) {
  const gradientId = useId();
  const trend = data.metric.trend;

  return (
    <Card className="preset-b7kBsBkh7b border-border/80 shadow-md bg-card transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center border border-emerald-600/20">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Merchant Center
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground">
                Preset b7kBsBkh7b
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                Nova
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight">
              {data.headline}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {data.detail}
            </CardDescription>
          </div>

          {/* Metric & Sparkline Chart */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {data.metric.label}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
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
        </CardContent>
      </div>

      <CardFooter className="flex-col gap-2.5 pt-2 border-t border-border/40 bg-muted/10">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 font-medium cursor-pointer">
          <span>{data.action}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          AI-generated insights may display inaccurate results.
        </p>
      </CardFooter>
    </Card>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>Up</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800">
        <TrendingDown className="w-3.5 h-3.5" />
        <span>Down</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 border-border">
      <Minus className="w-3.5 h-3.5" />
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
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill="#2563eb" className="animate-pulse" />
    </svg>
  );
}

export default MerchantCenterCard;
