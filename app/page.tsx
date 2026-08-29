"use client";

import { useState, useRef } from "react";
import type { MerchantInsight, VisualizationType } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  IconHierarchy2,
  IconArrowRight,
  IconArrowDown,
  IconChartLine,
  IconChartBar,
  IconGauge,
  IconChartPie,
} from "@tabler/icons-react";

interface PresetQuery {
  label: string;
  category: string;
  focusArea: "inventory" | "pricing" | "trend";
  visType: VisualizationType;
  timeHorizon: string;
  query: string;
}

const PRESETS: PresetQuery[] = [
  {
    label: "📈 7-Day Price Trajectory",
    category: "Consumer Electronics",
    focusArea: "pricing",
    visType: "trend_line",
    timeHorizon: "7d",
    query: "Forecast 7-day competitor price undercut trajectory and regional margin deflation across 48 key search terms.",
  },
  {
    label: "📊 4-Brand Price Benchmark",
    category: "Footwear & Apparel",
    focusArea: "pricing",
    visType: "bar_comparison",
    timeHorizon: "30d",
    query: "Compare our store pricing against top 4 rival brands (RetailDirect, Apex Global, PrimeVault) across high-velocity sneakers.",
  },
  {
    label: "🎯 Warehouse Buffer Gauge",
    category: "Warehouse Logistics",
    focusArea: "inventory",
    visType: "progress_gauge",
    timeHorizon: "14d",
    query: "Evaluate warehouse safety stock buffer capacity and critical replenishment hazard status ahead of peak demand.",
  },
  {
    label: "🥧 Omnichannel GMV Split",
    category: "Specialty Coffee",
    focusArea: "trend",
    visType: "breakdown_distribution",
    timeHorizon: "90d",
    query: "Break down revenue contribution and customer acquisition share across Mobile App, Desktop Web, and Third-Party Marketplaces.",
  },
];

const VIS_OPTIONS: Array<{ value: "auto" | VisualizationType; label: string; icon: typeof IconChartLine }> = [
  { value: "auto", label: "Auto (Inferred)", icon: IconSparkles },
  { value: "trend_line", label: "Trend Line", icon: IconChartLine },
  { value: "bar_comparison", label: "Ranked Bars", icon: IconChartBar },
  { value: "progress_gauge", label: "Progress Gauge", icon: IconGauge },
  { value: "breakdown_distribution", label: "Segment Breakdown", icon: IconChartPie },
];

interface McpWire {
  endpoint: string;
  request: unknown;
  response: unknown;
}

