"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountForm({ user }) {
  const router = useRouter();
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name || "");
  const [company, setCompany] = useState(user.company || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save changes.");
      setSuccess("Saved.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card">
      <div className="field">
        <label className="label">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label className="label">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label className="label">Company</label>
        <input value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "20px 0" }} />

      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
        Leave the password fields blank to keep your current password.
      </p>
      <div className="field">
        <label className="label">Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="field">
        <label className="label">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="field">
        <label className="label">Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error && <div className="error-text">{error}</div>}
      {success && <div className="success-text">{success}</div>}
      <button type="submit" className="btn" disabled={busy} style={{ marginTop: 8 }}>
        {busy ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
