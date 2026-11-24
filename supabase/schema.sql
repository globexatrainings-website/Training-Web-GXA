-- Run this entire script in Supabase Dashboard > SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.training_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  part_number integer not null check (part_number between 1 and 10),
  video_url text not null,
  thumbnail_url text not null,
  created_at timestamptz not null default now()
);

alter table public.training_videos enable row level security;

drop policy if exists "Anyone can view training videos" on public.training_videos;
create policy "Anyone can view training videos"
on public.training_videos for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can add videos" on public.training_videos;
create policy "Authenticated admins can add videos"
on public.training_videos for insert
to authenticated
with check (true);

drop policy if exists "Authenticated admins can edit videos" on public.training_videos;
create policy "Authenticated admins can edit videos"
on public.training_videos for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete videos" on public.training_videos;
create policy "Authenticated admins can delete videos"
on public.training_videos for delete
to authenticated
using (true);

-- IMPORTANT:
-- In Supabase Authentication settings, disable public sign-ups.
-- Create your admin user manually in Authentication > Users.
-- Only that admin account should be able to sign in to /admin.
