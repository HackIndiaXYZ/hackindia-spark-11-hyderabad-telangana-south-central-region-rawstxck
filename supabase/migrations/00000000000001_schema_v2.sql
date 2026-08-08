-- ============================================================
-- profiles — one row per authenticated user
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'byo-key', 'local')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- repos — one row per repo a user has run `securepush init` in
-- and connected to their account (Cloud mode or synced via login)
-- ============================================================
create table if not exists public.repos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  branch text not null default 'main',
  bank_id text unique not null,           -- "securepush-{github_username}-{repo_name}"
  provider text not null default 'groq' check (provider in ('groq', 'gemini', 'ollama', 'claude', 'cloud')),
  model text,
  test_command text,
  thresholds jsonb not null default '{"escalation_quality": 0.7, "file_shrink_max_pct": 30}'::jsonb,
  last_scan_at timestamptz,
  attestation_tx_id text,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- ============================================================
-- repo_stats — running totals only, one row per repo.
-- ============================================================
create table if not exists public.repo_stats (
  repo_id uuid primary key references public.repos(id) on delete cascade,
  total_scans integer not null default 0,
  secrets_caught integer not null default 0,
  vulns_caught integer not null default 0,
  hallucinated_deps_caught integer not null default 0,
  pushes_blocked integer not null default 0,
  pushes_allowed integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- muted_rules
-- ============================================================
create table if not exists public.muted_rules (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.repos(id) on delete cascade,
  issue_type text not null,               -- matches Finding.issue from the CLI
  muted_at timestamptz not null default now(),
  unique (repo_id, issue_type)
);

-- ============================================================
-- cli_sessions
-- ============================================================
create table if not exists public.cli_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  linked_at timestamptz,
  last_seen_at timestamptz,
  device_label text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.profiles enable row level security;
alter table public.repos enable row level security;
alter table public.repo_stats enable row level security;
alter table public.muted_rules enable row level security;
alter table public.cli_sessions enable row level security;

-- profiles: a user can only read/update their own row
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- repos: a user can only see/manage their own repos
create policy "own repos" on public.repos
  for all using (auth.uid() = owner_id);

-- repo_stats: scoped through the parent repo's owner_id
create policy "own repo stats" on public.repo_stats
  for all using (
    repo_id in (select id from public.repos where owner_id = auth.uid())
  );

-- muted_rules: scoped through the parent repo's owner_id
create policy "own muted rules only" on public.muted_rules
  for all using (
    exists (select 1 from public.repos r where r.id = repo_id and r.owner_id = auth.uid())
  );

-- cli_sessions: permissive on INSERT but locked down on read/update
create policy "anyone can create a session" on public.cli_sessions
  for insert with check (true);

create policy "read own linked sessions only" on public.cli_sessions
  for select using (user_id is null or auth.uid() = user_id);

-- ============================================================
-- Handlers & Triggers
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, github_username)
  values (new.id, new.raw_user_meta_data ->> 'user_name')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Only create the trigger if it doesn't already exist
do $$
begin
  if not exists(select * from information_schema.triggers where event_object_table = 'users' and trigger_schema = 'auth' and trigger_name = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end;
$$;
