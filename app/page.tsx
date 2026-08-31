"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { MerchantInsight, VisualizationType } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";
import {
  IconCode,
  IconTerminal2,
  IconHierarchy2,
  IconChevronDown,
  IconAlertCircle,
  IconArrowRight,
  IconArrowDown,
} from "@tabler/icons-react";

const AQUA = "#54cea1";
const CYAN = "#0e84f1";
const TANGERINE = "#ff9254";
const AMETHYST = "#9461fb";
const PINK = "#ff5470";

const STEP_COLORS = [AQUA, CYAN, TANGERINE, AMETHYST];
const STEP_LABELS = [
  "Query & widget intent",
  "MCP tool call",
  "Schema synthesis",
  "Adaptive render",
];

interface PresetItem {
  label: string;
  sub: string;
  accent: string;
  category: string;
  focusArea: "inventory" | "pricing" | "trend";
  visType: VisualizationType;
  timeHorizon: string;
  query: string;
}

const PRESETS: PresetItem[] = [
  {
    label: "7-Day Price Trajectory",
    sub: "Consumer electronics · pricing",
    accent: CYAN,
    category: "Consumer Electronics",
    focusArea: "pricing",
    visType: "trend_line",
    timeHorizon: "7d",
    query: "Forecast 7-day competitor price undercut trajectory and regional margin deflation across 48 key search terms.",
  },
  {
    label: "4-Brand Price Benchmark",
    sub: "Footwear & apparel · pricing",
    accent: AMETHYST,
    category: "Footwear & Apparel",
    focusArea: "pricing",
    visType: "bar_comparison",
    timeHorizon: "30d",
    query: "Compare our store pricing against top 4 rival brands across high-velocity sneakers.",
  },
  {
    label: "Warehouse Buffer Gauge",
    sub: "Warehouse logistics · inventory",
    accent: TANGERINE,
    category: "Warehouse Logistics",
    focusArea: "inventory",
    visType: "progress_gauge",
    timeHorizon: "14d",
    query: "Evaluate warehouse safety stock buffer capacity ahead of peak demand.",
  },
  {
    label: "Omnichannel GMV Split",
    sub: "Specialty coffee · trend",
    accent: AQUA,
    category: "Specialty Coffee",
    focusArea: "trend",
    visType: "breakdown_distribution",
    timeHorizon: "90d",
    query: "Break down revenue contribution across mobile app, desktop web, and marketplaces.",
  },
];

const VIS_OPTIONS: Array<{ value: "auto" | VisualizationType; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "trend_line", label: "Trend line" },
  { value: "bar_comparison", label: "Ranked bars" },
  { value: "progress_gauge", label: "Progress gauge" },
  { value: "breakdown_distribution", label: "Segment breakdown" },
];

const ERROR_SCENARIOS = [
  {
    key: "rate_limit",
    label: "429 rate limit",
    message: "429 Too Many Requests — merchant_8492 exceeded 60 calls/min quota.",
  },
  {
    key: "invalid_schema",
    label: "Invalid schema",
    message: "Zod validation failed: metric.trend must be one of up | down | flat.",
  },
  {
    key: "timeout",
    label: "Upstream timeout",
    message: "Upstream Gemini Flash call exceeded the 8000ms execution budget.",
  },
];

interface StatsData {
  latency: number;
  tokensIn: number;
  tokensOut: number;
  cost: string;
}

interface McpWire {
  endpoint: string;
  request: unknown;
  response: unknown;
}

