"use client";
import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";
import InputField from "@/components/admin/InputField";

const GOLD = "#c9a84c";

const BLANK = { name:"", category:"", price:"", salePrice:"", description:"", specs:"", imageUrl:"", deposit:"100", serialNumber:"", sku:"" };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | product id
  const [form, setForm] = useState(BLANK);
  const [imgPreview, setImgPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([prods, cats]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    });
  }, []);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const openEdit = p => {
    setEditing(p.id);
    setForm({ ...BLANK, ...p, price:String(p.price), salePrice:p.salePrice?String(p.salePrice):"", deposit:String(p.deposit), serialNumber:p.serialNumber||"", sku:p.sku||"", imageUrl:p.imageUrl||"" });
    setImgPreview(p.imageUrl||"");
  };

  const openNew = () => { setEditing("new"); setForm(BLANK); setImgPreview(""); };

  const save = async () => {
    setSaving(true);
    const body = { ...form, price:Number(form.price), salePrice:form.salePrice?Number(form.salePrice):null, deposit:Number(form.deposit)||0, imageUrl:imgPreview||null, serialNumber:form.serialNumber||null, sku:form.sku||null };
    try {
      if (editing === "new") {
        const res = await fetch("/api/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const p = await res.json();
        setProducts(ps => [...ps, p]);
      } else {
        await fetch(`/api/products/${editing}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        setProducts(ps => ps.map(p => p.id===editing ? {...p,...body} : p));
      }
      setEditing(null);
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm("Remove this product?")) return;
    await fetch(`/api/products/${id}`, { method:"DELETE" });
    setProducts(ps => ps.filter(p => p.id!==id));
  };

  const handleImg = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImgPreview(ev.target.result); set("imageUrl", ev.target.result); };
    r.readAsDataURL(f);
  };

  const filtered = products.filter(p => {
    const matchesCat = filterCat === "All" || p.category === filterCat;
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      p.name?.toLowerCase().includes(q) ||
      p.manufacturer?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.upc?.toLowerCase().includes(q) ||
      p.caliber?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  if (editing) return (
    <div>
      <PageHeader title={editing==="new" ? "ADD PRODUCT" : "EDIT PRODUCT"} action={
        <AdminButton variant="ghost" onClick={() => setEditing(null)}>CANCEL</AdminButton>
      }/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, maxWidth:900 }}>
        <div>
          <InputField label="Product Name" value={form.name} onChange={v => set("name",v)}/>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:9, color:"#555", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:4 }}>CATEGORY</label>
            <select value={form.category} onChange={e => set("category",e.target.value)} style={{ width:"100%", background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"8px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none" }}>
              <option value="">— select —</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Regular Price ($)" value={form.price} onChange={v => set("price",v)} type="number"/>
            <InputField label="Sale Price (optional)" value={form.salePrice} onChange={v => set("salePrice",v)} type="number"/>
          </div>
          <InputField label="Deposit Amount ($)" value={form.deposit} onChange={v => set("deposit",v)} type="number"/>
          <InputField label="Description" value={form.description} onChange={v => set("description",v)} type="textarea"/>
          <InputField label='Specs (separate with " | ")' value={form.specs} onChange={v => set("specs",v)} placeholder='Caliber: 9mm | Barrel: 4" | Capacity: 17+1'/>

          <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:16, marginTop:4 }}>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#444", letterSpacing:"0.16em", marginBottom:12 }}>UNIT TRACKING — ADMIN ONLY</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <InputField label="Serial Number" value={form.serialNumber} onChange={v => set("serialNumber",v)} placeholder="e.g. G2274519"/>
                {form.serialNumber && <div style={{ fontSize:9, color:"#444", marginTop:-10, marginBottom:14, fontStyle:"italic" }}>Customer sees: ···{form.serialNumber.slice(-4)}</div>}
              </div>
              <InputField label="SKU / Item Number" value={form.sku} onChange={v => set("sku",v)} placeholder="e.g. WIN-M70-3006"/>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize:9, color:"#555", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.14em", marginBottom:8 }}>PRODUCT PHOTO</div>
          <div onClick={() => fileRef.current.click()} onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}
            style={{ aspectRatio:"4/3", background:"#0d0d0d", border:"2px dashed #1e1e1e", borderRadius:3, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s" }}>
            {imgPreview ? <img src={imgPreview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> :
              <div style={{ textAlign:"center", color:"#333" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>↑</div>
                <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:12, letterSpacing:"0.1em" }}>CLICK TO UPLOAD</div>
                <div style={{ fontSize:10, marginTop:4, fontStyle:"italic", color:"#2a2a2a" }}>JPG / PNG → Cloudinary</div>
              </div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display:"none" }}/>
          {imgPreview && <AdminButton variant="ghost" onClick={() => { setImgPreview(""); set("imageUrl",""); }} style={{ marginTop:8, fontSize:10 }}>REMOVE PHOTO</AdminButton>}
        </div>
      </div>
      <div style={{ marginTop:24 }}>
        <AdminButton onClick={save} disabled={saving}>{saving ? "SAVING..." : "SAVE PRODUCT"}</AdminButton>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={`INVENTORY (${products.length})`} action={
        <AdminButton onClick={openNew}>+ ADD PRODUCT</AdminButton>
      }/>
      {/* Search and filter */}
      {!loading && (
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, make, model, SKU, UPC, caliber..."
            style={{ flex:1, minWidth:200, background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"8px 14px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none" }}
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"8px 12px", borderRadius:2, fontFamily:"'Oswald',sans-serif", fontSize:11, outline:"none", letterSpacing:"0.08em" }}>
            <option value="All">ALL CATEGORIES</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name.toUpperCase()}</option>)}
          </select>
          {(search || filterCat !== "All") && (
            <button onClick={() => { setSearch(""); setFilterCat("All"); }}
              style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#666", fontFamily:"'Oswald',sans-serif", fontSize:11, padding:"8px 14px", borderRadius:2, cursor:"pointer", letterSpacing:"0.08em" }}>
              CLEAR
            </button>
          )}
        </div>
      )}
      <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, color:"#444", letterSpacing:"0.12em", marginBottom:10 }}>
        {!loading && `${filtered.length} of ${products.length} ITEMS`}
      </div>

      {loading && <div style={{ color:"#444", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>LOADING...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ color:"#333", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"3rem 0", textAlign:"center" }}>NO PRODUCTS MATCH</div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#111", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
            <div style={{ width:52, height:40, background:"#161616", borderRadius:2, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:18, opacity:0.15 }}>🔫</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#e8e0d0", display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                {p.name}
                {p.salePrice && <span style={{ background:"#7a1515", color:"#fff", fontSize:8, padding:"2px 5px", borderRadius:1 }}>SALE</span>}
              </div>
              <div style={{ fontSize:10, color:"#444", fontFamily:"'Oswald',sans-serif", marginTop:2 }}>
                {p.category} · ${p.price}{p.salePrice?` → $${p.salePrice}`:""} · Deposit: ${p.deposit}
                {p.sku && <span style={{ color:"#333", fontFamily:"'Courier New',monospace", marginLeft:8 }}>SKU: {p.sku}</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <AdminButton variant="outline" onClick={() => openEdit(p)} style={{ fontSize:10, padding:"4px 10px" }}>EDIT</AdminButton>
              <AdminButton variant="danger" onClick={() => del(p.id)} style={{ fontSize:10, padding:"4px 10px" }}>DEL</AdminButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
