"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogle } from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        // 1. Get user profile from Google
        const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        // 2. Send to your backend
        const res = await loginWithGoogle({
          google_id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        });

        // 3. Save and redirect
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        router.push("/dashboard");
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.message || "Unknown error";
        setError(`Login failed: ${msg}`);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

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
            Sign in with your Google account to continue.
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              color: "#f87171", fontSize: 13
            }}>{error}</div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 20px", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff", color: "#1f1f1f",
              border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600, opacity: loading ? 0.7 : 1,
            }}
          >
            {/* Google logo SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          <p style={{ textAlign: "center", color: "#475569", fontSize: 12, marginTop: 16 }}>
            Your data stays private · Secured with Google OAuth
          </p>
        </div>
      </div>
    </div>
  );
}