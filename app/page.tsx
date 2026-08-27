"use client";

import { useState } from "react";
import type { MerchantInsight } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";

const FOCUS_AREAS = [
  { value: "inventory", label: "Inventory Analysis" },
  { value: "pricing", label: "Pricing Competitiveness" },
  { value: "trend", label: "Market Search Trends" },
] as const;

export default function DemoPage() {
  const [merchantId, setMerchantId] = useState("merchant_8492");
  const [focusArea, setFocusArea] = useState<"inventory" | "pricing" | "trend">("inventory");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleFetchInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/call-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId.trim(),
          focus_area: focusArea,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch insight`);
      }

      setInsight(data);
      setRawResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error calling MCP tool:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch insight from MCP tool");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Live Model Context Protocol Demo
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            One MCP tool call. Two native renders.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            A single structured MCP payload generated over the official Model Context Protocol, rendered simultaneously into two native Google product design systems.
          </p>
        </header>

        {/* Input Controls Card */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto">
          <form onSubmit={handleFetchInsight} className="space-y-4 sm:space-y-0 sm:flex sm:items-end sm:gap-4">
            <div className="flex-1">
              <label htmlFor="merchantId" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Merchant ID
              </label>
              <input
                id="merchantId"
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="e.g. merchant_8492"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="w-full sm:w-60">
              <label htmlFor="focusArea" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Focus Area
              </label>
              <select
                id="focusArea"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value as "inventory" | "pricing" | "trend")}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
              >
                {FOCUS_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium text-sm rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Calling MCP Tool…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Fetch insight</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Architecture flow indicator */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Stateless MCP Streamable HTTP Transport
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              POST /api/call-tool ➔ MCP client ➔ /api/mcp
            </span>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">MCP Request Failed</p>
              <p className="mt-0.5 text-xs text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Initial Empty State / Skeleton */}
        {!insight && !loading && !error && (
          <div className="text-center py-12 px-4 max-w-md mx-auto bg-white/60 border border-dashed border-slate-300 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Ready to execute MCP tool</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a focus area and click &quot;Fetch insight&quot; to invoke the MCP server tool and see the dual render in action.
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-200 rounded-lg" />
            </div>
            <div className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-4 space-y-3">
              <div className="h-4 bg-emerald-200/50 rounded w-1/4" />
              <div className="h-5 bg-emerald-200/50 rounded w-2/3" />
              <div className="h-3 bg-emerald-200/50 rounded w-full" />
              <div className="h-10 bg-emerald-100/50 rounded" />
            </div>
          </div>
        )}

        {/* Side-by-Side Dual Surface Output */}
        {insight && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Surface 1: Merchant Center */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Surface 1: Merchant Center
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Card Layout</span>
                </div>
                <MerchantCenterCard data={insight} />
              </div>

              {/* Surface 2: Google Ads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Surface 2: Google Ads
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Horizontal Banner</span>
                </div>
                <AdsBanner data={insight} />
              </div>
            </div>

            {/* Collapsible Raw MCP JSON Inspector */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    JSON
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    View raw MCP response payload
                  </span>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    (One single object powering both renders above)
                  </span>
                </div>
                <span className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  {showRawJson ? "Collapse" : "Expand"}
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${showRawJson ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {showRawJson && rawResponse && (
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                  <pre className="p-4 rounded-lg bg-slate-900/90 text-emerald-400 overflow-x-auto leading-relaxed">
                    {rawResponse}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
