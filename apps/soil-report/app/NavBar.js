"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NavBar({ user }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
        }}
      >
        <Link href="/" style={{ fontWeight: 700, textDecoration: "none", fontSize: 16 }}>
          🌱 Soil Report
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
          {!user && (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn" style={{ textDecoration: "none" }}>
                Get started
              </Link>
            </>
          )}
          {user && user.role === "customer" && (
            <>
              <Link href="/dashboard">My reports</Link>
              <Link href="/account">My account</Link>
              <button className="btn-outline btn" onClick={logout}>Log out</button>
            </>
          )}
          {user && user.role === "admin" && (
            <>
              <Link href="/admin">Admin</Link>
              <Link href="/dashboard">My reports</Link>
              <Link href="/account">My account</Link>
              <button className="btn-outline btn" onClick={logout}>Log out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
