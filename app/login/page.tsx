"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) { setError("Login is not configured. Please contact the administrator."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Login failed. Check your email and password, or contact the administrator.");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return <main className="login-page">
    <form className="portal-login-card" onSubmit={submit}>
      <div className="login-logo">▶</div>
      <p className="eyebrow">GXA TRAININGS</p>
      <h1>Trainee Login</h1>
      <p className="login-subtitle">Sign in with the email address and password provided to you.</p>
      <label htmlFor="trainee-email">Email address</label>
      <input id="trainee-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" required />
      <label htmlFor="trainee-password">Password</label>
      <input id="trainee-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
      <button className="primary-btn" type="submit" disabled={busy || !supabaseConfigured}>{busy ? "Signing in…" : "Log in to training"}</button>
      {!supabaseConfigured && <p className="login-error">The website administrator has not configured Supabase.</p>}
      {error && <p className="login-error">{error}</p>}
    </form>
    <p className="login-footer">Registered trainees only · Contact the administrator for access</p>
  </main>;
}
