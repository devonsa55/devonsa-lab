"use client";

import { useState } from "react";
import type { MerchantInsight } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  IconSparkles,
  IconChevronDown,
  IconLoader2,
  IconTerminal2,
  IconCode,
  IconAlertCircle,
  IconSend,
  IconUser,
  IconRobot,
  IconLayersLinked,
  IconCheck,
} from "@tabler/icons-react";

interface SuggestionChip {
  id: string;
  label: string;
  icon: string;
  focusArea: "inventory" | "pricing" | "trend";
  prompt: string;
}

const SUGGESTIONS: SuggestionChip[] = [
  {
    id: "pricing",
    label: "Check competitor pricing undercuts",
    icon: "🏷️",
    focusArea: "pricing",
    prompt: "Check competitor pricing competitiveness on top summer items",
  },
  {
    id: "inventory",
    label: "Identify catalog stockout risks",
    icon: "📦",
    focusArea: "inventory",
    prompt: "Analyze catalog inventory levels and flag critical stockout risks",
  },
  {
    id: "trend",
    label: "Forecast consumer search demand",
    icon: "📈",
    focusArea: "trend",
    prompt: "What are the latest consumer search trends and market demand velocity?",
  },
];

interface McpWire {
  endpoint: string;
  request: unknown;
  response: unknown;
}

