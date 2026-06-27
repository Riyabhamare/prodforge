"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { demoLogin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await demoLogin();
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err?.response?.data?.detail || err?.message || "Unknown error";
      setError(`Backend error: ${msg}. API: ${process.env.NEXT_PUBLIC_API_URL || "NOT SET"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden"
    }}>
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "rgba(124,58,237,0.2)",
            border: "1px solid rgba(139,92,246,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 16px"
          }}>⚡</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
            ProdForge
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, marginTop: 6 }}>
            AI-powered productivity execution engine
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          {["⚡ AI Task Breakdown", "🛡 Risk Detection", "📈 Smart Scheduling", "🚨 Rescue Mode"].map(f => (
            <span key={f} style={{
              padding: "6px 14px", borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              fontSize: 13, color: "#94a3b8"
            }}>{f}</span>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "#13131f",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20, padding: 32
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
            Get started free
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
            Try with a demo account — no sign-up needed.
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              color: "#f87171", fontSize: 13
            }}>{error}</div>
          )}

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 15 }}
          >
            <span>⚡</span>
            {loading ? "Connecting..." : "Launch Demo →"}
          </button>

          <p style={{ textAlign: "center", color: "#475569", fontSize: 12, marginTop: 16 }}>
            Google OAuth coming soon · Data stays local
          </p>
        </div>
      </div>
    </div>
  );
}