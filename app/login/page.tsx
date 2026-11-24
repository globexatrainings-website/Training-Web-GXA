"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Unable to sign in."); setBusy(false); return; }
      window.location.href = "/";
    } catch {
      setError("Connection error. Please try again.");
      setBusy(false);
    }
  }

  return <main className="login-page">
    <form className="portal-login-card" onSubmit={submit}>
      <div className="login-logo">▶</div>
      <p className="eyebrow">GXA TRAININGS</p>
      <h1>Training Portal</h1>
      <p className="login-subtitle">Enter your access password to view the training videos.</p>
      <label htmlFor="portal-password">Access password</label>
      <input id="portal-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter access password" required autoFocus />
      <button className="primary-btn" type="submit" disabled={busy}>{busy ? "Signing in…" : "Access training videos"}</button>
      {error && <p className="login-error">{error}</p>}
    </form>
    <p className="login-footer">Authorised trainees only</p>
  </main>;
}