export default function DemoPage() {
  const [merchantId] = useState("merchant_8492");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [mcpWire, setMcpWire] = useState<McpWire | null>(null);
  const [activeFocusArea, setActiveFocusArea] = useState<"inventory" | "pricing" | "trend">("pricing");

  // Panel open/close states
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWirePanel, setShowWirePanel] = useState(false);

  // Editable JSON state
  const [editedJson, setEditedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const handleExecutePrompt = async (promptText: string, focus: "inventory" | "pricing" | "trend") => {
    setSelectedPrompt(promptText);
    setActiveFocusArea(focus);
    setLoading(true);
    setError(null);
    setJsonError(null);
    setIsModified(false);
    setShowEditPanel(false);
    setShowWirePanel(false);

    try {
      const response = await fetch("/api/call-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          focus_area: focus,
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
      setError(err instanceof Error ? err.message : "Failed to execute MCP tool");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    // Detect focus area keyword or default to active
    let focus: "inventory" | "pricing" | "trend" = "pricing";
    const lower = customInput.toLowerCase();
    if (lower.includes("stock") || lower.includes("inventory") || lower.includes("sku")) {
      focus = "inventory";
    } else if (lower.includes("trend") || lower.includes("search") || lower.includes("demand")) {
      focus = "trend";
    }

    const text = customInput.trim();
    setCustomInput("");
    handleExecutePrompt(text, focus);
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
      const validatedInsight = parsed as MerchantInsight;
      setInsight(validatedInsight);
      setIsModified(true);

      if (mcpWire) {
        setMcpWire({
          ...mcpWire,
          response: {
            jsonrpc: "2.0",
            id: 1,
            result: {
              content: [{ type: "text", text: JSON.stringify(validatedInsight) }],
              structuredContent: validatedInsight,
            },
          },
        });
      }
    } catch {
      setJsonError("Invalid JSON — please check syntax and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Model Context Protocol Demo
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            One AI Agent query. <span className="text-emerald-600 dark:text-emerald-400">Two native renders.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Ask the merchant assistant for insights. A single agent invokes the MCP server tool and delivers one structured JSON payload rendered natively across surfaces.
          </p>
        </header>

        {/* Interactive Chat & Suggestion Chips Bar */}
        <Card className="shadow-md border-border/80 bg-card overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Suggested Merchant Queries (Click to trigger MCP Tool)
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleExecutePrompt(chip.prompt, chip.focusArea)}
                    className={`text-xs font-medium px-3.5 py-2 rounded-xl border transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                      selectedPrompt === chip.prompt
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/80 hover:border-border"
                    } disabled:opacity-50`}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Field */}
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-2 border-t border-border/40">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Or ask anything (e.g., 'Compare my pricing vs competitors')..."
                disabled={loading}
                className="flex-1 bg-muted/30 border border-input rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={loading || !customInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
              >
                <IconSend className="w-3.5 h-3.5" />
                <span>Ask Agent</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Conversational Trace / Status */}
        {selectedPrompt && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* User Prompt Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-300">
                <IconUser className="w-4 h-4" />
              </div>
              <div className="bg-muted/60 border border-border/60 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-foreground">
                {selectedPrompt}
              </div>
            </div>

            {/* Agent / MCP Tool Calling State */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white shadow-xs">
                <IconRobot className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-3">
                {/* Protocol Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                  {loading ? (
                    <>
                      <IconLoader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>
                        Agent calling MCP Tool: <code>get_merchant_insight({activeFocusArea})</code>
                      </span>
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        MCP Tool executed: <code>get_merchant_insight({activeFocusArea})</code>
                      </span>
                    </>
                  )}
                </div>

                {/* Loading Skeleton during tool execution */}
                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse pt-2">
                    <div className="rounded-2xl border border-zinc-200 p-6 space-y-4 bg-white/60 h-64" />
                    <div className="rounded-2xl border border-blue-200 p-6 space-y-4 bg-blue-50/40 h-64" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10 text-destructive shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <IconAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">MCP Tool Execution Failed</p>
                <p className="text-xs opacity-90 mt-0.5">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Initial Empty State (before first click) */}
        {!insight && !loading && !error && !selectedPrompt && (
          <Card className="text-center py-12 px-6 border-dashed border-2 bg-muted/20 shadow-none">
            <CardContent className="p-0 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <IconLayersLinked className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Click a suggestion chip above to begin</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Watch how a single prompt triggers the MCP tool to generate structured JSON rendered natively on both Google surfaces.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dual Surface Output Section */}
        {insight && !loading && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Surface 1: Merchant Center */}
              <MerchantCenterCard data={insight} />

              {/* Surface 2: Google Ads */}
              <AdsBanner data={insight} />
            </div>

            {/* ── Panel 1: Edit & Live Re-render ── */}
            <Collapsible open={showEditPanel} onOpenChange={setShowEditPanel} className="border border-border/80 rounded-xl bg-card shadow-xs overflow-hidden">
              <CollapsibleTrigger className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 gap-1">
                    <IconCode className="w-3 h-3" />
                    EDIT
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    Edit payload & re-render both surfaces
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — proof that one object drives both renders
                  </span>
                </div>
                <IconChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showEditPanel ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-5 pb-5 border-t border-border/40 space-y-3 pt-3 bg-muted/5">
                <p className="text-xs text-muted-foreground">
                  Edit any field in the JSON below and click <strong>Apply & Re-render</strong> to see both surfaces update simultaneously.
                </p>
                <Textarea
                  value={editedJson}
                  onChange={(e) => {
                    setEditedJson(e.target.value);
                    setJsonError(null);
                  }}
                  rows={12}
                  spellCheck={false}
                  className="w-full font-mono text-xs text-emerald-400 bg-slate-950 rounded-lg p-3.5 border-slate-800 leading-relaxed focus-visible:ring-violet-500"
                />
                {jsonError && (
                  <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                    <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {jsonError}
                  </p>
                )}
                <div className="flex items-center gap-2.5">
                  <Button
                    size="sm"
                    onClick={handleApplyEdit}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer"
                  >
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
                    Reset
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* ── Panel 2: MCP Wire Protocol ── */}
            <Collapsible open={showWirePanel} onOpenChange={setShowWirePanel} className="border border-border/80 rounded-xl bg-card shadow-xs overflow-hidden">
              <CollapsibleTrigger className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1">
                    <IconTerminal2 className="w-3 h-3" />
                    MCP
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    View raw MCP wire protocol
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — JSON-RPC 2.0 messages over Streamable HTTP transport
                  </span>
                </div>
                <IconChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showWirePanel ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-5 pb-5 border-t border-border/40 space-y-4 pt-3 bg-muted/5">
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
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          Client ➔ Server (Request)
                        </span>
                        <pre className="bg-slate-950 rounded-lg p-3.5 text-[11px] font-mono text-blue-300 overflow-x-auto leading-relaxed border border-slate-800">
                          {JSON.stringify(mcpWire.request, null, 2)}
                        </pre>
                      </div>

                      {/* Response */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Server ➔ Client (Response)
                          </span>
                          {isModified && (
                            <Badge variant="outline" className="text-[10px] font-mono border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-50/50">
                              Live Modified
                            </Badge>
                          )}
                        </div>
                        <pre className="bg-slate-950 rounded-lg p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                          {JSON.stringify(mcpWire.response, null, 2)}
                        </pre>
                      </div>
                    </div>
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
