 "use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { PARTS, TrainingVideo } from "@/lib/types";

const blank = { title: "", description: "", part_number: 1, video_url: "", thumbnail_url: "" };

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadVideos() {
    if (!supabase) return;
    const { data } = await supabase.from("training_videos").select("*").order("part_number").order("created_at");
    setVideos((data ?? []) as TrainingVideo[]);
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setLoggedIn(true); loadVideos(); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
      if (session) loadVideos();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(error?.message ?? "Signed in.");
  }

  async function saveVideo(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const payload = { ...form, description: form.description || null };
    const result = editing
      ? await supabase.from("training_videos").update(payload).eq("id", editing)
      : await supabase.from("training_videos").insert(payload);
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(editing ? "Video updated." : "Video added.");
    setForm(blank); setEditing(null); await loadVideos();
  }

  function editVideo(v: TrainingVideo) {
    setEditing(v.id);
    setForm({ title: v.title, description: v.description ?? "", part_number: v.part_number, video_url: v.video_url, thumbnail_url: v.thumbnail_url });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteVideo(id: string) {
    if (!supabase || !window.confirm("Delete this video?")) return;
    const { error } = await supabase.from("training_videos").delete().eq("id", id);
    setMessage(error?.message ?? "Video deleted.");
    await loadVideos();
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setLoggedIn(false);
  }

  if (!supabaseConfigured) return <main className="admin-shell"><Link href="/" className="back-link">← Back to portal</Link><div className="notice">Supabase setup is required. Follow the README instructions and add your environment variables.</div></main>;

  if (!loggedIn) return <main className="admin-shell">
    <Link href="/" className="back-link">← Back to portal</Link>
    <form className="login-card" onSubmit={signIn}>
      <p className="eyebrow">PORTAL MANAGEMENT</p><h1>Admin login</h1><p className="muted">Sign in to add and manage training videos.</p>
      <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <button className="primary-btn" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</button>
      {message && <p className="form-message">{message}</p>}
    </form>
  </main>;

  return <main className="admin-shell">
    <header className="admin-header"><div><Link href="/" className="back-link">← View portal</Link><h1>Manage training videos</h1><p className="muted">Add a Google Drive video link and its thumbnail.</p></div><button className="secondary-btn" onClick={signOut}>Sign out</button></header>
    <form className="editor-card" onSubmit={saveVideo}>
      <h2>{editing ? "Edit video" : "Add a training video"}</h2>
      <div className="form-grid">
        <label>Video title<input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g. Introduction to the process" required /></label>
        <label>Training part<select value={form.part_number} onChange={e => setForm({...form, part_number:Number(e.target.value)})}>{PARTS.map(p => <option key={p.number} value={p.number}>{p.label}</option>)}</select></label>
        <label className="wide">Google Drive video link<input type="url" value={form.video_url} onChange={e => setForm({...form, video_url:e.target.value})} placeholder="https://drive.google.com/file/d/..." required /></label>
        <label className="wide">Thumbnail image link<input type="url" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url:e.target.value})} placeholder="https://drive.google.com/uc?export=view&id=..." required /></label>
        <label className="wide">Short description (optional)<textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={2} placeholder="A short description for trainees" /></label>
      </div>
      <div className="form-actions"><button className="primary-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add video"}</button>{editing && <button type="button" className="secondary-btn" onClick={() => {setEditing(null);setForm(blank);}}>Cancel edit</button>}</div>
      {message && <p className="form-message">{message}</p>}
      <p className="hint">The selected part can contain up to 15 videos. Make sure the Drive video and thumbnail are shared so trainees can view them.</p>
    </form>
    <section className="admin-list"><div className="list-title"><h2>Existing videos</h2><span>{videos.length} total</span></div>
      {videos.length === 0 ? <p className="muted">No videos have been added yet.</p> : videos.map(v => <div className="admin-video" key={v.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.thumbnail_url} alt="" />
        <div className="admin-video-text"><strong>{v.title}</strong><span>{PARTS[v.part_number - 1]?.label}</span></div>
        <button className="text-btn" onClick={() => editVideo(v)}>Edit</button><button className="text-btn danger" onClick={() => deleteVideo(v.id)}>Delete</button>
      </div>)}
    </section>
  </main>;
}
