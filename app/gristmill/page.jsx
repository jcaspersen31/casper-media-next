"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8c84a";

const PRODUCTS = [
  { id:1, name:"Ruger 10/22 Carbine", cat:"Rifles", price:349, sale:299, desc:"The classic .22 LR semi-auto. Reliable, accurate, perfect for plinking or small game.", specs:"Caliber: .22 LR | Capacity: 10+1 | Barrel: 18.5\"", deposit:50, serial:"0082741", sku:"RUG-1022-18" },
  { id:2, name:"Mossberg 500 Field", cat:"Shotguns", price:489, sale:null, desc:"Pump-action 12-gauge. A working gun for hunters and home defense alike.", specs:"Gauge: 12 | Barrel: 28\" | Capacity: 5+1", deposit:75, serial:"P441892", sku:"MOS-500-28" },
  { id:3, name:"S&W M&P 9", cat:"Handguns", price:599, sale:549, desc:"Full-size polymer 9mm. Trusted by law enforcement and civilian shooters.", specs:"Caliber: 9mm | Capacity: 17+1 | Barrel: 4.25\"", deposit:100, serial:"HZN3301", sku:"SW-MP9-425" },
  { id:4, name:"Winchester Model 70", cat:"Rifles", price:899, sale:null, desc:"The Rifleman's Rifle. Controlled-round feeding, legendary accuracy.", specs:"Caliber: .30-06 | Capacity: 5 | Barrel: 22\"", deposit:150, serial:"G2274519", sku:"WIN-M70-3006" },
  { id:5, name:"Glock 43X", cat:"Handguns", price:479, sale:null, desc:"Slim, reliable 9mm for everyday carry. 10+1 capacity in a compact frame.", specs:"Caliber: 9mm | Capacity: 10+1 | Barrel: 3.41\"", deposit:75, serial:"BSTN441", sku:"GLK-43X-9" },
  { id:6, name:"Vortex Crossfire II 3-9x40", cat:"Optics", price:179, sale:159, desc:"Crystal-clear glass, precise adjustments. Hard to beat at this price.", specs:"Magnification: 3-9x | Objective: 40mm", deposit:30, serial:"", sku:"VTX-CF2-940" },
  { id:7, name:"Henry Golden Boy .22 LR", cat:"Rifles", price:549, sale:null, desc:"Lever-action rimfire with brass receiver. A piece of American heritage.", specs:"Caliber: .22 LR | Capacity: 16 | Barrel: 20\"", deposit:100, serial:"H0041823", sku:"HNR-GB-22" },
  { id:8, name:"Hornady 9mm 124gr 500rd", cat:"Ammunition", price:219, sale:189, desc:"Brass-cased, boxer-primed. Clean and consistent for range sessions.", specs:"Caliber: 9mm | Bullet: 124gr FMJ | Count: 500", deposit:0, serial:"", sku:"HRN-9MM-500" },
  { id:9, name:"Colt 1911 Government", cat:"Handguns", price:849, sale:null, desc:"Over a century of service. Single-action .45 ACP with a trigger like glass.", specs:"Caliber: .45 ACP | Capacity: 7+1 | Barrel: 5\"", deposit:150, serial:"336291LG", sku:"CLT-1911-45" },
  { id:10, name:"Leupold VX-Freedom 2-7x33", cat:"Optics", price:299, sale:null, desc:"Made in Oregon. Fog-proof, waterproof, shockproof. Built for the field.", specs:"Magnification: 2-7x | Objective: 33mm", deposit:50, serial:"", sku:"LEU-VXF-273" },
];

