"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const next = searchParams.get("next") || (data.user.role === "admin" ? "/admin" : "/dashboard");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Log in</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label className="label">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="btn" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
        No account? <Link href="/register" style={{ color: "var(--green-light)" }}>Sign up</Link>
      </p>
      <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-dim)" }}>
        Demo logins — admin@caspermediallc.com / admin1234, customer@example.com / customer1234
      </p>
    </div>
  );
}
