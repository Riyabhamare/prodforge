"use client";
import { useEffect, useState } from "react";
import { getDashboard, getWeekly } from "@/lib/api";
import { formatDeadline } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Link from "next/link";

interface DashboardData {
  user: { name: string; email: string; productivity_score: number };
  stats: { total_tasks: number; completed: number; missed: number; pending: number; in_progress: number; completion_rate: number };
  high_risk_tasks: Array<{ id: string; title: string; risk_score: number; deadline: string; completion_probability: number }>;
  upcoming_deadlines: Array<{ id: string; title: string; deadline: string; status: string; risk_score: number }>;
  habits: Array<{ id: string; name: string; streak: number }>;
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 0.7) return <span className="badge badge-red">Critical</span>;
  if (score >= 0.4) return <span className="badge badge-yellow">High</span>;
  return <span className="badge badge-green">Low</span>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getWeekly()])
      .then(([d, w]) => { setData(d.data); setWeekly(w.data.weekly); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#a78bfa", fontSize: 16 }}>Loading dashboard...</div>
    </div>
  );
  if (!data) return null;
  const { user, stats, high_risk_tasks, upcoming_deadlines, habits } = data;

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>
            Good day, {user.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Here's your productivity overview</p>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "conic-gradient(#7c3aed " + (stats.completion_rate * 3.6) + "deg, rgba(255,255,255,0.08) 0deg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative"
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "#13131f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#a78bfa"
            }}>{stats.completion_rate}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Score</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{user.productivity_score}</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Completed", value: stats.completed, color: "#4ade80", bg: "rgba(34,197,94,0.1)", icon: "✓" },
          { label: "In Progress", value: stats.in_progress, color: "#60a5fa", bg: "rgba(59,130,246,0.1)", icon: "⟳" },
          { label: "Pending", value: stats.pending, color: "#facc15", bg: "rgba(234,179,8,0.1)", icon: "◷" },
          { label: "Missed", value: stats.missed, color: "#f87171", bg: "rgba(239,68,68,0.1)", icon: "✕" },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="stat-card">
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color, marginBottom: 12
            }}>{icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Weekly Chart */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Weekly Activity</h2>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#64748b" }}>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#7c3aed", marginRight: 5 }} />Completed</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#ef4444", marginRight: 5 }} />Missed</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekly} barGap={4}>
              <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1e1e30", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="completed" name="Completed" radius={[5, 5, 0, 0]}>
                {weekly.map((_, i) => <Cell key={i} fill="#7c3aed" />)}
              </Bar>
              <Bar dataKey="missed" name="Missed" radius={[5, 5, 0, 0]}>
                {weekly.map((_, i) => <Cell key={i} fill="#ef4444" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High Risk */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>High Risk Tasks</h2>
          </div>
          {high_risk_tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#475569", fontSize: 14 }}>
              No high risk tasks 🎉
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {high_risk_tasks.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.deadline ? formatDeadline(t.deadline) : "No deadline"}</div>
                  </div>
                  <RiskBadge score={t.risk_score} />
                </div>
              ))}
            </div>
          )}
          <Link href="/forge" style={{ display: "block", textAlign: "center", marginTop: 16, fontSize: 13, color: "#7c3aed", textDecoration: "none" }}>
            + Forge new task
          </Link>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Upcoming Deadlines (7 days)</h2>
        </div>
        {upcoming_deadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#475569", fontSize: 14 }}>
            No deadlines this week 🎯
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {upcoming_deadlines.map(t => (
              <div key={t.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: 14
              }}>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#7c3aed" }}>{formatDeadline(t.deadline)}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4, textTransform: "capitalize" }}>{t.status.replace("_", " ")}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Habits */}
      {habits.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span>🔥</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Habit Streaks</h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {habits.map(h => (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 999, padding: "8px 16px"
              }}>
                <span style={{ fontSize: 13, color: "#e2e8f0" }}>{h.name}</span>
                <span style={{ fontSize: 13, color: "#fb923c", fontWeight: 700 }}>{h.streak} 🔥</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}