const DEALS = [
  { label: "10% OFF", sublabel: "All Handguns", pct: 10, cat: "Handguns", color: "#1a0a00", stroke: "#8b4513" },
  { label: "15% OFF", sublabel: "Ammunition", pct: 15, cat: "Ammunition", color: "#0a0a1a", stroke: "#4444aa" },
  { label: "5% OFF",  sublabel: "Any Item",    pct: 5,  cat: "Any",       color: "#0a1a0a", stroke: "#2a7a2a" },
  { label: "20% OFF", sublabel: "Accessories", pct: 20, cat: "Accessories",color: "#1a1a00", stroke: "#aaaa00" },
  { label: "10% OFF", sublabel: "All Optics",  pct: 10, cat: "Optics",    color: "#1a000a", stroke: "#aa2255" },
  { label: "12% OFF", sublabel: "Shotguns",    pct: 12, cat: "Shotguns",  color: "#001a1a", stroke: "#007777" },
  { label: "8% OFF",  sublabel: "All Rifles",  pct: 8,  cat: "Rifles",    color: "#0f0800", stroke: "#c9a84c" },
  { label: "18% OFF", sublabel: "Featured Gun",pct: 18, cat: "Featured",  color: "#1a0800", stroke: "#cc6600" },
];

const CATS = ["All","Rifles","Shotguns","Handguns","Optics","Ammunition","Accessories"];
const ADMIN_PASS = "gristmill2024";
const maskSerial = (s) => s && s.length > 4 ? `···${s.slice(-4)}` : s ? `···${s}` : null;

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

