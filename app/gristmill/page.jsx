"use client";
import { useState, useEffect, useRef } from "react";

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS = [
  { id:1, name:"Ruger 10/22 Carbine", cat:"Rifles", price:349, sale:299, desc:"The classic .22 LR semi-auto. Reliable, accurate, perfect for plinking or small game.", img:"", specs:"Caliber: .22 LR | Capacity: 10+1 | Barrel: 18.5\"", deal:false, deposit:50 },
  { id:2, name:"Mossberg 500 Field", cat:"Shotguns", price:489, sale:null, desc:"Pump-action 12-gauge. A working gun for hunters and home defense alike.", img:"", specs:"Gauge: 12 | Barrel: 28\" | Capacity: 5+1", deal:false, deposit:75 },
  { id:3, name:"Smith & Wesson M&P 9", cat:"Handguns", price:599, sale:549, desc:"Full-size polymer 9mm. Trusted by law enforcement and civilian shooters.", img:"", specs:"Caliber: 9mm | Capacity: 17+1 | Barrel: 4.25\"", deal:false, deposit:100 },
  { id:4, name:"Winchester Model 70", cat:"Rifles", price:899, sale:null, desc:"The Rifleman's Rifle. Controlled-round feeding, crisp trigger, legendary accuracy.", img:"", specs:"Caliber: .30-06 | Capacity: 5 | Barrel: 22\"", deal:true, deposit:150 },
  { id:5, name:"Glock 43X", cat:"Handguns", price:479, sale:null, desc:"Slim, reliable 9mm for everyday carry. 10+1 capacity in a compact frame.", img:"", specs:"Caliber: 9mm | Capacity: 10+1 | Barrel: 3.41\"", deal:false, deposit:75 },
  { id:6, name:"Vortex Crossfire II 3-9x40", cat:"Optics", price:179, sale:159, desc:"Crystal-clear glass, precise adjustments. Hard to beat at this price point.", img:"", specs:"Magnification: 3-9x | Objective: 40mm | FOV: 12.6–4.2ft/100yd", deal:false, deposit:30 },
  { id:7, name:"Henry Golden Boy .22 LR", cat:"Rifles", price:549, sale:null, desc:"Lever-action rimfire with a brass receiver. A piece of American heritage.", img:"", specs:"Caliber: .22 LR | Capacity: 16 | Barrel: 20\"", deal:false, deposit:100 },
  { id:8, name:"Hornady 9mm 124gr FMJ 500rd", cat:"Ammunition", price:219, sale:189, desc:"Brass-cased, boxer-primed. Clean and consistent for range sessions.", img:"", specs:"Caliber: 9mm | Bullet: 124gr FMJ | Count: 500 rounds", deal:false, deposit:0 },
  { id:9, name:"Leupold VX-Freedom 2-7x33", cat:"Optics", price:299, sale:null, desc:"Made in Oregon. Fog-proof, waterproof, shockproof. Built for the field.", img:"", specs:"Magnification: 2-7x | Objective: 33mm | Weight: 9.3oz", deal:false, deposit:50 },
  { id:10, name:"Colt 1911 Government .45 ACP", cat:"Handguns", price:849, sale:null, desc:"Over a century of service. Single-action .45 ACP with a trigger like glass.", img:"", specs:"Caliber: .45 ACP | Capacity: 7+1 | Barrel: 5\"", deal:false, deposit:150 },
];

const CATS = ["All","Rifles","Shotguns","Handguns","Optics","Ammunition","Accessories"];
const ADMIN_PASS = "gristmill2024";
const GOLD = "#c9a84c";
const DARK = "#0a0a0a";

// ── LOGO SVG ──────────────────────────────────────────────────────────────
function Logo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="100,18 170,70 170,130 30,130 30,70" fill="none" stroke={GOLD} strokeWidth="6"/>
      <line x1="30" y1="70" x2="170" y2="70" stroke={GOLD} strokeWidth="4"/>
      <rect x="68" y="52" width="10" height="20" rx="3" fill={GOLD}/>
      <rect x="122" y="52" width="10" height="20" rx="3" fill={GOLD}/>
      <circle cx="100" cy="100" r="36" fill="none" stroke="white" strokeWidth="6"/>
      <circle cx="100" cy="100" r="10" fill="none" stroke="white" strokeWidth="4"/>
      <circle cx="100" cy="100" r="3" fill="white"/>
      <line x1="100" y1="64" x2="100" y2="78" stroke="white" strokeWidth="4"/>
      <line x1="100" y1="122" x2="100" y2="136" stroke="white" strokeWidth="4"/>
      <line x1="64" y1="100" x2="78" y2="100" stroke="white" strokeWidth="4"/>
      <line x1="122" y1="100" x2="136" y2="100" stroke="white" strokeWidth="4"/>
      <line x1="30" y1="130" x2="170" y2="130" stroke={GOLD} strokeWidth="4"/>
    </svg>
  );
}

