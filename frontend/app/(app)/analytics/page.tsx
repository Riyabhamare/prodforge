"use client";
import { useEffect, useState } from "react";
import { getDashboard, getWeekly } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, PieChart, Pie, Legend
} from "recharts";

export default function AnalyticsPage() {
  const [dash, setDash] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getWeekly()])
      .then(([d, w]) => { setDash(d.data); setWeekly(w.data.weekly); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#a78bfa" }}>Loading analytics...</div>
    </div>
  );
  if (!dash) return null;

  const { stats } = dash;
  const pieData = [
    { name: "Completed", value: stats.completed, color: "#4ade80" },
    { name: "In Progress", value: stats.in_progress, color: "#60a5fa" },
    { name: "Pending", value: stats.pending, color: "#facc15" },
    { name: "Missed", value: stats.missed, color: "#f87171" },
  ].filter(d => d.value > 0);

  return (
    <div className="main-content">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>Analytics</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Your productivity at a glance</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Tasks", value: stats.total_tasks, color: "#a78bfa" },
          { label: "Completion Rate", value: `${stats.completion_rate}%`, color: "#4ade80" },
          { label: "Missed Rate", value: `${stats.total_tasks > 0 ? Math.round((stats.missed / stats.total_tasks) * 100) : 0}%`, color: "#f87171" },
          { label: "Productivity Score", value: dash.user.productivity_score, color: "#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Weekly bar chart */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>
            Weekly Performance
          </h2>
          <ResponsiveContainer width="100%" height={200}>
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

        {/* Pie chart */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>
            Task Distribution
          </h2>
          {pieData.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 14 }}>
              No tasks yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>} />
                <Tooltip contentStyle={{ background: "#1e1e30", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Productivity trend */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>
          Daily Productivity Score
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weekly}>
            <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#1e1e30", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
            <Line type="monotone" dataKey="score" name="Score" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: "#7c3aed", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#a78bfa" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}