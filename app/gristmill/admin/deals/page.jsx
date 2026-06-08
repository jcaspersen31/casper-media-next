"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";

export default function DealsPage() {
  const [queue, setQueue] = useState([]);
  const [products, setProducts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newDeal, setNewDeal] = useState({ productId:"", pct:"" });
  const [loading, setLoading] = useState(true);
  const [todaysDeal, setTodaysDeal] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/deals").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
      fetch("/api/deals/today").then(r => r.json()),
    ]).then(([deals, prods, today]) => {
      setQueue(Array.isArray(deals) ? deals : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setTodaysDeal(today);
      setLoading(false);
    });
  }, []);

  const addToQueue = async () => {
    if (!newDeal.productId || !newDeal.pct) return;
    const res = await fetch("/api/deals", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ productId:Number(newDeal.productId), discountPct:Number(newDeal.pct) }) });
    const deal = await res.json();
    setQueue(q => [...q, deal]);
    setNewDeal({ productId:"", pct:"" });
    setAdding(false);
  };

  const remove = async id => {
    await fetch(`/api/deals/${id}`, { method:"DELETE" });
    setQueue(q => q.filter(d => d.id!==id));
  };

  const preview = newDeal.productId && newDeal.pct ? products.find(p => p.id===Number(newDeal.productId)) : null;

  return (
    <div>
      <PageHeader title="DEALS QUEUE" action={<AdminButton onClick={() => setAdding(true)}>+ ADD TO QUEUE</AdminButton>}/>

      {todaysDeal && (
        <div style={{ padding:"12px 16px", background:"#0d1a0d", border:"1px solid #2a5a2a", borderRadius:3, marginBottom:20, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#4caf50", letterSpacing:"0.18em" }}>TODAY'S DEAL</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:"#e8e0d0" }}>{todaysDeal.product?.name}</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, color:GOLD }}>{todaysDeal.discountPct}% OFF</div>
          <div style={{ fontSize:11, color:"#444", marginLeft:"auto", fontStyle:"italic" }}>
            Sale price: ${Math.round((todaysDeal.product?.price||0) * (1 - todaysDeal.discountPct/100)).toLocaleString()}
          </div>
        </div>
      )}

      {adding && (
        <div style={{ background:"#111", border:`1px solid ${GOLD}`, borderRadius:3, padding:"1.25rem", marginBottom:16 }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:GOLD, letterSpacing:"0.1em", marginBottom:14 }}>ADD GUN TO QUEUE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", fontSize:9, color:"#555", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>SELECT GUN</label>
              <select value={newDeal.productId} onChange={e => setNewDeal(d => ({...d,productId:e.target.value}))} style={{ width:"100%", background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none" }}>
                <option value="">— choose a product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:9, color:"#555", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>DISCOUNT %</label>
              <input type="number" min="1" max="99" value={newDeal.pct} onChange={e => setNewDeal(d => ({...d,pct:e.target.value}))} placeholder="e.g. 15"
                style={{ width:"100%", background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
          </div>
          {preview && newDeal.pct && (
            <div style={{ fontSize:11, color:"#4caf50", fontFamily:"'Oswald',sans-serif", marginBottom:12 }}>
              Sale price: ${Math.round(preview.price * (1 - Number(newDeal.pct)/100)).toLocaleString()} (saving ${preview.price - Math.round(preview.price * (1 - Number(newDeal.pct)/100))})
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <AdminButton onClick={addToQueue}>ADD TO QUEUE</AdminButton>
            <AdminButton variant="ghost" onClick={() => setAdding(false)}>CANCEL</AdminButton>
          </div>
        </div>
      )}

      {loading && <div style={{ color:"#444", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>LOADING...</div>}
      {!loading && queue.length === 0 && <div style={{ color:"#333", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>NO DEALS IN QUEUE — ADD ONE ABOVE</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {queue.map((d, i) => {
          const prod = d.product || products.find(p => p.id===d.productId);
          return (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#111", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, color:"#333", minWidth:24, textAlign:"center" }}>#{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#e8e0d0" }}>{prod?.name || "Unknown"}</div>
                <div style={{ fontSize:10, color:"#555", marginTop:2 }}>{prod?.category} · ${prod?.price?.toLocaleString()} → ${Math.round((prod?.price||0)*(1-d.discountPct/100)).toLocaleString()} ({d.discountPct}% off)</div>
              </div>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, color:GOLD, fontWeight:700, minWidth:60, textAlign:"right" }}>{d.discountPct}% OFF</div>
              <AdminButton variant="danger" onClick={() => remove(d.id)} style={{ fontSize:10, padding:"4px 10px" }}>DEL</AdminButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
