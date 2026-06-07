"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8c84a";
const ADMIN_PASS = "gristmill2024";
const maskSerial = (s) => s && s.length > 4 ? `···${s.slice(-4)}` : s ? `···${s}` : null;

// ── seeded daily shuffle ──────────────────────────────────────────────────
// Deterministic for a given day so every visitor gets the same gun
function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
const SPIN_KEY = () => `gm_spun_${getDayKey()}`;
const TIMER_KEY = () => `gm_timer_${getDayKey()}`;
function getStoredSpin() {
  try { return localStorage.getItem(SPIN_KEY()) === "1"; } catch { return false; }
}
function saveSpinResult(endTime) {
  try { localStorage.setItem(SPIN_KEY(), "1"); localStorage.setItem(TIMER_KEY(), String(endTime)); } catch {}
}
function getStoredEndTime() {
  try { const v = localStorage.getItem(TIMER_KEY()); return v ? Number(v) : null; } catch { return null; }
}
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return () => { h ^= h >>> 13; h ^= h << 17; h ^= h >>> 5; return (h >>> 0) / 4294967296; };
}
function getTodaysDeal(dealList) {
  if (!dealList.length) return null;
  // Use cycle key stored in localStorage — resets when all items shown
  let cycleKey = "gm_cycle";
  let usedKey = "gm_used";
  let dayKey = "gm_day";
  try {
    const storedDay = localStorage.getItem(dayKey);
    const today = getDayKey();
    if (storedDay === today) {
      const id = localStorage.getItem(cycleKey);
      return dealList.find(d => String(d.id) === id) || dealList[0];
    }
    // New day — pick next unseen item
    let used = JSON.parse(localStorage.getItem(usedKey) || "[]");
    let remaining = dealList.filter(d => !used.includes(d.id));
    if (!remaining.length) { used = []; remaining = [...dealList]; }
    const rng = seededRandom(today);
    const pick = remaining[Math.floor(rng() * remaining.length)];
    used.push(pick.id);
    localStorage.setItem(usedKey, JSON.stringify(used));
    localStorage.setItem(cycleKey, String(pick.id));
    localStorage.setItem(dayKey, today);
    return pick;
  } catch { return dealList[0]; }
}

// ── mock data ─────────────────────────────────────────────────────────────
const INIT_PRODUCTS = [
  { id:1, name:"Ruger 10/22 Carbine", cat:"Rifles", price:349, sale:299, desc:"The classic .22 LR semi-auto. Reliable and accurate.", specs:"Caliber: .22 LR | Capacity: 10+1 | Barrel: 18.5\"", deposit:50, serial:"0082741", sku:"RUG-1022-18", img:"" },
  { id:2, name:"Mossberg 500 Field", cat:"Shotguns", price:489, sale:null, desc:"Pump-action 12-gauge for hunters and home defense.", specs:"Gauge: 12 | Barrel: 28\" | Capacity: 5+1", deposit:75, serial:"P441892", sku:"MOS-500-28", img:"" },
  { id:3, name:"S&W M&P 9", cat:"Handguns", price:599, sale:549, desc:"Full-size polymer 9mm trusted by law enforcement.", specs:"Caliber: 9mm | Capacity: 17+1 | Barrel: 4.25\"", deposit:100, serial:"HZN3301", sku:"SW-MP9-425", img:"" },
  { id:4, name:"Winchester Model 70", cat:"Rifles", price:899, sale:null, desc:"The Rifleman's Rifle. Controlled-round feeding, legendary accuracy.", specs:"Caliber: .30-06 | Capacity: 5 | Barrel: 22\"", deposit:150, serial:"G2274519", sku:"WIN-M70-3006", img:"" },
  { id:5, name:"Glock 43X", cat:"Handguns", price:479, sale:null, desc:"Slim, reliable 9mm for everyday carry.", specs:"Caliber: 9mm | Capacity: 10+1 | Barrel: 3.41\"", deposit:75, serial:"BSTN441", sku:"GLK-43X-9", img:"" },
  { id:6, name:"Vortex Crossfire II 3-9x40", cat:"Optics", price:179, sale:159, desc:"Crystal-clear glass, precise adjustments.", specs:"Magnification: 3-9x | Objective: 40mm", deposit:30, serial:"", sku:"VTX-CF2-940", img:"" },
  { id:7, name:"Henry Golden Boy .22 LR", cat:"Rifles", price:549, sale:null, desc:"Lever-action rimfire with brass receiver.", specs:"Caliber: .22 LR | Capacity: 16 | Barrel: 20\"", deposit:100, serial:"H0041823", sku:"HNR-GB-22", img:"" },
  { id:8, name:"Hornady 9mm 124gr 500rd", cat:"Ammunition", price:219, sale:189, desc:"Brass-cased, boxer-primed. Clean and consistent.", specs:"Caliber: 9mm | Bullet: 124gr FMJ | Count: 500", deposit:0, serial:"", sku:"HRN-9MM-500", img:"" },
  { id:9, name:"Colt 1911 Government", cat:"Handguns", price:849, sale:null, desc:"Over a century of service. Single-action .45 ACP.", specs:"Caliber: .45 ACP | Capacity: 7+1 | Barrel: 5\"", deposit:150, serial:"336291LG", sku:"CLT-1911-45", img:"" },
  { id:10, name:"Leupold VX-Freedom 2-7x33", cat:"Optics", price:299, sale:null, desc:"Made in Oregon. Fog-proof, waterproof, shockproof.", specs:"Magnification: 2-7x | Objective: 33mm", deposit:50, serial:"", sku:"LEU-VXF-273", img:"" },
];

