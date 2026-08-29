import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const CategoryDataPointSchema = z.object({
  label: z.string().describe("Category or entity label"),
  value: z.number().describe("Numerical value"),
  formattedValue: z.string().optional().describe("Display formatted string e.g. '$14.20' or '820 units'"),
  highlight: z.boolean().optional().describe("Whether this item should be highlighted/featured"),
});

const GaugeDataSchema = z.object({
  current: z.number().describe("Current progress or level value"),
  target: z.number().describe("Target or maximum capacity value"),
  unit: z.string().optional().describe("Unit symbol e.g. '%', 'days', 'SKUs'"),
  status: z.enum(["safe", "warning", "critical"]).optional().describe("Threshold health status"),
});

const DistributionSegmentSchema = z.object({
  label: z.string().describe("Segment name"),
  percentage: z.number().describe("Share percentage between 0 and 100"),
  colorHint: z.string().optional().describe("Optional color token hint"),
});

const VisualizationSchema = z.object({
  type: z
    .enum(["trend_line", "bar_comparison", "progress_gauge", "breakdown_distribution"])
    .describe("The visual widget type requested by the agent"),
  title: z.string().optional().describe("Short title for the visualization widget"),
  series: z.array(z.number()).optional().describe("Array of 5-8 numbers for trend_line"),
  categories: z.array(CategoryDataPointSchema).optional().describe("Array of 3-5 ranked items for bar_comparison"),
  gauge: GaugeDataSchema.optional().describe("Progress or threshold capacity metrics for progress_gauge"),
  distribution: z.array(DistributionSegmentSchema).optional().describe("Array of 3-4 proportion slices for breakdown_distribution"),
});

const MerchantInsightSchema = z.object({
  headline: z.string().describe("A short, high-impact headline summarizing the finding"),
  detail: z.string().describe("A precise, factual detail sentence explaining the observation"),
  metric: z.object({
    label: z.string().describe("Name of the key metric"),
    value: z.string().describe("Formatted metric value"),
    trend: z.enum(["up", "down", "flat"]).describe("Trend direction"),
  }),
  chart: z
    .array(z.number())
    .optional()
    .describe("Backward-compatible array of numeric data points"),
  visualization: VisualizationSchema.optional().describe("Polymorphic visualization widget specification"),
  action: z.string().describe("A short imperative call to action"),
});

type MerchantInsight = z.infer<typeof MerchantInsightSchema>;

interface GenerateParams {
  merchant_id: string;
  focus_area: "inventory" | "pricing" | "trend";
  visualization_type?: "auto" | "trend_line" | "bar_comparison" | "progress_gauge" | "breakdown_distribution";
  query?: string;
  category?: string;
  scenario?: string;
  time_horizon?: string;
}

function resolveVisualizationType(params: GenerateParams): "trend_line" | "bar_comparison" | "progress_gauge" | "breakdown_distribution" {
  if (params.visualization_type && params.visualization_type !== "auto") {
    return params.visualization_type;
  }
  const q = (params.query || "").toLowerCase();
  if (q.includes("compare") || q.includes("competitor") || q.includes("vs") || q.includes("ranking") || q.includes("brands")) {
    return "bar_comparison";
  }
  if (q.includes("capacity") || q.includes("gauge") || q.includes("threshold") || q.includes("stockout") || q.includes("quota") || q.includes("limit")) {
    return "progress_gauge";
  }
  if (q.includes("share") || q.includes("distribution") || q.includes("breakdown") || q.includes("segment") || q.includes("split") || q.includes("cohort")) {
    return "breakdown_distribution";
  }
  if (params.focus_area === "inventory") return "progress_gauge";
  if (params.focus_area === "pricing") return "bar_comparison";
  return "trend_line";
}

