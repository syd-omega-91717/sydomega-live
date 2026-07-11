/**
 * Ω SYD OMEGA 91717 — COMPLETE SOVEREIGN PLATFORM
 * Owner: Sleiman Yousef Dagher | sydomega.com
 * Visual: Dark void + Omega Gold + Glassmorphism + Particle fields
 * Pages: Landing · Login · Dashboard · AI Console · Cinema · Gaming · NFT · Heritage · Profile
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  bg:       "#07080F",
  bg2:      "#0D0E1A",
  bg3:      "#111224",
  gold:     "#C9A84C",
  goldBright:"#E2C860",
  goldDim:  "#8B6A2A",
  cyan:     "#00E5FF",
  crimson:  "#8B0000",
  violet:   "#6B21A8",
  white:    "#F5F5F5",
  muted:    "#888",
  border:   "rgba(201,168,76,0.18)",
  glass:    "rgba(201,168,76,0.06)",
  glassMd:  "rgba(201,168,76,0.10)",
};

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Courier+Prime:wght@400;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    :root{color-scheme:dark}
    body{background:${T.bg};color:${T.white};font-family:'Rajdhani',sans-serif;overflow-x:hidden}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:${T.bg2}}
    ::-webkit-scrollbar-thumb{background:${T.goldDim};border-radius:2px}
    ::-webkit-scrollbar-thumb:hover{background:${T.gold}}
    .font-display{font-family:'Cinzel Decorative',serif}
    .font-mono{font-family:'Courier Prime',monospace}
    @keyframes pulse-gold{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
    @keyframes rotate-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-12px)}}
    @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    @keyframes scan{0%{top:-100%}100%{top:100%}}
    @keyframes fade-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes glow-pulse{0%,100%{box-shadow:0 0 10px ${T.gold}44}50%{box-shadow:0 0 30px ${T.gold}88,0 0 60px ${T.gold}33}}
    @keyframes node-pulse{0%,100%{r:3;opacity:0.6}50%{r:5;opacity:1}}
    .animate-float{animation:float 4s ease-in-out infinite}
    .animate-pulse-gold{animation:pulse-gold 2.5s ease-in-out infinite}
    .animate-rotate{animation:rotate-slow 20s linear infinite}
    .animate-glow{animation:glow-pulse 2s ease-in-out infinite}
    .glass{background:${T.glass};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid ${T.border}}
    .glass-md{background:${T.glassMd};backdrop-filter:blur(16px);border:1px solid rgba(201,168,76,0.25)}
    .gold-text{background:linear-gradient(135deg,${T.gold} 0%,${T.goldBright} 50%,${T.gold} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .btn-gold{background:linear-gradient(135deg,${T.goldDim},${T.gold});color:#000;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all 0.3s;border:none}
    .btn-gold:hover{background:linear-gradient(135deg,${T.gold},${T.goldBright});transform:translateY(-2px);box-shadow:0 8px 30px ${T.gold}44}
    .btn-outline{background:transparent;color:${T.gold};border:1px solid ${T.gold};font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;cursor:pointer;transition:all 0.3s}
    .btn-outline:hover{background:${T.glass};box-shadow:0 0 20px ${T.gold}33}
    .nav-link{color:${T.muted};font-family:'Rajdhani',sans-serif;font-weight:500;letter-spacing:1px;cursor:pointer;transition:all 0.2s;text-transform:uppercase;font-size:13px;padding:6px 0;position:relative}
    .nav-link::after{content:'';position:absolute;bottom:0;left:0;width:0;height:1px;background:${T.gold};transition:width 0.3s}
    .nav-link:hover,.nav-link.active{color:${T.gold}}
    .nav-link:hover::after,.nav-link.active::after{width:100%}
    .card-hover{transition:all 0.3s cubic-bezier(0.4,0,0.2,1)}
    .card-hover:hover{transform:translateY(-4px);border-color:rgba(201,168,76,0.5)!important}
    .stat-num{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:-1px}
    input,textarea{background:rgba(255,255,255,0.04);border:1px solid ${T.border};color:${T.white};font-family:'Rajdhani',sans-serif;outline:none;transition:all 0.3s}
    input:focus,textarea:focus{border-color:${T.gold};box-shadow:0 0 0 3px ${T.gold}18}
    input::placeholder,textarea::placeholder{color:${T.muted}}
    .sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;transition:all 0.2s;color:${T.muted};font-size:13px;font-family:'Rajdhani',sans-serif;font-weight:500;letter-spacing:0.5px}
    .sidebar-item:hover{background:${T.glass};color:${T.gold}}
    .sidebar-item.active{background:rgba(201,168,76,0.12);color:${T.gold};border-left:2px solid ${T.gold}}
    .tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px;font-family:'Rajdhani',sans-serif;text-transform:uppercase}
    .scrollable{overflow-y:auto;overflow-x:hidden}
    .scrollable::-webkit-scrollbar{width:3px}
    .scrollable::-webkit-scrollbar-thumb{background:${T.goldDim}}
  `}</style>
);

// ─── PARTICLE CANVAS ────────────────────────────────────────────────────────
function ParticleField({ count = 80 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.6 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.opacity})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((a, i) => particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(201,168,76,${0.08 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [count]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── OMEGA SYMBOL ────────────────────────────────────────────────────────────
function OmegaLogo({ size = 40, animate = false }) {
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      className={animate ? "animate-pulse-gold" : ""}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <radialGradient id="omg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={T.goldBright} />
            <stop offset="100%" stopColor={T.goldDim} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <text x="50" y="72" textAnchor="middle" fill="url(#omg)" filter="url(#glow)"
          style={{ fontSize: 72, fontFamily: "'Cinzel Decorative',serif", fontWeight: 900 }}>Ω</text>
      </svg>
    </div>
  );
}

// ─── MINI SPARKLINE ──────────────────────────────────────────────────────────
function Sparkline({ data, color = T.gold, height = 40 }) {
  const w = 120, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = T.gold, height = 4, label }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      {label && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: T.muted }}>
        <span>{label}</span><span style={{ color: T.gold }}>{value.toLocaleString()}</span>
      </div>}
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: height, height, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${T.goldDim},${color})`, borderRadius: height, transition: "width 1s ease", boxShadow: `0 0 8px ${color}66` }} />
      </div>
    </div>
  );
}

// ─── BADGE / TAG ─────────────────────────────────────────────────────────────
function Badge({ label, color = T.gold, bg }) {
  return (
    <span className="tag" style={{ background: bg || `${color}18`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

// ─── GLASS CARD ──────────────────────────────────────────────────────────────
function Card({ children, style = {}, hover = true, onClick }) {
  return (
    <div className={`glass ${hover ? "card-hover" : ""}`} onClick={onClick}
      style={{ borderRadius: 16, padding: 20, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, delta, color = T.gold, spark }) {
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
          <div className="stat-num" style={{ fontSize: 26, color }}>{value}</div>
          {delta && <div style={{ fontSize: 11, color: delta > 0 ? "#4CAF50" : "#F44336", marginTop: 4 }}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </div>}
        </div>
        <div style={{ fontSize: 22, opacity: 0.8 }}>{icon}</div>
      </div>
      {spark && <Sparkline data={spark} color={color} />}
    </Card>
  );
}

// ─── AGENT CARD ──────────────────────────────────────────────────────────────
const AGENTS = [
  { name: "Sentinel",  role: "Security Operations",      icon: "🛡", color: T.crimson,  status: "active" },
  { name: "Analyst",   role: "Financial Analytics",       icon: "📊", color: "#2196F3",  status: "active" },
  { name: "Historian", role: "Knowledge Graph",           icon: "📚", color: "#9C27B0",  status: "idle"   },
  { name: "Tutor",     role: "Adaptive Learning",         icon: "🎓", color: "#4CAF50",  status: "active" },
  { name: "Merchant",  role: "Commerce Automation",       icon: "💎", color: T.gold,     status: "active" },
  { name: "Proxy",     role: "Workflow Orchestration",    icon: "⚡", color: T.cyan,     status: "idle"   },
  { name: "Oracle",    role: "Prediction Engine",         icon: "🔮", color: "#FF9800",  status: "active" },
  { name: "Scout",     role: "Competitive Benchmarking",  icon: "🔍", color: "#00BCD4",  status: "idle"   },
  { name: "Warden",    role: "Privacy & Safety",          icon: "🔒", color: "#607D8B",  status: "active" },
  { name: "Auditor",   role: "Compliance Audit",          icon: "⚖️", color: "#FF5722",  status: "idle"   },
  { name: "Beacon",    role: "Engagement System",         icon: "📡", color: "#8BC34A",  status: "active" },
  { name: "Sovereign", role: "Executive Operations",      icon: "👑", color: T.goldBright, status: "active" },
];

function AgentRow({ agent, onClick, active }) {
  return (
    <div className="sidebar-item" style={{ borderLeft: active ? `2px solid ${agent.color}` : "2px solid transparent" }} onClick={onClick}>
      <span style={{ fontSize: 16 }}>{agent.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: active ? agent.color : T.white, fontWeight: 600, fontSize: 12 }}>{agent.name}</div>
        <div style={{ color: T.muted, fontSize: 10 }}>{agent.role}</div>
      </div>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: agent.status === "active" ? "#4CAF50" : T.muted, flexShrink: 0 }} />
    </div>
  );
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const NAV_ITEMS = ["Home","Cinema","Games","AI Agents","NFT Hub","News","Community","Dashboard"];

function TopNav({ page, setPage, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: "rgba(7,8,15,0.92)", backdropFilter: "blur(24px)",
      borderBottom: `1px solid ${T.border}`, height: 60, display: "flex", alignItems: "center", padding: "0 24px" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minWidth: 180 }} onClick={() => setPage("home")}>
        <OmegaLogo size={32} />
        <div>
          <div className="font-display gold-text" style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>SYD OMEGA</div>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: 3 }}>91717</div>
        </div>
      </div>
      {/* Desktop Nav */}
      <div style={{ display: "flex", gap: 24, flex: 1, justifyContent: "center" }}>
        {NAV_ITEMS.map(n => (
          <span key={n} className={`nav-link ${page === n.toLowerCase().replace(" ","_") || (page==="home"&&n==="Home") ? "active":""}`}
            onClick={() => setPage(n.toLowerCase().replace(" ","_"))}>
            {n}
          </span>
        ))}
      </div>
      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 180, justifyContent: "flex-end" }}>
        <button style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>🔍</button>
        <button style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: T.crimson, borderRadius: "50%" }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: T.glass, padding: "4px 10px 4px 4px", borderRadius: 24, border: `1px solid ${T.border}` }}
          onClick={() => setPage("profile")}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${T.goldDim},${T.gold})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>S</div>
          <span style={{ fontSize: 12, color: T.white, fontFamily: "Rajdhani" }}>S.Y.D</span>
        </div>
      </div>
    </nav>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, selectedAgent, setSelectedAgent }) {
  const items = [
    { key: "home",      icon: "⌂", label: "Home" },
    { key: "dashboard", icon: "◈", label: "Dashboard" },
    { key: "ai_agents", icon: "⬡", label: "AI Agents" },
    { key: "cinema",    icon: "◉", label: "Cinema" },
    { key: "games",     icon: "◆", label: "Games" },
    { key: "nft_hub",   icon: "◎", label: "NFT Hub" },
    { key: "heritage",  icon: "◇", label: "Heritage" },
    { key: "community", icon: "◈", label: "Community" },
    { key: "profile",   icon: "○", label: "Profile" },
  ];
  return (
    <aside style={{ width: 200, minHeight: "100%", background: T.bg2,
      borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 2, padding: "12px 8px", flexShrink: 0 }}
      className="scrollable">
      <div style={{ padding: "4px 8px 12px", fontSize: 10, color: T.muted, letterSpacing: 2, textTransform: "uppercase" }}>NAVIGATION</div>
      {items.map(it => (
        <div key={it.key} className={`sidebar-item ${page===it.key?"active":""}`} onClick={() => setPage(it.key)}>
          <span style={{ fontSize: 14, fontFamily: "Courier Prime" }}>{it.icon}</span>
          <span>{it.label}</span>
        </div>
      ))}
      <div style={{ height: 1, background: T.border, margin: "12px 8px" }} />
      <div style={{ padding: "4px 8px 8px", fontSize: 10, color: T.muted, letterSpacing: 2, textTransform: "uppercase" }}>AI AGENTS</div>
      {AGENTS.map(a => (
        <AgentRow key={a.name} agent={a} active={selectedAgent?.name===a.name}
          onClick={() => { setSelectedAgent(a); setPage("ai_agents"); }} />
      ))}
      <div style={{ height: 1, background: T.border, margin: "12px 8px" }} />
      <div style={{ padding: "8px 14px 4px" }}>
        <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>View All Agents</div>
        <button className="btn-outline" style={{ width: "100%", padding: "6px 0", borderRadius: 6, fontSize: 11 }}
          onClick={() => setPage("ai_agents")}>ENTER AGENT HUB</button>
      </div>
    </aside>
  );
}

