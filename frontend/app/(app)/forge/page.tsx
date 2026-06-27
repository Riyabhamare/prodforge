"use client";
import { useState } from "react";
import { forgeTask } from "@/lib/api";
import { useRouter } from "next/navigation";

interface ForgeResult {
  task_id: string; title: string; risk_level: string; risk_score: number;
  completion_probability: number; rescue_needed: boolean; advice: string;
  subtasks: Array<{ title: string; estimated_minutes: number }>;
  total_estimated_hours: number;
}

export default function ForgePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", deadline_days: 7, description: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForgeResult | null>(null);
  const [error, setError] = useState("");

  const handleForge = async () => {
    if (!form.title.trim()) { setError("Task title is required"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await forgeTask(form);
      setResult(r.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to forge task. Is the backend running?");
    } finally { setLoading(false); }
  };

  const riskColor = (level: string) =>
    level === "critical" ? "#f87171" : level === "high" ? "#facc15" : "#4ade80";

  return (
    <div className="main-content" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>
          ⚡ Forge a Task
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          AI breaks your task into subtasks, calculates risk, and builds a schedule.
        </p>
      </div>

      {/* Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>
              Task Title *
            </label>
            <input
              className="input"
              placeholder="e.g. Build a REST API for user authentication"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>
              Description (optional)
            </label>
            <textarea
              className="input"
              placeholder="Add any extra context for better AI analysis..."
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>
              Deadline: <span style={{ color: "#a78bfa" }}>{form.deadline_days} days</span>
            </label>
            <input
              type="range" min={1} max={90} value={form.deadline_days}
              onChange={e => setForm(f => ({ ...f, deadline_days: Number(e.target.value) }))}
              style={{ width: "100%", accentColor: "#7c3aed" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginTop: 4 }}>
              <span>1 day</span><span>45 days</span><span>90 days</span>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13
            }}>{error}</div>
          )}

          <button
            onClick={handleForge}
            disabled={loading}
            className="btn-primary"
            style={{ justifyContent: "center", padding: "13px", fontSize: 15 }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                AI is analyzing...
              </>
            ) : "⚡ Forge Task with AI"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>
          {/* Summary */}
          <div className="card" style={{ borderColor: result.rescue_needed ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
                  {result.title}
                </h2>
                {result.rescue_needed && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🚨</span>
                    <span style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>Rescue Mode Activated</span>
                  </div>
                )}
              </div>
              <span style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                background: `${riskColor(result.risk_level)}20`,
                color: riskColor(result.risk_level),
                border: `1px solid ${riskColor(result.risk_level)}40`
              }}>
                {result.risk_level.toUpperCase()} RISK
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Risk Score", value: `${Math.round(result.risk_score * 100)}%`, color: riskColor(result.risk_level) },
                { label: "Success Probability", value: `${Math.round(result.completion_probability * 100)}%`, color: result.completion_probability >= 0.6 ? "#4ade80" : "#f87171" },
                { label: "Total Time", value: `${result.total_estimated_hours}h`, color: "#60a5fa" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)",
              borderRadius: 10, padding: "12px 16px"
            }}>
              <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, marginBottom: 4 }}>🤖 AI Advice</div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{result.advice}</p>
            </div>
          </div>

          {/* Subtasks */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>
              📋 AI-Generated Subtasks ({result.subtasks.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.subtasks.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: "rgba(124,58,237,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#a78bfa", fontWeight: 700
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: "#e2e8f0" }}>{s.title}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 999 }}>
                    {s.estimated_minutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/tasks/${result.task_id}`)}
            className="btn-primary"
            style={{ justifyContent: "center", padding: "13px", fontSize: 15 }}
          >
            View Task & Start Working →
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}