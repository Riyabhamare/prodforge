"use client";
import { useEffect, useState } from "react";
import { getInsight } from "@/lib/api";

interface Insight {
  greeting: string; performance_summary: string;
  key_insight: string; action_items: string[];
  motivation: string; warning?: string;
}

export default function CoachPage() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const r = await getInsight();
      setInsight(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#a78bfa" }}>Your AI Coach is thinking...</div>
    </div>
  );

  return (
    <div className="main-content" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>AI Coach</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Personalized insights powered by Gemini</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-primary"
          style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          {refreshing ? "⟳ Refreshing..." : "⟳ New Insight"}
        </button>
      </div>

      {insight && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Greeting */}
          <div className="card" style={{ borderColor: "rgba(139,92,246,0.25)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "rgba(124,58,237,0.2)", border: "1px solid rgba(139,92,246,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0
              }}>🤖</div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
                  {insight.greeting}
                </h2>
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
                  {insight.performance_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          {insight.warning && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 14, padding: "16px 20px",
              display: "flex", gap: 12, alignItems: "flex-start"
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>Warning</div>
                <p style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.6 }}>{insight.warning}</p>
              </div>
            </div>
          )}

          {/* Key Insight */}
          <div className="card">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>Key Insight</div>
                <p style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.7 }}>{insight.key_insight}</p>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Action Items</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insight.action_items?.map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)"
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#a78bfa", fontWeight: 700, flexShrink: 0
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.1))",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 14, padding: "20px 24px"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 8 }}>✨ Daily Motivation</div>
            <p style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.7, fontStyle: "italic" }}>
              "{insight.motivation}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}