// ─── RIGHT PANEL ─────────────────────────────────────────────────────────────
function RightPanel({ setPage }) {
  const [aiQuery, setAiQuery] = useState("");
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoading] = useState(false);
  const news = [
    { title: "Ω Universe Expanding — New Realm: Elysium", time: "2h", icon: "🌌" },
    { title: "Sovereign AI Update — New Capabilities", time: "5h", icon: "⚡" },
    { title: "Ω Partnership Announced — Strategic Alliance", time: "1d", icon: "🤝" },
    { title: "Omega Con 2025 — Event Details Revealed", time: "2d", icon: "🎬" },
  ];
  const handleAI = async () => {
    if (!aiQuery.trim()) return;
    setLoading(true);
    setAiResp("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 150,
          system: "You are the Sovereign AI of SYD OMEGA 91717, a cinematic intelligence platform. Respond in 1-2 sentences, concisely and with mystique.",
          messages: [{ role: "user", content: aiQuery }]
        })
      });
      const d = await res.json();
      setAiResp(d.content?.[0]?.text || "The Sovereign remains silent…");
    } catch { setAiResp("The Sovereign AI is awakening… Connect your API key to activate."); }
    setLoading(false);
  };
  return (
    <aside style={{ width: 260, minHeight: "100%", background: T.bg2,
      borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}
      className="scrollable">
      {/* User Profile Strip */}
      <div className="glass-md" style={{ margin: 12, borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%",
            background: `linear-gradient(135deg,${T.goldDim},${T.gold})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, border: `2px solid ${T.gold}` }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>S.Y.D</div>
            <div style={{ fontSize: 10, color: T.gold }}>Sovereign Founder</div>
            <Badge label="LEGENDARY" color={T.goldBright} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: T.muted }}>LEVEL 9.9.9</span>
          <span style={{ fontSize: 11, color: T.gold }}>66,770 / 100,000 XP</span>
        </div>
        <ProgressBar value={66770} max={100000} />
      </div>

      {/* Wallet */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>WALLET</div>
        <div className="glass-md" style={{ borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>Ω BALANCE</div>
          <div className="stat-num gold-text" style={{ fontSize: 22 }}>9,171,717 Ω</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>≈ $117.17 USD</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["DEPOSIT","WITHDRAW","TRANSFER"].map(a => (
              <button key={a} className="btn-outline" style={{ flex: 1, padding: "4px 0", borderRadius: 6, fontSize: 9 }}>{a}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>QUICK ACCESS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{icon:"🤖",label:"AI CHAT",sub:"Sovereign AI"},{icon:"💎",label:"NFT HUB",sub:"Collection"},{icon:"🎬",label:"CINEMA",sub:"Omega Films"},{icon:"🎮",label:"GAMES",sub:"Play & Earn"}].map(q => (
            <div key={q.label} className="glass card-hover" style={{ borderRadius: 10, padding: 10, cursor: "pointer" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{q.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>{q.label}</div>
              <div style={{ fontSize: 9, color: T.muted }}>{q.sub}</div>
            </div>
          ))}
        </div>
        <button className="btn-gold" style={{ width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 8, fontSize: 12 }}
          onClick={() => setPage("dashboard")}>SOVEREIGN DASHBOARD</button>
      </div>

      {/* AI Chat mini */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>AI QUICK CHAT</div>
        <div className="glass-md" style={{ borderRadius: 12, padding: 12 }}>
          {aiResp && <div style={{ fontSize: 11, color: T.white, marginBottom: 8, lineHeight: 1.5,
            background: "rgba(201,168,76,0.06)", padding: 8, borderRadius: 8, borderLeft: `2px solid ${T.gold}` }}>{aiResp}</div>}
          <div style={{ display: "flex", gap: 6 }}>
            <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleAI()}
              placeholder="Ask Sovereign AI…"
              style={{ flex: 1, padding: "6px 10px", borderRadius: 6, fontSize: 11 }} />
            <button className="btn-gold" onClick={handleAI} disabled={loading}
              style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11 }}>
              {loading ? "…" : "▶"}
            </button>
          </div>
        </div>
      </div>

      {/* Latest News */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase" }}>LATEST NEWS</div>
          <span style={{ fontSize: 10, color: T.gold, cursor: "pointer" }}>VIEW ALL</span>
        </div>
        {news.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < news.length-1 ? `1px solid ${T.border}` : "none" }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.white, lineHeight: 1.4 }}>{n.title}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{n.time} ago</div>
            </div>
          </div>
        ))}
      </div>

      {/* Ascension Progress */}
      <div style={{ padding: "0 12px 16px" }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>ASCENSION PROGRESS</div>
        <div className="glass-md" style={{ borderRadius: 12, padding: 14 }}>
          <svg width="100%" height="120" viewBox="0 0 200 120">
            <circle cx="100" cy="60" r="50" fill="none" stroke={`${T.gold}22`} strokeWidth="8" />
            <circle cx="100" cy="60" r="50" fill="none" stroke={T.gold} strokeWidth="8"
              strokeDasharray="314" strokeDashoffset="80" strokeLinecap="round"
              transform="rotate(-90 100 60)" />
            <text x="100" y="55" textAnchor="middle" fill={T.gold} fontSize="11" fontFamily="Cinzel Decorative">PHASE 7</text>
            <text x="100" y="70" textAnchor="middle" fill={T.white} fontSize="9" fontFamily="Rajdhani">THE TRANSCENDENT</text>
            <text x="100" y="84" textAnchor="middle" fill={T.goldBright} fontSize="14" fontFamily="Rajdhani" fontWeight="700">77%</text>
          </svg>
          <button className="btn-outline" style={{ width: "100%", padding: "6px 0", borderRadius: 6, fontSize: 10, marginTop: 4 }}>
            VIEW ASCENSION PATH
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
const MOVIES = [
  { num:1, title:"THE ORIGIN",      sub:"The Code Awakens",      year:2026, type:"FILM",     color:"#1a1a2e" },
  { num:2, title:"THE BLOODLINE",   sub:"Rise of the Heirs",     year:2027, type:"FILM",     color:"#16213e" },
  { num:3, title:"THE ASCENSION",   sub:"Path of the Chosen",    year:2028, type:"FILM",     color:"#0f3460" },
  { num:4, title:"THE CIVIL WAR",   sub:"Kingdoms Collide",      year:2029, type:"SERIES",   color:"#1a0a0a" },
  { num:5, title:"THE REVELATION",  sub:"Secrets of Omega",      year:2030, type:"FILM",     color:"#1a1a0a" },
  { num:6, title:"THE REBIRTH",     sub:"Fall of the Old World", year:2031, type:"FILM",     color:"#0a1a0a" },
];

function MovieCard({ movie }) {
  const colors = ["#1a1225","#0d1b2a","#1a0d0d","#0d1a0d","#1a1a0d","#0d0d1a"];
  return (
    <div className="card-hover" style={{ borderRadius: 12, overflow: "hidden", cursor: "pointer",
      border: `1px solid ${T.border}`, background: colors[movie.num-1], flexShrink: 0, width: 160 }}>
      <div style={{ height: 120, position: "relative", background: `linear-gradient(145deg, ${colors[movie.num-1]}, ${T.bg})`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.3,
          background: `radial-gradient(ellipse at center, ${T.gold}33, transparent 70%)` }} />
        <OmegaLogo size={50} />
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <Badge label={movie.type} color={movie.type === "FILM" ? T.gold : T.cyan} />
        </div>
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 2 }}>Ω CHRONICLES</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, fontFamily: "Cinzel Decorative" }}>{movie.title}</div>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{movie.sub}</div>
        <div style={{ fontSize: 10, color: T.white, marginTop: 6, opacity: 0.6 }}>{movie.year}</div>
      </div>
    </div>
  );
}

function HomePage({ setPage }) {
  const stats = [
    { num: "12", label: "AI Agents", icon: "🤖" },
    { num: "9",  label: "Realms",    icon: "🌌" },
    { num: "88+",label: "Assets",    icon: "💎" },
    { num: "∞",  label: "Possibilities", icon: "⚡" },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      {/* Hero */}
      <div style={{ position: "relative", minHeight: 420, display: "flex", alignItems: "center",
        background: `linear-gradient(135deg, ${T.bg} 0%, #1a0d00 50%, ${T.bg} 100%)`,
        overflow: "hidden", borderRadius: 20, marginBottom: 24 }}>
        <ParticleField count={60} />
        <div style={{ position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 60% 50%, ${T.gold}15, transparent 60%)` }} />
        {/* Rotating rings */}
        <div style={{ position: "absolute", right: 80, top: "50%", transform: "translateY(-50%)" }}>
          {[140,110,80].map((r, i) => (
            <div key={r} style={{ position: "absolute", top: "50%", left: "50%",
              width: r*2, height: r*2, borderRadius: "50%",
              border: `1px solid ${T.gold}${["22","33","44"][i]}`,
              transform: "translate(-50%, -50%)",
              animation: `rotate-slow ${[30,20,12][i]}s linear infinite${i%2?" reverse":""}` }} />
          ))}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} className="animate-float">
            <OmegaLogo size={100} animate />
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, padding: "60px 48px", maxWidth: 520 }}>
          <div style={{ fontSize: 11, color: T.gold, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontFamily: "Rajdhani" }}>
            Welcome to the
          </div>
          <h1 className="font-display" style={{ fontSize: 38, lineHeight: 1.1, marginBottom: 16,
            background: `linear-gradient(135deg, ${T.white}, ${T.gold})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            OMEGA<br/>ECOSYSTEM
          </h1>
          <p style={{ color: T.muted, fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            Cinematic Intelligence. Infinite Possibilities.<br/>The Code. The Frequency. The Legacy.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-gold" style={{ padding: "12px 28px", borderRadius: 8, fontSize: 13 }}
              onClick={() => setPage("dashboard")}>ENTER ECOSYSTEM</button>
            <button className="btn-outline" style={{ padding: "12px 28px", borderRadius: 8, fontSize: 13 }}
              onClick={() => setPage("cinema")}>WATCH TRAILER</button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="glass" style={{ flex: 1, padding: "16px 20px", borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div className="stat-num" style={{ fontSize: 28, color: T.gold }}>{s.num}</div>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cinematic Universe */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="font-display" style={{ fontSize: 16, color: T.gold }}>CINEMATIC UNIVERSE</h2>
          <span style={{ fontSize: 11, color: T.gold, cursor: "pointer" }} onClick={() => setPage("cinema")}>EXPLORE ALL →</span>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {MOVIES.map(m => <MovieCard key={m.num} movie={m} />)}
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Ecosystem Overview</div>
          <div style={{ marginBottom: 8 }}><ProgressBar value={1317717} max={2000000} label="USERS" /></div>
          <div style={{ marginBottom: 8 }}><ProgressBar value={197} max={250} label="NATIONS" color={T.cyan} /></div>
          <div><ProgressBar value={988} max={1000} label="TRANSACTIONS (M)" color="#9C27B0" /></div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>AI Insights</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Omega Intelligence Analysis</div>
          <Sparkline data={[40,55,48,62,58,75,70,85,80,95,88,100]} color={T.gold} height={50} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {[["Engagement","98.7%"],["Retention","87.4%"],["Satisfaction","96.2%"]].map(([k,v]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 9, color: T.muted }}>{k}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Real-Time Activity</div>
          {[
            ["0x4A3F…", "minted Ω Genesis NFT", "2m"],
            ["New cinematic asset", "THE FINAL REALM added", "1m"],
            ["0x9B82…", "completed Ω Ascension Challenge", "8m"],
            ["Sovereign AI", "processed 2,717 requests", "10m"],
          ].map(([who, what, t], i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i<3 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.glass,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>Ω</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>{who}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{what}</div>
              </div>
              <div style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>{t}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Top Collections</div>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <OmegaLogo size={48} animate />
            <div className="font-display" style={{ fontSize: 11, color: T.gold, marginTop: 6 }}>Ω GENESIS COLLECTION</div>
            <div style={{ fontSize: 10, color: T.muted }}>Supply 9,171 / 9,999</div>
            <div style={{ fontSize: 16, color: T.goldBright, fontWeight: 700, margin: "6px 0" }}>9,171 Ω</div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 10 }}>Floor Price</div>
            <button className="btn-gold" style={{ width: "100%", padding: "6px 0", borderRadius: 6, fontSize: 11 }}>VIEW COLLECTION</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────
function DashboardPage() {
  const metrics = [
    { icon:"👥", label:"Total Users",     value:"1,317,717", delta:24.8, spark:[60,65,58,72,70,80,75,88,85,95], color:T.gold },
    { icon:"💰", label:"Monthly Revenue", value:"$113,500",  delta:18.3, spark:[40,50,45,60,55,70,65,80,75,90], color:"#4CAF50" },
    { icon:"🤖", label:"AI Executions",   value:"2,717,091", delta:35.2, spark:[30,40,55,50,70,65,80,75,95,88], color:T.cyan },
    { icon:"💎", label:"NFTs Minted",     value:"9,171",     delta:12.5, spark:[10,15,12,20,18,25,22,30,28,35], color:"#9C27B0" },
  ];
  const subscriptions = [
    { tier:"Initiate",  count:4250, price:"$9.17",   color:"#607D8B", pct:42 },
    { tier:"Explorer",  count:2180, price:"$19.17",  color:"#4CAF50", pct:21 },
    { tier:"Seeker",    count:1560, price:"$29.17",  color:"#2196F3", pct:15 },
    { tier:"Warrior",   count:980,  price:"$49.17",  color:"#FF9800", pct:10 },
    { tier:"Champion",  count:520,  price:"$79.17",  color:"#9C27B0", pct:5  },
    { tier:"Sovereign", count:280,  price:"$119.17", color:T.gold,    pct:3  },
    { tier:"Legend",    count:140,  price:"$179.17", color:T.crimson, pct:2  },
    { tier:"Infinity",  count:72,   price:"$259.17", color:T.cyan,    pct:1  },
    { tier:"Nexus",     count:27,   price:"$917.17", color:T.goldBright, pct:0.3 },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold, marginBottom: 4 }}>SOVEREIGN DASHBOARD</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>Master control center — all platform metrics in real time</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {metrics.map(m => <StatCard key={m.label} {...m} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="font-display" style={{ fontSize: 13, color: T.gold }}>REVENUE ANALYTICS</div>
            <Badge label="LIVE" color="#4CAF50" />
          </div>
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[["MRR","$113,500"],["ARR","$1.36M"],["LTV","$420"],["CAC","$28"]].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: T.muted }}>{k}</div>
                <div className="stat-num" style={{ fontSize: 18, color: T.gold }}>{v}</div>
              </div>
            ))}
          </div>
          <Sparkline data={[20,30,25,40,35,50,45,60,55,70,65,80,75,90,85,100]} color={T.gold} height={80} />
        </Card>
        <Card style={{ padding: 24 }}>
          <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 16 }}>SUBSCRIPTION TIERS</div>
          {subscriptions.slice(0,6).map(s => (
            <div key={s.tier} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: T.white }}>{s.tier}</span>
                <span style={{ fontSize: 11, color: T.muted }}>{s.count} users</span>
              </div>
              <ProgressBar value={s.pct} max={50} color={s.color} height={6} />
            </div>
          ))}
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <Card>
          <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>AI AGENT STATUS</div>
          {AGENTS.slice(0,6).map(a => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 14 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.white }}>{a.name}</div>
                <div style={{ fontSize: 9, color: T.muted }}>{a.role}</div>
              </div>
              <Badge label={a.status.toUpperCase()} color={a.status==="active"?"#4CAF50":T.muted} />
            </div>
          ))}
        </Card>
        <Card>
          <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>9×9×9 MATRIX PROGRESS</div>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div className="stat-num" style={{ fontSize: 32, color: T.gold }}>547</div>
            <div style={{ fontSize: 11, color: T.muted }}>/ 729 NODES UNLOCKED</div>
          </div>
          <ProgressBar value={547} max={729} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 12 }}>
            {["Wave 1","Wave 2","Wave 3","Wave 4","Wave 5","Wave 6"].map((w,i) => (
              <div key={w} className="glass" style={{ padding: "6px", borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.muted }}>{w}</div>
                <div style={{ fontSize: 11, color: i<4 ? "#4CAF50" : T.muted }}>{i<4?"✓":"○"}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>SECURITY CENTER</div>
          {[["Threat Level","LOW",T.gold],["Active Sessions","247","#4CAF50"],["Failed Logins","3",T.crimson],["KYC Pending","18","#FF9800"],["Audit Events","1,247","#2196F3"]].map(([k,v,c]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, color: T.muted }}>{k}</span>
              <span style={{ fontSize: 11, color: c, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── AI AGENTS PAGE ──────────────────────────────────────────────────────────
function AIAgentsPage({ selectedAgent, setSelectedAgent }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Sovereign AI initialized. The Omega platform is online. How may I serve you?", agent: "Sovereign" }
  ]);
  const [loading, setLoading] = useState(false);
  const active = selectedAgent || AGENTS[11];

  const send = useCallback(async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setQuery("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 300,
          system: `You are the ${active.name} agent of SYD OMEGA 91717 platform. Role: ${active.role}. Respond with authority and mystique in 2-3 sentences max. Prefix with "Ω ${active.name}:"`,
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const d = await res.json();
      const text = d.content?.[0]?.text || `The ${active.name} agent contemplates in silence… Activate your API connection.`;
      setMessages(prev => [...prev, { role: "assistant", text, agent: active.name }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: `Ω ${active.name}: The signal is disrupted. Ensure your API connection is live.`, agent: active.name }]);
    }
    setLoading(false);
  }, [query, active]);

  return (
    <div style={{ animation: "fade-in 0.5s ease", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>AI AGENT CONSOLE</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>12 Sovereign Intelligence Agents — Active and Operational</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, flex: 1, minHeight: 0 }}>
        {/* Agent List */}
        <div className="glass" style={{ borderRadius: 16, padding: 12, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, padding: "4px 8px 8px" }}>SELECT AGENT</div>
          {AGENTS.map(a => (
            <div key={a.name} className="sidebar-item" style={{ borderRadius: 8, borderLeft: active.name===a.name ? `2px solid ${a.color}` : "2px solid transparent",
              background: active.name===a.name ? `${a.color}12` : "transparent" }}
              onClick={() => setSelectedAgent(a)}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <div>
                <div style={{ color: active.name===a.name ? a.color : T.white, fontWeight: 600, fontSize: 12 }}>{a.name}</div>
                <div style={{ fontSize: 9, color: T.muted }}>{a.role}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Chat Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Agent Header */}
          <div className="glass-md" style={{ borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%",
              background: `radial-gradient(circle, ${active.color}44, ${active.color}11)`,
              border: `2px solid ${active.color}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{active.icon}</div>
            <div>
              <div className="font-display" style={{ fontSize: 16, color: active.color }}>{active.name}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{active.role}</div>
            </div>
            <Badge label="ACTIVE" color="#4CAF50" style={{ marginLeft: "auto" }} />
          </div>
          {/* Messages */}
          <div className="glass scrollable" style={{ flex: 1, borderRadius: 16, padding: 16, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16,
                flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: m.role==="user" ? T.glass : `${active.color}22`,
                  border: `1px solid ${m.role==="user" ? T.border : active.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {m.role==="user" ? "S" : active.icon}
                </div>
                <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                  background: m.role==="user" ? T.glass : `${active.color}0d`,
                  border: `1px solid ${m.role==="user" ? T.border : `${active.color}33`}`,
                  fontSize: 13, lineHeight: 1.6, color: m.role==="user" ? T.white : T.white }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${active.color}22`,
                  border: `1px solid ${active.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{active.icon}</div>
                <div style={{ padding: "10px 14px", borderRadius: 12, background: `${active.color}0d`,
                  border: `1px solid ${active.color}33`, fontSize: 13, color: T.muted }}>
                  {active.name} is processing…
                </div>
              </div>
            )}
          </div>
          {/* Input */}
          <div style={{ display: "flex", gap: 10 }}>
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
              placeholder={`Send a message to ${active.name}…`}
              style={{ flex: 1, padding: "12px 16px", borderRadius: 10, fontSize: 13 }} />
            <button className="btn-gold" onClick={send} disabled={loading}
              style={{ padding: "12px 20px", borderRadius: 10, fontSize: 13 }}>
              {loading ? "…" : "SEND ▶"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CINEMA PAGE ─────────────────────────────────────────────────────────────
function CinemaPage() {
  const allMovies = [
    { num:1, title:"THE ORIGIN",       sub:"The Code Awakens",       year:2026, type:"FILM",     phase:1 },
    { num:2, title:"THE BLOODLINE",    sub:"Rise of the Heirs",      year:2027, type:"FILM",     phase:1 },
    { num:3, title:"THE ASCENSION",    sub:"Path of the Chosen",     year:2028, type:"FILM",     phase:1 },
    { num:4, title:"THE CIVIL WAR",    sub:"Kingdoms Collide",       year:2029, type:"FILM",     phase:2 },
    { num:5, title:"THE REVELATION",   sub:"Secrets of Omega",       year:2030, type:"SERIES",   phase:2 },
    { num:6, title:"THE REBIRTH",      sub:"Fall of the Old World",  year:2031, type:"FILM",     phase:2 },
    { num:7, title:"THE CONVERGENCE",  sub:"Realms Unite",           year:2032, type:"FILM",     phase:3 },
    { num:8, title:"THE ETERNITY CODE",sub:"Beyond Time",            year:2033, type:"SERIES",   phase:3 },
    { num:9, title:"THE NEW DAWN",     sub:"Legacy Continues",       year:2034, type:"FILM",     phase:3 },
  ];
  const phases = [
    { num:1, name:"GENESIS ERA",    years:"2026–2028", films:3, color:T.gold },
    { num:2, name:"ISOLATION SAGA", years:"2029–2031", films:3, color:T.cyan },
    { num:3, name:"CONVERGENCE",    years:"2032–2034", films:3, color:"#9C27B0" },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>Ω CINEMATIC UNIVERSE</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>9 Saga Films across 3 phases — 2026 to 2034</p>
      </div>
      {phases.map(ph => (
        <div key={ph.num} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%",
              background: `${ph.color}22`, border: `2px solid ${ph.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Cinzel Decorative", fontSize: 14, color: ph.color }}>{ph.num}</div>
            <div>
              <div className="font-display" style={{ fontSize: 14, color: ph.color }}>PHASE {ph.num}: {ph.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{ph.years} · {ph.films} Productions</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {allMovies.filter(m => m.phase===ph.num).map(m => (
              <div key={m.num} className="glass card-hover" style={{ borderRadius: 16, overflow: "hidden" }}>
                <div style={{ height: 180, background: `linear-gradient(145deg, #0d0520, #1a0d00)`,
                  display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse at center, ${ph.color}18, transparent 70%)` }} />
                  <OmegaLogo size={70} />
                  <div style={{ position: "absolute", top: 10, left: 10 }}>
                    <Badge label={`FILM ${m.num}`} color={ph.color} />
                  </div>
                  <div style={{ position: "absolute", bottom: 10, right: 10 }}>
                    <Badge label={m.type} color={m.type==="FILM" ? T.gold : T.cyan} />
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 8, color: T.muted, letterSpacing: 2, marginBottom: 4 }}>Ω CHRONICLES</div>
                  <div className="font-display" style={{ fontSize: 13, color: ph.color, marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{m.sub}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: T.white }}>{m.year}</span>
                    <button className="btn-outline" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10 }}>DETAILS</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── GAMING PAGE ─────────────────────────────────────────────────────────────
function GamingPage() {
  const games = [
    { id:1, name:"Ω Myth-Verse",  genre:"RPG / Open World",          element:"🌊", stage:7, xp:12500, players:"24K", color:"#1565C0" },
    { id:2, name:"Ω Warriors",    genre:"Action / Adventure",         element:"🔥", stage:5, xp:9800,  players:"18K", color:T.crimson },
    { id:3, name:"Ω Legacy",      genre:"Strategy / Empire",          element:"🌿", stage:3, xp:7200,  players:"12K", color:"#2E7D32" },
    { id:4, name:"Ω Arena",       genre:"Competitive / PvP",          element:"⚡", stage:9, xp:22000, players:"41K", color:T.gold },
    { id:5, name:"Ω Frontier",    genre:"Space Exploration",          element:"🌌", stage:4, xp:8400,  players:"9K",  color:"#6A1B9A" },
    { id:6, name:"Ω Shadows",     genre:"Stealth / Assassin",         element:"🌑", stage:6, xp:11200, players:"15K", color:"#37474F" },
    { id:7, name:"Ω Rebirth",     genre:"Survival / Post-Apocalyptic",element:"💧", stage:2, xp:4600,  players:"7K",  color:"#00695C" },
    { id:8, name:"Ω Ascension",   genre:"MMORPG",                     element:"🏔", stage:8, xp:18700, players:"33K", color:"#E65100" },
    { id:9, name:"Ω City",        genre:"Sim / City Builder",         element:"🏙", stage:1, xp:2100,  players:"5K",  color:"#455A64" },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>GAMING UNIVERSE</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>9 Games × 9 Stages × Ascension Engine — Play & Earn Ω</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {games.map(g => (
          <div key={g.id} className="glass card-hover" style={{ borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 120, background: `linear-gradient(135deg, ${g.color}44, ${T.bg})`,
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 50%, ${g.color}33, transparent 60%)` }} />
              <div style={{ position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 36 }}>{g.element}</div>
                <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1 }}>STAGE {g.stage}/9</div>
              </div>
              <div style={{ position: "absolute", bottom: 8, right: 8 }}>
                <Badge label={`${g.players} PLAYERS`} color={g.color} />
              </div>
            </div>
            <div style={{ padding: "12px 14px 14px" }}>
              <div className="font-display" style={{ fontSize: 12, color: g.color, marginBottom: 2 }}>{g.name}</div>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 8 }}>{g.genre}</div>
              <ProgressBar value={g.stage} max={9} color={g.color} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: T.gold }}>⚡ {g.xp.toLocaleString()} XP</span>
                <button className="btn-gold" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10 }}>PLAY</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 14 }}>ASCENSION LEADERBOARD</div>
          {[
            { rank:1, name:"SovereignX",   xp:"147,500", tier:"NEXUS",    icon:"👑" },
            { rank:2, name:"OmegaLord",    xp:"132,800", tier:"INFINITY", icon:"⚡" },
            { rank:3, name:"CipherKnight", xp:"118,200", tier:"LEGEND",   icon:"🔮" },
            { rank:4, name:"OriginSeeker", xp:"96,400",  tier:"SOVEREIGN",icon:"🌌" },
            { rank:5, name:"GlyphMaster",  xp:"84,700",  tier:"CHAMPION", icon:"💎" },
          ].map(p => (
            <div key={p.rank} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
              borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%",
                background: p.rank<=3 ? `${T.gold}33` : T.glass, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: p.rank<=3 ? T.gold : T.muted, fontWeight: 700 }}>{p.rank}</div>
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.white }}>{p.name}</div>
                <div style={{ fontSize: 9, color: T.muted }}>{p.xp} XP</div>
              </div>
              <Badge label={p.tier} color={p.rank<=3 ? T.gold : T.muted} />
            </div>
          ))}
        </Card>
        <Card>
          <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 14 }}>YOUR PROGRESS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[["Level","77"],["XP","66,770"],["Quests","142"],["NFTs Earned","23"]].map(([k,v]) => (
              <div key={k} className="glass" style={{ padding: "10px 12px", borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: T.muted }}>{k}</div>
                <div className="stat-num" style={{ fontSize: 18, color: T.gold }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="font-display" style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>RECENT ACHIEVEMENTS</div>
          {[
            { icon:"🏆", title:"Master of Myth-Verse",  tier:"GOLD",   xp:"+500 XP" },
            { icon:"🥇", title:"Arena Champion",        tier:"OMEGA",  xp:"+1000 XP" },
            { icon:"🎖", title:"NFT Collector — Level 3",tier:"SILVER", xp:"+250 XP" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.white }}>{a.title}</div>
                <Badge label={a.tier} color={a.tier==="OMEGA"?T.goldBright:a.tier==="GOLD"?T.gold:T.muted} />
              </div>
              <span style={{ fontSize: 11, color: "#4CAF50" }}>{a.xp}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── NFT PAGE ────────────────────────────────────────────────────────────────
function NFTPage() {
  const collections = [
    { name:"Ω Genesis",    supply:"9,999", minted:"9,171", floor:"9,171 Ω", type:"Founders",    color:T.gold },
    { name:"Ω Heroes",     supply:"4,500", minted:"2,847", floor:"2,500 Ω", type:"Characters",  color:T.cyan },
    { name:"Ω Relics",     supply:"7,777", minted:"5,120", floor:"777 Ω",   type:"Items",       color:"#9C27B0" },
    { name:"Ω Lands",      supply:"3,333", minted:"1,891", floor:"5,000 Ω", type:"Virtual RE",  color:"#4CAF50" },
    { name:"Ω Legacy",     supply:"999",   minted:"614",   floor:"12,000 Ω",type:"Limited Ed.", color:T.crimson },
    { name:"Ω Arcane Keys",supply:"1,717", minted:"917",   floor:"3,500 Ω", type:"Access Pass", color:"#FF9800" },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>NFT HUB</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>Blockchain: Polygon PoS · ERC-721/1155 · MetaMask Integration</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {collections.map(c => (
          <Card key={c.name} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 140, background: `linear-gradient(135deg, ${c.color}22, ${T.bg})`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0,
                background: `radial-gradient(circle at center, ${c.color}22, transparent 70%)` }} />
              <OmegaLogo size={60} />
              <Badge label={c.type} color={c.color} style={{ marginTop: 8 }} />
            </div>
            <div style={{ padding: 16 }}>
              <div className="font-display" style={{ fontSize: 13, color: c.color, marginBottom: 6 }}>{c.name}</div>
              <div style={{ marginBottom: 10 }}>
                <ProgressBar value={parseInt(c.minted.replace(",",""))} max={parseInt(c.supply.replace(",",""))} color={c.color} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: T.muted }}>Minted: {c.minted}</span>
                  <span style={{ fontSize: 10, color: T.muted }}>Supply: {c.supply}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted }}>FLOOR PRICE</div>
                  <div style={{ fontSize: 14, color: c.color, fontWeight: 700 }}>{c.floor}</div>
                </div>
                <button className="btn-gold" style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11 }}>MINT</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── HERITAGE PAGE ───────────────────────────────────────────────────────────
function HeritagePage() {
  const nodes = [
    { name:"Sleiman Dagher",   rel:"Self",      gen:0, x:50,  y:10, active:true },
    { name:"Yousef Dagher",    rel:"Father",    gen:1, x:25,  y:35 },
    { name:"Nadia Dagher",     rel:"Mother",    gen:1, x:75,  y:35 },
    { name:"George Dagher",    rel:"Grandfather",gen:2, x:10, y:60 },
    { name:"Maria Dagher",     rel:"Grandmother",gen:2, x:40, y:60 },
    { name:"Elias Khoury",     rel:"Grandfather",gen:2, x:60, y:60 },
    { name:"Sara Khoury",      rel:"Grandmother",gen:2, x:90, y:60 },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>FAMILY HERITAGE</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>Dagher Lineage Archive · Lebanese Order of Engineers No. 30875</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>LINEAGE OVERVIEW</div>
            {[
              ["Family Name", "Dagher (دغر)"],
              ["Origin", "Lebanon"],
              ["Heritage", "Lebanese / Phoenician"],
              ["Documented Nodes", "47 Family Members"],
              ["Archives", "3 Generations Mapped"],
              ["Certifications", "Engineer No. 30875"],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.muted }}>{k}</span>
                <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>LEGACY MILESTONES</div>
            {[
              { year:"2024", event:"SYD OMEGA 91717 Founded", icon:"⭐" },
              { year:"2023", event:"Lebanese Engineer No. 30875", icon:"🏛" },
              { year:"2020", event:"Digital Architecture Era Begins", icon:"💻" },
              { year:"2015", event:"Consultancy Practice Established", icon:"📐" },
              { year:"1991", event:"Origin: 9.17Hz Frequency Born", icon:"🌟" },
            ].map((m,i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: T.gold }}>{m.year}</div>
                  <div style={{ fontSize: 11, color: T.white }}>{m.event}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Card>
          <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 12 }}>FAMILY TREE VISUALIZATION</div>
          <div style={{ position: "relative", height: 340, background: T.glass, borderRadius: 12, overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet">
              {/* Connecting lines */}
              <line x1="50" y1="15" x2="25" y2="35" stroke={`${T.gold}44`} strokeWidth="0.5" />
              <line x1="50" y1="15" x2="75" y2="35" stroke={`${T.gold}44`} strokeWidth="0.5" />
              <line x1="25" y1="40" x2="10" y2="60" stroke={`${T.gold}33`} strokeWidth="0.4" />
              <line x1="25" y1="40" x2="40" y2="60" stroke={`${T.gold}33`} strokeWidth="0.4" />
              <line x1="75" y1="40" x2="60" y2="60" stroke={`${T.gold}33`} strokeWidth="0.4" />
              <line x1="75" y1="40" x2="90" y2="60" stroke={`${T.gold}33`} strokeWidth="0.4" />
              {nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={`${parseInt(n.y)+5}`} r={n.active ? 5 : 3.5}
                    fill={n.active ? T.gold : T.glass} stroke={n.active ? T.goldBright : T.border} strokeWidth="0.5"
                    style={{ filter: n.active ? `drop-shadow(0 0 3px ${T.gold})` : "none" }} />
                  <text x={n.x} y={`${parseInt(n.y)+13}`} textAnchor="middle"
                    fontSize={n.active ? "2.8" : "2.2"} fill={n.active ? T.goldBright : T.muted}
                    fontFamily="Rajdhani">{n.name.split(" ")[0]}</text>
                  <text x={n.x} y={`${parseInt(n.y)+16}`} textAnchor="middle"
                    fontSize="1.8" fill={T.muted} fontFamily="Rajdhani">{n.rel}</text>
                </g>
              ))}
            </svg>
            {/* Generation Labels */}
            {[["Gen 0 — Self","10%"],["Gen 1 — Parents","35%"],["Gen 2 — Grandparents","62%"]].map(([label,top]) => (
              <div key={label} style={{ position: "absolute", left: 8, top, fontSize: 9, color: `${T.gold}88`, letterSpacing: 1 }}>{label}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-gold" style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 11 }}>ADD FAMILY MEMBER</button>
            <button className="btn-outline" style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 11 }}>EXPORT ARCHIVE</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
function ProfilePage() {
  const creds = [
    { icon:"🏛", title:"Digital Passport",    id:"Ω-SYD-91717-PRIME",  status:"VERIFIED" },
    { icon:"⚙",  title:"Engineer Certificate", id:"LEB-ENG-30875",       status:"ACTIVE"   },
    { icon:"💎", title:"Omega Identity Card",  id:"OIC-9.9.9-SOVEREIGN", status:"ACTIVE"   },
    { icon:"🔐", title:"KYC Verification",     id:"KYC-LEVEL-3",         status:"APPROVED" },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>SOVEREIGN PROFILE</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ textAlign: "center", padding: 28 }}>
            <div className="animate-glow" style={{ width: 80, height: 80, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.goldDim},${T.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, margin: "0 auto 16px", border: `3px solid ${T.gold}` }}>S</div>
            <div className="font-display" style={{ fontSize: 16, color: T.gold }}>Sleiman Yousef Dagher</div>
            <div style={{ fontSize: 12, color: T.muted, margin: "6px 0 10px" }}>Founder & Sovereign Architect</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              <Badge label="NEXUS" color={T.goldBright} />
              <Badge label="LEVEL 9.9.9" color={T.gold} />
              <Badge label="OWNER" color={T.crimson} />
            </div>
          </Card>
          <Card>
            {[["Member Since","May 2024"],["Location","Lebanon / Global"],["Engineer","Order No. 30875"],["Platform Role","Sovereign Owner"],["Domain","sydomega.com"]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.muted }}>{k}</span>
                <span style={{ fontSize: 11, color: T.gold }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[["9,171,717 Ω","Omega Balance"],["66,770","XP Earned"],["729/729","Matrix Nodes"],["27","NFTs Owned"],["142","Quests Done"],["15 YRS","Platform Age"]].map(([v,l]) => (
              <div key={l} className="glass" style={{ padding: "14px 16px", borderRadius: 12, textAlign: "center" }}>
                <div className="stat-num" style={{ fontSize: 18, color: T.gold }}>{v}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 14 }}>CREDENTIALS & IDENTITY</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {creds.map(c => (
                <div key={c.id} className="glass" style={{ padding: 14, borderRadius: 10 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{c.title}</div>
                      <div className="font-mono" style={{ fontSize: 9, color: T.muted }}>{c.id}</div>
                    </div>
                  </div>
                  <Badge label={c.status} color="#4CAF50" />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="font-display" style={{ fontSize: 13, color: T.gold, marginBottom: 14 }}>XP & PROGRESSION</div>
            <ProgressBar value={66770} max={100000} label="Level 77 → 78" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
              {[["Platform","9.9.9","SOVEREIGN"],["Gaming","77","CHAMPION"],["Academy","512/729","ADVANCED"],["Heritage","Gen 3","MAPPED"],["NFT","27 Assets","COLLECTOR"],["AI","12 Agents","CONNECTED"]].map(([k,v,t]) => (
                <div key={k} className="glass" style={{ padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: T.muted, marginBottom: 2, textTransform: "uppercase" }}>{k}</div>
                  <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 9, color: T.muted }}>{t}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── NEWS PAGE ────────────────────────────────────────────────────────────────
function NewsPage() {
  const articles = [
    { cat:"UNIVERSE",  title:"New Realm Discovered: Elysium — The Eternal Plane",    time:"2 hours ago",  img:"🌌", featured:true },
    { cat:"AI",        title:"Sovereign AI v3.0 Update — 12 Agents Now Fully Online", time:"5 hours ago",  img:"🤖" },
    { cat:"GAMING",    title:"Ω Arena Season 7 Begins — Prize Pool 91,717 Ω",        time:"1 day ago",    img:"🎮" },
    { cat:"NFT",       title:"Ω Genesis Collection Sold Out — Floor at 9,171 Ω",     time:"2 days ago",   img:"💎" },
    { cat:"CINEMA",    title:"Movie 1 'The Origin' — Official Teaser Released",       time:"3 days ago",   img:"🎬" },
    { cat:"PLATFORM",  title:"SYD OMEGA 91717 Reaches 1.3M Registered Users",        time:"4 days ago",   img:"⚡" },
    { cat:"HERITAGE",  title:"New Family Tree Module — Multi-Generational Archive",   time:"5 days ago",   img:"🏛" },
    { cat:"FINANCE",   title:"Ω Economy Report Q2 2025 — $113K Monthly Revenue",     time:"1 week ago",   img:"📊" },
  ];
  const catColors = { UNIVERSE:"#9C27B0", AI:T.cyan, GAMING:T.gold, NFT:"#FF9800", CINEMA:"#E91E63", PLATFORM:"#4CAF50", HERITAGE:"#795548", FINANCE:"#2196F3" };
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>NEWS INTELLIGENCE</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>AI-aggregated platform intelligence · Real-time updates</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div>
          {articles.filter(a => a.featured).map((a, i) => (
            <Card key={i} style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ height: 140, background: `linear-gradient(135deg, #1a0d2e, ${T.bg})`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48,
                position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, #9C27B044, transparent 70%)` }} />
                <span style={{ position: "relative" }}>{a.img}</span>
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <Badge label="FEATURED" color={T.goldBright} />
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <Badge label={a.cat} color={catColors[a.cat] || T.gold} />
                <div style={{ fontSize: 16, color: T.white, fontWeight: 700, margin: "8px 0 6px", lineHeight: 1.4 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{a.time}</div>
              </div>
            </Card>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {articles.slice(1, 5).map((a, i) => (
              <Card key={i} style={{ padding: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{a.img}</div>
                <Badge label={a.cat} color={catColors[a.cat] || T.gold} />
                <div style={{ fontSize: 12, color: T.white, fontWeight: 600, margin: "6px 0 4px", lineHeight: 1.4 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{a.time}</div>
              </Card>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>TRENDING</div>
            {["#OmegaGenesis","#SovereignAI","#ElysiumRealm","#OmegaArena","#91717"].map((tag, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}`,
                display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.cyan }}>{tag}</span>
                <span style={{ fontSize: 10, color: T.muted }}>{[847,612,449,380,290][i]}K</span>
              </div>
            ))}
          </Card>
          <Card>
            <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>LATEST UPDATES</div>
            {articles.slice(4).map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 18 }}>{a.img}</span>
                <div>
                  <Badge label={a.cat} color={catColors[a.cat] || T.gold} />
                  <div style={{ fontSize: 11, color: T.white, marginTop: 3, lineHeight: 1.3 }}>{a.title.substring(0,50)}…</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── COMMUNITY PAGE ──────────────────────────────────────────────────────────
function CommunityPage() {
  const posts = [
    { user:"OmegaLord",   time:"2m", text:"Just completed Wave 5 of the matrix — 547 nodes unlocked! The Sovereign platform is incredible. 🔥", likes:47, replies:12, tier:"NEXUS" },
    { user:"CipherKnight",time:"15m",text:"Movie 1 'The Origin' teaser gave me chills. The cinematic universe is going to be legendary. #OmegaUniverse",likes:89, replies:28, tier:"INFINITY" },
    { user:"SovereignX",  time:"1h", text:"Ω Arena Season 7 — I'm in. Anyone challenging me for the top spot is welcome to try.",likes:124,replies:41, tier:"NEXUS" },
    { user:"GlyphMaster", time:"3h", text:"The AI agent 'Oracle' just predicted my next 3 investment moves with 91% accuracy. Mind blown.", likes:66, replies:19, tier:"LEGEND" },
  ];
  return (
    <div style={{ animation: "fade-in 0.5s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 20, color: T.gold }}>COMMUNITY</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>The Omega collective — 1.3M sovereign minds connected</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div>
          {posts.map((post, i) => (
            <Card key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%",
                  background: `linear-gradient(135deg,${T.goldDim},${T.gold})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {post.user[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{post.user}</span>
                    <Badge label={post.tier} color={T.gold} />
                    <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}>{post.time} ago</span>
                  </div>
                  <p style={{ fontSize: 13, color: T.white, lineHeight: 1.6, marginBottom: 10 }}>{post.text}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    {[["❤️", post.likes],["💬", post.replies],["🔄","Share"],["🔖","Save"]].map(([icon, val]) => (
                      <button key={icon} style={{ background: "none", border: "none", color: T.muted,
                        cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{icon}</span><span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>TOP MEMBERS</div>
            {[["SovereignX","147,500 XP","NEXUS"],["OmegaLord","132,800 XP","NEXUS"],["CipherKnight","118,200 XP","INFINITY"]].map(([n,xp,t],i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%",
                  background: `linear-gradient(135deg,${T.goldDim},${T.gold})`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{n[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{n}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{xp}</div>
                </div>
                <Badge label={t} color={T.gold} />
              </div>
            ))}
          </Card>
          <Card>
            <div className="font-display" style={{ fontSize: 12, color: T.gold, marginBottom: 12 }}>LIVE EVENTS</div>
            {[["🎮","Arena Season 7 Live","NOW"],["🎬","Origin Teaser Drop","2h"],["🏆","Matrix Challenge","Tomorrow"]].map(([i,t,time]) => (
              <div key={t} style={{ display: "flex", gap: 8, padding: "6px 0" }}>
                <span style={{ fontSize: 18 }}>{i}</span>
                <div>
                  <div style={{ fontSize: 11, color: T.white }}>{t}</div>
                  <div style={{ fontSize: 10, color: time==="NOW"?"#4CAF50":T.muted }}>{time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[11]);

  const renderPage = () => {
    switch (page) {
      case "home":       return <HomePage setPage={setPage} />;
      case "dashboard":  return <DashboardPage />;
      case "ai_agents":  return <AIAgentsPage selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />;
      case "cinema":     return <CinemaPage />;
      case "games":      return <GamingPage />;
      case "nft_hub":    return <NFTPage />;
      case "heritage":   return <HeritagePage />;
      case "community":  return <CommunityPage />;
      case "news":       return <NewsPage />;
      case "profile":    return <ProfilePage />;
      default:           return <HomePage setPage={setPage} />;
    }
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: "100vh", background: T.bg }}>
        <TopNav page={page} setPage={setPage} />
        <div style={{ display: "flex", paddingTop: 60, minHeight: "calc(100vh - 60px)" }}>
          <Sidebar page={page} setPage={setPage} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />
          {/* Main Content */}
          <main style={{ flex: 1, padding: "28px 24px", overflowY: "auto", minWidth: 0 }} className="scrollable">
            {renderPage()}
          </main>
          <RightPanel setPage={setPage} />
        </div>
      </div>
    </>
  );
}
