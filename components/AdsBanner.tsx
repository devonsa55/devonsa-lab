import React from "react";
import type { MerchantInsight } from "@/types/insight";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconTarget,
  IconBolt,
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
    <Card
      className={`preset-b3ZzpQduoy border-border/80 shadow-md bg-gradient-to-br from-blue-500/5 via-card to-card dark:from-blue-950/20 transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden ${className}`}
      aria-label="Google Ads campaign insight"
    >
      <div>
        {/* Header */}
        <CardHeader className="pb-3 border-b border-border/40 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center border border-blue-600/20">
                <IconTarget className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <IconBolt className="w-3.5 h-3.5 text-blue-600" />
                Google Ads
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground">
                Preset b3ZzpQduoy
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-700 bg-blue-50/50 dark:bg-blue-950/40 dark:text-blue-300">
                Maia
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="pt-5 space-y-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight">
              {data.headline}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {data.detail}
            </CardDescription>
          </div>

          {/* Metric & Mini Bar Chart Box */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {data.metric?.label}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-foreground tracking-tight font-mono">
                  {data.metric?.value}
                </span>
                {data.metric?.trend && <TrendBadge trend={data.metric.trend} />}
              </div>
            </div>

            {/* Mini Bar Chart with Emerald chart colors per preset b3ZzpQduoy */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trend Activity
              </span>
              <MiniBarChart chart={data.chart} />
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer CTA Button */}
      <CardFooter className="flex-col gap-2.5 pt-2 border-t border-border/40 bg-muted/10">
        <Button
          onClick={onAction}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 font-medium cursor-pointer"
        >
          <span>{data.action}</span>
          <IconArrowUpRight className="w-4 h-4" />
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          Delivered dynamically via Google Ads campaign API.
        </p>
      </CardFooter>
    </Card>
  );
}

function TrendBadge({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800">
        <IconTrendingUp className="w-3.5 h-3.5" />
        <span>Up</span>
      </Badge>
    );
  }

  if (trend === "down") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800">
        <IconTrendingDown className="w-3.5 h-3.5" />
        <span>Down</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 border-border">
      <IconMinus className="w-3.5 h-3.5" />
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
      className="flex items-end gap-1.5 h-10 px-2.5 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
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