// ── COUNTDOWN HOOK ────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRemaining(Math.max(0, endTime - Date.now()));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endTime]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return { remaining, mins, secs, expired: remaining === 0 };
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────
function ProductCard({ p, onReserve }) {
  const displayPrice = p.sale ?? p.price;
  return (
    <div style={{
      background:"#111", border:`1px solid #2a2a2a`,
      borderRadius:4, overflow:"hidden",
      transition:"transform 0.2s, border-color 0.2s",
      cursor:"default",
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor=GOLD}}
    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor="#2a2a2a"}}
    >
      {/* Image */}
      <div style={{
        width:"100%", aspectRatio:"4/3", background:"#1a1a1a",
        display:"flex", alignItems:"center", justifyContent:"center",
        borderBottom:"1px solid #2a2a2a", position:"relative", overflow:"hidden"
      }}>
        {p.img
          ? <img src={p.img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
              <rect x="2" y="18" width="44" height="8" rx="2" fill="#333"/>
              <rect x="14" y="10" width="32" height="6" rx="1" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
              <rect x="10" y="24" width="8" height="10" rx="1" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
              <circle cx="46" cy="22" r="6" fill="none" stroke="#444" strokeWidth="1.5"/>
              <circle cx="46" cy="22" r="2" fill="#333"/>
            </svg>
        }
        {p.sale && <span style={{position:"absolute",top:8,right:8,background:"#8b1a1a",color:"#fff",fontSize:11,padding:"3px 8px",borderRadius:2,fontFamily:"'Oswald',sans-serif",letterSpacing:"0.08em"}}>SALE</span>}
      </div>
      {/* Body */}
      <div style={{padding:"14px 16px 16px"}}>
        <div style={{fontSize:10,color:"#666",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4,fontFamily:"'Oswald',sans-serif"}}>{p.cat}</div>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,color:"#e8e0d0",fontWeight:600,lineHeight:1.25,marginBottom:6}}>{p.name}</div>
        <div style={{fontSize:12,color:"#666",lineHeight:1.5,marginBottom:8,fontFamily:"Georgia,serif",fontStyle:"italic"}}>{p.desc}</div>
        {p.specs && <div style={{fontSize:10,color:"#555",marginBottom:10,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{p.specs.split(" | ").map((s,i)=><span key={i} style={{display:"block"}}>· {s}</span>)}</div>}
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:8}}>
          <span style={{fontFamily:"'Oswald',sans-serif",fontSize:20,color:GOLD,fontWeight:700}}>${displayPrice.toLocaleString()}</span>
          {p.sale && <span style={{fontSize:13,color:"#555",textDecoration:"line-through"}}>${p.price.toLocaleString()}</span>}
          {p.sale && <span style={{fontSize:11,color:"#8b1a1a",marginLeft:"auto"}}>Save ${(p.price-p.sale).toLocaleString()}</span>}
        </div>
        {onReserve && p.deposit > 0 && (
          <button onClick={()=>onReserve(p)} style={{
            marginTop:12, width:"100%", background:"transparent",
            border:`1px solid ${GOLD}`, color:GOLD,
            fontFamily:"'Oswald',sans-serif", fontSize:13,
            padding:"7px 0", borderRadius:2, cursor:"pointer",
            letterSpacing:"0.08em", transition:"all 0.2s"
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=GOLD;e.currentTarget.style.color="#000"}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=GOLD}}
          >RESERVE · ${p.deposit} DEPOSIT</button>
        )}
      </div>
    </div>
  );
}

