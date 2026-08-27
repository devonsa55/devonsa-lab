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

interface McpWire {
  endpoint: string;
  request: unknown;
  response: unknown;
}

export default function DemoPage() {
  const [merchantId, setMerchantId] = useState("merchant_8492");
  const [focusArea, setFocusArea] = useState<"inventory" | "pricing" | "trend">("inventory");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [mcpWire, setMcpWire] = useState<McpWire | null>(null);

  // Panel open/close state
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWirePanel, setShowWirePanel] = useState(false);

  // Editable JSON state
  const [editedJson, setEditedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleFetchInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim()) return;

    setLoading(true);
    setError(null);
    setJsonError(null);
    setShowEditPanel(false);
    setShowWirePanel(false);

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

      setInsight(data.insight);
      setMcpWire(data._mcp ?? null);
      setEditedJson(JSON.stringify(data.insight, null, 2));
    } catch (err) {
      console.error("Error calling MCP tool:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch insight from MCP tool");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEdit = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(editedJson);
      // Basic shape validation
      if (
        typeof parsed.headline !== "string" ||
        typeof parsed.detail !== "string" ||
        typeof parsed.action !== "string" ||
        !parsed.metric ||
        !Array.isArray(parsed.chart)
      ) {
        setJsonError("JSON must include: headline, detail, metric {label, value, trend}, chart[], action");
        return;
      }
      if (!["up", "down", "flat"].includes(parsed.metric.trend)) {
        setJsonError('metric.trend must be "up", "down", or "flat"');
        return;
      }
      setInsight(parsed as MerchantInsight);
    } catch {
      setJsonError("Invalid JSON — check syntax and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
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
                  <option key={area.value} value={area.value}>{area.label}</option>
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
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Stateless MCP Streamable HTTP Transport
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Browser ➔ /api/call-tool ➔ MCP client ➔ /api/mcp
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

        {/* Empty State */}
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
          <section className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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

            {/* ── Panel 1: Edit & Re-render ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEditPanel(!showEditPanel)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">
                    EDIT
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    Edit payload & re-render both surfaces
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    — proof that one object drives both renders
                  </span>
                </div>
                <ChevronIcon open={showEditPanel} />
              </button>

              {showEditPanel && (
                <div className="px-6 pb-6 border-t border-slate-100 space-y-3 pt-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Edit any field below and click <strong>Apply</strong>. Both the Merchant Center card and Google Ads banner will re-render from your modified JSON — proving they share a single data source.
                  </p>
                  <textarea
                    value={editedJson}
                    onChange={(e) => {
                      setEditedJson(e.target.value);
                      setJsonError(null);
                    }}
                    rows={14}
                    spellCheck={false}
                    className="w-full font-mono text-xs text-emerald-400 bg-slate-950 rounded-xl p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed"
                  />
                  {jsonError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {jsonError}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleApplyEdit}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Apply & Re-render
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedJson(JSON.stringify(insight, null, 2));
                        setJsonError(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Reset to original
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Panel 2: MCP Wire Protocol ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowWirePanel(!showWirePanel)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                    MCP
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    View raw MCP wire protocol
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    — actual JSON-RPC messages over the protocol
                  </span>
                </div>
                <ChevronIcon open={showWirePanel} />
              </button>

              {showWirePanel && mcpWire && (
                <div className="px-6 pb-6 border-t border-slate-100 space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600">
                      {mcpWire.endpoint}
                    </span>
                    <span className="text-slate-400">— Streamable HTTP Transport</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Request */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Client ➔ Server (Request)
                        </span>
                      </div>
                      <pre className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-blue-300 overflow-x-auto leading-relaxed border border-slate-800">
                        {JSON.stringify(mcpWire.request, null, 2)}
                      </pre>
                    </div>

                    {/* Response */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Server ➔ Client (Response)
                        </span>
                      </div>
                      <pre className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                        {JSON.stringify(mcpWire.response, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    These are the actual <code className="text-slate-300 bg-slate-800 px-1 rounded">tools/call</code> JSON-RPC 2.0 messages that flowed between the server-side MCP client and the MCP server over Streamable HTTP transport — the same protocol used by Claude Desktop, Cursor, and other MCP hosts.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