export default function DemoPage() {
  const [dark, setDark] = useState(false);
  const [activePresetIdx, setActivePresetIdx] = useState<number | null>(0);
  const [query, setQuery] = useState(PRESETS[0].query);
  const [visType, setVisType] = useState<"auto" | VisualizationType>("auto");

  // Execution & timeline states
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<{ message: string; atStep: number } | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Inspector Panels states (EDIT, MCP, SPECS)
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWirePanel, setShowWirePanel] = useState(false);
  const [showArchPanel, setShowArchPanel] = useState(false);

  // Editable JSON state
  const [editedJson, setEditedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  // Real MCP Data
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [mcpWire, setMcpWire] = useState<McpWire | null>(null);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const timelineCardRef = useRef<HTMLDivElement>(null);
  const rendersCardRef = useRef<HTMLDivElement>(null);
  const editPanelRef = useRef<HTMLDivElement>(null);
  const wirePanelRef = useRef<HTMLDivElement>(null);
  const archPanelRef = useRef<HTMLDivElement>(null);

  // Sync dark class on document element
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>, offset = 28) => {
    if (typeof window === "undefined") return;
    setTimeout(() => {
      if (!ref.current) return;
      const targetY = window.pageYOffset + ref.current.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }, 120);
  };

  const computeStats = (presetIdx: number | null, actualLatency?: number): StatsData => {
    const idx = presetIdx ?? 0;
    const latency = actualLatency || 260 + idx * 90 + 60;
    const tokensIn = 420 + idx * 35;
    const tokensOut = 180 + idx * 22;
    const cost = ((tokensIn + tokensOut) * 0.0000027).toFixed(4);
    return { latency, tokensIn, tokensOut, cost };
  };

  const runExecution = async (opts: {
    presetIdx?: number | null;
    customQuery?: string;
    overrideVisType?: "auto" | VisualizationType;
    errorKey?: string | null;
  }) => {
    clearTimers();

    const pIdx = opts.presetIdx !== undefined ? opts.presetIdx : activePresetIdx;
    const activePreset = pIdx !== null ? PRESETS[pIdx] : PRESETS[0];
    const currentQuery = opts.customQuery !== undefined ? opts.customQuery : query;
    const currentVis = opts.overrideVisType !== undefined ? opts.overrideVisType : visType;
    const errorKey = opts.errorKey ?? null;
    const errorScenario = errorKey ? ERROR_SCENARIOS.find((e) => e.key === errorKey) : null;
    const failStep = errorKey ? 2 : -1;

    setLoading(true);
    setHasRun(true);
    setDone(false);
    setError(null);
    setStats(null);
    setStep(0);
    setActivePresetIdx(pIdx ?? null);
    setIsModified(false);
    setJsonError(null);

    // Scroll smoothly to timeline
    scrollToRef(timelineCardRef);

    const startTime = Date.now();

    // Start MCP tool execution in parallel if not simulating a predefined error
    let fetchPromise: Promise<{ insight: MerchantInsight; _mcp: McpWire } | null> = Promise.resolve(null);
    if (!errorKey) {
      const toolArgs = {
        merchant_id: "merchant_8492",
        category: activePreset.category,
        focus_area: activePreset.focusArea,
        visualization_type: currentVis,
        time_horizon: activePreset.timeHorizon,
        query: currentQuery,
        scenario: currentQuery,
      };

      fetchPromise = fetch("/api/call-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toolArgs),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          console.warn("API call failed, falling back to simulated data:", err);
          return null;
        });
    }

    // Step timeline animation
    [1, 2, 3].forEach((i) => {
      const t = setTimeout(async () => {
        if (failStep === i && errorScenario) {
          setLoading(false);
          setError({ message: errorScenario.message, atStep: i });
          setStep(i);
        } else if (i < 3) {
          setStep(i);
        } else {
          // Final step 3: Adaptive render complete
          const apiResult = await fetchPromise;
          const actualDuration = Date.now() - startTime;

          let finalInsight: MerchantInsight;
          if (apiResult?.insight) {
            finalInsight = apiResult.insight;
            setInsight(apiResult.insight);
            setMcpWire(apiResult._mcp);
          } else {
            // High fidelity fallback matching the preset
            finalInsight = {
              headline: activePreset.label,
              detail: `Analyzed ${activePreset.category} performance across merchant catalog.`,
              metric: {
                label: "Key Impact Gap",
                value: "+18.4%",
                trend: "up",
              },
              chart: [65, 78, 85, 92, 104],
              visualization: {
                type: currentVis !== "auto" ? currentVis : activePreset.visType,
                title: activePreset.label,
                series: [65, 78, 85, 92, 104],
              },
              action: "Review Adjustment",
            };
            setInsight(finalInsight);
          }

          setEditedJson(JSON.stringify(finalInsight, null, 2));
          setLoading(false);
          setDone(true);
          setStep(3);
          setStats(computeStats(pIdx, actualDuration));

          scrollToRef(rendersCardRef);
        }
      }, 430 * i);
      timersRef.current.push(t);
    });
  };

  const handleSelectPreset = (idx: number) => {
    const selected = PRESETS[idx];
    setQuery(selected.query);
    setVisType(selected.visType);
    runExecution({ presetIdx: idx, customQuery: selected.query, overrideVisType: selected.visType });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    runExecution({ customQuery: query.trim() });
  };

  const handleErrorChip = (errorKey: string) => {
    runExecution({ errorKey });
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
      scrollToRef(rendersCardRef);

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

  const activePreset = activePresetIdx !== null ? PRESETS[activePresetIdx] : PRESETS[0];
  const wireToolArgs = {
    merchant_id: "merchant_8492",
    category: activePreset.sub,
    visualization_type: visType,
    query: query,
  };

  const wireResponseObj = error
    ? { jsonrpc: "2.0", id: 1, error: { code: -32000, message: error.message } }
    : insight
    ? {
        jsonrpc: "2.0",
        id: 1,
        result: {
          structuredContent: insight,
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-fg)] font-sans py-14 px-5 pb-24 flex justify-center transition-colors duration-200">
      <div className="max-w-[880px] w-full flex flex-col gap-7">
        {/* ── 1. Header Row ── */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-[var(--brand-border)] font-mono text-[0.68rem] font-semibold uppercase tracking-[0.06em]">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-aqua)] animate-brand-pulse inline-block" />
            Model Context Protocol Demo
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="px-4 py-2 rounded-full border-2 border-[var(--brand-border)] bg-transparent text-[var(--brand-fg)] font-mono text-[0.68rem] font-semibold uppercase tracking-[0.06em] cursor-pointer hover:opacity-80 transition-opacity"
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        {/* ── 2. Title Block ── */}
        <div>
          <h1 className="font-heading font-extrabold text-[clamp(2rem,4vw,2.75rem)] tracking-tight leading-[1.1] m-0">
            One MCP tool call. <span className="text-[#0e84f1]">Two native renders.</span>
          </h1>
          <p className="font-sans text-base text-[var(--brand-text-secondary)] leading-relaxed max-w-[600px] mt-3">
            A single structured JSON payload, rendered natively into two opposing surface designs — plus a live look at the protocol trace, timing, and failure modes underneath.
          </p>
        </div>

        {/* ── 3. Query & Presets Card ── */}
        <div className="bg-[var(--brand-bg)] border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] p-6">
          <div className="font-heading font-extrabold text-[0.95rem] tracking-tight">
            Query &amp; Presets
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 mt-3.5">
            {PRESETS.map((p, i) => {
              const isSelected = activePresetIdx === i;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(i)}
                  style={{
                    backgroundColor: isSelected ? p.accent : "var(--brand-muted-bg)",
                    borderColor: isSelected ? p.accent : "var(--brand-border-subtle)",
                    color: isSelected ? "#ffffff" : "var(--brand-fg)",
                  }}
                  className="rounded-[14px] border-2 p-3 sm:p-3.5 text-left flex flex-col gap-1 cursor-pointer transition-all duration-150"
                >
                  <span className="font-heading font-bold text-[0.85rem] leading-snug">
                    {p.label}
                  </span>
                  <span
                    style={{ color: isSelected ? "rgba(255,255,255,0.85)" : "var(--brand-text-secondary)" }}
                    className="font-mono text-[0.65rem] uppercase tracking-wider"
                  >
                    {p.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-[2px] bg-[var(--brand-border-subtle)] my-5" />

          {/* Widget Override */}
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.06em] text-[var(--brand-text-secondary)]">
            Widget override
          </div>
          <div className="flex gap-2 flex-wrap mb-4.5 mt-2.5">
            {VIS_OPTIONS.map((v) => {
              const isSelected = visType === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => {
                    setVisType(v.value);
                    if (done && activePresetIdx !== null) {
                      runExecution({ overrideVisType: v.value });
                    }
                  }}
                  style={{
                    backgroundColor: isSelected ? "var(--brand-fg)" : "transparent",
                    color: isSelected ? "var(--brand-bg)" : "var(--brand-text-secondary)",
                    borderColor: isSelected ? "var(--brand-fg)" : "var(--brand-border-subtle)",
                  }}
                  className="border-2 rounded-full px-3.5 py-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.04em] cursor-pointer transition-colors"
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Query Form */}
          <form onSubmit={handleSubmit} className="flex gap-2.5 flex-wrap">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActivePresetIdx(null);
              }}
              placeholder="Describe any merchant scenario…"
              className="flex-1 min-w-[260px] px-4 py-3 rounded-full border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-muted-bg)] text-[var(--brand-fg)] font-sans text-[0.85rem] outline-none focus:border-[var(--brand-border)] transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-full border-2 border-[var(--brand-border)] bg-[var(--brand-fg)] text-[var(--brand-bg)] font-mono font-semibold text-[0.75rem] uppercase tracking-[0.05em] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Executing…" : "Execute MCP"}
            </button>
          </form>

          {/* Divider */}
          <div className="h-[2px] bg-[var(--brand-border-subtle)] my-5" />

          {/* Simulate a Failure */}
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.06em] text-[var(--brand-text-secondary)]">
            Simulate a failure
          </div>
          <div className="flex gap-2 flex-wrap mt-2.5">
            {ERROR_SCENARIOS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => handleErrorChip(e.key)}
                className="bg-transparent border-2 border-[var(--brand-pink)] text-[var(--brand-pink)] rounded-full px-3.5 py-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.03em] cursor-pointer hover:bg-[var(--brand-pink)]/10 transition-colors"
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. Protocol Timeline Card ── */}
        {hasRun && (
          <div
            ref={timelineCardRef}
            className="bg-[var(--brand-bg)] border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] p-6 transition-all duration-300"
          >
            <div className="font-heading font-extrabold text-[0.95rem] tracking-tight">
              Protocol Timeline
            </div>

            {/* Timeline Stepper */}
            <div className="flex items-start mt-5.5 overflow-x-auto pb-2">
              {STEP_LABELS.map((label, i) => {
                let status: "pending" | "active" | "done" | "error" = "pending";
                if (error && error.atStep === i) status = "error";
                else if (error && i > error.atStep) status = "pending";
                else if (i < step) status = "done";
                else if (i === step && loading) status = "active";
                else if (i === step && done) status = "done";

                const stepColor = STEP_COLORS[i];

                let mark = String(i + 1);
                let textColor = "var(--brand-text-secondary)";
                let circleBg = "var(--brand-muted-bg)";
                let circleColor = "var(--brand-text-secondary)";
                let circleBorder = "var(--brand-border-subtle)";
                let isPulsing = false;

                if (status === "done") {
                  circleBg = stepColor;
                  circleColor = "#ffffff";
                  circleBorder = stepColor;
                  mark = "✓";
                  textColor = "var(--brand-fg)";
                } else if (status === "active") {
                  circleBg = "var(--brand-bg)";
                  circleColor = stepColor;
                  circleBorder = stepColor;
                  textColor = stepColor;
                  isPulsing = true;
                } else if (status === "error") {
                  circleBg = PINK;
                  circleColor = "#ffffff";
                  circleBorder = PINK;
                  mark = "!";
                  textColor = PINK;
                }

                const lineColor = (i < step || done) ? stepColor : "var(--brand-border-subtle)";

                return (
                  <div key={label} className={`flex items-center ${i < 3 ? "flex-1" : "flex-initial"}`}>
                    <div className="flex flex-col items-center gap-2 min-w-[80px]">
                      <div
                        style={{
                          backgroundColor: circleBg,
                          color: circleColor,
                          borderColor: circleBorder,
                        }}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-semibold text-[0.8rem] shrink-0 ${
                          isPulsing ? "animate-brand-pulse" : ""
                        }`}
                      >
                        {mark}
                      </div>
                      <div
                        style={{ color: textColor }}
                        className="font-mono text-[0.6rem] text-center uppercase tracking-wider max-w-[96px] leading-tight"
                      >
                        {label}
                      </div>
                    </div>

                    {/* Connecting Line */}
                    {i < 3 && (
                      <div
                        style={{ backgroundColor: lineColor }}
                        className="h-[2px] flex-1 min-w-[24px] mx-1 -mt-5 transition-colors duration-300"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error Message Box */}
            {error && (
              <div
                style={{
                  backgroundColor: dark ? "rgba(255,84,112,0.08)" : "#fff1f3",
                  color: dark ? "#ff8fa3" : "#b3123f",
                }}
                className="mt-5.5 p-4 sm:p-4.5 rounded-[14px] border-2 border-[var(--brand-pink)]"
              >
                <div className="font-mono font-semibold text-[0.75rem] uppercase tracking-[0.05em] mb-1.5 text-[var(--brand-pink)]">
                  Execution failed
                </div>
                <div className="text-[0.85rem] leading-relaxed">
                  {error.message}
                </div>
              </div>
            )}

            {/* Success Metrics / Stats */}
            {stats && done && (
              <div className="flex gap-3 mt-5.5 flex-wrap">
                <div className="border-2 border-[var(--brand-border-subtle)] rounded-[14px] p-2.5 sm:p-3 px-4 flex-1 min-w-[140px]">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)]">
                    Latency
                  </div>
                  <div className="font-heading font-extrabold text-[1.15rem] mt-1 text-[var(--brand-fg)]">
                    {stats.latency}ms
                  </div>
                </div>

                <div className="border-2 border-[var(--brand-border-subtle)] rounded-[14px] p-2.5 sm:p-3 px-4 flex-1 min-w-[140px]">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)]">
                    Tokens (in / out)
                  </div>
                  <div className="font-heading font-extrabold text-[1.15rem] mt-1 text-[var(--brand-fg)]">
                    {stats.tokensIn} / {stats.tokensOut}
                  </div>
                </div>

                <div className="border-2 border-[var(--brand-border-subtle)] rounded-[14px] p-2.5 sm:p-3 px-4 flex-1 min-w-[140px]">
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)]">
                    Est. cost
                  </div>
                  <div className="font-heading font-extrabold text-[1.15rem] mt-1 text-[var(--brand-fg)]">
                    ${stats.cost}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 5. Dual Native Surface Renders Card ── */}
        {insight && done && !error && (
          <div
            ref={rendersCardRef}
            className="bg-[var(--brand-bg)] border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] p-6 space-y-4"
          >
            <div>
              <div className="font-heading font-extrabold text-[0.95rem] tracking-tight">
                Dual Native Surface Renders
              </div>
              <p className="text-[0.85rem] text-[var(--brand-text-secondary)] mt-2 mb-4 max-w-[520px]">
                The same JSON, rendered by two intentionally opposite surfaces — an editorial serif dispatch and a constructivist ad unit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Surface A: Editorial Serif */}
              <div className="space-y-2 flex flex-col">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.05em] text-[#0e84f1] font-semibold">
                  Surface A — Editorial
                </span>
                <MerchantCenterCard data={insight} />
              </div>

              {/* Surface B: Constructivist Visual */}
              <div className="space-y-2 flex flex-col">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.05em] text-[#ff9254] font-semibold">
                  Surface B — Constructivist
                </span>
                <AdsBanner data={insight} />
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Bottom Collapsible Panels (Full-header Touch Target) ── */}
        <div className="space-y-4">
          {/* Panel 1: EDIT Payload & Live Re-render */}
          {insight && done && !error && (
            <div
              ref={editPanelRef}
              className="border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] bg-[var(--brand-bg)] overflow-hidden"
            >
              {/* Entire header row is clickable */}
              <button
                type="button"
                onClick={() => {
                  const next = !showEditPanel;
                  setShowEditPanel(next);
                  if (next) scrollToRef(editPanelRef);
                }}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-[var(--brand-bg)] hover:bg-[var(--brand-muted-bg)] transition-colors cursor-pointer border-none"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[0.68rem] font-bold uppercase tracking-wider bg-[#9461fb]/15 text-[#9461fb] border border-[#9461fb]/30">
                    <IconCode className="w-3.5 h-3.5" />
                    EDIT
                  </span>
                  <span className="font-heading font-bold text-sm text-[var(--brand-fg)]">
                    Edit payload &amp; test adaptive visualizers
                  </span>
                  <span className="text-xs text-[var(--brand-text-secondary)] hidden md:inline">
                    — change visualization type or values to see instant multi-surface adaptation
                  </span>
                </div>
                <IconChevronDown
                  className={`w-4 h-4 text-[var(--brand-text-secondary)] transition-transform duration-200 shrink-0 ml-2 ${
                    showEditPanel ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showEditPanel && (
                <div className="p-5 border-t-2 border-[var(--brand-border-subtle)] space-y-3 bg-[var(--brand-muted-bg)]/30">
                  <p className="text-xs text-[var(--brand-text-secondary)]">
                    Try changing <code className="font-mono font-bold">visualization.type</code> to <code className="font-mono">&quot;trend_line&quot;</code>, <code className="font-mono">&quot;bar_comparison&quot;</code>, <code className="font-mono">&quot;progress_gauge&quot;</code>, or <code className="font-mono">&quot;breakdown_distribution&quot;</code> and click <strong>Apply &amp; Re-render</strong>.
                  </p>
                  <textarea
                    value={editedJson}
                    onChange={(e) => {
                      setEditedJson(e.target.value);
                      setJsonError(null);
                    }}
                    rows={14}
                    spellCheck={false}
                    className="w-full font-mono text-xs text-[#6ee7b7] bg-[#0a0a0b] rounded-[10px] p-4 border-2 border-[#000000] leading-relaxed outline-none focus:border-[#9461fb]"
                  />
                  {jsonError && (
                    <p className="text-xs text-[var(--brand-pink)] font-medium flex items-center gap-1.5">
                      <IconAlertCircle className="w-4 h-4 shrink-0" />
                      {jsonError}
                    </p>
                  )}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleApplyEdit}
                      className="px-5 py-2 rounded-full border-2 border-[var(--brand-border)] bg-[#9461fb] text-white font-mono font-semibold text-xs uppercase tracking-wider cursor-pointer hover:opacity-90 shadow-[2px_2px_0_var(--brand-shadow-color)]"
                    >
                      Apply &amp; Re-render
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedJson(JSON.stringify(insight, null, 2));
                        setJsonError(null);
                      }}
                      className="px-4 py-2 rounded-full border-2 border-[var(--brand-border-subtle)] bg-transparent text-[var(--brand-fg)] font-mono text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-[var(--brand-muted-bg)]"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel 2: MCP Wire Protocol */}
          {insight && done && !error && (
            <div
              ref={wirePanelRef}
              className="border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] bg-[var(--brand-bg)] overflow-hidden"
            >
              {/* Entire header row is clickable */}
              <button
                type="button"
                onClick={() => {
                  const next = !showWirePanel;
                  setShowWirePanel(next);
                  if (next) scrollToRef(wirePanelRef);
                }}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-[var(--brand-bg)] hover:bg-[var(--brand-muted-bg)] transition-colors cursor-pointer border-none"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[0.68rem] font-bold uppercase tracking-wider bg-[#ff9254]/15 text-[#ff9254] border border-[#ff9254]/30">
                    <IconTerminal2 className="w-3.5 h-3.5" />
                    MCP
                  </span>
                  <span className="font-heading font-bold text-sm text-[var(--brand-fg)]">
                    View raw MCP wire protocol
                  </span>
                  <span className="text-xs text-[var(--brand-text-secondary)] hidden md:inline">
                    — JSON-RPC 2.0 messages over Streamable HTTP transport
                  </span>
                </div>
                <IconChevronDown
                  className={`w-4 h-4 text-[var(--brand-text-secondary)] transition-transform duration-200 shrink-0 ml-2 ${
                    showWirePanel ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showWirePanel && (
                <div className="p-5 border-t-2 border-[var(--brand-border-subtle)] space-y-4 bg-[var(--brand-muted-bg)]/30">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--brand-text-secondary)]">
                    <span className="px-2.5 py-1 rounded-full border border-[var(--brand-border-subtle)] bg-[var(--brand-bg)]">
                      /api/mcp
                    </span>
                    <span>— Streamable HTTP Transport</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Request */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)] font-semibold block">
                        Client ➔ Server (Request)
                      </span>
                      <pre className="bg-[#0a0a0b] border-2 border-[#000000] rounded-[8px] p-3.5 font-mono text-[0.72rem] leading-relaxed overflow-x-auto m-0 text-[#7dd3fc]">
                        {JSON.stringify(mcpWire?.request ?? wireToolArgs, null, 2)}
                      </pre>
                    </div>

                    {/* Response */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.62rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)] font-semibold">
                          Server ➔ Client (Response)
                        </span>
                        {isModified && (
                          <span className="font-mono text-[0.62rem] px-2 py-0.5 rounded border border-[#9461fb]/40 bg-[#9461fb]/15 text-[#9461fb] uppercase">
                            Live Modified
                          </span>
                        )}
                      </div>
                      <pre className="bg-[#0a0a0b] border-2 border-[#000000] rounded-[8px] p-3.5 font-mono text-[0.72rem] leading-relaxed overflow-x-auto m-0 text-[#6ee7b7]">
                        {JSON.stringify(mcpWire?.response ?? wireResponseObj, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel 3: SPECS Technical Architecture */}
          <div
            ref={archPanelRef}
            className="border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] bg-[var(--brand-bg)] overflow-hidden"
          >
            {/* Entire header row is clickable */}
            <button
              type="button"
              onClick={() => {
                const next = !showArchPanel;
                setShowArchPanel(next);
                if (next) scrollToRef(archPanelRef);
              }}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-[var(--brand-bg)] hover:bg-[var(--brand-muted-bg)] transition-colors cursor-pointer border-none"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[0.68rem] font-bold uppercase tracking-wider bg-[#0e84f1]/15 text-[#0e84f1] border border-[#0e84f1]/30">
                  <IconHierarchy2 className="w-3.5 h-3.5" />
                  SPECS
                </span>
                <span className="font-heading font-bold text-sm text-[var(--brand-fg)]">
                  Technical Architecture &amp; Multi-Surface Flow
                </span>
                <span className="text-xs text-[var(--brand-text-secondary)] hidden md:inline">
                  — polymorphic visual contracts &amp; surface capability resolution
                </span>
              </div>
              <IconChevronDown
                className={`w-4 h-4 text-[var(--brand-text-secondary)] transition-transform duration-200 shrink-0 ml-2 ${
                  showArchPanel ? "rotate-180" : ""
                }`}
              />
            </button>

            {showArchPanel && (
              <div className="p-5 border-t-2 border-[var(--brand-border-subtle)] space-y-4 bg-[var(--brand-muted-bg)]/30">
                {/* Flowchart Diagram */}
                <div className="rounded-[14px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] font-bold text-[var(--brand-text-secondary)] uppercase tracking-wider block">
                      End-to-End Execution Flow
                    </span>
                    <span className="font-mono text-[0.65rem] text-[#0e84f1] font-semibold">
                      1 Polymorphic JSON ➔ 2 Native Surface Projections
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                    {/* Step 1 */}
                    <div className="flex-1 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.62rem] font-bold uppercase text-[var(--brand-aqua)]">Step 1</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-aqua)]" />
                      </div>
                      <span className="font-heading font-bold text-[var(--brand-fg)] text-xs block">User Query &amp; Intent</span>
                      <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                        Natural language scenario with requested visualization type.
                      </p>
                    </div>

                    <div className="flex items-center justify-center text-[var(--brand-text-secondary)] shrink-0 py-0.5 lg:py-0">
                      <IconArrowRight className="w-4 h-4 hidden lg:block text-[var(--brand-aqua)]" />
                      <IconArrowDown className="w-4 h-4 block lg:hidden text-[var(--brand-aqua)]" />
                    </div>

                    {/* Step 2 */}
                    <div className="flex-1 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.62rem] font-bold uppercase text-[#0e84f1]">Step 2</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0e84f1]" />
                      </div>
                      <span className="font-heading font-bold text-[var(--brand-fg)] text-xs block">MCP Tool Call</span>
                      <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                        Client invokes <code className="font-mono">tools/call</code> over Streamable HTTP transport.
                      </p>
                    </div>

                    <div className="flex items-center justify-center text-[var(--brand-text-secondary)] shrink-0 py-0.5 lg:py-0">
                      <IconArrowRight className="w-4 h-4 hidden lg:block text-[#0e84f1]" />
                      <IconArrowDown className="w-4 h-4 block lg:hidden text-[#0e84f1]" />
                    </div>

                    {/* Step 3 */}
                    <div className="flex-1 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.62rem] font-bold uppercase text-[#ff9254]">Step 3</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff9254]" />
                      </div>
                      <span className="font-heading font-bold text-[var(--brand-fg)] text-xs block">Polymorphic Schema</span>
                      <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                        MCP Server synthesizes semantic data (trend, bars, gauge, distribution).
                      </p>
                    </div>

                    <div className="flex items-center justify-center text-[var(--brand-text-secondary)] shrink-0 py-0.5 lg:py-0">
                      <IconArrowRight className="w-4 h-4 hidden lg:block text-[#ff9254]" />
                      <IconArrowDown className="w-4 h-4 block lg:hidden text-[#ff9254]" />
                    </div>

                    {/* Step 4 */}
                    <div className="flex-1 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.62rem] font-bold uppercase text-[#9461fb]">Step 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9461fb]" />
                      </div>
                      <span className="font-heading font-bold text-[var(--brand-fg)] text-xs block">Adaptive Render</span>
                      <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                        Surfaces project data to their local design system or adapt via fallback.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="space-y-1.5 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)]">
                    <span className="font-heading font-bold text-[var(--brand-fg)] flex items-center gap-1.5 text-[0.78rem]">
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-aqua)]" />
                      Polymorphic Data Contracts
                    </span>
                    <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                      MCP tools return structured visualization intent rather than pre-rendered pixels or rigid DOM nodes, enabling true cross-platform presentation agility.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)]">
                    <span className="font-heading font-bold text-[var(--brand-fg)] flex items-center gap-1.5 text-[0.78rem]">
                      <span className="w-2 h-2 rounded-full bg-[#0e84f1]" />
                      Capability &amp; Fallback Resolution
                    </span>
                    <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                      If an edge client or constrained surface lacks support for complex visualizations, it gracefully degrades to native summary representations.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-[12px] border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-bg)]">
                    <span className="font-heading font-bold text-[var(--brand-fg)] flex items-center gap-1.5 text-[0.78rem]">
                      <span className="w-2 h-2 rounded-full bg-[#9461fb]" />
                      Reactive Multi-Surface Sync
                    </span>
                    <p className="text-[0.7rem] text-[var(--brand-text-secondary)] leading-relaxed">
                      Upstream schema mutations or visual type switches instantly update both native rendering pipelines in real-time lockstep.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