// deals queue — each entry links to a product id with a fixed discount %
const INIT_DEALS_QUEUE = [
  { id:101, productId:4, pct:15, note:"Winchester Model 70 — 15% off" },
  { id:102, productId:1, pct:10, note:"Ruger 10/22 — 10% off" },
  { id:103, productId:9, pct:12, note:"Colt 1911 — 12% off" },
  { id:104, productId:3, pct:8,  note:"S&W M&P 9 — 8% off" },
  { id:105, productId:7, pct:18, note:"Henry Golden Boy — 18% off" },
];

const CATS = ["All","Rifles","Shotguns","Handguns","Optics","Ammunition","Accessories"];

// ── helpers ───────────────────────────────────────────────────────────────
function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <polygon points="100,18 170,68 170,130 30,130 30,68" fill="none" stroke={GOLD} strokeWidth="6"/>
      <line x1="30" y1="68" x2="170" y2="68" stroke={GOLD} strokeWidth="4"/>
      <rect x="66" y="50" width="11" height="20" rx="3" fill={GOLD}/>
      <rect x="123" y="50" width="11" height="20" rx="3" fill={GOLD}/>
      <circle cx="100" cy="100" r="36" fill="none" stroke="white" strokeWidth="5.5"/>
      <circle cx="100" cy="100" r="10" fill="none" stroke="white" strokeWidth="4"/>
      <circle cx="100" cy="100" r="3" fill="white"/>
      <line x1="100" y1="64" x2="100" y2="79" stroke="white" strokeWidth="4"/>
      <line x1="100" y1="121" x2="100" y2="136" stroke="white" strokeWidth="4"/>
      <line x1="64" y1="100" x2="79" y2="100" stroke="white" strokeWidth="4"/>
      <line x1="121" y1="100" x2="136" y2="100" stroke="white" strokeWidth="4"/>
      <line x1="30" y1="130" x2="170" y2="130" stroke={GOLD} strokeWidth="4"/>
    </svg>
  );
}

function useCountdown(endTime) {
  const [rem, setRem] = useState(0);
  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRem(Math.max(0, endTime - Date.now()));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endTime]);
  return { rem, mins: Math.floor(rem / 60000), secs: Math.floor((rem % 60000) / 1000), expired: rem === 0 };
}

// ── spinner wheel — visual only, always lands on today's deal ─────────────
function SpinnerWheel({ onResult, todaysDeal }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);

  // 12 decorative slices — alternating gold tones, no text
  const SLICES = 12;
  const COLORS = [
    "#1a0e00","#0f0800","#1a1200","#120900",
    "#150b00","#1c1000","#0d0700","#181100",
    "#200f00","#110800","#1a0e00","#0e0700",
  ];
  const ACCENTS = [
    "#8b6914","#c9a84c","#6b5010","#e8c84a",
    "#a07820","#c9a84c","#7a5c18","#e0b840",
    "#9a7220","#b89030","#7a5c18","#d4a030",
  ];

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 260, cy = 260, r = 240;
    const arc = (Math.PI * 2) / SLICES;
    ctx.clearRect(0, 0, 520, 520);

    // outer glow ring
    ctx.save();
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // slices
    COLORS.forEach((col, i) => {
      const start = angle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = ACCENTS[i];
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // decorative line toward edge
      const mid = start + arc / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(mid) * 60, cy + Math.sin(mid) * 60);
      ctx.lineTo(cx + Math.cos(mid) * (r - 20), cy + Math.sin(mid) * (r - 20));
      ctx.strokeStyle = ACCENTS[i];
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // crosshair diamond near rim
      const dx = cx + Math.cos(mid) * (r - 24);
      const dy = cy + Math.sin(mid) * (r - 24);
      const ds = 6;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(mid);
      ctx.beginPath();
      ctx.moveTo(0, -ds); ctx.lineTo(ds, 0); ctx.lineTo(0, ds); ctx.lineTo(-ds, 0);
      ctx.closePath();
      ctx.fillStyle = ACCENTS[i];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    // tick marks
    for (let i = 0; i < SLICES * 4; i++) {
      const t = angle + (i / (SLICES * 4)) * Math.PI * 2;
      const len = i % 4 === 0 ? 10 : 5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(t) * (r - len), cy + Math.sin(t) * (r - len));
      ctx.lineTo(cx + Math.cos(t) * (r + 2), cy + Math.sin(t) * (r + 2));
      ctx.strokeStyle = i % 4 === 0 ? GOLD : "rgba(201,168,76,0.3)";
      ctx.lineWidth = i % 4 === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0a0a";
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();

    // crosshair in hub
    [[-20,0,20,0],[0,-20,0,20]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(cx+x1, cy+y1); ctx.lineTo(cx+x2, cy+y2);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2);
    ctx.fillStyle = GOLD; ctx.fill();
  }, []);

  useEffect(() => { drawWheel(0); }, [drawWheel]);

  const spin = () => {
    if (spinning || done || !todaysDeal) return;
    setSpinning(true);

    // Always land on slice 0 (top) — the wheel is pure theater
    const spins = 6 + Math.random() * 3;
    const targetAngle = spins * Math.PI * 2;
    const duration = 5200;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    const easeOut = t => 1 - Math.pow(1 - t, 4);

    function frame(now) {
      const t = Math.min((now - startTime) / duration, 1);
      angleRef.current = startAngle + targetAngle * easeOut(t);
      drawWheel(angleRef.current);
      if (t < 1) requestAnimationFrame(frame);
      else { setSpinning(false); setDone(true); onResult(); }
    }
    requestAnimationFrame(frame);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:0, height:0, borderLeft:"18px solid transparent", borderRight:"18px solid transparent", borderTop:`36px solid ${GOLD}`, filter:`drop-shadow(0 0 8px rgba(201,168,76,0.8))`, marginBottom:-6, zIndex:10 }}/>
      <canvas ref={canvasRef} width={520} height={520} style={{ display:"block", maxWidth:"min(520px, 90vw)", borderRadius:"50%", border:`4px solid #111` }}/>
      {!done && (
        <button onClick={spin} disabled={spinning || !todaysDeal}
          style={{ marginTop:28, background: spinning ? "#111" : `linear-gradient(180deg, ${GOLD2} 0%, ${GOLD} 100%)`, color: spinning ? "#444" : "#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:20, letterSpacing:"0.14em", padding:"16px 64px", border:`2px solid ${GOLD}`, borderRadius:3, cursor: spinning||!todaysDeal ? "not-allowed":"pointer", boxShadow: spinning ? "none" : `0 0 28px rgba(201,168,76,0.35)`, transition:"all 0.2s" }}>
          {spinning ? "SPINNING..." : todaysDeal ? "SPIN FOR TODAY'S DEAL" : "NO DEAL TODAY"}
        </button>
      )}
    </div>
  );
}

