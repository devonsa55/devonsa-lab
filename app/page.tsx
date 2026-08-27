"use client";

import { useState } from "react";
import type { MerchantInsight } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Sparkles,
  Zap,
  ChevronDown,
  RefreshCw,
  Terminal,
  Code2,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

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

  // Panel open/close states
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
      setJsonError("Invalid JSON — please check syntax and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Live Model Context Protocol Demo
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            One MCP tool call. <span className="text-blue-600 dark:text-blue-400">Two native renders.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A single structured MCP payload generated over the official Model Context Protocol, rendered simultaneously into two native Google product design systems.
          </p>
        </header>

        {/* Input Controls Card */}
        <Card className="max-w-3xl mx-auto shadow-md border-border/80 bg-card">
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              Tool Parameters
            </div>
            <CardDescription className="text-xs">
              Configure arguments to pass into the MCP <code>get_merchant_insight</code> tool.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            <form onSubmit={handleFetchInsight} className="space-y-4 sm:space-y-0 sm:flex sm:items-end sm:gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="merchantId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Merchant ID
                </Label>
                <Input
                  id="merchantId"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="e.g. merchant_8492"
                  required
                  disabled={loading}
                  className="bg-background shadow-2xs font-mono text-sm"
                />
              </div>

              <div className="w-full sm:w-64 space-y-1.5">
                <Label htmlFor="focusArea" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Focus Area
                </Label>
                <select
                  id="focusArea"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value as "inventory" | "pricing" | "trend")}
                  disabled={loading}
                  className="w-full h-9 px-3 py-1 bg-background border border-input rounded-md text-sm font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer"
                >
                  {FOCUS_AREAS.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto pt-2 sm:pt-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-9 px-6 font-semibold shadow-sm gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Calling MCP Tool…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Fetch insight</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Architecture flow indicator */}
            <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Stateless MCP Streamable HTTP Transport
              </span>
              <span className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                Browser ➔ /api/call-tool ➔ MCP Client ➔ /api/mcp
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="max-w-3xl mx-auto border-destructive/50 bg-destructive/10 text-destructive shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">MCP Request Failed</p>
                <p className="text-xs opacity-90 mt-0.5">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty Initial State */}
        {!insight && !loading && !error && (
          <Card className="max-w-md mx-auto text-center py-10 px-6 border-dashed border-2 bg-muted/20 shadow-none">
            <CardContent className="p-0 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-bold">Ready to execute MCP tool</CardTitle>
              <CardDescription className="text-xs max-w-xs mx-auto">
                Select a focus area and click &quot;Fetch insight&quot; to invoke the MCP server tool and see both surfaces render simultaneously.
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
            <Card className="p-6 space-y-4">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-16 bg-muted/60 rounded-xl" />
              <div className="h-10 bg-muted rounded-lg" />
            </Card>
            <Card className="p-5 space-y-3 bg-emerald-500/5 border-emerald-500/20">
              <div className="h-4 bg-emerald-500/15 rounded w-1/4" />
              <div className="h-5 bg-emerald-500/15 rounded w-2/3" />
              <div className="h-3 bg-emerald-500/15 rounded w-full" />
              <div className="h-10 bg-emerald-500/10 rounded" />
            </Card>
          </div>
        )}

        {/* Side-by-Side Dual Surface Output */}
        {insight && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Surface 1: Merchant Center */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Surface 1: Merchant Center
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Card Component
                  </Badge>
                </div>
                <MerchantCenterCard data={insight} />
              </div>

              {/* Surface 2: Google Ads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Surface 2: Google Ads
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40">
                    Banner Strip
                  </Badge>
                </div>
                <AdsBanner data={insight} />
              </div>
            </div>

            {/* ── Panel 1: Edit & Re-render ── */}
            <Collapsible open={showEditPanel} onOpenChange={setShowEditPanel} className="border border-border/80 rounded-2xl bg-card shadow-sm overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 gap-1">
                    <Code2 className="w-3 h-3" />
                    EDIT
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    Edit payload & re-render both surfaces
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — proof that one object drives both renders
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showEditPanel ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-6 pb-6 border-t border-border/40 space-y-4 pt-4 bg-muted/5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Edit any field below and click <strong>Apply & Re-render</strong>. Both the Merchant Center card and Google Ads banner will re-render from your modified JSON in real time.
                </p>
                <Textarea
                  value={editedJson}
                  onChange={(e) => {
                    setEditedJson(e.target.value);
                    setJsonError(null);
                  }}
                  rows={13}
                  spellCheck={false}
                  className="w-full font-mono text-xs text-emerald-400 bg-slate-950 rounded-xl p-4 border-slate-800 leading-relaxed focus-visible:ring-violet-500"
                />
                {jsonError && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {jsonError}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleApplyEdit}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Apply & Re-render
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedJson(JSON.stringify(insight, null, 2));
                      setJsonError(null);
                    }}
                    className="text-xs font-medium cursor-pointer"
                  >
                    Reset to original
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* ── Panel 2: MCP Wire Protocol ── */}
            <Collapsible open={showWirePanel} onOpenChange={setShowWirePanel} className="border border-border/80 rounded-2xl bg-card shadow-sm overflow-hidden">
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1">
                    <Terminal className="w-3 h-3" />
                    MCP
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    View raw MCP wire protocol
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — actual JSON-RPC 2.0 messages over the protocol
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showWirePanel ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-6 pb-6 border-t border-border/40 space-y-4 pt-4 bg-muted/5">
                {mcpWire && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {mcpWire.endpoint}
                      </Badge>
                      <span>— Streamable HTTP Transport</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Request */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Server ➔ Client (Response)
                          </span>
                        </div>
                        <pre className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                          {JSON.stringify(mcpWire.response, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      These are the actual <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">tools/call</code> JSON-RPC 2.0 messages that flowed between the server-side MCP client and the MCP server over Streamable HTTP transport — the same protocol used by Claude Desktop, Cursor, and other MCP hosts.
                    </p>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
          </section>
        )}
      </div>
    </div>
  );
}
