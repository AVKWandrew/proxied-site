-- Run this ONCE in Supabase → SQL Editor → New query → Run.

-- Games library (name + artwork), reusable across events.
create table if not exists public.games (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  image_url  text,
  created_at timestamptz not null default now()
);
alter table public.games enable row level security;
create policy "public can read games" on public.games for select using (true);
create policy "admins manage games" on public.games for all to authenticated using (true) with check (true);

create table if not exists public.events (
  game_id       uuid references public.games(id) on delete set null,
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  location      text,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  image_url     text,
  repeat_weekly boolean not null default false,
  repeat_until  date,
  published     boolean not null default true,
  featured      boolean not null default false,  -- show in homepage "Upcoming Events" (off by default)
  created_at    timestamptz not null default now()
);

alter table public.events enable row level security;

-- Anyone can read PUBLISHED events.
create policy "public can read published events"
  on public.events for select
  using (published = true);

-- Signed-in admins can do everything (including see drafts).
create policy "admins manage events"
  on public.events for all to authenticated
  using (true) with check (true);

-- Store photos for the "Inside the shop" gallery.
create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  created_at timestamptz not null default now()
);
alter table public.photos enable row level security;
create policy "public can read photos" on public.photos for select using (true);
create policy "admins manage photos" on public.photos for all to authenticated using (true) with check (true);

-- Image storage bucket (public read).
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "public can view event images"
  on storage.objects for select
  using (bucket_id = 'event-images');

create policy "admins upload event images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images');

create policy "admins update event images"
  on storage.objects for update to authenticated
  using (bucket_id = 'event-images');

create policy "admins delete event images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-images');