// ── DEAL OF THE DAY ───────────────────────────────────────────────────────
function DealOfTheDay({ product, onReserve, onPayFull }) {
  const [revealed, setRevealed] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const { remaining, mins, secs, expired } = useCountdown(endTime);
  const [claimed, setClaimed] = useState(false);

  const reveal = () => {
    setRevealed(true);
    setEndTime(Date.now() + 10 * 60 * 1000);
  };

  const salePrice = product ? Math.round((product.sale ?? product.price) * 0.88) : 0;
  const savings = product ? (product.price - salePrice) : 0;

  if (!product) return (
    <div style={{textAlign:"center",padding:"3rem",color:"#444",fontFamily:"'Oswald',sans-serif",fontSize:18,letterSpacing:"0.1em"}}>
      NO DEAL ACTIVE TODAY — CHECK BACK SOON
    </div>
  );

  return (
    <div style={{maxWidth:700,margin:"0 auto"}}>
      {!revealed ? (
        /* ── UNREVEALED ── */
        <div style={{textAlign:"center",padding:"2rem 1rem"}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,color:"#666",letterSpacing:"0.2em",marginBottom:8}}>TODAY ONLY</div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:32,color:"#e8e0d0",fontWeight:700,marginBottom:4}}>DEAL OF THE DAY</div>
          <div style={{fontFamily:"Georgia,serif",fontStyle:"italic",color:"#888",marginBottom:32}}>One item. One day. Once you reveal it, your clock starts.</div>
          <div style={{
            width:180,height:180,margin:"0 auto 2rem",
            background:"#111",border:`2px solid #2a2a2a`,
            borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
            position:"relative",overflow:"hidden"
          }}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%, #1a1a1a, #0a0a0a)"}}/>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{position:"relative",zIndex:1,opacity:0.2}}>
              <circle cx="36" cy="36" r="32" stroke={GOLD} strokeWidth="3"/>
              <circle cx="36" cy="36" r="12" stroke={GOLD} strokeWidth="2"/>
              <circle cx="36" cy="36" r="3" fill={GOLD}/>
              <line x1="36" y1="4" x2="36" y2="20" stroke={GOLD} strokeWidth="2"/>
              <line x1="36" y1="52" x2="36" y2="68" stroke={GOLD} strokeWidth="2"/>
              <line x1="4" y1="36" x2="20" y2="36" stroke={GOLD} strokeWidth="2"/>
              <line x1="52" y1="36" x2="68" y2="36" stroke={GOLD} strokeWidth="2"/>
            </svg>
          </div>
          <button onClick={reveal} style={{
            background:GOLD, color:"#000",
            fontFamily:"'Oswald',sans-serif", fontWeight:700,
            fontSize:18, letterSpacing:"0.12em",
            padding:"14px 48px", border:"none",
            borderRadius:2, cursor:"pointer",
            transition:"opacity 0.2s"
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity=0.85}
          onMouseLeave={e=>e.currentTarget.style.opacity=1}
          >REVEAL TODAY'S DEAL</button>
        </div>
      ) : (
        /* ── REVEALED ── */
        <div>
          {/* Countdown */}
          {!claimed && !expired && (
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:16,
              padding:"12px 0 20px",marginBottom:8
            }}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:12,color:"#888",letterSpacing:"0.15em"}}>OFFER EXPIRES IN</div>
              <div style={{
                fontFamily:"'Oswald',sans-serif",fontSize:36,fontWeight:700,
                color: remaining < 60000 ? "#c0392b" : GOLD,
                letterSpacing:"0.1em",
                transition:"color 0.5s"
              }}>
                {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
              </div>
            </div>
          )}
          {expired && !claimed && (
            <div style={{textAlign:"center",padding:"12px 0 20px",fontFamily:"'Oswald',sans-serif",fontSize:14,color:"#c0392b",letterSpacing:"0.1em"}}>
              OFFER EXPIRED — CHECK BACK TOMORROW
            </div>
          )}
          {claimed && (
            <div style={{textAlign:"center",padding:"16px",marginBottom:16,background:"#0d1a0d",border:"1px solid #2a5a2a",borderRadius:4}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,color:"#4caf50",letterSpacing:"0.1em"}}>✓ RESERVATION RECEIVED</div>
              <div style={{color:"#888",fontSize:13,marginTop:6,fontFamily:"Georgia,serif"}}>We'll hold this for you. Come in within 48 hours to complete your purchase and paperwork.</div>
            </div>
          )}

          {/* Product */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"start"}}>
            <div style={{
              aspectRatio:"4/3",background:"#1a1a1a",border:`1px solid #2a2a2a`,
              borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"
            }}>
              {product.img
                ? <img src={product.img} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:4}}/>
                : <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
                    <rect x="2" y="22" width="56" height="10" rx="2" fill="#333"/>
                    <rect x="18" y="12" width="40" height="8" rx="1" fill="#2a2a2a" stroke="#555" strokeWidth="1.5"/>
                    <rect x="12" y="30" width="10" height="14" rx="1" fill="#2a2a2a" stroke="#555" strokeWidth="1.5"/>
                    <circle cx="58" cy="27" r="8" fill="none" stroke="#555" strokeWidth="2"/>
                    <circle cx="58" cy="27" r="3" fill="#333"/>
                  </svg>
              }
            </div>
            <div>
              <div style={{fontSize:10,color:"#666",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6,fontFamily:"'Oswald',sans-serif"}}>{product.cat}</div>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:24,color:"#e8e0d0",fontWeight:700,lineHeight:1.2,marginBottom:10}}>{product.name}</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:13,color:"#888",fontStyle:"italic",lineHeight:1.6,marginBottom:12}}>{product.desc}</div>
              {product.specs && <div style={{fontSize:11,color:"#555",fontFamily:"'Courier New',monospace",lineHeight:1.8,marginBottom:16}}>
                {product.specs.split(" | ").map((s,i)=><div key={i}>· {s}</div>)}
              </div>}

              <div style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontSize:32,color:GOLD,fontWeight:700}}>${salePrice.toLocaleString()}</span>
                  <span style={{fontSize:16,color:"#555",textDecoration:"line-through"}}>${product.price.toLocaleString()}</span>
                </div>
                <div style={{fontSize:12,color:"#4caf50",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.08em"}}>TODAY ONLY — SAVE ${savings.toLocaleString()}</div>
              </div>

              {!claimed && !expired && (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <button onClick={()=>{setClaimed(true);onReserve(product,salePrice)}} style={{
                    background:GOLD, color:"#000",
                    fontFamily:"'Oswald',sans-serif", fontWeight:700,
                    fontSize:15, letterSpacing:"0.1em",
                    padding:"12px 0", border:"none",
                    borderRadius:2, cursor:"pointer", width:"100%"
                  }}>RESERVE IT · ${product.deposit} DEPOSIT</button>
                  <button onClick={()=>{setClaimed(true);onPayFull(product,salePrice)}} style={{
                    background:"transparent", color:"#e8e0d0",
                    fontFamily:"'Oswald',sans-serif", fontWeight:600,
                    fontSize:14, letterSpacing:"0.08em",
                    padding:"11px 0", border:"1px solid #444",
                    borderRadius:2, cursor:"pointer", width:"100%"
                  }}>PAY IN FULL · ${salePrice.toLocaleString()}</button>
                  <div style={{fontSize:11,color:"#555",textAlign:"center",fontFamily:"Georgia,serif",fontStyle:"italic"}}>
                    FFL paperwork completed in-store. Valid ID required.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RESERVE MODAL ─────────────────────────────────────────────────────────
function ReserveModal({ product, price, type, onClose }) {
  const [form, setForm] = useState({name:"",email:"",phone:""});
  const [submitted, setSubmitted] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const isDeposit = type === "deposit";

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:1000,padding:16
    }}>
      <div style={{
        background:"#111",border:`1px solid ${GOLD}`,
        borderRadius:4,padding:"2rem",width:"100%",maxWidth:420,
        position:"relative"
      }}>
        <button onClick={onClose} style={{
          position:"absolute",top:12,right:14,
          background:"none",border:"none",color:"#666",
          fontSize:22,cursor:"pointer",lineHeight:1
        }}>×</button>

        {!submitted ? <>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,color:GOLD,letterSpacing:"0.1em",marginBottom:4}}>
            {isDeposit ? "RESERVE THIS ITEM" : "PAY IN FULL"}
          </div>
          <div style={{fontFamily:"Georgia,serif",fontSize:13,color:"#888",fontStyle:"italic",marginBottom:20}}>
            {product.name} — ${price.toLocaleString()}
          </div>

          {[["Full Name","name","text"],["Email","email","email"],["Phone","phone","tel"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,color:"#666",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.1em",marginBottom:5}}>{label.toUpperCase()}</label>
              <input
                type={type} value={form[key]}
                onChange={e=>set(key,e.target.value)}
                style={{
                  width:"100%",background:"#0a0a0a",border:"1px solid #2a2a2a",
                  color:"#e8e0d0",padding:"9px 12px",borderRadius:2,
                  fontFamily:"Georgia,serif",fontSize:14,outline:"none",
                  boxSizing:"border-box"
                }}
              />
            </div>
          ))}

          <div style={{padding:"14px",background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:2,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,color:"#888",fontFamily:"'Oswald',sans-serif"}}>
                {isDeposit ? "DEPOSIT DUE NOW" : "TOTAL DUE NOW"}
              </span>
              <span style={{fontSize:16,color:GOLD,fontFamily:"'Oswald',sans-serif",fontWeight:700}}>
                ${isDeposit ? product.deposit : price.toLocaleString()}
              </span>
            </div>
            {isDeposit && (
              <div style={{fontSize:11,color:"#555",fontFamily:"Georgia,serif",fontStyle:"italic"}}>
                Balance of ${(price - product.deposit).toLocaleString()} due in-store
              </div>
            )}
          </div>

          <button
            onClick={()=>setSubmitted(true)}
            disabled={!form.name || !form.email || !form.phone}
            style={{
              width:"100%",background:GOLD,color:"#000",
              fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:16,letterSpacing:"0.1em",
              padding:"13px 0",border:"none",borderRadius:2,
              cursor:form.name&&form.email&&form.phone?"pointer":"not-allowed",
              opacity:form.name&&form.email&&form.phone?1:0.5
            }}>
            PROCEED TO PAYMENT →
          </button>
          <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#444",fontFamily:"Georgia,serif",fontStyle:"italic"}}>
            You'll be redirected to our secure payment processor
          </div>
        </> : <>
          <div style={{textAlign:"center",padding:"1rem 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✓</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,color:"#4caf50",letterSpacing:"0.1em",marginBottom:8}}>YOU'RE ALL SET</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:14,color:"#888",lineHeight:1.7}}>
              We'll send a confirmation to <strong style={{color:"#e8e0d0"}}>{form.email}</strong>.<br/>
              Come in within 48 hours to complete your purchase and fill out the required paperwork.<br/><br/>
              <em>Questions? Call us at (555) 748-2291</em>
            </div>
            <button onClick={onClose} style={{
              marginTop:20,background:"transparent",border:`1px solid ${GOLD}`,
              color:GOLD,fontFamily:"'Oswald',sans-serif",fontSize:14,
              padding:"10px 32px",borderRadius:2,cursor:"pointer",letterSpacing:"0.08em"
            }}>CLOSE</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────────
function AdminPanel({ products, setProducts, onClose }) {
  const [editing, setEditing] = useState(null);
  const [blank] = useState({ id:0, name:"", cat:"Rifles", price:"", sale:"", desc:"", specs:"", img:"", deal:false, deposit:100 });
  const [form, setForm] = useState(blank);
  const [imgPreview, setImgPreview] = useState("");
  const fileRef = useRef();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({...p, price:String(p.price), sale:p.sale!=null?String(p.sale):"", deposit:String(p.deposit)});
    setImgPreview(p.img||"");
  };

  const openNew = () => {
    setEditing("new");
    setForm({...blank, id: Date.now()});
    setImgPreview("");
  };

  const save = () => {
    const p = {...form, price:Number(form.price), sale:form.sale?Number(form.sale):null, deposit:Number(form.deposit)||0, img:imgPreview};
    if (editing === "new") setProducts(ps=>[...ps,p]);
    else setProducts(ps=>ps.map(x=>x.id===p.id?p:x));
    setEditing(null);
  };

  const del = (id) => setProducts(ps=>ps.filter(p=>p.id!==id));

  const setDeal = (id) => setProducts(ps=>ps.map(p=>({...p,deal:p.id===id})));

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImgPreview(ev.target.result); set("img",ev.target.result); };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{minHeight:"100vh",background:"#080808",color:"#e8e0d0"}}>
      {/* Header */}
      <div style={{background:"#0d0d0d",borderBottom:`2px solid ${GOLD}`,padding:"1rem 2rem",display:"flex",alignItems:"center",gap:16}}>
        <Logo size={36}/>
        <div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,color:GOLD,letterSpacing:"0.15em"}}>ADMIN PANEL</div>
          <div style={{fontSize:11,color:"#555",fontFamily:"Georgia,serif",fontStyle:"italic"}}>Gristmill Guns & Optics</div>
        </div>
        <button onClick={onClose} style={{
          marginLeft:"auto",background:"transparent",border:"1px solid #333",
          color:"#888",fontFamily:"'Oswald',sans-serif",fontSize:12,
          padding:"6px 14px",borderRadius:2,cursor:"pointer",letterSpacing:"0.08em"
        }}>← BACK TO SITE</button>
      </div>

      <div style={{padding:"2rem",maxWidth:1100,margin:"0 auto"}}>
        {editing ? (
          /* ── FORM ── */
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,color:GOLD,letterSpacing:"0.1em"}}>
                {editing==="new"?"ADD NEW PRODUCT":"EDIT PRODUCT"}
              </div>
              <button onClick={()=>setEditing(null)} style={{background:"transparent",border:"1px solid #333",color:"#888",fontFamily:"'Oswald',sans-serif",fontSize:12,padding:"6px 14px",borderRadius:2,cursor:"pointer"}}>CANCEL</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {[["Product Name","name","text"],["Regular Price ($)","price","number"],["Sale Price ($, optional)","sale","number"],["Deposit Amount ($)","deposit","number"]].map(([label,key,type])=>(
                  <div key={key}>
                    <label style={{display:"block",fontSize:10,color:"#666",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.12em",marginBottom:5}}>{label.toUpperCase()}</label>
                    <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)}
                      style={{width:"100%",background:"#111",border:"1px solid #2a2a2a",color:"#e8e0d0",padding:"9px 12px",borderRadius:2,fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div>
                  <label style={{display:"block",fontSize:10,color:"#666",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.12em",marginBottom:5}}>CATEGORY</label>
                  <select value={form.cat} onChange={e=>set("cat",e.target.value)}
                    style={{width:"100%",background:"#111",border:"1px solid #2a2a2a",color:"#e8e0d0",padding:"9px 12px",borderRadius:2,fontFamily:"Georgia,serif",fontSize:14,outline:"none"}}>
                    {CATS.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:10,color:"#666",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.12em",marginBottom:5}}>DESCRIPTION</label>
                  <textarea value={form.desc} onChange={e=>set("desc",e.target.value)} rows={3}
                    style={{width:"100%",background:"#111",border:"1px solid #2a2a2a",color:"#e8e0d0",padding:"9px 12px",borderRadius:2,fontFamily:"Georgia,serif",fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:10,color:"#666",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.12em",marginBottom:5}}>SPECS (separate with " | ")</label>
                  <input type="text" value={form.specs} onChange={e=>set("specs",e.target.value)}
                    placeholder="Caliber: 9mm | Barrel: 4.5&quot; | Capacity: 17+1"
                    style={{width:"100%",background:"#111",border:"1px solid #2a2a2a",color:"#e8e0d0",padding:"9px 12px",borderRadius:2,fontFamily:"'Courier New',monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <input type="checkbox" checked={form.deal} onChange={e=>set("deal",e.target.checked)}
                    style={{width:16,height:16,accentColor:GOLD}}/>
                  <span style={{fontFamily:"'Oswald',sans-serif",fontSize:13,color:GOLD,letterSpacing:"0.08em"}}>SET AS TODAY'S DEAL OF THE DAY</span>
                </label>
              </div>

              {/* Image upload */}
              <div>
                <label style={{display:"block",fontSize:10,color:"#666",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.12em",marginBottom:8}}>PRODUCT PHOTO</label>
                <div
                  onClick={()=>fileRef.current.click()}
                  style={{
                    width:"100%",aspectRatio:"4/3",background:"#111",
                    border:`2px dashed #2a2a2a`,borderRadius:4,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",overflow:"hidden",transition:"border-color 0.2s"
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                >
                  {imgPreview
                    ? <img src={imgPreview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <>
                        <div style={{fontSize:32,color:"#333",marginBottom:8}}>↑</div>
                        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,color:"#555",letterSpacing:"0.08em"}}>CLICK TO UPLOAD PHOTO</div>
                        <div style={{fontSize:11,color:"#444",marginTop:4,fontFamily:"Georgia,serif",fontStyle:"italic"}}>JPG, PNG — will be sent to Cloudinary</div>
                      </>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{display:"none"}}/>
                {imgPreview && <button onClick={()=>{setImgPreview("");set("img","")}} style={{marginTop:8,background:"transparent",border:"1px solid #333",color:"#666",fontSize:11,padding:"4px 10px",borderRadius:2,cursor:"pointer",fontFamily:"'Oswald',sans-serif"}}>REMOVE PHOTO</button>}
              </div>
            </div>

            <button onClick={save} style={{
              marginTop:28,background:GOLD,color:"#000",
              fontFamily:"'Oswald',sans-serif",fontWeight:700,
              fontSize:16,letterSpacing:"0.1em",
              padding:"13px 40px",border:"none",borderRadius:2,cursor:"pointer"
            }}>SAVE PRODUCT</button>
          </div>
        ) : (
          /* ── PRODUCT LIST ── */
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,color:GOLD,letterSpacing:"0.1em"}}>INVENTORY ({products.length} items)</div>
              <button onClick={openNew} style={{
                background:GOLD,color:"#000",fontFamily:"'Oswald',sans-serif",
                fontWeight:700,fontSize:13,letterSpacing:"0.1em",
                padding:"9px 20px",border:"none",borderRadius:2,cursor:"pointer"
              }}>+ ADD PRODUCT</button>
            </div>
            <div style={{display:"grid",gap:8}}>
              {products.map(p=>(
                <div key={p.id} style={{
                  display:"flex",alignItems:"center",gap:14,
                  background:"#111",border:`1px solid ${p.deal?"#c9a84c40":"#1a1a1a"}`,
                  borderRadius:3,padding:"12px 16px"
                }}>
                  <div style={{
                    width:52,height:40,background:"#1a1a1a",borderRadius:2,
                    flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"
                  }}>
                    {p.img ? <img src={p.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> :
                      <span style={{fontSize:18,opacity:0.2}}>🔫</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,color:"#e8e0d0",display:"flex",alignItems:"center",gap:8}}>
                      {p.name}
                      {p.deal && <span style={{background:GOLD,color:"#000",fontSize:9,padding:"2px 6px",borderRadius:1,fontWeight:700,letterSpacing:"0.1em"}}>TODAY'S DEAL</span>}
                      {p.sale && <span style={{background:"#8b1a1a",color:"#fff",fontSize:9,padding:"2px 6px",borderRadius:1,letterSpacing:"0.08em"}}>SALE</span>}
                    </div>
                    <div style={{fontSize:11,color:"#555",fontFamily:"'Oswald',sans-serif",marginTop:2}}>
                      {p.cat} · ${p.price}{p.sale?` → $${p.sale}`:""} · Deposit: ${p.deposit}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    {!p.deal && <button onClick={()=>setDeal(p.id)} style={{background:"transparent",border:`1px solid #333`,color:"#888",fontFamily:"'Oswald',sans-serif",fontSize:11,padding:"5px 10px",borderRadius:2,cursor:"pointer",letterSpacing:"0.06em"}}>SET DEAL</button>}
                    <button onClick={()=>openEdit(p)} style={{background:"transparent",border:`1px solid #333`,color:GOLD,fontFamily:"'Oswald',sans-serif",fontSize:11,padding:"5px 10px",borderRadius:2,cursor:"pointer",letterSpacing:"0.06em"}}>EDIT</button>
                    <button onClick={()=>del(p.id)} style={{background:"transparent",border:"1px solid #330000",color:"#8b1a1a",fontFamily:"'Oswald',sans-serif",fontSize:11,padding:"5px 10px",borderRadius:2,cursor:"pointer",letterSpacing:"0.06em"}}>DEL</button>
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

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if(pw===ADMIN_PASS){onLogin()}else{setErr(true);setTimeout(()=>setErr(false),2000)} };
  return (
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#111",border:`1px solid ${GOLD}`,borderRadius:4,padding:"2.5rem",width:340,textAlign:"center"}}>
        <Logo size={48}/>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,color:GOLD,letterSpacing:"0.2em",margin:"1rem 0 1.5rem"}}>ADMIN ACCESS</div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="Password"
          style={{width:"100%",background:"#0a0a0a",border:`1px solid ${err?"#c0392b":"#2a2a2a"}`,color:"#e8e0d0",padding:"10px 14px",borderRadius:2,fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {err && <div style={{color:"#c0392b",fontSize:12,fontFamily:"Georgia,serif",marginBottom:10}}>Incorrect password</div>}
        <button onClick={submit} style={{width:"100%",background:GOLD,color:"#000",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:15,letterSpacing:"0.1em",padding:"11px 0",border:"none",borderRadius:2,cursor:"pointer"}}>ENTER</button>
        <div style={{fontSize:11,color:"#444",marginTop:12,fontFamily:"Georgia,serif",fontStyle:"italic"}}>Demo password: gristmill2024</div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [tab, setTab] = useState("catalog");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [view, setView] = useState("site"); // site | adminlogin | admin

  const dealProduct = products.find(p => p.deal) || null;

  const filtered = catFilter === "All" ? products : products.filter(p => p.cat === catFilter);

  if (view === "adminlogin") return <AdminLogin onLogin={()=>setView("admin")}/>;
  if (view === "admin") return <AdminPanel products={products} setProducts={setProducts} onClose={()=>setView("site")}/>;

  return (
    <div style={{minHeight:"100vh",background:DARK,color:"#e8e0d0",fontFamily:"Georgia,serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap" rel="stylesheet"/>

      {/* ── HEADER ── */}
      <header style={{background:"#050505",borderBottom:`2px solid ${GOLD}`,padding:"0 2rem"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:16,padding:"1rem 0"}}>
          <Logo size={52}/>
          <div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:26,fontWeight:700,color:"white",letterSpacing:"0.1em",lineHeight:1}}>GRISTMILL</div>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:GOLD,letterSpacing:"0.22em"}}>GUNS &amp; OPTICS</div>
          </div>
          <nav style={{marginLeft:"auto",display:"flex",gap:4}}>
            {[["catalog","CATALOG"],["deal","DEAL OF THE DAY"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                background:tab===id?`${GOLD}18`:"transparent",
                border:`1px solid ${tab===id?GOLD:"transparent"}`,
                color:tab===id?GOLD:"#888",
                fontFamily:"'Oswald',sans-serif",fontSize:12,
                padding:"8px 16px",borderRadius:2,cursor:"pointer",
                letterSpacing:"0.1em",transition:"all 0.2s"
              }}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"2.5rem 2rem 4rem"}}>

        {/* ── CATALOG ── */}
        {tab === "catalog" && <>
          <div style={{marginBottom:"2rem",display:"flex",gap:8,flexWrap:"wrap"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)} style={{
                background:catFilter===c?`${GOLD}18`:"transparent",
                border:`1px solid ${catFilter===c?GOLD:"#2a2a2a"}`,
                color:catFilter===c?GOLD:"#666",
                fontFamily:"'Oswald',sans-serif",fontSize:11,
                padding:"6px 14px",borderRadius:2,cursor:"pointer",
                letterSpacing:"0.1em",transition:"all 0.2s"
              }}>{c}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1.25rem"}}>
            {filtered.map(p=><ProductCard key={p.id} p={p} onReserve={p=>setModal({product:p,type:"deposit",price:p.sale??p.price})}/>)}
          </div>
          {filtered.length === 0 && <div style={{textAlign:"center",padding:"4rem",color:"#444",fontFamily:"'Oswald',sans-serif",letterSpacing:"0.1em"}}>NO ITEMS IN THIS CATEGORY</div>}
        </>}

        {/* ── DEAL OF THE DAY ── */}
        {tab === "deal" && (
          <div>
            <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,color:"#555",letterSpacing:"0.25em",marginBottom:4}}>GRISTMILL GUNS &amp; OPTICS</div>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:36,fontWeight:700,color:"white",letterSpacing:"0.05em"}}>DEAL OF THE DAY</div>
              <div style={{width:60,height:2,background:GOLD,margin:"12px auto 0"}}/>
            </div>
            <DealOfTheDay
              product={dealProduct}
              onReserve={(p,price)=>setModal({product:p,type:"deposit",price})}
              onPayFull={(p,price)=>setModal({product:p,type:"full",price})}
            />
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{background:"#050505",borderTop:"1px solid #1a1a1a",padding:"1.5rem 2rem",textAlign:"center"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{fontSize:12,color:"#444",fontStyle:"italic"}}>
            Gristmill Guns &amp; Optics · 1 Mill Road · (555) 748-2291 · All firearm purchases require valid ID &amp; background check
          </div>
          <button onClick={()=>setView("adminlogin")} style={{
            background:"transparent",border:"none",color:"#2a2a2a",
            fontSize:10,cursor:"pointer",fontFamily:"'Oswald',sans-serif",
            letterSpacing:"0.1em",transition:"color 0.2s"
          }}
          onMouseEnter={e=>e.currentTarget.style.color="#555"}
          onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}
          >ADMIN</button>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {modal && <ReserveModal {...modal} onClose={()=>setModal(null)}/>}
    </div>
  );
}
