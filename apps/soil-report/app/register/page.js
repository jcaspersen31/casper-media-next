"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Create an account</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label className="label">Name</label>
          <input value={form.name} onChange={update("name")} />
        </div>
        <div className="field">
          <label className="label">Company</label>
          <input value={form.company} onChange={update("company")} />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input type="email" required value={form.email} onChange={update("email")} />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={update("password")} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="btn" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
        Already have an account? <Link href="/login" style={{ color: "var(--green-light)" }}>Log in</Link>
      </p>
    </div>
  );
}
