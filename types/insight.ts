export type VisualizationType =
  | "trend_line"
  | "bar_comparison"
  | "progress_gauge"
  | "breakdown_distribution";

export interface CategoryDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
  highlight?: boolean;
}

export interface GaugeData {
  current: number;
  target: number;
  unit?: string;
  status?: "safe" | "warning" | "critical";
}

export interface DistributionSegment {
  label: string;
  percentage: number;
  colorHint?: string;
}

export interface VisualizationData {
  type: VisualizationType;
  title?: string;
  // Numerical chronological points (for trend_line)
  series?: number[];
  // Ranked / categorical items (for bar_comparison)
  categories?: CategoryDataPoint[];
  // Target vs current completion (for progress_gauge)
  gauge?: GaugeData;
  // Proportional breakdown (for breakdown_distribution)
  distribution?: DistributionSegment[];
}

export interface MerchantInsight {
  headline: string;
  detail: string;
  metric: {
    label: string;
    value: string;
    trend: "up" | "down" | "flat";
  };
  // Backward compatibility numerical array
  chart?: number[];
  // Polymorphic structured visualization
  visualization?: VisualizationData;
  action: string;
}
