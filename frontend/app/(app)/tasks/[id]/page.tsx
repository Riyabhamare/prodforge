"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTask, updateSubtaskStatus, getRescuePlan } from "@/lib/api";
import { formatDeadline } from "@/lib/utils";

interface Subtask { id: string; title: string; estimated_minutes: number; status: string; order_index: number }
interface TaskDetail {
  id: string; title: string; description?: string; deadline?: string;
  status: string; priority: number; risk_score: number;
  completion_probability: number; ai_plan: any; rescue_mode: boolean;
  total_estimated_hours: number; subtasks: Subtask[];
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescue, setRescue] = useState<any>(null);
  const [rescueLoading, setRescueLoading] = useState(false);

  const load = () => {
    getTask(id)
      .then(r => setTask(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const toggleSubtask = async (subtaskId: string, current: string) => {
    const next = current === "done" ? "pending" : "done";
    await updateSubtaskStatus(subtaskId, next);
    load();
  };

  const handleRescue = async () => {
    setRescueLoading(true);
    try {
      const r = await getRescuePlan(id, 24);
      setRescue(r.data);
    } catch (e) { console.error(e); }
    finally { setRescueLoading(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#a78bfa" }}>Loading task...</div>
    </div>
  );
  if (!task) return null;

  const doneCount = task.subtasks.filter(s => s.status === "done").length;
  const progress = task.subtasks.length > 0 ? Math.round((doneCount / task.subtasks.length) * 100) : 0;

  return (
    <div className="main-content" style={{ maxWidth: 860 }}>
      {/* Back */}
      <button onClick={() => router.push("/tasks")} style={{
        background: "none", border: "none", color: "#64748b", cursor: "pointer",
        fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6
      }}>← Back to tasks</button>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 20 }}>
        {task.rescue_mode && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10, padding: "10px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span>🚨</span>
            <span style={{ color: "#f87171", fontSize: 13, fontWeight: 600 }}>
              Rescue Mode Active — This task needs immediate attention
            </span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>{task.title}</h1>
            {task.description && <p style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>{task.description}</p>}
            {task.deadline && (
              <div style={{ fontSize: 13, color: "#a78bfa" }}>📅 {formatDeadline(task.deadline)}</div>
            )}
          </div>

          {/* Risk meter */}
          <div style={{ textAlign: "center", minWidth: 100 }}>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 8px" }}>
              <svg viewBox="0 0 80 80" style={{ width: 80, height: 80 }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={task.risk_score >= 0.7 ? "#ef4444" : task.risk_score >= 0.4 ? "#facc15" : "#4ade80"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - task.risk_score)}`}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#f1f5f9"
              }}>{Math.round(task.risk_score * 100)}%</div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Risk Score</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Completion Prob", value: `${Math.round((task.completion_probability || 0) * 100)}%`, color: task.completion_probability >= 0.6 ? "#4ade80" : "#f87171" },
            { label: "Est. Hours", value: `${task.total_estimated_hours}h`, color: "#60a5fa" },
            { label: "Progress", value: `${progress}%`, color: "#a78bfa" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#64748b" }}>
            <span>{doneCount} of {task.subtasks.length} subtasks done</span>
            <span style={{ color: "#a78bfa" }}>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Subtasks */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>
            📋 Subtasks
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {task.subtasks.map((s, i) => (
              <div
                key={s.id}
                onClick={() => toggleSubtask(s.id, s.status)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  background: s.status === "done" ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${s.status === "done" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)"}`,
                  transition: "all 0.15s"
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${s.status === "done" ? "#4ade80" : "rgba(255,255,255,0.2)"}`,
                  background: s.status === "done" ? "#4ade80" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#0d0d14"
                }}>
                  {s.status === "done" ? "✓" : ""}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, color: s.status === "done" ? "#64748b" : "#e2e8f0",
                    textDecoration: s.status === "done" ? "line-through" : "none",
                    fontWeight: 500
                  }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    ~{s.estimated_minutes} min
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>#{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Plan + Rescue */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Advice */}
          {task.ai_plan?.advice && (
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>
                🤖 AI Advice
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                {task.ai_plan.advice}
              </p>
            </div>
          )}

          {/* Rescue */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>
              🚨 Rescue Mode
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
              Generate an emergency plan if you're falling behind on this task.
            </p>
            {!rescue ? (
              <button
                onClick={handleRescue}
                disabled={rescueLoading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", background: "#b91c1c" }}
              >
                {rescueLoading ? "Generating..." : "🚨 Generate Rescue Plan"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rescue.emergency_schedule?.map((step: any, i: number) => (
                  <div key={i} style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)"
                  }}>
                    <div style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>{step.time_block}</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 2 }}>{step.action}</div>
                  </div>
                ))}
                {rescue.message && (
                  <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>{rescue.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}