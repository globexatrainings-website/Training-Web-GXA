
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { PARTS, TrainingVideo } from "@/lib/types";

// Extract Google Drive file ID
function getDriveFileId(raw: string) {
  const match =
    raw.match(/\/file\/d\/([^/?]+)/) ||
    raw.match(/[?&]id=([^&]+)/);

  return match?.[1] ?? null;
}

// Convert Google Drive link into an embedded video URL
function driveEmbedUrl(raw: string) {
  const id = getDriveFileId(raw);

  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  return raw;
}

// Automatically generate a Google Drive thumbnail URL
function driveThumbnailUrl(raw: string) {
  const id = getDriveFileId(raw);

  if (!id) return "";

  return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
}

export default function HomePage() {
  const [part, setPart] = useState(1);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TrainingVideo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch videos from Supabase
  const loadVideos = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("training_videos")
      .select("*")
      .order("part_number", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data) {
      setVideos(data as TrainingVideo[]);
    } else if (error) {
      console.error("Unable to load training videos:", error.message);
    }

    setLoading(false);
  }, []);

  // Authentication and automatic video refresh
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setAuthChecked(true);
      window.location.href = "/login";
      return;
    }

    let alive = true;

    async function initialize() {
      const { data } = await supabase!.auth.getSession();

      if (!alive) return;

      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      await loadVideos();

      if (alive) {
        setAuthChecked(true);
      }
    }

    initialize();

    // Automatically check for new videos every 15 seconds
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadVideos();
      }
    }, 15000);

    // Refresh immediately when trainee returns to the portal tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadVideos();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Handle login expiration
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          window.location.href = "/login";
        }
      }
    );

    return () => {
      alive = false;
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      listener.subscription.unsubscribe();
    };
  }, [loadVideos]);

  // Filter videos according to selected part and search
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

      {/* Header */}
      <header className="topbar">
        <Link href="/" className="brand">
          <img
            src="/Globexa_logo.jpg"
            alt="Globexa Logo"
            className="portal-brand-logo"
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

      {/* Hero */}
      <section className="hero">
        <p className="eyebrow">LEARNING RESOURCE CENTRE</p>

        <h1>Training Video Library</h1>

        <p className="hero-copy">
          Select a training part and watch the lessons at your own pace.
        </p>
      </section>

      {!supabaseConfigured && (
        <div className="notice">
          <strong>Setup required:</strong> Connect this website to Supabase
          before trainees can sign in.
        </div>
      )}

      {authChecked && (
        <div className="notice">
          Signed in successfully. Your training access is active.
        </div>
      )}

      {/* Video library */}
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
          <p className="empty">Loading videos...</p>
        ) : visibleVideos.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">▶</div>
            <h3>No videos added yet</h3>
            <p>
              Training videos for {PARTS[part - 1]?.label} will appear here.
            </p>
          </div>
        ) : (
          <div className="video-grid">
            {visibleVideos.map((video) => {
              const thumbnail =
                video.thumbnail_url?.trim() ||
                driveThumbnailUrl(video.video_url);

              return (
                <button
                  className="video-card"
                  key={video.id}
                  onClick={() => setSelected(video)}
                >
                  <div className="thumb-wrap">
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="thumb"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget;
                          const fallback = driveThumbnailUrl(video.video_url);

                          // Try the Google Drive thumbnail if the
                          // manually provided thumbnail fails.
                          if (
                            fallback &&
                            img.dataset.fallbackTried !== "true"
                          ) {
                            img.dataset.fallbackTried = "true";
                            img.src = fallback;
                          } else {
                            img.style.display = "none";
                          }
                        }}
                      />
                    )}

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
              );
            })}
          </div>
        )}

        <div className="pagination-note">
          Showing up to 15 videos · {PARTS[part - 1]?.label}
          <span> · Auto-refresh every 15 seconds</span>
        </div>

      </section>

      {/* Footer */}
      <footer className="footer">
        Globexa Training Portal
      </footer>

      {/* Video player */}
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
                <span className="eyebrow">NOW PLAYING</span>
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
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="eager"
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
