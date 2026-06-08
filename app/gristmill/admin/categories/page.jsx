"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import AdminButton from "@/components/admin/AdminButton";

const GOLD = "#c9a84c";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => {
      setCategories(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const add = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:newName.trim() }) });
    const cat = await res.json();
    if (cat.error) { setError(cat.error); return; }
    setCategories(cs => [...cs, cat]);
    setNewName("");
  };

  const save = async (id) => {
    if (!editName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:editName.trim() }) });
    const cat = await res.json();
    setCategories(cs => cs.map(c => c.id===id ? cat : c));
    setEditingId(null);
  };

  const del = async (id) => {
    const res = await fetch(`/api/categories/${id}`, { method:"DELETE" });
    const d = await res.json();
    if (d.error) { setError(d.error); setTimeout(() => setError(""), 4000); return; }
    setCategories(cs => cs.filter(c => c.id!==id));
  };

  const iStyle = { background:"#0a0a0a", border:"1px solid #222", color:"#e8e0d0", padding:"7px 12px", borderRadius:2, fontFamily:"Georgia,serif", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ maxWidth:600 }}>
      <PageHeader title="CATEGORIES"/>

      {error && <div style={{ padding:"10px 14px", background:"#1a0000", border:"1px solid #c0392b", borderRadius:3, color:"#c0392b", fontSize:12, fontStyle:"italic", marginBottom:16 }}>{error}</div>}

      {/* Add new */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==="Enter" && add()}
          placeholder="New category name..." style={{ ...iStyle, flex:1 }}/>
        <AdminButton onClick={add} disabled={!newName.trim()}>ADD</AdminButton>
      </div>

      {loading && <div style={{ color:"#444", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"2rem 0", textAlign:"center" }}>LOADING...</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {categories.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#111", border:"1px solid #1a1a1a", borderRadius:2, padding:"10px 14px" }}>
            {editingId === c.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key==="Enter" && save(c.id)}
                  style={{ ...iStyle, flex:1 }} autoFocus/>
                <AdminButton onClick={() => save(c.id)} style={{ fontSize:10, padding:"4px 10px" }}>SAVE</AdminButton>
                <AdminButton variant="ghost" onClick={() => setEditingId(null)} style={{ fontSize:10, padding:"4px 10px" }}>CANCEL</AdminButton>
              </>
            ) : (
              <>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, color:"#e8e0d0" }}>{c.name}</div>
                  <div style={{ fontSize:10, color:"#444", marginTop:2 }}>{c._count?.products || 0} product{c._count?.products !== 1 ? "s":""}</div>
                </div>
                <AdminButton variant="outline" onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ fontSize:10, padding:"4px 10px" }}>EDIT</AdminButton>
                <AdminButton variant="danger" onClick={() => del(c.id)} style={{ fontSize:10, padding:"4px 10px" }}>DEL</AdminButton>
              </>
            )}
          </div>
        ))}
      </div>

      {!loading && categories.length === 0 && (
        <div style={{ color:"#333", fontFamily:"'Oswald',sans-serif", letterSpacing:"0.15em", padding:"2rem 0", textAlign:"center" }}>NO CATEGORIES YET</div>
      )}
    </div>
  );
}