function SpinnerWheel({ onResult }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const [winner, setWinner] = useState(null);
  const rafRef = useRef(null);

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 260, cy = 260, r = 240;
    const n = DEALS.length;
    const arc = (Math.PI * 2) / n;
    ctx.clearRect(0, 0, 520, 520);

    // outer ring glow
    ctx.save();
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    DEALS.forEach((d, i) => {
      const start = angle + i * arc;
      const end = start + arc;

      // slice fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();

      // slice border
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.strokeStyle = d.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";

      ctx.font = `bold 22px 'Oswald', sans-serif`;
      ctx.fillStyle = GOLD2;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(d.label, r - 16, -8);

      ctx.font = `13px 'Oswald', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(d.sublabel, r - 16, 12);
      ctx.restore();
    });

    // decorative tick marks
    for (let i = 0; i < n * 3; i++) {
      const tickAngle = angle + (i / (n * 3)) * Math.PI * 2;
      const inner = r - 4, outer = r + 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(tickAngle) * inner, cy + Math.sin(tickAngle) * inner);
      ctx.lineTo(cx + Math.cos(tickAngle) * outer, cy + Math.sin(tickAngle) * outer);
      ctx.strokeStyle = "rgba(201,168,76,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();

    // hub logo crosshair
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy); ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, []);

  useEffect(() => { drawWheel(0); }, [drawWheel]);

  const spin = () => {
    if (spinning || done) return;
    setSpinning(true);

    const targetSlice = Math.floor(Math.random() * DEALS.length);
    const arc = (Math.PI * 2) / DEALS.length;
    const spins = 6 + Math.random() * 4;
    const targetAngle = spins * Math.PI * 2 + (DEALS.length - targetSlice) * arc + arc * 0.5 - Math.PI / 2;
    const duration = 5000;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const current = startAngle + targetAngle * easeOut(t);
      angleRef.current = current;
      drawWheel(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setSpinning(false);
        setDone(true);
        setWinner(DEALS[targetSlice]);
        onResult(DEALS[targetSlice]);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {/* pointer */}
      <div style={{ width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `32px solid ${GOLD}`, filter: "drop-shadow(0 2px 6px rgba(201,168,76,0.6))", marginBottom: -4, zIndex: 10 }} />
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={520} height={520} style={{ display: "block", maxWidth: "100%", borderRadius: "50%", border: `4px solid #1a1a1a` }} />
      </div>
      {!done && (
        <button
          onClick={spin}
          disabled={spinning}
          style={{
            marginTop: 28,
            background: spinning ? "#1a1a1a" : `linear-gradient(180deg, ${GOLD2} 0%, ${GOLD} 100%)`,
            color: spinning ? "#555" : "#000",
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "0.14em",
            padding: "16px 64px",
            border: `2px solid ${GOLD}`,
            borderRadius: 3,
            cursor: spinning ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: spinning ? "none" : `0 0 24px rgba(201,168,76,0.3)`,
          }}
        >
          {spinning ? "SPINNING..." : "SPIN FOR TODAY'S DEAL"}
        </button>
      )}
    </div>
  );
}

function DealResult({ deal, onReserve, onPayFull }) {
  const [endTime] = useState(() => Date.now() + 10 * 60 * 1000);
  const { rem, mins, secs, expired } = useCountdown(endTime);
  const [claimed, setClaimed] = useState(false);

  const product = PRODUCTS.find(p => deal.cat === "Any" || deal.cat === "Featured" ? true : p.cat === deal.cat) || PRODUCTS[0];
  const salePrice = Math.round((product.sale ?? product.price) * (1 - deal.pct / 100));
  const savings = product.price - salePrice;
  const catLabel = deal.cat === "Any" ? "any item in the store" : deal.cat === "Featured" ? "today's featured item" : `all ${deal.cat}`;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", animation: "fadeUp 0.5s ease" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Winner banner */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, color: "#555", letterSpacing: "0.2em", marginBottom: 6 }}>YOU LANDED ON</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 52, fontWeight: 700, color: GOLD, letterSpacing: "0.04em", lineHeight: 1, textShadow: `0 0 40px rgba(201,168,76,0.4)` }}>{deal.label}</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, color: "#e8e0d0", letterSpacing: "0.12em", marginTop: 4 }}>{deal.sublabel}</div>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#666", fontSize: 13, marginTop: 8 }}>Applied to {catLabel}</div>
      </div>

      {/* Countdown */}
      {!claimed && !expired && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28, padding: "16px", background: "#0d0d0d", border: `1px solid ${rem < 60000 ? "#c0392b" : "#2a2a2a"}`, borderRadius: 3, transition: "border-color 0.5s" }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, color: "#555", letterSpacing: "0.2em" }}>OFFER EXPIRES IN</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 48, fontWeight: 700, color: rem < 60000 ? "#c0392b" : GOLD, letterSpacing: "0.06em", lineHeight: 1, transition: "color 0.5s", minWidth: 130, textAlign: "center" }}>
            {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
        </div>
      )}
      {expired && !claimed && (
        <div style={{ textAlign: "center", padding: "16px", marginBottom: 20, background: "#1a0000", border: "1px solid #c0392b", borderRadius: 3, fontFamily: "'Oswald', sans-serif", fontSize: 14, color: "#c0392b", letterSpacing: "0.1em" }}>
          OFFER EXPIRED — CHECK BACK TOMORROW
        </div>
      )}
      {claimed && (
        <div style={{ textAlign: "center", padding: "20px", marginBottom: 20, background: "#0d1a0d", border: "1px solid #2a5a2a", borderRadius: 3 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, color: "#4caf50", letterSpacing: "0.1em" }}>✓ RESERVATION RECEIVED</div>
          <div style={{ color: "#777", fontSize: 13, marginTop: 6, fontStyle: "italic" }}>Come in within 48 hours to complete your purchase and paperwork.</div>
        </div>
      )}

      {/* Product */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start", background: "#111", border: "1px solid #1e1e1e", borderRadius: 3, padding: 24 }}>
        <div style={{ aspectRatio: "4/3", background: "#161616", border: "1px solid #1e1e1e", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
            <rect x="2" y="20" width="52" height="10" rx="2" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="1"/>
            <rect x="16" y="12" width="36" height="8" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
            <rect x="10" y="28" width="10" height="14" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
            <circle cx="56" cy="25" r="8" fill="none" stroke="#3a3a3a" strokeWidth="1.5"/>
            <circle cx="56" cy="25" r="3" fill="#2a2a2a"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'Oswald', sans-serif" }}>{product.cat}</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, color: "#e8e0d0", fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>{product.name}</div>
          <div style={{ fontStyle: "italic", color: "#666", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{product.desc}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, color: GOLD, fontWeight: 700 }}>${salePrice.toLocaleString()}</span>
            <span style={{ fontSize: 15, color: "#444", textDecoration: "line-through" }}>${product.price.toLocaleString()}</span>
          </div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, color: "#4caf50", letterSpacing: "0.1em", marginBottom: 16 }}>TODAY ONLY — SAVE ${savings.toLocaleString()}</div>
          {!claimed && !expired && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { setClaimed(true); onReserve(product, salePrice); }} style={{ width: "100%", background: GOLD, color: "#000", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.1em", padding: "12px 0", border: "none", borderRadius: 2, cursor: "pointer" }}>
                RESERVE IT · ${product.deposit} DEPOSIT
              </button>
              <button onClick={() => { setClaimed(true); onPayFull(product, salePrice); }} style={{ width: "100%", background: "transparent", color: "#e8e0d0", fontFamily: "'Oswald', sans-serif", fontSize: 13, letterSpacing: "0.08em", padding: "10px 0", border: "1px solid #333", borderRadius: 2, cursor: "pointer" }}>
                PAY IN FULL · ${salePrice.toLocaleString()}
              </button>
              <div style={{ fontSize: 10, color: "#444", textAlign: "center", fontStyle: "italic" }}>FFL paperwork completed in-store. Valid ID required.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ product, price, type, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name && form.email && form.phone;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#111", border: `1px solid ${GOLD}`, borderRadius: 3, padding: "2rem", width: "100%", maxWidth: 400, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 10, right: 14, background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>×</button>
        {!done ? (
          <>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, color: GOLD, letterSpacing: "0.1em", marginBottom: 3 }}>{type === "deposit" ? "RESERVE THIS ITEM" : "PAY IN FULL"}</div>
            <div style={{ fontStyle: "italic", color: "#666", fontSize: 12, marginBottom: 18 }}>{product.name} · ${price.toLocaleString()}</div>
            {[["Full Name","name","text"],["Email Address","email","email"],["Phone Number","phone","tel"]].map(([label, key, t]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, color: "#555", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>{label.toUpperCase()}</label>
                <input type={t} value={form[key]} onChange={e => set(key, e.target.value)} style={{ width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e0d0", padding: "8px 12px", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ padding: "12px 14px", background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 2, marginBottom: 16, marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#666", fontFamily: "'Oswald', sans-serif" }}>{type === "deposit" ? "DEPOSIT" : "TOTAL"} DUE NOW</span>
                <span style={{ fontSize: 16, color: GOLD, fontFamily: "'Oswald', sans-serif", fontWeight: 700 }}>${(type === "deposit" ? product.deposit : price).toLocaleString()}</span>
              </div>
              {type === "deposit" && <div style={{ fontSize: 10, color: "#444", marginTop: 4, fontStyle: "italic" }}>Balance of ${(price - product.deposit).toLocaleString()} due in-store</div>}
            </div>
            <button onClick={() => setDone(true)} disabled={!valid} style={{ width: "100%", background: valid ? GOLD : "#333", color: valid ? "#000" : "#666", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.1em", padding: "12px 0", border: "none", borderRadius: 2, cursor: valid ? "pointer" : "not-allowed" }}>
              PROCEED TO PAYMENT →
            </button>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "#333", fontStyle: "italic" }}>Redirects to secure payment processor</div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: 42, color: "#4caf50", marginBottom: 12 }}>✓</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, color: "#4caf50", letterSpacing: "0.1em", marginBottom: 10 }}>YOU'RE ALL SET</div>
            <div style={{ color: "#777", fontSize: 13, lineHeight: 1.7 }}>
              Confirmation sent to <strong style={{ color: "#e8e0d0" }}>{form.email}</strong>. Come in within 48 hours with valid ID.
              {(product.sku || product.serial) && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 2, textAlign: "left" }}>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 10, color: "#555", letterSpacing: "0.15em", marginBottom: 6 }}>YOUR ITEM REFERENCE</div>
                  {product.sku && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#555", fontSize: 12 }}>SKU</span>
                    <span style={{ color: "#e8e0d0", fontSize: 12, fontFamily: "'Courier New', monospace" }}>{product.sku}</span>
                  </div>}
                  {product.serial && maskSerial(product.serial) && <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#555", fontSize: 12 }}>Serial</span>
                    <span style={{ color: GOLD, fontSize: 12, fontFamily: "'Courier New', monospace" }}>{maskSerial(product.serial)}</span>
                  </div>}
                </div>
              )}
              <br /><em>Questions? Call (555) 748-2291</em>
            </div>
            <button onClick={onClose} style={{ marginTop: 20, background: "transparent", border: `1px solid ${GOLD}`, color: GOLD, fontFamily: "'Oswald', sans-serif", fontSize: 13, padding: "9px 28px", borderRadius: 2, cursor: "pointer", letterSpacing: "0.08em" }}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ p, onReserve }) {
  const [hov, setHov] = useState(false);
  const dp = p.sale ?? p.price;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: "#111", border: `1px solid ${hov ? GOLD : "#1e1e1e"}`, borderRadius: 3, overflow: "hidden", transition: "transform 0.18s, border-color 0.18s", transform: hov ? "translateY(-3px)" : "none" }}>
      <div style={{ aspectRatio: "4/3", background: "#161616", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderBottom: "1px solid #1e1e1e" }}>
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <rect x="2" y="16" width="42" height="8" rx="2" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="1"/>
          <rect x="12" y="10" width="30" height="6" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
          <rect x="8" y="22" width="8" height="12" rx="1" fill="#222" stroke="#3a3a3a" strokeWidth="1"/>
          <circle cx="46" cy="20" r="7" fill="none" stroke="#3a3a3a" strokeWidth="1.5"/>
        </svg>
        {p.sale && <span style={{ position: "absolute", top: 7, right: 7, background: "#7a1515", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 1, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.08em" }}>SALE</span>}
      </div>
      <div style={{ padding: "11px 13px 13px" }}>
        <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3, fontFamily: "'Oswald', sans-serif" }}>{p.cat}</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, color: "#e8e0d0", fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>{p.name}</div>
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>{p.desc}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: p.deposit > 0 ? 8 : 0 }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, color: GOLD, fontWeight: 700 }}>${dp.toLocaleString()}</span>
          {p.sale && <span style={{ fontSize: 11, color: "#444", textDecoration: "line-through" }}>${p.price.toLocaleString()}</span>}
        </div>
        {onReserve && p.deposit > 0 && (
          <button onClick={() => onReserve(p)} onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = "#000"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = GOLD; }} style={{ width: "100%", background: "transparent", border: `1px solid ${GOLD}`, color: GOLD, fontFamily: "'Oswald', sans-serif", fontSize: 11, padding: "6px 0", borderRadius: 2, cursor: "pointer", letterSpacing: "0.08em", transition: "all 0.15s" }}>
            RESERVE · ${p.deposit} DEPOSIT
          </button>
        )}
      </div>
    </div>
  );
}

