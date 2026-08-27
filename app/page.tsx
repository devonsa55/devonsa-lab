"use client";

import { useState } from "react";
import type { MerchantInsight } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  IconAdjustmentsHorizontal,
  IconFlame,
  IconArrowsExchange,
  IconShip,
  IconTrendingUp,
  IconDiscount2,
} from "@tabler/icons-react";

interface MarketScenario {
  id: string;
  title: string;
  category: string;
  focusArea: "inventory" | "pricing" | "trend";
  scenario: string;
  timeHorizon: string;
  prompt: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
}

const SCENARIOS: MarketScenario[] = [
  {
    id: "rival-price-war",
    title: "Competitor Price Undercut",
    category: "Consumer Electronics",
    focusArea: "pricing",
    scenario: "Aggressive competitor discount (-18%) on flagship 4K monitors",
    timeHorizon: "7d",
    prompt: "Key competitor undercut our top 4K monitor SKU by 18%, shrinking margin and ad conversion share.",
    icon: <IconDiscount2 className="w-4 h-4 text-rose-500" />,
    badge: "Pricing Threat",
    badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  {
    id: "viral-demand-spike",
    title: "Viral TikTok Demand Surge",
    category: "Beauty & Cosmetics",
    focusArea: "trend",
    scenario: "Sudden +340% search velocity explosion from influencer coverage",
    timeHorizon: "30d",
    prompt: "Viral TikTok campaign triggered a 340% spike in search demand for peptide glow serum.",
    icon: <IconFlame className="w-4 h-4 text-amber-500" />,
    badge: "Demand Surge",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  {
    id: "supply-chain-bottleneck",
    title: "Supply Chain Port Delay",
    category: "Apparel & Footwear",
    focusArea: "inventory",
    scenario: "Shipping bottleneck delaying restock of winter parkas by 14 days",
    timeHorizon: "30d",
    prompt: "Port congestion delayed winter jacket inventory; stock levels dropping to critical threshold.",
    icon: <IconShip className="w-4 h-4 text-blue-500" />,
    badge: "Stockout Risk",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  {
    id: "market-share-growth",
    title: "Category Market Expansion",
    category: "Specialty Coffee",
    focusArea: "trend",
    scenario: "Rising regional interest in organic single-origin whole bean coffee",
    timeHorizon: "90d",
    prompt: "Search interest for single-origin whole bean coffee up 28% across Midwest metro hubs.",
    icon: <IconTrendingUp className="w-4 h-4 text-emerald-500" />,
    badge: "Growth Wave",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
];

const CATEGORIES = [
  "Consumer Electronics",
  "Apparel & Footwear",
  "Beauty & Cosmetics",
  "Specialty Coffee & Food",
  "Home & Furniture",
  "Outdoor & Sports",
];

const TIME_HORIZONS = ["7d", "30d", "90d", "ytd"];

interface McpWire {
  endpoint: string;
  request: unknown;
  response: unknown;
}

export default function DemoPage() {
  const [merchantId] = useState("merchant_8492");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Dynamic parameters state
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Consumer Electronics");
  const [selectedFocusArea, setSelectedFocusArea] = useState<"inventory" | "pricing" | "trend">("pricing");
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState("7d");
  const [isCustomConfigOpen, setIsCustomConfigOpen] = useState(false);

  // Execution & result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [mcpWire, setMcpWire] = useState<McpWire | null>(null);
  const [lastExecutedArgs, setLastExecutedArgs] = useState<Record<string, unknown> | null>(null);

  // Inspector panel states
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWirePanel, setShowWirePanel] = useState(false);
  const [editedJson, setEditedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const executeMcpTool = async (params: {
    query: string;
    category: string;
    focus_area: "inventory" | "pricing" | "trend";
    scenario?: string;
    time_horizon: string;
  }) => {
    setLoading(true);
    setError(null);
    setJsonError(null);
    setIsModified(false);
    setShowEditPanel(false);
    setShowWirePanel(false);

    const toolArgs = {
      merchant_id: merchantId,
      focus_area: params.focus_area,
      query: params.query,
      category: params.category,
      scenario: params.scenario || params.query,
      time_horizon: params.time_horizon,
    };

    setLastExecutedArgs(toolArgs);

    try {
      const response = await fetch("/api/call-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toolArgs),
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

  const handleSelectScenario = (sc: MarketScenario) => {
    setSelectedScenarioId(sc.id);
    setSelectedCategory(sc.category);
    setSelectedFocusArea(sc.focusArea);
    setSelectedTimeHorizon(sc.timeHorizon);
    setCustomPrompt(sc.prompt);

    executeMcpTool({
      query: sc.prompt,
      category: sc.category,
      focus_area: sc.focusArea,
      scenario: sc.scenario,
      time_horizon: sc.timeHorizon,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setSelectedScenarioId(null);
    executeMcpTool({
      query: customPrompt.trim(),
      category: selectedCategory,
      focus_area: selectedFocusArea,
      time_horizon: selectedTimeHorizon,
    });
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
            Model Context Protocol Demo
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            One AI Agent query. <span className="text-emerald-600 dark:text-emerald-400">Two radical renders.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Select a live market scenario or craft a custom query. The agent invokes the MCP server tool with dynamic parameters, producing one shared JSON payload rendered into opposing design systems.
          </p>
        </header>

        {/* ── CARD 1: Dynamic Market Scenarios & AI Query Studio ── */}
        <Card className="shadow-md border-border/80 bg-card overflow-hidden">
          <CardHeader className="py-3.5 px-5 sm:px-6 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconSparkles className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Market Scenario Simulator & MCP Query Studio
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Dynamic Gemini Flash Tool Calls
            </span>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Clickable Market Scenario Cards */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Choose a Dynamic Scenario:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SCENARIOS.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectScenario(sc)}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-600"
                          : "border-border/80 bg-muted/20 hover:bg-muted/50 hover:border-border"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                          {sc.icon}
                          <span>{sc.title}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.badgeColor}`}>
                          {sc.badge}
                        </span>
                      </div>

                      <div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {sc.scenario}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span>{sc.category}</span>
                        <span>{sc.timeHorizon}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Query Bar & Parameter Drawer */}
            <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Or write any custom retail query (e.g. 'Flash sale surge on organic roast beans in Tokyo')..."
                  disabled={loading}
                  className="flex-1 bg-muted/30 border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={loading || !customPrompt.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl h-10 px-5 gap-1.5 cursor-pointer shrink-0"
                >
                  {loading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconSend className="w-4 h-4" />}
                  <span>Execute MCP</span>
                </Button>
              </div>

              {/* Dynamic Parameter Fine-Tuning */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <IconAdjustmentsHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  Parameters:
                </span>

                {/* Category select */}
                <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Industry:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={loading}
                    className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-popover text-foreground">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Focus area select */}
                <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Focus:</span>
                  <select
                    value={selectedFocusArea}
                    onChange={(e) => setSelectedFocusArea(e.target.value as "inventory" | "pricing" | "trend")}
                    disabled={loading}
                    className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="pricing" className="bg-popover text-foreground">Pricing Competitiveness</option>
                    <option value="inventory" className="bg-popover text-foreground">Inventory & Supply</option>
                    <option value="trend" className="bg-popover text-foreground">Search Trends</option>
                  </select>
                </div>

                {/* Time horizon select */}
                <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Window:</span>
                  <select
                    value={selectedTimeHorizon}
                    onChange={(e) => setSelectedTimeHorizon(e.target.value)}
                    disabled={loading}
                    className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {TIME_HORIZONS.map((th) => (
                      <option key={th} value={th} className="bg-popover text-foreground">
                        {th.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── CARD 2: Dynamic Agent Interaction & MCP Protocol Execution ── */}
        {lastExecutedArgs && (
          <Card className="shadow-md border-border/80 bg-card overflow-hidden">
            <div className="py-3 px-5 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Agent Interaction & Dynamic MCP Execution
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Transport: Streamable HTTP
              </span>
            </div>

            <CardContent className="p-5 space-y-4">
              {/* User Prompt Message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <IconUser className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="bg-muted/60 border border-border/60 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-foreground font-medium">
                    {String(lastExecutedArgs.query || lastExecutedArgs.scenario)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground px-1">
                    <span className="bg-muted px-2 py-0.5 rounded">Category: {String(lastExecutedArgs.category)}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">Focus: {String(lastExecutedArgs.focus_area)}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">Horizon: {String(lastExecutedArgs.time_horizon)}</span>
                  </div>
                </div>
              </div>

              {/* Agent / MCP Tool Calling State */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white shadow-xs">
                  <IconRobot className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Protocol Status Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                    {loading ? (
                      <>
                        <IconLoader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>
                          Agent calling MCP Tool: <code>get_merchant_insight({String(lastExecutedArgs.focus_area)})</code> with dynamic parameters…
                        </span>
                      </>
                    ) : (
                      <>
                        <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          MCP Tool executed successfully: <code>get_merchant_insight({String(lastExecutedArgs.focus_area)})</code>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Loading Skeleton */}
                  {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse pt-1">
                      <div className="rounded-xl border border-zinc-200 p-6 space-y-4 bg-muted/40 h-48" />
                      <div className="rounded-none border-2 border-blue-300 p-6 space-y-4 bg-blue-50/30 h-48" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
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

        {/* Initial Empty State */}
        {!insight && !loading && !error && !lastExecutedArgs && (
          <Card className="text-center py-12 px-6 border-dashed border-2 bg-muted/20 shadow-none">
            <CardContent className="p-0 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <IconLayersLinked className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Select a market scenario above to execute the MCP tool</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Watch how dynamic scenario arguments generate structured JSON rendered natively on both surfaces.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── CARD 3: Dual Native Surface Renders ── */}
        {insight && !loading && (
          <Card className="shadow-md border-border/80 bg-card overflow-hidden">
            <div className="py-4 px-6 border-b border-border/40 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Dual Native Surface Renders
                </h2>
                <p className="text-xs text-muted-foreground">
                  The exact same MCP JSON payload rendered under two radically different design systems.
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] font-bold self-start sm:self-auto">
                1 JSON ➔ 2 Native Surfaces
              </Badge>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Surface 1: Editorial Serif Grayscale */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-serif italic text-zinc-600 dark:text-zinc-400">
                      Surface A: Editorial Dispatch
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                      100% Serif • Grayscale
                    </Badge>
                  </div>
                  <MerchantCenterCard data={insight} />
                </div>

                {/* Surface 2: Constructivist Square & Color */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Surface B: Constructivist Visual
                    </span>
                    <Badge className="text-[10px] font-mono bg-yellow-400 text-black border-none font-black rounded-none">
                      Zero Radius • Vivid Color
                    </Badge>
                  </div>
                  <AdsBanner data={insight} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── CARD 4: Live Inspectors ── */}
        {insight && !loading && (
          <div className="space-y-4">
            {/* Panel 1: Edit & Live Re-render */}
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

            {/* Panel 2: MCP Wire Protocol */}
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
          </div>
        )}
      </div>
    </div>
  );
}
