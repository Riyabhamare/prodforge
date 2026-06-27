"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { href: "/dashboard", icon: "⊞", label: "Dashboard" },
  { href: "/tasks", icon: "☰", label: "My Tasks" },
  { href: "/forge", icon: "⚡", label: "Forge Task" },
  { href: "/analytics", icon: "▦", label: "Analytics" },
  { href: "/coach", icon: "◎", label: "AI Coach" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 28px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(124,58,237,0.25)",
          border: "1px solid rgba(139,92,246,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16
        }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#e2e8f0", letterSpacing: "-0.3px" }}>
          ProdForge
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname === href ? "active" : ""}`}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, marginTop: 16 }}>
        <button
          onClick={() => { localStorage.clear(); router.push("/"); }}
          className="nav-item"
          style={{ width: "100%", background: "none", border: "none", color: "#64748b" }}
        >
          <span style={{ fontSize: 15 }}>→</span>
          Logout
        </button>
      </div>
    </aside>
  );
}