function AdminLogin({ onLogin, onBack }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw === ADMIN_PASS) onLogin(); else { setErr(true); setTimeout(() => setErr(false), 2000); } };
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');`}</style>
      <div style={{ background: "#111", border: `1px solid ${GOLD}`, borderRadius: 3, padding: "2.5rem", width: 320, textAlign: "center" }}>
        <Logo size={46} />
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, color: GOLD, letterSpacing: "0.22em", margin: "1rem 0 1.5rem" }}>ADMIN ACCESS</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Password"
          style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${err ? "#c0392b" : "#1e1e1e"}`, color: "#e8e0d0", padding: "9px 14px", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: err ? 8 : 14 }} />
        {err && <div style={{ color: "#c0392b", fontSize: 12, fontStyle: "italic", marginBottom: 10 }}>Incorrect password</div>}
        <button onClick={submit} style={{ width: "100%", background: GOLD, color: "#000", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.1em", padding: "11px 0", border: "none", borderRadius: 2, cursor: "pointer" }}>ENTER</button>
        <button onClick={onBack} style={{ marginTop: 12, background: "transparent", border: "none", color: "#444", fontFamily: "'Oswald', sans-serif", fontSize: 11, cursor: "pointer", letterSpacing: "0.1em" }}>← BACK TO SITE</button>
        <div style={{ fontSize: 10, color: "#333", marginTop: 8, fontStyle: "italic" }}>Demo: gristmill2024</div>
      </div>
    </div>
  );
}

function AdminPanel({ onClose }) {
  const [products, setProducts] = useState(PRODUCTS);
  const [editing, setEditing] = useState(null);
  const BLANK = { id: 0, name: "", cat: "Rifles", price: "", sale: "", desc: "", specs: "", img: "", deal: false, deposit: "100", serial: "", sku: "" };
  const [form, setForm] = useState(BLANK);
  const [imgPreview, setImgPreview] = useState("");
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openEdit = p => { setEditing(p.id); setForm({ ...p, price: String(p.price), sale: p.sale != null ? String(p.sale) : "", deposit: String(p.deposit), serial: p.serial || "", sku: p.sku || "" }); setImgPreview(p.img || ""); };
  const openNew = () => { setEditing("new"); setForm({ ...BLANK, id: Date.now() }); setImgPreview(""); };
  const save = () => {
    const p = { ...form, price: Number(form.price), sale: form.sale ? Number(form.sale) : null, deposit: Number(form.deposit) || 0, img: imgPreview };
    if (editing === "new") setProducts(ps => [...ps, p]);
    else setProducts(ps => ps.map(x => x.id === p.id ? p : x));
    setEditing(null);
  };
  const del = id => setProducts(ps => ps.filter(p => p.id !== id));
  const handleImg = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setImgPreview(ev.target.result); set("img", ev.target.result); }; r.readAsDataURL(f); };

  const iStyle = { width: "100%", background: "#0a0a0a", border: "1px solid #222", color: "#e8e0d0", padding: "8px 12px", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lStyle = { display: "block", fontSize: 9, color: "#555", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.14em", marginBottom: 4 };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e0d0" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');`}</style>
      <div style={{ background: "#0d0d0d", borderBottom: `2px solid ${GOLD}`, padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", gap: 14 }}>
        <Logo size={36} />
        <div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, color: GOLD, letterSpacing: "0.18em" }}>ADMIN PANEL</div>
          <div style={{ fontSize: 10, color: "#444", fontStyle: "italic" }}>Gristmill Guns & Optics</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #2a2a2a", color: "#777", fontFamily: "'Oswald', sans-serif", fontSize: 11, padding: "6px 14px", borderRadius: 2, cursor: "pointer", letterSpacing: "0.08em" }}>← BACK TO SITE</button>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 980, margin: "0 auto" }}>
        {editing ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, color: GOLD, letterSpacing: "0.1em" }}>{editing === "new" ? "ADD NEW PRODUCT" : "EDIT PRODUCT"}</div>
              <button onClick={() => setEditing(null)} style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#777", fontFamily: "'Oswald', sans-serif", fontSize: 11, padding: "6px 14px", borderRadius: 2, cursor: "pointer" }}>CANCEL</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Product Name", "name", "text"], ["Regular Price ($)", "price", "number"], ["Sale Price (optional)", "sale", "number"], ["Deposit Amount ($)", "deposit", "number"]].map(([l, k, t]) => (
                  <div key={k}><label style={lStyle}>{l.toUpperCase()}</label><input type={t} value={form[k]} onChange={e => set(k, e.target.value)} style={iStyle} /></div>
                ))}
                <div><label style={lStyle}>CATEGORY</label>
                  <select value={form.cat} onChange={e => set("cat", e.target.value)} style={iStyle}>
                    {CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lStyle}>DESCRIPTION</label><textarea value={form.desc} onChange={e => set("desc", e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical" }} /></div>
                <div><label style={lStyle}>SPECS (separate with " | ")</label><input type="text" value={form.specs} onChange={e => set("specs", e.target.value)} placeholder='Caliber: 9mm | Barrel: 4" | Capacity: 17+1' style={{ ...iStyle, fontFamily: "'Courier New', monospace", fontSize: 11 }} /></div>

                {/* SERIAL & SKU — admin only */}
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 12, marginTop: 4 }}>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 10, color: "#444", letterSpacing: "0.16em", marginBottom: 10 }}>UNIT TRACKING — ADMIN ONLY</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={lStyle}>SERIAL NUMBER</label>
                      <input type="text" value={form.serial} onChange={e => set("serial", e.target.value)} placeholder="e.g. G2274519" style={{ ...iStyle, fontFamily: "'Courier New', monospace", fontSize: 12 }} />
                      <div style={{ fontSize: 9, color: "#333", marginTop: 3, fontStyle: "italic" }}>Customer sees: {form.serial ? maskSerial(form.serial) : "—"}</div>
                    </div>
                    <div>
                      <label style={lStyle}>SKU / ITEM NUMBER</label>
                      <input type="text" value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. WIN-M70-3006" style={{ ...iStyle, fontFamily: "'Courier New', monospace", fontSize: 12 }} />
                    </div>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.deal} onChange={e => set("deal", e.target.checked)} style={{ width: 15, height: 15, accentColor: GOLD }} />
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 12, color: GOLD, letterSpacing: "0.08em" }}>SET AS TODAY'S DEAL OF THE DAY</span>
                </label>
              </div>

              <div>
                <label style={lStyle}>PRODUCT PHOTO</label>
                <div onClick={() => fileRef.current.click()} onMouseEnter={e => e.currentTarget.style.borderColor = GOLD} onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}
                  style={{ aspectRatio: "4/3", background: "#0d0d0d", border: "2px dashed #1e1e1e", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", transition: "border-color 0.2s" }}>
                  {imgPreview ? <img src={imgPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
                    <div style={{ textAlign: "center", color: "#333" }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>↑</div>
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 12, letterSpacing: "0.1em" }}>CLICK TO UPLOAD</div>
                      <div style={{ fontSize: 10, marginTop: 3, fontStyle: "italic", color: "#2a2a2a" }}>JPG / PNG → Cloudinary</div>
                    </div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display: "none" }} />
                {imgPreview && <button onClick={() => { setImgPreview(""); set("img", ""); }} style={{ marginTop: 6, background: "transparent", border: "1px solid #222", color: "#555", fontSize: 10, padding: "3px 10px", borderRadius: 2, cursor: "pointer", fontFamily: "'Oswald', sans-serif" }}>REMOVE</button>}
              </div>
            </div>
            <button onClick={save} style={{ marginTop: 24, background: GOLD, color: "#000", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.1em", padding: "12px 36px", border: "none", borderRadius: 2, cursor: "pointer" }}>SAVE PRODUCT</button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, color: GOLD, letterSpacing: "0.1em" }}>INVENTORY ({products.length} items)</div>
              <button onClick={openNew} style={{ background: GOLD, color: "#000", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", padding: "8px 18px", border: "none", borderRadius: 2, cursor: "pointer" }}>+ ADD PRODUCT</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {products.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#111", border: `1px solid ${p.deal ? "rgba(201,168,76,0.25)" : "#1a1a1a"}`, borderRadius: 2, padding: "10px 14px" }}>
                  <div style={{ width: 48, height: 36, background: "#161616", borderRadius: 2, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.img ? <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 16, opacity: 0.15 }}>🔫</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, color: "#e8e0d0", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      {p.name}
                      {p.deal && <span style={{ background: GOLD, color: "#000", fontSize: 8, padding: "2px 5px", borderRadius: 1, fontWeight: 700, letterSpacing: "0.1em" }}>DEAL</span>}
                      {p.sale && <span style={{ background: "#7a1515", color: "#fff", fontSize: 8, padding: "2px 5px", borderRadius: 1 }}>SALE</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "#444", fontFamily: "'Oswald', sans-serif", marginTop: 2 }}>
                      {p.cat} · ${p.price}{p.sale ? ` → $${p.sale}` : ""} · Deposit: ${p.deposit}
                      {p.sku && <span style={{ color: "#333", fontFamily: "'Courier New', monospace", marginLeft: 8 }}>SKU: {p.sku}</span>}
                      {p.serial && <span style={{ color: "#333", fontFamily: "'Courier New', monospace", marginLeft: 8 }}>S/N: {p.serial}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(p)} style={{ background: "transparent", border: "1px solid #2a2a2a", color: GOLD, fontFamily: "'Oswald', sans-serif", fontSize: 10, padding: "4px 9px", borderRadius: 2, cursor: "pointer", letterSpacing: "0.06em" }}>EDIT</button>
                    <button onClick={() => del(p.id)} style={{ background: "transparent", border: "1px solid #330000", color: "#7a1515", fontFamily: "'Oswald', sans-serif", fontSize: 10, padding: "4px 9px", borderRadius: 2, cursor: "pointer", letterSpacing: "0.06em" }}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GristmillPage() {
  const [spinResult, setSpinResult] = useState(null);
  const [modal, setModal] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [view, setView] = useState("site");

  const filtered = catFilter === "All" ? PRODUCTS : PRODUCTS.filter(p => p.cat === catFilter);

  if (view === "adminlogin") {
    return <AdminLogin onLogin={() => setView("admin")} onBack={() => setView("site")} />;
  }

  if (view === "admin") {
    return <AdminPanel onClose={() => setView("site")} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e0d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#050505", borderBottom: `2px solid ${GOLD}`, padding: "0 2rem", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, padding: "0.85rem 0" }}>
          <Logo size={46} />
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "0.1em", lineHeight: 1 }}>GRISTMILL</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 10, color: GOLD, letterSpacing: "0.24em" }}>GUNS & OPTICS</div>
          </div>
          <div style={{ marginLeft: "auto", fontFamily: "'Oswald', sans-serif", fontSize: 11, color: "#555", letterSpacing: "0.1em" }}>
            (555) 748-2291 &nbsp;·&nbsp; 1 Mill Road
          </div>
        </div>
      </header>

      {/* HERO — SPINNER */}
      <section style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a0a 100%)", borderBottom: `1px solid #1a1a1a`, padding: "3rem 2rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* eyebrow */}
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, color: "#555", letterSpacing: "0.28em", marginBottom: 10 }}>EVERY DAY · ONE DEAL · LIMITED TIME</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 38, fontWeight: 700, color: "white", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 6 }}>DAILY DEAL SPINNER</div>
          <div style={{ width: 48, height: 2, background: GOLD, margin: "0 auto 12px" }} />
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#555", fontSize: 14, marginBottom: 32 }}>
            Spin once a day for an exclusive in-store discount. Claim it before the clock runs out.
          </div>

          {!spinResult ? (
            <SpinnerWheel onResult={setSpinResult} />
          ) : (
            <DealResult
              deal={spinResult}
              onReserve={(p, price) => setModal({ product: p, type: "deposit", price })}
              onPayFull={(p, price) => setModal({ product: p, type: "full", price })}
            />
          )}
        </div>
      </section>

      {/* CATALOG */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 9, color: "#444", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 4 }}>BROWSE OUR INVENTORY</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>IN-STORE CATALOG</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ background: catFilter === c ? `${GOLD}18` : "transparent", border: `1px solid ${catFilter === c ? GOLD : "#1e1e1e"}`, color: catFilter === c ? GOLD : "#555", fontFamily: "'Oswald', sans-serif", fontSize: 10, padding: "5px 12px", borderRadius: 2, cursor: "pointer", letterSpacing: "0.12em", transition: "all 0.2s" }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {filtered.map(p => <ProductCard key={p.id} p={p} onReserve={p => setModal({ product: p, type: "deposit", price: p.sale ?? p.price })} />)}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#050505", borderTop: "1px solid #141414", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 11, color: "#333", fontStyle: "italic" }}>Gristmill Guns & Optics · 1 Mill Road · (555) 748-2291 · All sales require valid ID & background check</div>
          <button onClick={() => setView("adminlogin")} style={{ background: "transparent", border: "none", color: "#1e1e1e", fontSize: 10, cursor: "pointer", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.1em", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#555"} onMouseLeave={e => e.currentTarget.style.color = "#1e1e1e"}>ADMIN</button>
        </div>
      </footer>

      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}
