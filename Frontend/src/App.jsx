import { useState, useRef, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CLASS_CONFIG = {
  Anxiety:     { color: "#FBBF24", bg: "rgba(251,191,36,0.1)",   icon: "⚡", desc: "Anxiety Disorder" },
  Depression:  { color: "#818CF8", bg: "rgba(129,140,248,0.1)",  icon: "🌧", desc: "Depression" },
  Normal:      { color: "#34D399", bg: "rgba(52,211,153,0.1)",   icon: "✦",  desc: "Normal" },
  Bipolar:     { color: "#F472B6", bg: "rgba(244,114,182,0.1)",  icon: "◎",  desc: "Bipolar Disorder" },
  Personality: { color: "#A78BFA", bg: "rgba(167,139,250,0.1)",  icon: "◈",  desc: "Personality Disorder" },
  Stress:      { color: "#FB7185", bg: "rgba(251,113,133,0.1)",  icon: "▲",  desc: "Stress" },
  Suicidal:    { color: "#FB923C", bg: "rgba(251,146,60,0.1)",   icon: "⊗",  desc: "Suicidal Ideation" },
};

const cfg = (label) =>
  CLASS_CONFIG[label] ?? { color: "#94A3B8", bg: "rgba(148,163,184,0.1)", icon: "◇", desc: label };

const SAMPLES = [
  { text: "I haven't slept in three days, my mind just won't quiet down and I keep worrying.", label: "Anxiety" },
  { text: "Everything feels pointless and empty. I don't see any reason to keep going anymore.", label: "Depression" },
  { text: "Today was a great day! I went for a walk and genuinely felt happy and motivated.", label: "Normal" },
  { text: "I feel so much energy, I barely need sleep and my thoughts are racing with big ideas.", label: "Bipolar" },
  { text: "I can't stop thinking about ending it all. I don't want to be here anymore.", label: "Suicidal" },
];

// ── Radial confidence chart ───────────────────────────────────────────────────
function ConfidenceArc({ value, color }) {
  const r = 42, cx = 55, cy = 55;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${circ * value} ${circ}`}
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 0.9s cubic-bezier(.4,1,.2,1)" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white"
        style={{ fontSize: "17px", fontWeight: 700, fontFamily: "monospace" }}>
        {Math.round(value * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)"
        style={{ fontSize: "9px", fontFamily: "monospace" }}>
        CONFIDENCE
      </text>
    </svg>
  );
}

// ── Probability bar row ───────────────────────────────────────────────────────
function ProbRow({ label, probability, isTop }) {
  const { color, icon } = cfg(label);
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: isTop ? color : "#64748B", fontWeight: isTop ? 600 : 400, display: "flex", alignItems: "center", gap: "5px" }}>
          {isTop && <span style={{ fontSize: "10px" }}>{icon}</span>}
          {label}
        </span>
        <span style={{ fontSize: "11px", fontFamily: "monospace", color: isTop ? color : "#475569" }}>
          {(probability * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${probability * 100}%`,
          background: isTop ? color : "rgba(255,255,255,0.08)",
          borderRadius: "99px",
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────
function Result({ data }) {
  const { label, confidence, probabilities, latency_ms } = data;
  const { color, bg, icon, desc } = cfg(label);
  return (
    <div style={{
      background: "rgba(15,20,35,0.9)", border: `1px solid ${color}25`,
      borderRadius: "20px", padding: "30px",
      boxShadow: `0 0 60px ${color}10, 0 20px 40px rgba(0,0,0,0.4)`,
      animation: "fadeUp 0.5s cubic-bezier(.2,1,.2,1)",
      width: "100%", maxWidth: "800px", margin: "0 auto",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "30px", alignItems: "start" }}>
        <div style={{ textAlign: "center" }}>
           <ConfidenceArc value={confidence} color={color} />
        </div>
        
        <div>
          <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
            Classification Result
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color, display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <span>{icon}</span>{label}
          </div>
          <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "16px" }}>{desc}</div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: bg, border: `1px solid ${color}20`, borderRadius: "99px", padding: "5px 14px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ fontSize: "12px", color, fontWeight: 600 }}>{(confidence * 100).toFixed(1)}% confidence</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "99px", padding: "5px 14px" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Latency: {latency_ms}ms</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "24px", paddingTop: "20px" }}>
        <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>
          Probability Breakdown
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0 40px" }}>
          {probabilities.map((p, i) => (
            <ProbRow key={p.label} label={p.label} probability={p.probability} isTop={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Loader ────────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "40px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "10px", height: "10px", borderRadius: "50%", background: "#6366F1",
          animation: `bounce 1.1s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function App() {
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);
  const [history, setHist]  = useState([]);
  const ref = useRef(null);

  const analyse = useCallback(async (input = text) => {
    if (!input.trim() || loading) return;
    setLoad(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? `HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      setHist(h => [{ text: input, result: data, id: Date.now() }, ...h.slice(0, 5)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  }, [text, loading]);

  const useSample = useCallback((s) => {
    setText(s.text);
    setTimeout(() => analyse(s.text), 50);
  }, [analyse]);

  const clear = () => { setText(""); setResult(null); setError(null); ref.current?.focus(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07090F; color: #CBD5E1; font-family: 'Inter', sans-serif; min-height: 100vh; overflow-x: hidden; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        @keyframes bounce   { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-12px); } }
        @keyframes glow     { 0%,100% { opacity:.3; } 50% { opacity:1; } }
        textarea { resize: vertical; transition: border-color 0.3s, background 0.3s; }
        textarea:focus { outline: none; background: rgba(255,255,255,0.05) !important; border-color: rgba(99,102,241,0.5) !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
        button { font-family: inherit; cursor: pointer; transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        button:hover { transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>

      {/* Background decoration */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-10%", left:"-10%", width:"50%", height:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-10%", width:"50%", height:"50%", background:"radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position:"relative", zIndex:1, maxWidth:"1100px", margin:"0 auto", padding:"60px 24px 100px" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={{ textAlign:"center", marginBottom:"60px", animation: "fadeUp 0.6s ease" }}>
          <h1 style={{ fontFamily:"'Syne', sans-serif", fontSize:"clamp(40px,7vw,64px)", fontWeight:800, lineHeight:1, marginBottom:"20px", letterSpacing: "-1px" }}>
            Sentiment{" "}
            <span style={{ background:"linear-gradient(135deg,#6366F1,#A78BFA,#F472B6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Analysis
            </span>
          </h1>
          <p style={{ color:"#475569", maxWidth:"500px", margin:"0 auto", fontSize:"16px", lineHeight:1.6, fontWeight: 400 }}>
             An intelligent mental health diagnostics portal powered by a fine-tuned RandomForest architecture.
          </p>
        </header>

        {/* ── Main Input Card ─────────────────────────────────────────────── */}
        <main style={{ maxWidth: "800px", margin: "0 auto", animation: "fadeUp 0.7s ease" }}>
          <div style={{ 
            background:"rgba(15,20,35,0.7)", border:"1px solid rgba(255,255,255,0.08)", 
            borderRadius:"24px", padding:"30px", backdropFilter:"blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
          }}>
            <div style={{ fontSize:"11px", color:"#334155", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"14px", fontWeight: 600 }}>
              Input Statement
            </div>
            <textarea
              ref={ref}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyse(); }}
              placeholder="How are you feeling today? Describe your emotional state…"
              rows={6}
              maxLength={5000}
              style={{
                width:"100%", background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px",
                color:"#F1F5F9", fontSize:"16px", lineHeight:1.6, padding:"20px",
                fontFamily:"'Inter', sans-serif"
              }}
            />
            
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"20px" }}>
              <span style={{ fontSize:"12px", color:"#1E293B", fontFamily:"'JetBrains Mono', monospace" }}>
                {text.length} / 5000 characters
              </span>
              <div style={{ display:"flex", gap:"12px" }}>
                {text && (
                  <button onClick={clear} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#64748B", borderRadius:"12px", padding:"10px 20px", fontSize:"13px", fontWeight: 500 }}>
                    Clear
                  </button>
                )}
                <button
                  onClick={() => analyse()}
                  disabled={!text.trim() || loading}
                  style={{
                    background: text.trim() && !loading ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(99,102,241,0.1)",
                    border:"none", color: text.trim() && !loading ? "white" : "#334155",
                    borderRadius:"12px", padding:"10px 28px", fontSize:"14px", fontWeight:700,
                    boxShadow: text.trim() && !loading ? "0 10px 25px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  {loading ? "Processing…" : "Run Analysis"}
                </button>
              </div>
            </div>
          </div>

          {/* Try Samples */}
          <div style={{ marginTop: "32px", textAlign: "center" }}>
             <div style={{ fontSize:"11px", color:"#1E293B", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"16px", fontWeight: 600 }}>
              Quick Samples
            </div>
            <div style={{ display:"flex", flexWrap: "wrap", justifyContent: "center", gap:"10px" }}>
              {SAMPLES.map((s, i) => {
                const { color } = cfg(s.label);
                return (
                  <button key={i} onClick={() => useSample(s)} style={{
                    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:"12px", padding:"10px 16px",
                    color:"#475569", fontSize:"12px", maxWidth: "240px",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background=`${color}10`; e.currentTarget.style.borderColor=`${color}30`; e.currentTarget.style.color="#94A3B8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"; e.currentTarget.style.color="#475569"; }}
                  >
                   {s.text}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* ── Status Section ──────────────────────────────────────────────── */}
        <section style={{ marginTop: "40px", minHeight: "120px" }}>
          {loading && <Loader />}
          {error && !loading && (
            <div style={{ 
              background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", 
              borderRadius:"16px", padding:"24px", textAlign:"center", maxWidth: "800px", margin: "0 auto" 
            }}>
              <div style={{ color:"#EF4444", fontWeight:700, marginBottom:"6px" }}>Analysis Failed</div>
              <div style={{ color:"#94A3B8", fontSize:"14px" }}>{error}</div>
            </div>
          )}
          {result && !loading && <Result data={result} />}
        </section>

        {/* ── Side history ───────────────────────────────────────────────── */}
        {history.length > 0 && (
          <section style={{ marginTop: "80px", maxWidth: "800px", margin: "80px auto 0" }}>
             <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <div style={{ fontSize:"11px", color:"#334155", letterSpacing:"2px", textTransform:"uppercase", fontWeight: 600 }}>
                  Recent Sessions
                </div>
                <button onClick={() => setHist([])} style={{ background:"transparent", border:"none", color:"#2D3748", fontSize:"12px", fontWeight: 500 }}>
                  Clear All
                </button>
             </div>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
                {history.map(h => {
                  const { color, icon } = cfg(h.result.label);
                  return (
                    <button key={h.id}
                      onClick={() => { setText(h.text); setResult(h.result); setError(null); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                      style={{ 
                        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", 
                        borderRadius:"16px", padding:"16px", textAlign:"left", display:"flex", gap:"14px", alignItems:"center" 
                      }}
                       onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                       onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                    >
                      <span style={{ fontSize:"18px" }}>{icon}</span>
                      <div style={{ flex:1, overflow:"hidden" }}>
                        <div style={{ fontSize:"12px", color:"#475569", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h.text}</div>
                        <div style={{ fontSize:"11px", color, fontWeight: 600, marginTop:"2px" }}>{h.result.label} · {Math.round(h.result.confidence * 100)}%</div>
                      </div>
                    </button>
                  );
                })}
             </div>
          </section>
        )}

        {/* ── Footer / Classes / Specs ────────────────────────────────────── */}
        <footer style={{ marginTop: "100px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "60px" }}>
          
          <div style={{ marginBottom: "50px" }}>
             <div style={{ fontSize:"11px", color:"#334155", letterSpacing:"2px", textTransform:"uppercase", textAlign: "center", marginBottom:"24px", fontWeight: 600 }}>
                Diagnostic Classification Key
             </div>
             <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                {Object.entries(CLASS_CONFIG).map(([label, { color, icon, bg }]) => (
                  <div key={label} style={{ 
                    display:"flex", alignItems:"center", gap:"10px", padding:"8px 16px", 
                    borderRadius:"12px", background:"rgba(15,20,35,0.5)", border:`1px solid ${color}15` 
                  }}>
                    <span style={{ fontSize:"14px" }}>{icon}</span>
                    <span style={{ fontSize:"13px", color, fontWeight:600 }}>{label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "60px", opacity: 0.8, borderTop: "1px solid rgba(255,255,255,0.02)", paddingTop: "40px" }}>
             <div style={{ textAlign: "center" }}>
                <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", marginBottom:"8px" }}>MODEL PARAMETERS</div>
                <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"11px", color:"#94A3B8" }}>RF · E200 · S6 · L1 · Gini</div>
             </div>
             <div style={{ textAlign: "center" }}>
                <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", marginBottom:"8px" }}>ACCURACY & F1</div>
                <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"12px", color:"#10B981", fontWeight: 700 }}>91.90% · 91.78%</div>
             </div>
             <div style={{ textAlign: "center" }}>
                <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", marginBottom:"8px" }}>FEATURE ENGINE</div>
                <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"11px", color:"#94A3B8" }}>TF-IDF · 3000 DIM · LOG2</div>
             </div>
             <div style={{ textAlign: "center" }}>
                <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", marginBottom:"8px" }}>INFERENCE INFRA</div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", justifyContent: "center" }}>
                    <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#34D399" }} />
                    <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"12px", color:"#34D399" }}>HF Spaces API</span>
                </div>
             </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "60px", fontSize: "12px", color: "#1E293B", fontFamily: "'JetBrains Mono', monospace" }}>
             © 2026 MENTAL HEALTH NLP · SYSTEM READY
          </div>
        </footer>

      </div>
    </>
  );
}
