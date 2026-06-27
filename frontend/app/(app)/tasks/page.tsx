"use client";
import { useEffect, useState } from "react";
import { getTasks, updateTaskStatus, deleteTask } from "@/lib/api";
import { formatDeadline } from "@/lib/utils";
import Link from "next/link";

interface Task {
  id: string; title: string; description?: string;
  deadline?: string; status: string; priority: number;
  risk_score: number; completion_probability: number;
  rescue_mode: boolean; total_subtasks: number;
  completed_subtasks: number; progress_percent: number;
  created_at: string;
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 0.7) return <span className="badge badge-red">Critical</span>;
  if (score >= 0.4) return <span className="badge badge-yellow">High</span>;
  return <span className="badge badge-green">Low</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-yellow", in_progress: "badge-blue",
    done: "badge-green", missed: "badge-red"
  };
  return <span className={`badge ${map[status] || "badge-purple"}`}>{status.replace("_", " ")}</span>;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    getTasks()
      .then(r => setTasks(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: string) => {
    await updateTaskStatus(id, status);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(id);
    load();
  };

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#a78bfa" }}>Loading tasks...</div>
    </div>
  );

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>My Tasks</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{tasks.length} tasks total</p>
        </div>
        <Link href="/forge" className="btn-primary">⚡ Forge New Task</Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "#13131f", borderRadius: 12, padding: 6, width: "fit-content", border: "1px solid rgba(255,255,255,0.07)" }}>
        {["all", "pending", "in_progress", "done", "missed"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, transition: "all 0.15s",
              background: filter === s ? "#7c3aed" : "transparent",
              color: filter === s ? "white" : "#64748b"
            }}
          >
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0",
          background: "#13131f", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: "#64748b", fontSize: 15 }}>No tasks here yet.</div>
          <Link href="/forge" style={{ display: "inline-block", marginTop: 16, color: "#7c3aed", fontSize: 14 }}>
            + Forge your first task
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(task => (
            <div key={task.id} className="card" style={{ position: "relative" }}>
              {task.rescue_mode && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: "linear-gradient(90deg, #ef4444, #f97316)",
                  borderRadius: "16px 16px 0 0"
                }} />
              )}

              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Left */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <Link href={`/tasks/${task.id}`} style={{ textDecoration: "none" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", cursor: "pointer" }}>
                        {task.title}
                      </h3>
                    </Link>
                    <StatusBadge status={task.status} />
                    <RiskBadge score={task.risk_score} />
                    {task.rescue_mode && <span className="badge badge-red">🚨 Rescue</span>}
                  </div>

                  {task.deadline && (
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                      📅 {formatDeadline(task.deadline)}
                    </div>
                  )}

                  {/* Progress bar */}
                  {task.total_subtasks > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {task.completed_subtasks}/{task.total_subtasks} subtasks
                        </span>
                        <span style={{ fontSize: 12, color: "#a78bfa" }}>{task.progress_percent}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${task.progress_percent}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Completion prob */}
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Completion probability:{" "}
                    <span style={{ color: task.completion_probability >= 0.6 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                      {Math.round((task.completion_probability || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Right — actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130 }}>
                  <Link href={`/tasks/${task.id}`} style={{
                    padding: "7px 14px", borderRadius: 8, textAlign: "center",
                    background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
                    color: "#a78bfa", fontSize: 13, fontWeight: 500, textDecoration: "none"
                  }}>View Details</Link>

                  {task.status !== "done" && (
                    <button onClick={() => handleStatus(task.id, "done")} style={{
                      padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(74,222,128,0.25)",
                      background: "rgba(34,197,94,0.08)", color: "#4ade80",
                      fontSize: 13, fontWeight: 500, cursor: "pointer"
                    }}>✓ Mark Done</button>
                  )}

                  {task.status === "pending" && (
                    <button onClick={() => handleStatus(task.id, "in_progress")} style={{
                      padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(96,165,250,0.25)",
                      background: "rgba(59,130,246,0.08)", color: "#60a5fa",
                      fontSize: 13, fontWeight: 500, cursor: "pointer"
                    }}>▶ Start</button>
                  )}

                  <button onClick={() => handleDelete(task.id)} style={{
                    padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)",
                    background: "transparent", color: "#f87171",
                    fontSize: 13, fontWeight: 500, cursor: "pointer"
                  }}>✕ Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}