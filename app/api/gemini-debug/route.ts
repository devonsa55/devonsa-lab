import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  const results: Record<string, unknown> = { keyPrefix: apiKey.slice(0, 8) + "..." };

  // List models with their supported methods (v1beta)
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=50`
    );
    const data = await r.json();
    results.v1beta_models_full = (data.models || []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
      name: m.name,
      methods: m.supportedGenerationMethods,
    }));
    if (data.error) results.v1beta_list_error = data.error;
  } catch (e) {
    results.v1beta_list_error = String(e);
  }

  // Try generateContent on each candidate model
  const candidates = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite-preview-06-17",
    "gemini-2.5-flash-preview-05-20",
  ];

  const generateResults: Record<string, unknown> = {};
  for (const model of candidates) {
    for (const apiVer of ["v1beta", "v1"]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "Say one word: hello." }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          }
        );
        const data = await r.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        generateResults[`${apiVer}/${model}`] = r.ok
          ? { status: r.status, text }
          : { status: r.status, error: data.error?.message?.slice(0, 150) };
      } catch (e) {
        generateResults[`${apiVer}/${model}`] = { error: String(e) };
      }
    }
  }
  results.generate_tests = generateResults;

  return NextResponse.json(results, { status: 200 });
}