// ── deal result ───────────────────────────────────────────────────────────
function DealResult({ product, pct, onReserve, onPayFull }) {
  const [endTime] = useState(() => getStoredEndTime() || Date.now() + 10 * 60 * 1000);
  const { rem, mins, secs, expired } = useCountdown(endTime);
  const [claimed, setClaimed] = useState(false);
  const salePrice = Math.round(product.price * (1 - pct / 100));
  const savings = product.price - salePrice;

  return (
    <div style={{ maxWidth:700, margin:"0 auto", animation:"fadeUp 0.5s ease" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#555", letterSpacing:"0.2em", marginBottom:6 }}>TODAY'S DEAL</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:58, fontWeight:700, color:GOLD, letterSpacing:"0.04em", lineHeight:1, textShadow:`0 0 40px rgba(201,168,76,0.5)` }}>{pct}% OFF</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, color:"#e8e0d0", letterSpacing:"0.1em", marginTop:4 }}>{product.name}</div>
      </div>

      {!claimed && !expired && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:24, padding:"14px", background:"#0d0d0d", border:`1px solid ${rem < 60000 ? "#c0392b" : "#2a2a2a"}`, borderRadius:3, transition:"border-color 0.5s" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#555", letterSpacing:"0.2em" }}>OFFER EXPIRES IN</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:48, fontWeight:700, color: rem < 60000 ? "#c0392b" : GOLD, letterSpacing:"0.06em", lineHeight:1, minWidth:130, textAlign:"center", transition:"color 0.5s" }}>
            {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
        </div>
      )}
      {expired && !claimed && <div style={{ textAlign:"center", padding:"14px", marginBottom:20, background:"#1a0000", border:"1px solid #c0392b", borderRadius:3, fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#c0392b", letterSpacing:"0.12em" }}>OFFER EXPIRED — CHECK BACK TOMORROW</div>}
      {claimed && <div style={{ textAlign:"center", padding:"18px", marginBottom:20, background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3 }}>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:"#4caf50", letterSpacing:"0.1em" }}>✓ RESERVATION RECEIVED</div>
        <div style={{ color:"#777", fontSize:13, marginTop:5, fontStyle:"italic" }}>Come in within 48 hours to complete your purchase and paperwork.</div>
      </div>}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, background:"#111", border:"1px solid #1e1e1e", borderRadius:3, padding:24 }}>
        <div style={{ aspectRatio:"4/3", background:"#161616", border:"1px solid #1e1e1e", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {product.img ? <img src={product.img} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> :
            <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
              <rect x="2" y="20" width="52" height="10" rx="2" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="1"/>
              <rect x="16" y="12" width="36" height="8" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
              <rect x="10" y="28" width="10" height="14" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
              <circle cx="56" cy="25" r="8" fill="none" stroke="#3a3a3a" strokeWidth="1.5"/>
            </svg>}
        </div>
        <div>
          <div style={{ fontSize:9, color:"#555", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:5, fontFamily:"'Oswald',sans-serif" }}>{product.cat}</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, color:"#e8e0d0", fontWeight:700, lineHeight:1.2, marginBottom:8 }}>{product.name}</div>
          <div style={{ fontStyle:"italic", color:"#666", fontSize:13, lineHeight:1.6, marginBottom:10 }}>{product.desc}</div>
          {product.specs && <div style={{ fontSize:10, color:"#444", fontFamily:"'Courier New',monospace", lineHeight:1.8, marginBottom:14 }}>
            {product.specs.split(" | ").map((s,i) => <div key={i}>· {s}</div>)}
          </div>}
          <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
            <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, color:GOLD, fontWeight:700 }}>${salePrice.toLocaleString()}</span>
            <span style={{ fontSize:15, color:"#444", textDecoration:"line-through" }}>${product.price.toLocaleString()}</span>
          </div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#4caf50", letterSpacing:"0.1em", marginBottom:16 }}>TODAY ONLY — SAVE ${savings.toLocaleString()}</div>
          {!claimed && !expired && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={() => { setClaimed(true); onReserve(product, salePrice); }}
                style={{ width:"100%", background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.1em", padding:"12px 0", border:"none", borderRadius:2, cursor:"pointer" }}>
                RESERVE IT · ${product.deposit} DEPOSIT
              </button>
              <button onClick={() => { setClaimed(true); onPayFull(product, salePrice); }}
                style={{ width:"100%", background:"transparent", color:"#e8e0d0", fontFamily:"'Oswald',sans-serif", fontSize:13, letterSpacing:"0.08em", padding:"10px 0", border:"1px solid #333", borderRadius:2, cursor:"pointer" }}>
                PAY IN FULL · ${salePrice.toLocaleString()}
              </button>
              <div style={{ fontSize:10, color:"#444", textAlign:"center", fontStyle:"italic" }}>FFL paperwork completed in-store. Valid ID required.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── reservation modal ─────────────────────────────────────────────────────
function Modal({ product, price, type, onClose }) {
  const [form, setForm] = useState({ name:"", email:"", phone:"" });
  const [done, setDone] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const valid = form.name && form.email && form.phone;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
      <div style={{ background:"#111", border:`1px solid ${GOLD}`, borderRadius:3, padding:"2rem", width:"100%", maxWidth:400, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:10, right:14, background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>×</button>
        {!done ? <>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, letterSpacing:"0.1em", marginBottom:3 }}>{type==="deposit" ? "RESERVE THIS ITEM" : "PAY IN FULL"}</div>
          <div style={{ fontStyle:"italic", color:"#666", fontSize:12, marginBottom:18 }}>{product.name} · ${price.toLocaleString()}</div>
          {[["Full Name","name","text"],["Email Address","email","email"],["Phone Number","phone","tel"]].map(([label,key,t]) => (
            <div key={key} style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontSize:10, color:"#555", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.12em", marginBottom:4 }}>{label.toUpperCase()}</label>
              <input type={t} value={form[key]} onChange={e => set(key, e.target.value)} style={{ width:"100%", background:"#0a0a0a", border:"1px solid #2a2a2a", color:"#e8e0d0", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
          ))}
          <div style={{ padding:"12px 14px", background:"#0a0a0a", border:"1px solid #1e1e1e", borderRadius:2, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"#666", fontFamily:"'Oswald',sans-serif" }}>{type==="deposit" ? "DEPOSIT" : "TOTAL"} DUE NOW</span>
              <span style={{ fontSize:16, color:GOLD, fontFamily:"'Oswald',sans-serif", fontWeight:700 }}>${(type==="deposit" ? product.deposit : price).toLocaleString()}</span>
            </div>
            {type==="deposit" && <div style={{ fontSize:10, color:"#444", marginTop:4, fontStyle:"italic" }}>Balance of ${(price - product.deposit).toLocaleString()} due in-store</div>}
          </div>
          <button onClick={() => setDone(true)} disabled={!valid} style={{ width:"100%", background: valid ? GOLD : "#333", color: valid ? "#000" : "#666", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"12px 0", border:"none", borderRadius:2, cursor: valid ? "pointer":"not-allowed" }}>
            PROCEED TO PAYMENT →
          </button>
        </> : (
          <div style={{ textAlign:"center", padding:"1rem 0" }}>
            <div style={{ fontSize:42, color:"#4caf50", marginBottom:12 }}>✓</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, color:"#4caf50", letterSpacing:"0.1em", marginBottom:10 }}>YOU'RE ALL SET</div>
            <div style={{ color:"#777", fontSize:13, lineHeight:1.7 }}>
              Confirmation sent to <strong style={{ color:"#e8e0d0" }}>{form.email}</strong>. Come in within 48 hours with valid ID.
              {(product.sku || product.serial) && (
                <div style={{ marginTop:14, padding:"10px 14px", background:"#0d0d0d", border:"1px solid #2a2a2a", borderRadius:2, textAlign:"left" }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#555", letterSpacing:"0.15em", marginBottom:6 }}>YOUR ITEM REFERENCE</div>
                  {product.sku && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:"#555", fontSize:12 }}>SKU</span>
                    <span style={{ color:"#e8e0d0", fontSize:12, fontFamily:"'Courier New',monospace" }}>{product.sku}</span>
                  </div>}
                  {product.serial && <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"#555", fontSize:12 }}>Serial</span>
                    <span style={{ color:GOLD, fontSize:12, fontFamily:"'Courier New',monospace" }}>{maskSerial(product.serial)}</span>
                  </div>}
                </div>
              )}
              <br/><em>Questions? Call (555) 748-2291</em>
            </div>
            <button onClick={onClose} style={{ marginTop:20, background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:13, padding:"9px 28px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── product card ──────────────────────────────────────────────────────────
function ProductCard({ p, onReserve }) {
  const [hov, setHov] = useState(false);
  const dp = p.sale ?? p.price;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"#111", border:`1px solid ${hov ? GOLD : "#1e1e1e"}`, borderRadius:3, overflow:"hidden", transition:"transform 0.18s,border-color 0.18s", transform: hov ? "translateY(-3px)":"none" }}>
      <div style={{ aspectRatio:"4/3", background:"#161616", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", borderBottom:"1px solid #1e1e1e", overflow:"hidden" }}>
        {p.img ? <img src={p.img} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> :
          <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
            <rect x="2" y="16" width="42" height="8" rx="2" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="1"/>
            <rect x="12" y="10" width="30" height="6" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
            <rect x="8" y="22" width="8" height="12" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
            <circle cx="46" cy="20" r="7" fill="none" stroke="#3a3a3a" strokeWidth="1.5"/>
          </svg>}
        {p.sale && <span style={{ position:"absolute", top:7, right:7, background:"#7a1515", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:1, fontFamily:"'Oswald',sans-serif" }}>SALE</span>}
      </div>
      <div style={{ padding:"11px 13px 13px" }}>
        <div style={{ fontSize:9, color:"#555", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:3, fontFamily:"'Oswald',sans-serif" }}>{p.cat}</div>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"#e8e0d0", fontWeight:600, lineHeight:1.2, marginBottom:4 }}>{p.name}</div>
        <div style={{ fontSize:11, color:"#555", lineHeight:1.5, marginBottom:6, fontStyle:"italic" }}>{p.desc}</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom: p.deposit > 0 ? 8:0 }}>
          <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, fontWeight:700 }}>${dp.toLocaleString()}</span>
          {p.sale && <span style={{ fontSize:11, color:"#444", textDecoration:"line-through" }}>${p.price.toLocaleString()}</span>}
        </div>
        {onReserve && p.deposit > 0 && (
          <button onClick={() => onReserve(p)}
            onMouseEnter={e => { e.currentTarget.style.background=GOLD; e.currentTarget.style.color="#000"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=GOLD; }}
            style={{ width:"100%", background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"6px 0", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em", transition:"all 0.15s" }}>
            RESERVE · ${p.deposit} DEPOSIT
          </button>
        )}
      </div>
    </div>
  );
}

// ── admin login ───────────────────────────────────────────────────────────
function AdminLogin({ onLogin, onBack }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw === ADMIN_PASS) onLogin(); else { setErr(true); setTimeout(() => setErr(false), 2000); } };
  return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');`}</style>
      <div style={{ background:"#111", border:`1px solid ${GOLD}`, borderRadius:3, padding:"2.5rem", width:320, textAlign:"center" }}>
        <Logo size={46}/>
        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD, letterSpacing:"0.22em", margin:"1rem 0 1.5rem" }}>ADMIN ACCESS</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} placeholder="Password"
          style={{ width:"100%", background:"#0a0a0a", border:`1px solid ${err ? "#c0392b":"#1e1e1e"}`, color:"#e8e0d0", padding:"9px 14px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom: err ? 8:14 }}/>
        {err && <div style={{ color:"#c0392b", fontSize:12, fontStyle:"italic", marginBottom:10 }}>Incorrect password</div>}
        <button onClick={submit} style={{ width:"100%", background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.1em", padding:"11px 0", border:"none", borderRadius:2, cursor:"pointer" }}>ENTER</button>
        <button onClick={onBack} style={{ marginTop:12, background:"transparent", border:"none", color:"#444", fontFamily:"'Oswald',sans-serif", fontSize:11, cursor:"pointer", letterSpacing:"0.1em" }}>← BACK TO SITE</button>
        <div style={{ fontSize:10, color:"#333", marginTop:8, fontStyle:"italic" }}>Demo: gristmill2024</div>
      </div>
    </div>
  );
}

// ── admin panel ───────────────────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [dealsQueue, setDealsQueue] = useState(INIT_DEALS_QUEUE);
  const [tab, setTab] = useState("queue"); // queue | products
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingDeal, setAddingDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ productId:"", pct:"" });
  const BLANK = { id:0, name:"", cat:"Rifles", price:"", sale:"", desc:"", specs:"", img:"", deposit:"100", serial:"", sku:"" };
  const [form, setForm] = useState(BLANK);
  const [imgPreview, setImgPreview] = useState("");
  const fileRef = useRef();
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const openEdit = p => { setEditingProduct(p.id); setForm({ ...p, price:String(p.price), sale: p.sale!=null?String(p.sale):"", deposit:String(p.deposit), serial:p.serial||"", sku:p.sku||"" }); setImgPreview(p.img||""); };
  const openNew = () => { setEditingProduct("new"); setForm({ ...BLANK, id:Date.now() }); setImgPreview(""); };
  const saveProduct = () => {
    const p = { ...form, price:Number(form.price), sale:form.sale?Number(form.sale):null, deposit:Number(form.deposit)||0, img:imgPreview };
    if (editingProduct==="new") setProducts(ps => [...ps,p]);
    else setProducts(ps => ps.map(x => x.id===p.id ? p : x));
    setEditingProduct(null);
  };
  const delProduct = id => setProducts(ps => ps.filter(p => p.id!==id));
  const handleImg = e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>{setImgPreview(ev.target.result);set("img",ev.target.result);}; r.readAsDataURL(f); };
  const addToQueue = () => {
    if (!newDeal.productId || !newDeal.pct) return;
    const prod = products.find(p => p.id === Number(newDeal.productId));
    if (!prod) return;
    setDealsQueue(q => [...q, { id:Date.now(), productId:Number(newDeal.productId), pct:Number(newDeal.pct), note:`${prod.name} — ${newDeal.pct}% off` }]);
    setNewDeal({ productId:"", pct:"" });
    setAddingDeal(false);
  };
  const removeFromQueue = id => setDealsQueue(q => q.filter(d => d.id!==id));
  const moveUp = id => setDealsQueue(q => { const i=q.findIndex(d=>d.id===id); if(i<=0)return q; const n=[...q]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });

  const iStyle = { width:"100%", background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" };
  const lStyle = { display:"block", fontSize:9, color:"#555", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 };
  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{ background: tab===id ? `${GOLD}18`:"transparent", border:`1px solid ${tab===id ? GOLD:"#2a2a2a"}`, color: tab===id ? GOLD:"#666", fontFamily:"'Oswald',sans-serif", fontSize:12, padding:"7px 18px", borderRadius:2, cursor:"pointer", letterSpacing:"0.1em" }}>{label}</button>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#e8e0d0" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');`}</style>
      <div style={{ background:"#0d0d0d", borderBottom:`2px solid ${GOLD}`, padding:"0.85rem 1.5rem", display:"flex", alignItems:"center", gap:14 }}>
        <Logo size={36}/>
        <div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.18em" }}>ADMIN PANEL</div>
          <div style={{ fontSize:10, color:"#444", fontStyle:"italic" }}>Gristmill Guns & Optics</div>
        </div>
        <button onClick={onClose} style={{ marginLeft:"auto", background:"transparent", border:"1px solid #2a2a2a", color:"#777", fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"6px 14px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>← BACK TO SITE</button>
      </div>

      <div style={{ padding:"1.5rem", maxWidth:980, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {tabBtn("queue","DEALS QUEUE")}
          {tabBtn("products","INVENTORY")}
        </div>

        {/* ── DEALS QUEUE TAB ── */}
        {tab==="queue" && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em", marginBottom:6 }}>DAILY DEALS QUEUE</div>
              <div style={{ fontSize:12, color:"#555", fontStyle:"italic", marginBottom:16 }}>Guns rotate randomly, never repeating until the full list cycles. The discount is set per gun.</div>
            </div>

            {/* today's deal preview */}
            {(() => {
              const td = getTodaysDeal(dealsQueue);
              const prod = td ? products.find(p => p.id === td.productId) : null;
              return prod && (
                <div style={{ padding:"12px 16px", background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3, marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#4caf50", letterSpacing:"0.18em" }}>TODAY'S DEAL</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"#e8e0d0" }}>{prod.name}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD }}>{td.pct}% OFF</div>
                  <div style={{ fontSize:11, color:"#444", marginLeft:"auto", fontStyle:"italic" }}>Sale price: ${Math.round(prod.price * (1-td.pct/100)).toLocaleString()}</div>
                </div>
              );
            })()}

            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
              {dealsQueue.map((d, i) => {
                const prod = products.find(p => p.id === d.productId);
                if (!prod) return null;
                return (
                  <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#111", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#333", minWidth:24, textAlign:"center" }}>#{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#e8e0d0" }}>{prod.name}</div>
                      <div style={{ fontSize:10, color:"#555", marginTop:2 }}>{prod.cat} · Regular: ${prod.price.toLocaleString()} · Deal: ${Math.round(prod.price*(1-d.pct/100)).toLocaleString()} ({d.pct}% off)</div>
                    </div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, fontWeight:700, minWidth:60, textAlign:"right" }}>{d.pct}% OFF</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => moveUp(d.id)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#666", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 8px", borderRadius:2, cursor:"pointer" }}>↑</button>
                      <button onClick={() => removeFromQueue(d.id)} style={{ background:"transparent", border:"1px solid #330000", color:"#7a1515", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 9px", borderRadius:2, cursor:"pointer" }}>DEL</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {addingDeal ? (
              <div style={{ background:"#111", border:`1px solid ${GOLD}`, borderRadius:3, padding:"1.25rem", marginTop:8 }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.1em", marginBottom:14 }}>ADD TO DEALS QUEUE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                  <div>
                    <label style={lStyle}>SELECT GUN</label>
                    <select value={newDeal.productId} onChange={e => setNewDeal(d => ({...d, productId:e.target.value}))} style={iStyle}>
                      <option value="">— choose a product —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lStyle}>DISCOUNT %</label>
                    <input type="number" min="1" max="99" value={newDeal.pct} onChange={e => setNewDeal(d => ({...d, pct:e.target.value}))} placeholder="e.g. 15" style={iStyle}/>
                  </div>
                </div>
                {newDeal.productId && newDeal.pct && (() => {
                  const prod = products.find(p => p.id === Number(newDeal.productId));
                  const sp = prod ? Math.round(prod.price * (1 - Number(newDeal.pct)/100)) : 0;
                  return <div style={{ fontSize:11, color:"#4caf50", fontFamily:"'Oswald',sans-serif", marginBottom:14 }}>
                    Sale price will be: ${sp.toLocaleString()} (saving ${prod ? prod.price-sp : 0})
                  </div>;
                })()}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={addToQueue} style={{ background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, letterSpacing:"0.08em", padding:"8px 20px", border:"none", borderRadius:2, cursor:"pointer" }}>ADD TO QUEUE</button>
                  <button onClick={() => setAddingDeal(false)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#666", fontFamily:"'Oswald',sans-serif", fontSize:12, padding:"8px 16px", borderRadius:2, cursor:"pointer" }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingDeal(true)} style={{ background:"transparent", border:`1px solid ${GOLD}`, color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em", padding:"9px 20px", borderRadius:2, cursor:"pointer" }}>+ ADD GUN TO QUEUE</button>
            )}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab==="products" && !editingProduct && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, letterSpacing:"0.1em" }}>INVENTORY ({products.length} items)</div>
              <button onClick={openNew} style={{ background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.1em", padding:"8px 18px", border:"none", borderRadius:2, cursor:"pointer" }}>+ ADD PRODUCT</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {products.map(p => (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#111", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
                  <div style={{ width:48, height:36, background:"#161616", borderRadius:2, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {p.img ? <img src={p.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:16, opacity:0.15 }}>🔫</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#e8e0d0", display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                      {p.name}
                      {dealsQueue.some(d => d.productId===p.id) && <span style={{ background:`${GOLD}22`, border:`1px solid ${GOLD}44`, color:GOLD, fontSize:8, padding:"2px 5px", borderRadius:1, letterSpacing:"0.1em" }}>IN QUEUE</span>}
                      {p.sale && <span style={{ background:"#7a1515", color:"#fff", fontSize:8, padding:"2px 5px", borderRadius:1 }}>SALE</span>}
                    </div>
                    <div style={{ fontSize:10, color:"#444", fontFamily:"'Oswald',sans-serif", marginTop:2 }}>
                      {p.cat} · ${p.price}{p.sale?` → $${p.sale}`:""} · Deposit: ${p.deposit}
                      {p.sku && <span style={{ color:"#333", fontFamily:"'Courier New',monospace", marginLeft:8 }}>SKU: {p.sku}</span>}
                      {p.serial && <span style={{ color:"#333", fontFamily:"'Courier New',monospace", marginLeft:8 }}>S/N: {p.serial}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => openEdit(p)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:GOLD, fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 9px", borderRadius:2, cursor:"pointer" }}>EDIT</button>
                    <button onClick={() => delProduct(p.id)} style={{ background:"transparent", border:"1px solid #330000", color:"#7a1515", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"4px 9px", borderRadius:2, cursor:"pointer" }}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="products" && editingProduct && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, color:GOLD, letterSpacing:"0.1em" }}>{editingProduct==="new" ? "ADD NEW PRODUCT":"EDIT PRODUCT"}</div>
              <button onClick={() => setEditingProduct(null)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#777", fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"6px 14px", borderRadius:2, cursor:"pointer" }}>CANCEL</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["Product Name","name","text"],["Regular Price ($)","price","number"],["Sale Price (optional)","sale","number"],["Deposit Amount ($)","deposit","number"]].map(([l,k,t]) => (
                  <div key={k}><label style={lStyle}>{l.toUpperCase()}</label><input type={t} value={form[k]} onChange={e => set(k, e.target.value)} style={iStyle}/></div>
                ))}
                <div><label style={lStyle}>CATEGORY</label>
                  <select value={form.cat} onChange={e => set("cat", e.target.value)} style={iStyle}>
                    {CATS.filter(c => c!=="All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lStyle}>DESCRIPTION</label><textarea value={form.desc} onChange={e => set("desc", e.target.value)} rows={3} style={{ ...iStyle, resize:"vertical" }}/></div>
                <div><label style={lStyle}>SPECS (separate with " | ")</label><input type="text" value={form.specs} onChange={e => set("specs", e.target.value)} placeholder='Caliber: 9mm | Barrel: 4" | Capacity: 17+1' style={{ ...iStyle, fontFamily:"'Courier New',monospace", fontSize:11 }}/></div>
                <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:12 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#444", letterSpacing:"0.16em", marginBottom:10 }}>UNIT TRACKING — ADMIN ONLY</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={lStyle}>SERIAL NUMBER</label>
                      <input type="text" value={form.serial} onChange={e => set("serial", e.target.value)} placeholder="e.g. G2274519" style={{ ...iStyle, fontFamily:"'Courier New',monospace", fontSize:12 }}/>
                      <div style={{ fontSize:9, color:"#333", marginTop:3, fontStyle:"italic" }}>Customer sees: {form.serial ? maskSerial(form.serial) : "—"}</div>
                    </div>
                    <div>
                      <label style={lStyle}>SKU / ITEM NUMBER</label>
                      <input type="text" value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. WIN-M70-3006" style={{ ...iStyle, fontFamily:"'Courier New',monospace", fontSize:12 }}/>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label style={lStyle}>PRODUCT PHOTO</label>
                <div onClick={() => fileRef.current.click()} onMouseEnter={e => e.currentTarget.style.borderColor=GOLD} onMouseLeave={e => e.currentTarget.style.borderColor="#1e1e1e"}
                  style={{ aspectRatio:"4/3", background:"#0d0d0d", border:"2px dashed #1e1e1e", borderRadius:3, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s" }}>
                  {imgPreview ? <img src={imgPreview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> :
                    <div style={{ textAlign:"center", color:"#333" }}>
                      <div style={{ fontSize:28, marginBottom:6 }}>↑</div>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>CLICK TO UPLOAD</div>
                      <div style={{ fontSize:10, marginTop:3, fontStyle:"italic", color:"#2a2a2a" }}>JPG / PNG → Cloudinary</div>
                    </div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }}/>
                {imgPreview && <button onClick={() => { setImgPreview(""); set("img",""); }} style={{ marginTop:6, background:"transparent", border:"1px solid #222", color:"#555", fontSize:10, padding:"3px 10px", borderRadius:2, cursor:"pointer", fontFamily:"'Oswald',sans-serif" }}>REMOVE</button>}
              </div>
            </div>
            <button onClick={saveProduct} style={{ marginTop:24, background:GOLD, color:"#000", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:15, letterSpacing:"0.1em", padding:"12px 36px", border:"none", borderRadius:2, cursor:"pointer" }}>SAVE PRODUCT</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────
export default function GristmillPage() {
  const [spinDone, setSpinDone] = useState(false);
  const [modal, setModal] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [view, setView] = useState("site");
  const [todaysDeal, setTodaysDeal] = useState(null);

  useEffect(() => {
    const deal = getTodaysDeal(INIT_DEALS_QUEUE);
    setTodaysDeal(deal);
    // Restore spin state — if they already spun today, skip straight to result
    if (getStoredSpin()) setSpinDone(true);
  }, []);

  const handleSpinResult = () => {
    const endTime = Date.now() + 10 * 60 * 1000;
    saveSpinResult(endTime);
    setSpinDone(true);
  };

  const dealProduct = todaysDeal ? INIT_PRODUCTS.find(p => p.id === todaysDeal.productId) : null;
  const filtered = catFilter === "All" ? INIT_PRODUCTS : INIT_PRODUCTS.filter(p => p.cat === catFilter);

  if (view === "adminlogin") return <AdminLogin onLogin={() => setView("admin")} onBack={() => setView("site")}/>;
  if (view === "admin") return <AdminPanel onClose={() => setView("site")}/>;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#e8e0d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <header style={{ background:"#050505", borderBottom:`2px solid ${GOLD}`, padding:"0 2rem", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:14, padding:"0.85rem 0" }}>
          <Logo size={46}/>
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, fontWeight:700, color:"white", letterSpacing:"0.1em", lineHeight:1 }}>GRISTMILL</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:GOLD, letterSpacing:"0.24em" }}>GUNS & OPTICS</div>
          </div>
          <div style={{ marginLeft:"auto", fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#555", letterSpacing:"0.1em" }}>(555) 748-2291 &nbsp;·&nbsp; 1 Mill Road</div>
        </div>
      </header>

      {/* HERO — SPINNER */}
      <section style={{ background:"linear-gradient(180deg,#050505 0%,#0a0a0a 100%)", borderBottom:"1px solid #1a1a1a", padding:"3rem 2rem 4rem", textAlign:"center" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#555", letterSpacing:"0.28em", marginBottom:10 }}>EVERY DAY · ONE DEAL · LIMITED TIME</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:38, fontWeight:700, color:"white", letterSpacing:"0.05em", lineHeight:1, marginBottom:6 }}>DAILY DEAL SPINNER</div>
          <div style={{ width:48, height:2, background:GOLD, margin:"0 auto 12px" }}/>
          <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"#555", fontSize:14, marginBottom:32 }}>
            Spin once a day for an exclusive in-store discount. Claim it before the clock runs out.
          </div>
          {!spinDone ? (
            <SpinnerWheel onResult={handleSpinResult} todaysDeal={todaysDeal}/>
          ) : dealProduct ? (
            <DealResult
              product={dealProduct}
              pct={todaysDeal.pct}
              onReserve={(p, price) => setModal({ product:p, type:"deposit", price })}
              onPayFull={(p, price) => setModal({ product:p, type:"full", price })}
            />
          ) : null}
        </div>
      </section>

      {/* CATALOG */}
      <section style={{ maxWidth:1100, margin:"0 auto", padding:"3rem 2rem 5rem" }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:9, color:"#444", letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:4 }}>BROWSE OUR INVENTORY</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:26, fontWeight:700, color:"white", letterSpacing:"0.04em" }}>IN-STORE CATALOG</div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{ background: catFilter===c ? `${GOLD}18`:"transparent", border:`1px solid ${catFilter===c ? GOLD:"#1e1e1e"}`, color: catFilter===c ? GOLD:"#555", fontFamily:"'Oswald',sans-serif", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", letterSpacing:"0.12em", transition:"all 0.2s" }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1rem" }}>
          {filtered.map(p => <ProductCard key={p.id} p={p} onReserve={p => setModal({ product:p, type:"deposit", price: p.sale??p.price })}/>)}
        </div>
      </section>

      <footer style={{ background:"#050505", borderTop:"1px solid #141414", padding:"1.25rem 2rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div style={{ fontSize:11, color:"#333", fontStyle:"italic" }}>Gristmill Guns & Optics · 1 Mill Road · (555) 748-2291 · All sales require valid ID & background check</div>
          <button onClick={() => setView("adminlogin")} style={{ background:"transparent", border:"none", color:"#1e1e1e", fontSize:10, cursor:"pointer", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.1em", transition:"color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="#555"} onMouseLeave={e => e.currentTarget.style.color="#1e1e1e"}>ADMIN</button>
        </div>
      </footer>

      {modal && <Modal {...modal} onClose={() => setModal(null)}/>}
    </div>
  );
}
