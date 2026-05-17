import React, { useState, useMemo } from "react";
import { LoginPage as LoginForm } from "@/components/auth/login-page";
import { ForgotPassword } from "@/components/auth/forgot-password";

/* ── Bean data hook ──────────────────────────────────────────────────── */
type BeanData = { id: number; left: number; size: number; opacity: number; duration: number; delay: number; drift: number };

function useBeans(count: number): BeanData[] {
  return useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n: number) => { const x = Math.sin((i + 1) * (n + 9.13)) * 10000; return x - Math.floor(x); };
    return { id: i, left: 3 + r(2) * 94, size: 11 + r(3) * 15, opacity: 0.07 + r(4) * 0.18, duration: 15 + r(5) * 12, delay: -r(6) * 22, drift: (r(7) - 0.5) * 90 };
  }), [count]);
}

/* ── Steam wisp ──────────────────────────────────────────────────────── */
function Steam({ left, delay }: { left: string; delay: number }) {
  return (
    <div style={{ position: "absolute", left, bottom: "100%", opacity: 0, animation: `steamRise ${2.8 + delay * 0.25}s ease-out ${delay * 0.55}s infinite` }}>
      <svg width="12" height="40" viewBox="0 0 12 40" fill="none">
        <path d="M6 38C10 28 2 16 6 6C10-2 6-6 6-10" stroke="rgba(245,230,211,0.38)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Coffee cup artwork ──────────────────────────────────────────────── */
function CoffeeCup() {
  return (
    <div style={{ position: "relative", width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,83,0.18) 0%, rgba(192,152,145,0.08) 55%, transparent 75%)", animation: "glowPulse 4s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "57%", left: "50%", transform: "translateX(-50%)", width: 70, height: 50 }}>
        <Steam left="15%" delay={0} />
        <Steam left="48%" delay={1.2} />
        <Steam left="80%" delay={2.4} />
      </div>
      <svg viewBox="0 0 200 200" width={210} height={210} fill="none">
        <ellipse cx="100" cy="168" rx="68" ry="10" fill="rgba(192,152,145,0.12)" />
        <ellipse cx="100" cy="163" rx="64" ry="8" fill="rgba(30,8,2,0.85)" stroke="rgba(192,152,145,0.28)" strokeWidth="1.5" />
        <path d="M44 90 L54 158 Q54 165 62 165 L138 165 Q146 165 146 158 L156 90 Z" fill="rgba(22,6,1,0.92)" stroke="rgba(192,152,145,0.22)" strokeWidth="1.5" />
        <path d="M52 110 L57 150 Q57 156 63 156 L79 156" stroke="rgba(192,152,145,0.09)" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="100" cy="90" rx="56" ry="10" fill="rgba(55,28,12,0.95)" />
        <path d="M83 88 Q100 82 117 88" stroke="rgba(245,230,211,0.22)" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="100" cy="89" rx="16" ry="5" fill="rgba(245,230,211,0.09)" />
        <ellipse cx="100" cy="90" rx="56" ry="10" fill="none" stroke="rgba(192,152,145,0.38)" strokeWidth="1.5" />
        <path d="M154 102 Q182 102 182 126 Q182 150 154 150" stroke="rgba(192,152,145,0.32)" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M154 102 Q175 102 175 126 Q175 150 154 150" stroke="rgba(22,6,1,0.80)" strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/* ── Feature badge ───────────────────────────────────────────────────── */
function Badge({ emoji, label, delay }: { emoji: string; label: string; delay: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "rgba(42,8,0,0.55)", border: "1px solid rgba(192,152,145,0.18)", color: "rgba(245,230,211,0.78)", fontSize: 12, fontWeight: 500, backdropFilter: "blur(8px)", animation: `fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) ${delay} both` }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>{label}
    </div>
  );
}

/* ── Left hero panel ─────────────────────────────────────────────────── */
function LeftPanel() {
  const beans = useBeans(18);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(150deg, #0A0100 0%, #1A0600 30%, #2A0E04 65%, #3D1A08 100%)" }}>
      {/* Ambient bloom */}
      <div style={{ position: "absolute", top: "-8%", right: "-5%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Noise */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      {/* Floating beans */}
      {beans.map(b => (
        <div key={b.id} style={{ position: "absolute", left: `${b.left}%`, bottom: "-5%", width: b.size, height: b.size * 1.4, opacity: b.opacity, animation: `beanFloat ${b.duration}s linear ${b.delay}s infinite`, "--bean-drift": `${b.drift}px`, pointerEvents: "none" } as React.CSSProperties}>
          <svg viewBox="0 0 100 140" width="100%" height="100%" fill="none">
            <ellipse cx="50" cy="70" rx="38" ry="55" fill="#C09891" />
            <path d="M44 18C34 50 66 90 56 122" stroke="#775144" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </div>
      ))}
      {/* Right border glow */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, transparent, rgba(192,152,145,0.22) 30%, rgba(212,168,83,0.10) 65%, transparent)", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 44px", textAlign: "center", position: "relative", zIndex: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase", color: "#C09891", animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
          Coffee Time Admin
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "clamp(2.6rem, 4vw, 3.6rem)", fontWeight: 700, color: "#F5E6D3", lineHeight: 1.05, letterSpacing: "-0.02em", marginTop: 16, textShadow: "0 4px 30px rgba(0,0,0,0.5)", animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
          Brew the<br /><span style={{ color: "#D4A853" }}>perfect</span><br />experience.
        </h1>
        <div style={{ marginTop: 28, animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.35s both" }}>
          <CoffeeCup />
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(245,230,211,0.52)", maxWidth: 270, marginTop: 8, animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s both" }}>
          Your complete Coffee Time management hub.<br />Orders, analytics &amp; team — one place.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24, justifyContent: "center" }}>
          <Badge emoji="⚡" label="Live Orders" delay="0.55s" />
          <Badge emoji="📊" label="Analytics" delay="0.65s" />
          <Badge emoji="👥" label="Staff Mgmt" delay="0.75s" />
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(10,1,0,0.55), transparent)", pointerEvents: "none" }} />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const [view, setView] = useState<"login" | "forgot">("login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", overflow: "hidden", background: "#0A0100" }}>
      {/* Left panel — hidden on small screens */}
      <div className="hidden lg:flex" style={{ width: "55%", flexShrink: 0 }}>
        <LeftPanel />
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: "linear-gradient(160deg, rgba(42,14,8,0.30) 0%, rgba(10,1,0,0.96) 100%)", position: "relative" }}>
        {/* Noise overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.025, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480 }}>
          {view === "login"
            ? <LoginForm onForgotPassword={() => setView("forgot")} />
            : <ForgotPassword onBackToLogin={() => setView("login")} />
          }
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
