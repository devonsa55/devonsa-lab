import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

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
    .min(5)
    .max(8)
    .describe("An array of 5 to 8 numeric data points representing recent trend"),
  action: z.string().describe("A short imperative call to action"),
});

type MerchantInsight = z.infer<typeof MerchantInsightSchema>;

interface GenerateParams {
  merchant_id: string;
  focus_area: "inventory" | "pricing" | "trend";
  query?: string;
  category?: string;
  scenario?: string;
  time_horizon?: string;
}

async function generateMerchantInsight({
  merchant_id,
  focus_area,
  query,
  category,
  scenario,
  time_horizon,
}: GenerateParams): Promise<MerchantInsight> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a specialized retail and merchant analytics intelligence engine that generates compact, high-impact Smart Snippets for e-commerce and retail businesses.
Given a merchant ID, focus area, category, custom scenario, or user question, synthesize an insightful, highly realistic data finding tailored precisely to their inputs.
You must output ONLY a single valid JSON object matching this exact structure:
{
  "headline": "Short high-impact headline specific to the scenario (max 8-10 words)",
  "detail": "Precise, factual detail sentence explaining observation or root cause (max 20 words)",
  "metric": {
    "label": "Metric name relevant to category & scenario (e.g. Stockout Risk Index, Competitor Price Gap, Demand Lift)",
    "value": "Formatted metric value (e.g. 64%, $19.99, +28.4%, -14.2%)",
    "trend": "up" | "down" | "flat"
  },
  "chart": [5 to 8 numeric numbers showing realistic chronological trend reflecting the scenario],
  "action": "Short imperative call to action button label (max 4-5 words)"
}`;

    const promptDetails = [
      `Merchant ID: "${merchant_id}"`,
      `Focus Area: "${focus_area}"`,
      query ? `User Query/Scenario: "${query}"` : null,
      category ? `Industry/Category: "${category}"` : null,
      scenario ? `Market Condition: "${scenario}"` : null,
      time_horizon ? `Time Horizon: "${time_horizon}"` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Generate a realistic merchant insight snippet based on:\n${promptDetails}`;

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
            responseSchema: {
              type: "object" as any,
              properties: {
                headline: { type: "string" as any },
                detail: { type: "string" as any },
                metric: {
                  type: "object" as any,
                  properties: {
                    label: { type: "string" as any },
                    value: { type: "string" as any },
                    trend: { type: "string" as any, enum: ["up", "down", "flat"] },
                  },
                  required: ["label", "value", "trend"],
                },
                chart: {
                  type: "array" as any,
                  items: { type: "number" as any },
                },
                action: { type: "string" as any },
              },
              required: ["headline", "detail", "metric", "chart", "action"],
            },
          },
        });

        const rawText = response.text?.trim() || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : rawText;
        const parsed = JSON.parse(jsonString);
        return MerchantInsightSchema.parse(parsed);
      } catch (err) {
        console.warn(`Model ${modelName} call failed, trying fallback:`, err);
      }
    }
  }

  // Deterministic dynamic fallback
  const cat = category || "catalog items";
  if (focus_area === "inventory") {
    return {
      headline: `Stockout Risk in ${cat} (${merchant_id})`,
      detail: `Top-selling ${cat} projected to deplete rapidly based on recent surge velocity.`,
      metric: { label: "In-Stock Rate", value: "58.4%", trend: "down" },
      chart: [96, 90, 82, 71, 64, 58],
      action: `Restock ${cat} SKUs`,
    };
  }
  if (focus_area === "pricing") {
    return {
      headline: `Competitor Undercut Threat in ${cat}`,
      detail: `Rival merchants lowered median price by 12.8% on high-intent search items.`,
      metric: { label: "Price Index", value: "87.2", trend: "down" },
      chart: [100, 98, 95, 91, 88, 87],
      action: "Optimize Dynamic Pricing",
    };
  }
  return {
    headline: `Surging Search Velocity for ${cat}`,
    detail: `Regional search interest climbed 34.2% week-over-week across target locations.`,
    metric: { label: "Demand Lift", value: "+34.2%", trend: "up" },
    chart: [110, 125, 140, 168, 195, 230],
    action: "Boost Campaign Bids",
  };
}

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "get_merchant_insight",
      {
        description: "Generate dynamic, structured retail and merchant analytics insight snippets",
        inputSchema: z.object({
          merchant_id: z.string().describe("The unique identifier for the merchant"),
          focus_area: z
            .enum(["inventory", "pricing", "trend"])
            .describe("The focus area: inventory, pricing, or trend"),
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
