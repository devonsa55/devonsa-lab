export interface MerchantInsight {
  headline: string;
  detail: string;
  metric: {
    label: string;
    value: string;
    trend: "up" | "down" | "flat";
  };
  chart: number[];
  action: string;
}
