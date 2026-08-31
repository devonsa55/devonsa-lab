"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { MerchantInsight, VisualizationType } from "@/types/insight";
import { MerchantCenterCard } from "@/components/MerchantCenterCard";
import { AdsBanner } from "@/components/AdsBanner";

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
  const [showWire, setShowWire] = useState(false);

  // Real MCP Data
  const [insight, setInsight] = useState<MerchantInsight | null>(null);
  const [mcpWire, setMcpWire] = useState<McpWire | null>(null);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const timelineCardRef = useRef<HTMLDivElement>(null);
  const rendersCardRef = useRef<HTMLDivElement>(null);

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
    setShowWire(false);

    // Scroll smoothly to timeline
    setTimeout(() => {
      if (timelineCardRef.current) {
        const top = window.pageYOffset + timelineCardRef.current.getBoundingClientRect().top - 28;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    }, 100);

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

          if (apiResult?.insight) {
            setInsight(apiResult.insight);
            setMcpWire(apiResult._mcp);
          } else {
            // High fidelity fallback matching the preset
            const fallbackInsight: MerchantInsight = {
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
            setInsight(fallbackInsight);
          }

          setLoading(false);
          setDone(true);
          setStep(3);
          setStats(computeStats(pIdx, actualDuration));

          setTimeout(() => {
            if (rendersCardRef.current) {
              const top = window.pageYOffset + rendersCardRef.current.getBoundingClientRect().top - 28;
              window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
            }
          }, 150);
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

  // Wire Protocol content
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

        {/* ── 6. Raw MCP Wire Protocol Card ── */}
        {insight && done && !error && (
          <div className="bg-[var(--brand-bg)] border-2 border-[var(--brand-border)] rounded-[20px] shadow-[4px_4px_0_var(--brand-shadow-color)] p-6">
            <button
              type="button"
              onClick={() => setShowWire(!showWire)}
              className="w-full flex justify-between items-center bg-transparent border-none p-0 cursor-pointer font-mono text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-[var(--brand-fg)]"
            >
              <span>Raw MCP wire protocol</span>
              <span>{showWire ? "−" : "+"}</span>
            </button>

            {showWire && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                <div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)] mb-1.5">
                    Client → Server
                  </div>
                  <pre className="bg-[#0a0a0b] border-2 border-[#000000] rounded-[8px] p-3.5 font-mono text-[0.72rem] leading-relaxed overflow-x-auto m-0 text-[#7dd3fc]">
                    {JSON.stringify(mcpWire?.request ?? wireToolArgs, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.05em] text-[var(--brand-text-secondary)] mb-1.5">
                    Server → Client
                  </div>
                  <pre className="bg-[#0a0a0b] border-2 border-[#000000] rounded-[8px] p-3.5 font-mono text-[0.72rem] leading-relaxed overflow-x-auto m-0 text-[#6ee7b7]">
                    {JSON.stringify(mcpWire?.response ?? wireResponseObj, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
