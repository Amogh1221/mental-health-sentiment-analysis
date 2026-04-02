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
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)" }}
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
      borderRadius: "16px", padding: "24px",
      boxShadow: `0 0 40px ${color}10, 0 20px 40px rgba(0,0,0,0.3)`,
      animation: "fadeUp 0.4s ease",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "24px" }}>
        <ConfidenceArc value={confidence} color={color} />
        <div>
          <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>
            DETECTED
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color, display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{icon}</span>{label}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{desc}</div>
          <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", background: bg, border: `1px solid ${color}20`, borderRadius: "99px", padding: "3px 10px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: "11px", color, fontWeight: 600 }}>{(confidence * 100).toFixed(1)}% confidence · {latency_ms}ms</span>
          </div>
        </div>
      </div>

      {/* Probability bars */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
        <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>
          ALL CLASSES
        </div>
        {probabilities.map((p, i) => (
          <ProbRow key={p.label} label={p.label} probability={p.probability} isTop={i === 0} />
        ))}
      </div>
    </div>
  );
}

// ── Loader ────────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "7px", padding: "28px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "8px", height: "8px", borderRadius: "50%", background: "#6366F1",
          animation: `bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
      setHist(h => [{ text: input, result: data, id: Date.now() }, ...h.slice(0, 7)]);
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07090F; color: #CBD5E1; font-family: 'Inter', sans-serif; min-height: 100vh; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes bounce   { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-9px); } }
        @keyframes glow     { 0%,100% { opacity:.3; } 50% { opacity:1; } }
        textarea { resize: vertical; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }
        button { font-family: inherit; cursor: pointer; }
      `}</style>

      {/* bg gradients */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 70% 40% at 15% 5%, rgba(99,102,241,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 85% 90%, rgba(52,211,153,0.05) 0%, transparent 70%)" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:"1060px", margin:"0 auto", padding:"36px 20px 60px" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={{ textAlign:"center", marginBottom:"44px" }}>
          <div style={{ fontSize:"10px", letterSpacing:"4px", color:"#6366F1", textTransform:"uppercase", marginBottom:"14px", fontFamily:"'JetBrains Mono', monospace" }}>
            ◎ mental health nlp
          </div>
          <h1 style={{ fontFamily:"'Syne', sans-serif", fontSize:"clamp(32px,5.5vw,52px)", fontWeight:800, lineHeight:1.1, marginBottom:"14px" }}>
            Sentiment{" "}
            <span style={{ background:"linear-gradient(130deg,#6366F1,#A78BFA,#F472B6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Analysis
            </span>
          </h1>
          <p style={{ color:"#475569", maxWidth:"420px", margin:"0 auto", fontSize:"14px", lineHeight:1.6 }}>
            Detect mental health conditions from free-text statements using a tuned RandomForest classifier.
          </p>
        </header>

        {/* ── Layout ─────────────────────────────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"20px", alignItems:"start" }}>

          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            {/* Input card */}
            <div style={{ background:"rgba(15,20,35,0.85)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"22px", backdropFilter:"blur(16px)" }}>
              <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:"10px" }}>
                Statement
              </div>
              <textarea
                ref={ref}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyse(); }}
                placeholder="Describe how you're feeling in your own words…"
                rows={5}
                maxLength={5000}
                style={{
                  width:"100%", background:"rgba(255,255,255,0.03)",
                  border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px",
                  color:"#E2E8F0", fontSize:"14px", lineHeight:1.7, padding:"14px",
                  fontFamily:"'Inter', sans-serif", transition:"border-color 0.2s",
                }}
                onFocus={e  => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                onBlur={e   => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"10px" }}>
                <span style={{ fontSize:"11px", color:"#1E293B", fontFamily:"'JetBrains Mono', monospace" }}>
                  {text.length}/5000 · ⌘↵ to run
                </span>
                <div style={{ display:"flex", gap:"8px" }}>
                  {text && (
                    <button onClick={clear} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:"#475569", borderRadius:"8px", padding:"7px 14px", fontSize:"12px" }}>
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => analyse()}
                    disabled={!text.trim() || loading}
                    style={{
                      background: text.trim() && !loading ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(99,102,241,0.15)",
                      border:"none", color: text.trim() && !loading ? "white" : "#334155",
                      borderRadius:"8px", padding:"7px 22px", fontSize:"13px", fontWeight:600,
                      boxShadow: text.trim() && !loading ? "0 4px 18px rgba(99,102,241,0.25)" : "none",
                      transition:"all 0.2s",
                    }}
                  >
                    {loading ? "Analysing…" : "Analyse →"}
                  </button>
                </div>
              </div>
            </div>

            {/* Samples */}
            <div>
              <div style={{ fontSize:"10px", color:"#1E293B", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:"8px" }}>
                Try a sample
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {SAMPLES.map((s, i) => {
                  const { color } = cfg(s.label);
                  return (
                    <button key={i} onClick={() => useSample(s)} style={{
                      background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
                      borderRadius:"9px", padding:"9px 13px", textAlign:"left",
                      color:"#475569", fontSize:"12px", lineHeight:1.5, transition:"all 0.18s",
                      display:"flex", alignItems:"flex-start", gap:"10px",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${color}08`; e.currentTarget.style.borderColor=`${color}25`; e.currentTarget.style.color="#94A3B8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.05)"; e.currentTarget.style.color="#475569"; }}
                    >
                      <span style={{ color, fontSize:"10px", marginTop:"2px", flexShrink:0 }}>{cfg(s.label).icon}</span>
                      {s.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output */}
            {loading && <Loader />}
            {error && !loading && (
              <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:"12px", padding:"16px", textAlign:"center" }}>
                <div style={{ color:"#EF4444", fontWeight:600, marginBottom:"4px" }}>Request failed</div>
                <div style={{ color:"#94A3B8", fontSize:"12px" }}>{error}</div>
                <div style={{ color:"#475569", fontSize:"11px", marginTop:"6px" }}>Is the backend running on port 8000?</div>
              </div>
            )}
            {result && !loading && <Result data={result} />}
          </div>

          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:"14px", position:"sticky", top:"20px" }}>

            {/* Classes legend */}
            <div style={{ background:"rgba(15,20,35,0.85)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"16px", padding:"18px", backdropFilter:"blur(16px)" }}>
              <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:"12px" }}>
                Classes
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {Object.entries(CLASS_CONFIG).map(([label, { color, icon, bg }]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:"9px", padding:"7px 10px", borderRadius:"8px", background:bg, border:`1px solid ${color}18` }}>
                    <span style={{ fontSize:"13px" }}>{icon}</span>
                    <span style={{ fontSize:"12px", color, fontWeight:500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ background:"rgba(15,20,35,0.85)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"16px", padding:"18px", backdropFilter:"blur(16px)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                  <div style={{ fontSize:"10px", color:"#334155", letterSpacing:"1.5px", textTransform:"uppercase" }}>
                    History ({history.length})
                  </div>
                  <button onClick={() => setHist([])} style={{ background:"transparent", border:"none", color:"#334155", fontSize:"11px", padding:"2px 6px" }}>
                    clear
                  </button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                  {history.map(h => {
                    const { color, icon } = cfg(h.result.label);
                    return (
                      <button key={h.id}
                        onClick={() => { setText(h.text); setResult(h.result); setError(null); }}
                        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"8px", padding:"9px 11px", textAlign:"left", display:"flex", gap:"9px", alignItems:"center", transition:"background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                      >
                        <span style={{ fontSize:"13px" }}>{icon}</span>
                        <div style={{ flex:1, overflow:"hidden" }}>
                          <div style={{ fontSize:"11px", color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {h.text.slice(0, 46)}…
                          </div>
                          <div style={{ fontSize:"10px", color, marginTop:"2px" }}>
                            {h.result.label} · {(h.result.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* API info */}
            <div style={{ background:"rgba(15,20,35,0.85)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"16px", padding:"16px", backdropFilter:"blur(16px)" }}>
              <div style={{ fontSize:"10px", color:"#1E293B", letterSpacing:"1px", marginBottom:"8px" }}>MODEL INFO</div>
              <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"11px", color:"#334155", marginBottom:"6px" }}>
                RandomForestClassifier
              </div>
              <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:"11px", color:"#1E293B", marginBottom:"10px" }}>
                TF-IDF · 3000 features · 1–3 ngram
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#34D399", animation:"glow 2s infinite" }} />
                <span style={{ fontSize:"11px", color:"#34D399" }}>{API}/predict</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
