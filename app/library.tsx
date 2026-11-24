
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { PARTS, TrainingVideo } from "@/lib/types";

function driveEmbedUrl(raw: string) {
  const fileMatch =
    raw.match(/\/file\/d\/([^/]+)/) ||
    raw.match(/[?&]id=([^&]+)/);

  if (fileMatch?.[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  return raw;
}

export default function HomePage() {
  const [part, setPart] = useState(1);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TrainingVideo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setAuthChecked(true);
      window.location.href = "/login";
      return;
    }

    let alive = true;

    async function loadForUser() {
      const { data: sessionData } =
        await supabase!.auth.getSession();

      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase!
        .from("training_videos")
        .select("*")
        .order("part_number")
        .order("created_at");

      if (!alive) return;

      if (!error && data) {
        setVideos(data as TrainingVideo[]);
      }

      setLoading(false);
      setAuthChecked(true);
    }

    loadForUser();

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          window.location.href = "/login";
        }
      });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const visibleVideos = useMemo(
    () =>
      videos
        .filter((v) => v.part_number === part)
        .filter((v) =>
          `${v.title} ${v.description ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .slice(0, 15),
    [videos, part, search]
  );

  return (
    <main className="shell">

      {/* WEBSITE HEADER */}
      <header className="topbar">

        <Link href="/" className="brand">

          <img
            src="/Globexa_logo.png"
            alt="Globexa Logo"
            style={{
              height: "46px",
              width: "auto",
              maxWidth: "190px",
              objectFit: "contain",
            }}
          />

          <span>TRAINING PORTAL</span>

        </Link>

        <div className="header-actions">

          <Link href="/admin" className="admin-link">
            Admin login
          </Link>

          <button
            className="logout-btn"
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = "/login";
            }}
          >
            Log out
          </button>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">

        <p className="eyebrow">
          LEARNING RESOURCE CENTRE
        </p>

        <h1>Training Video Library</h1>

        <p className="hero-copy">
          Select a training part and watch the lessons at your own pace.
        </p>

      </section>

      {!supabaseConfigured && (
        <div className="notice">
          <strong>Setup required:</strong> Connect this website to
          Supabase before trainees can sign in.
        </div>
      )}

      {authChecked && (
        <div className="notice">
          Signed in successfully. Your training access is active.
        </div>
      )}

      {/* VIDEO LIBRARY */}
      <section className="library">

        <div className="library-head">

          <div>
            <p className="eyebrow">VIDEO COLLECTION</p>
            <h2>Browse training videos</h2>
          </div>

          <div className="controls">

            <label className="sr-only" htmlFor="part">
              Select training part
            </label>

            <select
              id="part"
              value={part}
              onChange={(e) => setPart(Number(e.target.value))}
            >
              {PARTS.map((p) => (
                <option key={p.number} value={p.number}>
                  {p.label}
                </option>
              ))}
            </select>

            <input
              aria-label="Search videos"
              placeholder="Search this part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>

        {loading ? (
          <p className="empty">Loading videos…</p>
        ) : visibleVideos.length === 0 ? (

          <div className="empty-card">

            <div className="empty-icon">▶</div>

            <h3>No videos added yet</h3>

            <p>
              Training videos for {PARTS[part - 1].label}
              will appear here.
            </p>

          </div>

        ) : (

          <div className="video-grid">

            {visibleVideos.map((video) => (

              <button
                className="video-card"
                key={video.id}
                onClick={() => setSelected(video)}
              >

                <div className="thumb-wrap">

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="thumb"
                  />

                  <span className="play">▶</span>

                </div>

                <div className="video-info">

                  <span className="video-number">
                    VIDEO {video.id.slice(0, 4).toUpperCase()}
                  </span>

                  <h3>{video.title}</h3>

                  {video.description && (
                    <p>{video.description}</p>
                  )}

                </div>

              </button>

            ))}

          </div>

        )}

        <div className="pagination-note">
          Showing up to 15 videos · {PARTS[part - 1].label}
        </div>

      </section>

      {/* FOOTER */}
      <footer className="footer">
        Training Video Portal
      </footer>

      {/* VIDEO PLAYER */}
      {selected && (

        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >

          <div
            className="player-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="player-head">

              <div>
                <span className="eyebrow">
                  NOW PLAYING
                </span>

                <h2>{selected.title}</h2>
              </div>

              <button
                className="close"
                onClick={() => setSelected(null)}
                aria-label="Close video"
              >
                ×
              </button>

            </div>

            <div className="player-frame">

              <iframe
                src={driveEmbedUrl(selected.video_url)}
                title={selected.title}
                allow="autoplay; fullscreen"
                allowFullScreen
              />

            </div>

            {selected.description && (
              <p className="player-description">
                {selected.description}
              </p>
            )}

          </div>

        </div>

      )}

    </main>
  );
}
