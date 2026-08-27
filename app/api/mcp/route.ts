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

async function generateMerchantInsight(
  merchant_id: string,
  focus_area: "inventory" | "pricing" | "trend"
): Promise<MerchantInsight> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Fallback demo fixtures if API key is not yet set in environment
  if (!apiKey) {
    if (focus_area === "inventory") {
      return {
        headline: `Low Stock Alert for Merchant ${merchant_id}`,
        detail: "Top 3 high-velocity SKUs are projected to stock out within 48 hours based on weekend demand.",
        metric: { label: "In-Stock Rate", value: "62%", trend: "down" },
        chart: [98, 92, 85, 74, 68, 62],
        action: "Reorder Fast-Moving SKUs",
      };
    }
    if (focus_area === "pricing") {
      return {
        headline: `Price Competitiveness Opportunity (${merchant_id})`,
        detail: "Benchmark prices across matched catalog items are 8.4% below median market basket rates.",
        metric: { label: "Price Index", value: "91.6", trend: "up" },
        chart: [88, 89, 89, 90, 91, 92],
        action: "Adjust Smart Bidding Target",
      };
    }
    return {
      headline: `Surge in Seasonal Search Demand for Merchant ${merchant_id}`,
      detail: "Category queries for outdoor gear surged 24% week-over-week across your primary sales regions.",
      metric: { label: "Query Volume", value: "+24.3%", trend: "up" },
      chart: [120, 135, 140, 158, 172, 195, 214],
      action: "Increase Campaign Budgets",
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a specialized retail and merchant analytics engine that generates compact Smart Snippets for e-commerce merchants.
Given a merchant ID and a focus area (inventory, pricing, or trend), produce a concise, realistic insight object.
You must output ONLY a single valid JSON object matching this exact structure:
{
  "headline": "Short high-impact headline (max 8-10 words)",
  "detail": "Precise, factual detail sentence explaining observation or risk (max 20 words)",
  "metric": {
    "label": "Metric name (e.g. In-Stock Rate, Price Index, Search Lift)",
    "value": "Formatted metric value (e.g. 64%, $19.99, +28.4%)",
    "trend": "up" | "down" | "flat"
  },
  "chart": [5 to 8 numeric numbers showing chronological trend],
  "action": "Short imperative call to action button label (max 4-5 words)"
}`;

  const prompt = `Generate a realistic merchant insight snippet for merchant_id: "${merchant_id}" with focus_area: "${focus_area}".`;

  // Attempt 1: Using structured generation
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            headline: { type: "STRING" },
            detail: { type: "STRING" },
            metric: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING" },
                value: { type: "STRING" },
                trend: { type: "STRING", enum: ["up", "down", "flat"] },
              },
              required: ["label", "value", "trend"],
            },
            chart: {
              type: "ARRAY",
              items: { type: "NUMBER" },
            },
            action: { type: "STRING" },
          },
          required: ["headline", "detail", "metric", "chart", "action"],
        },
      },
    });

    const rawText = response.text?.trim() || "";
    const parsed = JSON.parse(rawText);
    return MerchantInsightSchema.parse(parsed);
  } catch (firstError) {
    console.warn("First attempt failed, retrying with stricter prompt...", firstError);
    // Retry once with a stricter reminder
    try {
      const retryResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `${prompt}\n\nIMPORTANT: Your previous output failed schema validation. Return ONLY a strictly valid JSON object conforming to the schema with 5 to 8 numeric values in the chart array. No markdown formatting.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const rawText = retryResponse.text?.trim() || "";
      const parsed = JSON.parse(rawText);
      return MerchantInsightSchema.parse(parsed);
    } catch (secondError) {
      throw new Error(
        `Failed to generate valid merchant insight JSON: ${
          secondError instanceof Error ? secondError.message : String(secondError)
        }`
      );
    }
  }
}

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "get_merchant_insight",
      {
        description: "Generate a structured merchant insight snippet for inventory, pricing, or trend analytics",
        inputSchema: z.object({
          merchant_id: z.string().describe("The unique identifier for the merchant"),
          focus_area: z
            .enum(["inventory", "pricing", "trend"])
            .describe("The focus area for the insight: inventory, pricing, or trend"),
        }),
        outputSchema: MerchantInsightSchema,
      },
      async ({ merchant_id, focus_area }) => {
        try {
          const insight = await generateMerchantInsight(merchant_id, focus_area);
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
