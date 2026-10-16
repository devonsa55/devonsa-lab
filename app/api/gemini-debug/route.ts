import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key configured" }, { status: 500 });
  }

  const results: Record<string, unknown> = { keyPrefix: apiKey.slice(0, 8) + "..." };

  // Test listing models on v1beta
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=10`
    );
    const data = await r.json();
    results.v1beta_list_status = r.status;
    results.v1beta_models = (data.models || []).map((m: { name: string }) => m.name).slice(0, 15);
    if (data.error) results.v1beta_list_error = data.error;
  } catch (e) {
    results.v1beta_list_error = String(e);
  }

  // Test listing models on v1
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}&pageSize=10`
    );
    const data = await r.json();
    results.v1_list_status = r.status;
    results.v1_models = (data.models || []).map((m: { name: string }) => m.name).slice(0, 15);
    if (data.error) results.v1_list_error = data.error;
  } catch (e) {
    results.v1_list_error = String(e);
  }

  // Quick generate test on v1 with gemini-1.5-flash
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Say hello in one word." }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );
    const data = await r.json();
    results.v1_generate_status = r.status;
    results.v1_generate_text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (data.error) results.v1_generate_error = data.error;
  } catch (e) {
    results.v1_generate_error = String(e);
  }

  return NextResponse.json(results);
}
