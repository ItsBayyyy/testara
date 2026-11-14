-- Skema awal Testara.
-- Publik tidak pernah membaca/menulis tabel secara langsung: semua lewat route
-- handler server dengan kunci service role. RLS tetap aktif sebagai lapisan kedua:
-- tanpa policy untuk anon, dan petugas login hanya melihat data kabupatennya.

create extension if not exists pgcrypto;

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  regency_code text not null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  demo_session_id text,
  regency_code text not null,
  village_code text,
  needs text[] not null default '{}',
  vulnerable text[] not null default '{}',
  for_self boolean not null default true,
  story_text text not null default '',
  reporter_phone text,
  source text not null check (source in ('form', 'whatsapp')),
  source_meta jsonb,
  status text not null default 'diterima'
    check (status in ('diterima', 'dibaca', 'resmi', 'perlu_konfirmasi')),
  urgency text not null check (urgency in ('tinggi', 'sedang', 'rendah')),
  urgency_source text not null check (urgency_source in ('aturan', 'ai', 'petugas')),
  urgency_reason text not null default '',
  urgency_quote text,
  ai_state text not null default 'menunggu' check (ai_state in ('menunggu', 'selesai', 'gagal')),
  extraction jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index reports_scope_idx on public.reports (demo_session_id, regency_code, created_at desc);
create index reports_expires_idx on public.reports (expires_at);

create table public.report_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports (id) on delete cascade,
  status text not null check (status in ('diterima', 'dibaca', 'resmi', 'perlu_konfirmasi')),
  actor text not null check (actor in ('system', 'petugas')),
  created_at timestamptz not null default now()
);

create index report_events_report_idx on public.report_events (report_id, created_at);

-- Pilihan angka petugas per kejadian (desa, jenis bencana).
create table public.incidents (
  id bigint generated always as identity primary key,
  demo_session_id text,
  regency_code text not null,
  village_code text not null,
  hazard text not null,
  chosen jsonb not null default '{}',
  reviewed_by text not null,
  reviewed_at timestamptz not null default now()
);

create unique index incidents_key_idx
  on public.incidents (coalesce(demo_session_id, ''), village_code, hazard);

-- Papan info: setiap terbit adalah versi baru; versi terbaru yang tampil.
create table public.board_versions (
  id uuid primary key default gen_random_uuid(),
  demo_session_id text,
  regency_code text not null,
  village_code text not null,
  content jsonb not null,
  published_at timestamptz not null default now(),
  published_by text not null
);

create index board_versions_latest_idx
  on public.board_versions (demo_session_id, village_code, published_at desc);

create table public.ai_cache (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

create table public.usage_daily (
  day date primary key,
  ai_requests integer not null default 0
);

-- Penambahan atomik untuk pembatasan laju dan anggaran harian.
create or replace function public.hit_rate_limit(p_key text, p_window timestamptz)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limits (key, window_start, count)
  values (p_key, p_window, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count;
$$;

create or replace function public.increment_ai_usage(p_day date)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.usage_daily (day, ai_requests)
  values (p_day, 1)
  on conflict (day) do update set ai_requests = public.usage_daily.ai_requests + 1
  returning ai_requests;
$$;

revoke all on function public.hit_rate_limit(text, timestamptz) from public, anon, authenticated;
revoke all on function public.increment_ai_usage(date) from public, anon, authenticated;

-- RLS
alter table public.staff enable row level security;
alter table public.reports enable row level security;
alter table public.report_events enable row level security;
alter table public.incidents enable row level security;
alter table public.board_versions enable row level security;
alter table public.ai_cache enable row level security;
alter table public.rate_limits enable row level security;
alter table public.usage_daily enable row level security;

create or replace function public.staff_regency()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select regency_code from public.staff where user_id = auth.uid();
$$;

create policy "petugas membaca dirinya" on public.staff
  for select to authenticated using (user_id = auth.uid());

create policy "petugas membaca laporan kabupatennya" on public.reports
  for select to authenticated
  using (demo_session_id is null and regency_code = public.staff_regency());

create policy "petugas mengubah laporan kabupatennya" on public.reports
  for update to authenticated
  using (demo_session_id is null and regency_code = public.staff_regency())
  with check (demo_session_id is null and regency_code = public.staff_regency());

create policy "petugas membaca riwayat laporan kabupatennya" on public.report_events
  for select to authenticated
  using (exists (
    select 1 from public.reports r
    where r.id = report_id and r.demo_session_id is null and r.regency_code = public.staff_regency()
  ));

create policy "petugas membaca kejadian kabupatennya" on public.incidents
  for select to authenticated
  using (demo_session_id is null and regency_code = public.staff_regency());

create policy "petugas membaca papan kabupatennya" on public.board_versions
  for select to authenticated
  using (demo_session_id is null and regency_code = public.staff_regency());