async function generateMerchantInsight(params: GenerateParams): Promise<MerchantInsight> {
  const { merchant_id, focus_area, query, category, scenario, time_horizon } = params;
  const targetVisType = resolveVisualizationType(params);
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a specialized retail and merchant analytics intelligence engine.
Given merchant parameters, synthesize a high-impact, realistic insight and select the requested visualization type ("${targetVisType}").
Output ONLY a single valid JSON object matching this structure:
{
  "headline": "Short high-impact headline (max 8-10 words)",
  "detail": "Precise detail sentence explaining observation or root cause (max 20 words)",
  "metric": {
    "label": "Metric name",
    "value": "Formatted metric value (e.g. 78%, $24.50, +31.4%)",
    "trend": "up" | "down" | "flat"
  },
  "chart": [5 to 8 numbers],
  "visualization": {
    "type": "${targetVisType}",
    "title": "Short title for widget (e.g. '7-Day Price Trajectory' or 'Brand Price Index' or 'Depletion Level' or 'Channel Share')",
    "series": [5 to 8 numbers] (if type === "trend_line"),
    "categories": [{"label": "Name", "value": number, "formattedValue": "$12.00", "highlight": true/false}] (if type === "bar_comparison", 3-5 items),
    "gauge": {"current": 72, "target": 100, "unit": "%", "status": "safe" | "warning" | "critical"} (if type === "progress_gauge"),
    "distribution": [{"label": "Segment", "percentage": 45}] (if type === "breakdown_distribution", 3-4 segments summing to 100)
  },
  "action": "Short imperative button label (max 4-5 words)"
}`;

    const promptDetails = [
      `Merchant ID: "${merchant_id}"`,
      `Focus Area: "${focus_area}"`,
      `Target Visualization Widget: "${targetVisType}"`,
      query ? `User Query/Scenario: "${query}"` : null,
      category ? `Industry/Category: "${category}"` : null,
      scenario ? `Market Condition: "${scenario}"` : null,
      time_horizon ? `Time Horizon: "${time_horizon}"` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Generate a realistic merchant insight snippet with visualization "${targetVisType}" based on:\n${promptDetails}`;

    const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash"];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });

        const rawText = response.text?.trim() || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : rawText;
        const parsed = JSON.parse(jsonString);

        // Ensure series and chart are in sync
        if (!parsed.chart && parsed.visualization?.series) {
          parsed.chart = parsed.visualization.series;
        }
        if (!parsed.visualization) {
          parsed.visualization = {
            type: targetVisType,
            series: parsed.chart || [50, 60, 70, 80, 90],
          };
        }

        return MerchantInsightSchema.parse(parsed);
      } catch (err) {
        console.warn(`Model ${modelName} call failed, trying fallback:`, err);
      }
    }
  }

  // Deterministic fallbacks for each visualization type
  const cat = category || "Catalog Products";

  if (targetVisType === "bar_comparison") {
    return {
      headline: `Competitor Price Benchmark for ${cat}`,
      detail: `Your median catalog price sits 14.8% below top-tier regional competitors.`,
      metric: { label: "Price Benchmark Gap", value: "-14.8%", trend: "down" },
      chart: [85, 92, 98, 104, 112],
      visualization: {
        type: "bar_comparison",
        title: "Peer Price Comparison",
        categories: [
          { label: "Your Store", value: 85, formattedValue: "$85", highlight: true },
          { label: "RetailCo", value: 98, formattedValue: "$98" },
          { label: "Apex Global", value: 104, formattedValue: "$104" },
          { label: "PrimeDirect", value: 112, formattedValue: "$112" },
        ],
      },
      action: "Adjust Dynamic Margins",
    };
  }

  if (targetVisType === "progress_gauge") {
    return {
      headline: `Critical Stockout Threshold in ${cat}`,
      detail: `Warehouse inventory depleted to 24% capacity with 4 days until replenishment shipment.`,
      metric: { label: "Stock Reserve Level", value: "24.0%", trend: "down" },
      chart: [88, 72, 54, 38, 24],
      visualization: {
        type: "progress_gauge",
        title: "Warehouse Buffer Capacity",
        gauge: {
          current: 24,
          target: 100,
          unit: "%",
          status: "critical",
        },
      },
      action: `Expedite ${cat} Restock`,
    };
  }

  if (targetVisType === "breakdown_distribution") {
    return {
      headline: `Customer Channel Share in ${cat}`,
      detail: `Direct mobile checkout captures 54% of transaction volume, leading organic search.`,
      metric: { label: "Mobile Share", value: "54.0%", trend: "up" },
      chart: [40, 44, 48, 51, 54],
      visualization: {
        type: "breakdown_distribution",
        title: "Sales Channel Distribution",
        distribution: [
          { label: "Mobile App", percentage: 54, colorHint: "primary" },
          { label: "Web Direct", percentage: 28, colorHint: "secondary" },
          { label: "Marketplace", percentage: 18, colorHint: "accent" },
        ],
      },
      action: "Optimize Mobile Funnel",
    };
  }

  // Default: trend_line
  return {
    headline: `Surging Search Velocity for ${cat}`,
    detail: `Regional search interest climbed 34.2% week-over-week across target demographic hubs.`,
    metric: { label: "Demand Lift", value: "+34.2%", trend: "up" },
    chart: [110, 125, 140, 168, 195, 230],
    visualization: {
      type: "trend_line",
      title: "7-Day Search Velocity",
      series: [110, 125, 140, 168, 195, 230],
    },
    action: "Boost Campaign Bids",
  };
}

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "get_merchant_insight",
      {
        description: "Generate dynamic, structured retail and merchant analytics insight snippets with polymorphic visual widgets",
        inputSchema: z.object({
          merchant_id: z.string().describe("The unique identifier for the merchant"),
          focus_area: z
            .enum(["inventory", "pricing", "trend"])
            .describe("The focus area: inventory, pricing, or trend"),
          visualization_type: z
            .enum(["auto", "trend_line", "bar_comparison", "progress_gauge", "breakdown_distribution"])
            .optional()
            .describe("Requested visual widget format"),
          query: z.string().optional().describe("Specific user natural language question or scenario"),
          category: z.string().optional().describe("Retail industry or product category"),
          scenario: z.string().optional().describe("Simulated market condition or event"),
          time_horizon: z.string().optional().describe("Evaluation window (e.g. 7d, 30d, 90d)"),
        }),
        outputSchema: MerchantInsightSchema,
      },
      async (params) => {
        try {
          const insight = await generateMerchantInsight(params as GenerateParams);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(insight),
              },
            ],
            structuredContent: insight,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error generating insight";
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: message }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  },
  {
    serverInfo: {
      name: "merchant-insights-server",
      version: "1.0.0",
    },
  }
);

export const GET = handler;
export const POST = handler;
export const runtime = "nodejs";