export default function DemoPage() {
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(PRESETS[0].label);
  const [queryMessage, setQueryMessage] = useState(PRESETS[0].query);
  const [selectedVisType, setSelectedVisType] = useState<"auto" | VisualizationType>("auto");

  // Active parameter metadata attached to the prompt
  const [activeCategory, setActiveCategory] = useState(PRESETS[0].category);
  const [activeFocusArea, setActiveFocusArea] = useState<"inventory" | "pricing" | "trend">(PRESETS[0].focusArea);
  const [activeTimeHorizon, setActiveTimeHorizon] = useState(PRESETS[0].timeHorizon);

  // Execution & result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [mcpWire, setMcpWire] = useState<McpWire | null>(null);
  const [lastExecutedArgs, setLastExecutedArgs] = useState<Record<string, unknown> | null>(null);

  // Collapsible Card States (Card 2, Card 3, Panels)
  const [showExecCard, setShowExecCard] = useState(true);
  const [showRendersCard, setShowRendersCard] = useState(true);
  const [showArchPanel, setShowArchPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWirePanel, setShowWirePanel] = useState(false);

  // Scroll Viewport Refs
  const execCardRef = useRef<HTMLDivElement>(null);
  const rendersCardRef = useRef<HTMLDivElement>(null);
  const editPanelRef = useRef<HTMLDivElement>(null);
  const wirePanelRef = useRef<HTMLDivElement>(null);
  const archPanelRef = useRef<HTMLDivElement>(null);

  // Silky Smooth Scroll Helper with calculated offset and animation delay
  const scrollToCard = (ref: React.RefObject<HTMLDivElement | null>, offset = 28) => {
    if (typeof window === "undefined") return;
    setTimeout(() => {
      if (!ref.current) return;
      const elementRect = ref.current.getBoundingClientRect();
      const targetY = window.pageYOffset + elementRect.top - offset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    }, 150);
  };

  // Editable JSON state
  const [editedJson, setEditedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const executeMcpTool = async (params: {
    category: string;
    focus_area: "inventory" | "pricing" | "trend";
    visualization_type?: "auto" | VisualizationType;
    time_horizon: string;
    query: string;
  }) => {
    setLoading(true);
    setError(null);
    setJsonError(null);
    setIsModified(false);
    setShowExecCard(true);
    setShowEditPanel(false);
    setShowWirePanel(false);

    const toolArgs = {
      merchant_id: "merchant_8492",
      category: params.category,
      focus_area: params.focus_area,
      visualization_type: params.visualization_type || "auto",
      time_horizon: params.time_horizon,
      query: params.query,
      scenario: params.query,
    };

    setLastExecutedArgs(toolArgs);
    scrollToCard(execCardRef);

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
      setShowRendersCard(true);
      scrollToCard(rendersCardRef);
    } catch (err) {
      console.error("Error calling MCP tool:", err);
      setError(err instanceof Error ? err.message : "Failed to execute MCP tool");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: PresetQuery) => {
    setSelectedPresetLabel(preset.label);
    setQueryMessage(preset.query);
    setActiveCategory(preset.category);
    setActiveFocusArea(preset.focusArea);
    setActiveTimeHorizon(preset.timeHorizon);
    setSelectedVisType(preset.visType);

    executeMcpTool({
      category: preset.category,
      focus_area: preset.focusArea,
      visualization_type: preset.visType,
      time_horizon: preset.timeHorizon,
      query: preset.query,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryMessage.trim()) return;

    let focus: "inventory" | "pricing" | "trend" = activeFocusArea;
    const lower = queryMessage.toLowerCase();
    if (lower.includes("stock") || lower.includes("inventory") || lower.includes("supply") || lower.includes("capacity")) {
      focus = "inventory";
    } else if (lower.includes("price") || lower.includes("discount") || lower.includes("margin") || lower.includes("competitor")) {
      focus = "pricing";
    } else if (lower.includes("trend") || lower.includes("demand") || lower.includes("search") || lower.includes("share")) {
      focus = "trend";
    }

    executeMcpTool({
      category: activeCategory,
      focus_area: focus,
      visualization_type: selectedVisType,
      time_horizon: activeTimeHorizon,
      query: queryMessage.trim(),
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
        !parsed.metric
      ) {
        setJsonError("JSON must include at least: headline, detail, metric {label, value, trend}, action");
        return;
      }
      if (!["up", "down", "flat"].includes(parsed.metric.trend)) {
        setJsonError('metric.trend must be "up", "down", or "flat"');
        return;
      }
      const validatedInsight = parsed as MerchantInsight;
      setInsight(validatedInsight);
      setIsModified(true);
      setShowRendersCard(true);
      scrollToCard(rendersCardRef);

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

  const currentVisType = insight?.visualization?.type || (insight?.chart ? "trend_line" : "trend_line");

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 scroll-smooth">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Model Context Protocol Demo
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            One MCP tool call. <span className="text-emerald-600 dark:text-emerald-400">Two radical renders.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A single structured JSON payload with polymorphic visual widgets, rendered simultaneously into two opposing design philosophies.
          </p>
        </header>

        {/* ── CARD 1: Query & Presets Card ── */}
        <Card className="shadow-md border-border/80 bg-card overflow-hidden">
          <CardHeader className="py-3.5 px-5 sm:px-6 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconSparkles className="w-4 h-4 text-emerald-600" />
              <CardTitle className="font-heading text-sm font-bold text-foreground">
                Query & MCP Tool Execution
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Tool: <code>get_merchant_insight</code>
            </span>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* 1-Click Preset Chips with Multiple Visualization Types */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Quick Visualization Presets (Click to Execute):
                </span>
                <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                  4 Distinct Visual Widget Types
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPresetLabel === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-xs font-medium p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]"
                          : "bg-muted/40 hover:bg-muted text-foreground border-border/80 hover:border-border"
                      } disabled:opacity-50`}
                    >
                      <span className="font-semibold">{preset.label}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? "text-emerald-100" : "text-muted-foreground"}`}>
                        Widget: {preset.visType.replace("_", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Visualization Override Selector */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Requested Visualization Widget:
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Surface adapts or falls back gracefully
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VIS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedVisType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedVisType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Freeform Prompt Input & Submit */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <Input
                  value={queryMessage}
                  onChange={(e) => {
                    setQueryMessage(e.target.value);
                    setSelectedPresetLabel(null);
                  }}
                  disabled={loading}
                  placeholder="Or enter any custom query (e.g., 'Compare warehouse safety buffers against supplier quotas')..."
                  className="bg-muted/20 text-xs text-foreground font-medium h-10 flex-1"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading || !queryMessage.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl h-10 px-5 gap-1.5 cursor-pointer shrink-0"
                >
                  {loading ? <IconLoader2 className="w-3.5 h-3.5 animate-spin" /> : <IconSend className="w-3.5 h-3.5" />}
                  <span>Execute MCP</span>
                </Button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Stateless MCP Streamable HTTP Transport
                </span>
                <span className="font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                  Client ➔ /api/call-tool ➔ MCP Client ➔ /api/mcp
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── CARD 2: Dynamic Agent Interaction & MCP Protocol Execution (Collapsible with Ref) ── */}
        {lastExecutedArgs && (
          <div ref={execCardRef} className="scroll-mt-6">
            <Collapsible
              open={showExecCard}
              onOpenChange={(open) => {
                setShowExecCard(open);
                if (open) scrollToCard(execCardRef);
              }}
              className="border border-border/80 rounded-xl bg-card shadow-md overflow-hidden"
            >
              <CollapsibleTrigger className="w-full py-3.5 px-5 bg-muted/20 hover:bg-muted/30 transition-colors border-b border-border/40 flex items-center justify-between cursor-pointer text-left">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Agent Interaction & MCP Protocol Execution
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono hidden sm:inline">
                    Streamable HTTP
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {showExecCard ? "Collapse" : "Expand"} trace
                  </span>
                  <IconChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      showExecCard ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="p-5 space-y-4">
                {/* User Prompt Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                    <IconUser className="w-4 h-4" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="bg-muted/60 border border-border/60 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-foreground font-medium">
                      {String(lastExecutedArgs.query)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground px-1">
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded">
                        category: &quot;{String(lastExecutedArgs.category)}&quot;
                      </span>
                      <span className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">
                        focus_area: &quot;{String(lastExecutedArgs.focus_area)}&quot;
                      </span>
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                        vis_widget: &quot;{String(lastExecutedArgs.visualization_type)}&quot;
                      </span>
                      <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
                        time_horizon: &quot;{String(lastExecutedArgs.time_horizon)}&quot;
                      </span>
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
                            Agent calling MCP Tool: <code>get_merchant_insight({String(lastExecutedArgs.visualization_type)})</code>…
                          </span>
                        </>
                      ) : (
                        <>
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            MCP Tool synthesized widget: <code>{currentVisType}</code>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Loading Skeleton */}
                    {loading && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse pt-1">
                        <div className="rounded-xl border border-zinc-200 p-6 space-y-4 bg-muted/40 h-52" />
                        <div className="rounded-none border-2 border-blue-300 p-6 space-y-4 bg-blue-50/30 h-52" />
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
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
              <p className="text-sm font-bold text-foreground">Click a preset above to execute the MCP tool</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Watch how the MCP server synthesizes different visual widget formats (trend lines, comparison bars, gauges, distributions) rendered natively across both surfaces.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── CARD 3: Dual Native Surface Renders (Collapsible with Ref) ── */}
        {insight && !loading && (
          <div ref={rendersCardRef} className="scroll-mt-6">
            <Collapsible
              open={showRendersCard}
              onOpenChange={(open) => {
                setShowRendersCard(open);
                if (open) scrollToCard(rendersCardRef);
              }}
              className="border border-border/80 rounded-xl bg-card shadow-md overflow-hidden"
            >
              <CollapsibleTrigger className="w-full py-4 px-6 border-b border-border/40 bg-muted/15 hover:bg-muted/25 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer text-left">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground tracking-tight">
                    Dual Native Surface Renders
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    The exact same polymorphic JSON payload rendered under two radically different design systems.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    Widget: {currentVisType.replace("_", " ")}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                    1 JSON ➔ 2 Surfaces
                  </Badge>
                  <IconChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      showRendersCard ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Surface 1: Editorial Serif Warm Neutral */}
                  <div className="space-y-2 flex flex-col">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-serif italic text-zinc-600 dark:text-zinc-400">
                        Surface A: Editorial Dispatch
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                        100% Serif • Warm Editorial
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* ── CARD 4: Live Inspectors & Technical Architecture ── */}
        <div className="space-y-4">
          {/* Panel 1: Edit & Live Re-render */}
          {insight && !loading && (
            <div ref={editPanelRef} className="scroll-mt-6">
              <Collapsible
                open={showEditPanel}
                onOpenChange={(open) => {
                  setShowEditPanel(open);
                  if (open) scrollToCard(editPanelRef);
                }}
                className="border border-border/80 rounded-xl bg-card shadow-xs overflow-hidden"
              >
                <CollapsibleTrigger className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 gap-1">
                      <IconCode className="w-3 h-3" />
                      EDIT
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      Edit payload & test adaptive visualizers
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      — change visualization type or values to see instant multi-surface adaptation
                    </span>
                  </div>
                  <IconChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showEditPanel ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>

                <CollapsibleContent className="px-5 pb-5 border-t border-border/40 space-y-3 pt-3 bg-muted/5">
                  <p className="text-xs text-muted-foreground">
                    Try changing <code>visualization.type</code> to <code>&quot;trend_line&quot;</code>, <code>&quot;bar_comparison&quot;</code>, <code>&quot;progress_gauge&quot;</code>, or <code>&quot;breakdown_distribution&quot;</code> and click <strong>Apply & Re-render</strong>.
                  </p>
                  <Textarea
                    value={editedJson}
                    onChange={(e) => {
                      setEditedJson(e.target.value);
                      setJsonError(null);
                    }}
                    rows={14}
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
            </div>
          )}

          {/* Panel 2: MCP Wire Protocol */}
          {insight && !loading && (
            <div ref={wirePanelRef} className="scroll-mt-6">
              <Collapsible
                open={showWirePanel}
                onOpenChange={(open) => {
                  setShowWirePanel(open);
                  if (open) scrollToCard(wirePanelRef);
                }}
                className="border border-border/80 rounded-xl bg-card shadow-xs overflow-hidden"
              >
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

          {/* Panel 3: Technical Architecture & Protocol Pipeline (SPECS) */}
          <div ref={archPanelRef} className="scroll-mt-6">
            <Collapsible
              open={showArchPanel}
              onOpenChange={(open) => {
                setShowArchPanel(open);
                if (open) scrollToCard(archPanelRef);
              }}
              className="border border-border/80 rounded-xl bg-card shadow-xs overflow-hidden"
            >
              <CollapsibleTrigger className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 gap-1">
                    <IconHierarchy2 className="w-3 h-3" />
                    SPECS
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    Technical Architecture & Multi-Surface Flow
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — polymorphic visual contracts & surface capability resolution
                  </span>
                </div>
                <IconChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showArchPanel ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="px-5 pb-5 border-t border-border/40 space-y-4 pt-4 bg-muted/5">
                {/* Flowchart Diagram */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      End-to-End Execution Flow
                    </span>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                      1 Polymorphic JSON ➔ 2 Native Surface Projections
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                    {/* Step 1 */}
                    <div className="flex-1 p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Step 1</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="font-bold text-foreground text-xs block">User Query & Widget Intent</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Natural language observation with requested visualization type.
                      </p>
                    </div>

                    {/* Arrow 1 */}
                    <div className="flex items-center justify-center text-muted-foreground shrink-0 py-0.5 lg:py-0">
                      <IconArrowRight className="w-4 h-4 hidden lg:block text-emerald-600" />
                      <IconArrowDown className="w-4 h-4 block lg:hidden text-emerald-600" />
                    </div>

                    {/* Step 2 */}
                    <div className="flex-1 p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Step 2</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                      <span className="font-bold text-foreground text-xs block">MCP Tool Call</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Client invokes <code>tools/call</code> over Streamable HTTP transport.
                      </p>
                    </div>

                    {/* Arrow 2 */}
                    <div className="flex items-center justify-center text-muted-foreground shrink-0 py-0.5 lg:py-0">
                      <IconArrowRight className="w-4 h-4 hidden lg:block text-blue-600" />
                      <IconArrowDown className="w-4 h-4 block lg:hidden text-blue-600" />
                    </div>

                    {/* Step 3 */}
                    <div className="flex-1 p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">Step 3</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>
                      <span className="font-bold text-foreground text-xs block">Polymorphic Schema</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        MCP Server synthesizes semantic data (trend, bars, gauge, distribution).
                      </p>
                    </div>

                    {/* Arrow 3 */}
                    <div className="flex items-center justify-center text-muted-foreground shrink-0 py-0.5 lg:py-0">
                      <IconArrowRight className="w-4 h-4 hidden lg:block text-amber-600" />
                      <IconArrowDown className="w-4 h-4 block lg:hidden text-amber-600" />
                    </div>

                    {/* Step 4 */}
                    <div className="flex-1 p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400">Step 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                      <span className="font-bold text-foreground text-xs block">Adaptive Surface Render</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Surfaces project data to their local design system or adapt via fallback.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5 p-3.5 rounded-lg border border-border/40 bg-card">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Polymorphic Data Contracts
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      MCP tools return structured visualization intent rather than pre-rendered pixels or rigid DOM nodes, enabling true cross-platform presentation agility.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-lg border border-border/40 bg-card">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Capability & Fallback Resolution
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      If an edge client or constrained surface lacks support for complex visualizations, it gracefully degrades to native summary representations.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-lg border border-border/40 bg-card">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Reactive Multi-Surface Sync
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Upstream schema mutations or visual type switches instantly update both native rendering pipelines in real-time lockstep.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
