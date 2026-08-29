import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const CategoryDataPointSchema = z.object({
  label: z.string().describe("Category or entity label"),
  value: z.number().describe("Numerical value"),
  formattedValue: z.string().optional().describe("Display formatted string e.g. '$85.00' or '820 units'"),
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
  if (q.includes("compare") || q.includes("competitor") || q.includes("vs") || q.includes("ranking") || q.includes("benchmark") || q.includes("brands")) {
    return "bar_comparison";
  }
  if (q.includes("capacity") || q.includes("gauge") || q.includes("threshold") || q.includes("stockout") || q.includes("buffer") || q.includes("quota") || q.includes("depletion")) {
    return "progress_gauge";
  }
  if (q.includes("share") || q.includes("distribution") || q.includes("breakdown") || q.includes("segment") || q.includes("split") || q.includes("channel")) {
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
Synthesize a realistic, highly specific merchant insight and craft the exact requested visualization widget ("${targetVisType}").

VISUALIZATION TYPE SPECIFICATIONS:
- When target is "trend_line": Provide a chronological 5-8 point numerical series showing price or demand changes over time.
- When target is "bar_comparison": Provide 3-5 ranked entities in "categories" (with labels, numeric values, formatted strings like "$85", and set highlight: true on "Your Store").
- When target is "progress_gauge": Provide "gauge" with "current" number (e.g. 24), "target" number (e.g. 100), "unit" (e.g. "%" or "days"), and "status" ("safe", "warning", or "critical").
- When target is "breakdown_distribution": Provide 3-4 segments in "distribution" whose percentages sum to 100 (e.g. Mobile, Web, Marketplace).

Output ONLY a single valid JSON object matching this structure:
{
  "headline": "Short high-impact headline tailored to the widget (max 8-10 words)",
  "detail": "Precise detail sentence explaining observation or root cause (max 20 words)",
  "metric": {
    "label": "Metric name specific to this analysis",
    "value": "Formatted metric value (e.g. 22%, -$18.50, +34.2%, 54.0%)",
    "trend": "up" | "down" | "flat"
  },
  "chart": [5 to 8 numbers],
  "visualization": {
    "type": "${targetVisType}",
    "title": "Title for widget (e.g. '7-Day Price Trajectory' or 'Brand Price Benchmark' or 'Warehouse Safety Buffer' or 'Channel GMV Breakdown')",
    "series": [numbers] (if trend_line),
    "categories": [{"label": "Name", "value": number, "formattedValue": "$XX.XX", "highlight": boolean}] (if bar_comparison),
    "gauge": {"current": number, "target": number, "unit": "%", "status": "safe"|"warning"|"critical"} (if progress_gauge),
    "distribution": [{"label": "Name", "percentage": number}] (if breakdown_distribution)
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

  // Rich distinct fallbacks for each visualization type
  const cat = category || "Catalog Products";

  if (targetVisType === "bar_comparison") {
    return {
      headline: `Footwear Pricing Benchmark vs. Top 4 Rivals`,
      detail: `Your store price sits $18.50 below Apex Global while capturing 28% higher search click-through.`,
      metric: { label: "Median Price Gap", value: "-$18.50", trend: "down" },
      chart: [85, 98, 104, 114],
      visualization: {
        type: "bar_comparison",
        title: "Brand Price Benchmark Index",
        categories: [
          { label: "Your Store", value: 85, formattedValue: "$85.00", highlight: true },
          { label: "RetailDirect", value: 98, formattedValue: "$98.00" },
          { label: "Apex Global", value: 104, formattedValue: "$104.00" },
          { label: "PrimeVault", value: 114.5, formattedValue: "$114.50" },
        ],
      },
      action: "Optimize Brand Margins",
    };
  }

  if (targetVisType === "progress_gauge") {
    return {
      headline: `Warehouse Buffer Depletion Warning`,
      detail: `Inventory reserves reached critical 22% buffer with 5 days until scheduled replenishment arrival.`,
      metric: { label: "Safety Stock Buffer", value: "22.0%", trend: "down" },
      chart: [88, 72, 54, 38, 22],
      visualization: {
        type: "progress_gauge",
        title: "Warehouse Buffer Capacity",
        gauge: {
          current: 22,
          target: 100,
          unit: "%",
          status: "critical",
        },
      },
      action: "Expedite Priority Restock",
    };
  }

  if (targetVisType === "breakdown_distribution") {
    return {
      headline: `Omnichannel Acquisition & Revenue Split`,
      detail: `Mobile App purchases drive 54% of total GMV, outperforming Desktop Direct by 2.1x.`,
      metric: { label: "Mobile GMV Share", value: "54.0%", trend: "up" },
      chart: [54, 28, 18],
      visualization: {
        type: "breakdown_distribution",
        title: "Channel Revenue Contribution",
        distribution: [
          { label: "Mobile App", percentage: 54, colorHint: "primary" },
          { label: "Desktop Web", percentage: 28, colorHint: "secondary" },
          { label: "Marketplaces", percentage: 18, colorHint: "accent" },
        ],
      },
      action: "Scale Mobile Ad Budget",
    };
  }

  // Default: trend_line
  return {
    headline: `7-Day Competitor Price Undercut Trajectory`,
    detail: `Median competitor catalog pricing dropped 12.4% over 7 days across 48 key search terms.`,
    metric: { label: "Price Deflation Rate", value: "-12.4%", trend: "down" },
    chart: [104, 101, 98, 95, 93, 91, 88],
    visualization: {
      type: "trend_line",
      title: "7-Day Deflation Trajectory",
      series: [104, 101, 98, 95, 93, 91, 88],
    },
    action: "Recalibrate Pricing Rules",
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
