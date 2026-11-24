-- Run this in Supabase SQL Editor AFTER creating your first admin user.
-- All authenticated trainees can view videos. Only user IDs in portal_admins can manage them.

create table if not exists public.portal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portal_admins enable row level security;

-- Admins can see their own admin record. No client-side insert/update/delete policies.
drop policy if exists "Admins can view own admin record" on public.portal_admins;
create policy "Admins can view own admin record"
on public.portal_admins for select
to authenticated
using (user_id = auth.uid());

-- Remove the earlier policies that made the catalogue public and allowed every signed-in user to edit.
drop policy if exists "Anyone can view training videos" on public.training_videos;
drop policy if exists "Authenticated admins can add videos" on public.training_videos;
drop policy if exists "Authenticated admins can edit videos" on public.training_videos;
drop policy if exists "Authenticated admins can delete videos" on public.training_videos;

drop policy if exists "Signed-in trainees can view training videos" on public.training_videos;
create policy "Signed-in trainees can view training videos"
on public.training_videos for select
to authenticated
using (true);

drop policy if exists "Only portal admins can add videos" on public.training_videos;
create policy "Only portal admins can add videos"
on public.training_videos for insert
to authenticated
with check (exists (select 1 from public.portal_admins where user_id = auth.uid()));

drop policy if exists "Only portal admins can edit videos" on public.training_videos;
create policy "Only portal admins can edit videos"
on public.training_videos for update
to authenticated
using (exists (select 1 from public.portal_admins where user_id = auth.uid()))
with check (exists (select 1 from public.portal_admins where user_id = auth.uid()));

drop policy if exists "Only portal admins can delete videos" on public.training_videos;
create policy "Only portal admins can delete videos"
on public.training_videos for delete
to authenticated
using (exists (select 1 from public.portal_admins where user_id = auth.uid()));

grant select on public.training_videos to authenticated;
grant insert, update, delete on public.training_videos to authenticated;
grant select on public.portal_admins to authenticated;

-- IMPORTANT: after running this script, add your own admin user UUID:
-- insert into public.portal_admins (user_id) values ('YOUR-AUTH-USER-UUID');
