-- ============================================================
-- SecurePush — Final Schema (deployable)
-- Base: the implementation actually written, kept as-is where it
-- was correct or better than the original draft. Three real fixes
-- applied, each marked inline with why.
-- ============================================================

-- ============================================================
-- profiles — one row per authenticated user
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'byo-key', 'local')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, github_username)
  values (new.id, new.raw_user_meta_data ->> 'user_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- repos — one row per repo a user has run `securepush init` in
-- ============================================================
create table public.repos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  branch text not null default 'main',
  bank_id text unique not null,
  cli_secret uuid not null default gen_random_uuid(), -- FIX: caller-auth token
  provider text not null check (provider in ('groq', 'gemini', 'ollama', 'claude', 'cloud')),
  model text,
  test_command text,
  thresholds jsonb not null default '{"escalation_quality": 0.7, "file_shrink_max_pct": 30}'::jsonb,
  avg_scan_duration_ms integer, -- FIX: gives p_duration_ms somewhere to actually go
  last_scan_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- ============================================================
-- repo_stats — running totals only, one row per repo.
-- ============================================================
create table public.repo_stats (
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
create table public.muted_rules (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.repos(id) on delete cascade,
  issue_type text not null,
  muted_at timestamptz not null default now(),
  unique (repo_id, issue_type)
);

-- ============================================================
-- cli_sessions
-- ============================================================
create table public.cli_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting' check (status in ('waiting', 'linked', 'expired')),
  user_id uuid references public.profiles(id) on delete cascade,
  linked_at timestamptz,
  last_seen_at timestamptz,
  device_label text,
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

create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "own repos" on public.repos
  for all using (auth.uid() = owner_id);

create policy "own repo stats" on public.repo_stats
  for all using (
    repo_id in (select id from public.repos where owner_id = auth.uid())
  );

create policy "own muted rules" on public.muted_rules
  for all using (
    repo_id in (select id from public.repos where owner_id = auth.uid())
  );

create policy "anyone can create a session" on public.cli_sessions
  for insert with check (true);

create policy "read own session or unclaimed" on public.cli_sessions
  for select using (user_id is null or user_id = auth.uid());

create policy "only the linking user can update" on public.cli_sessions
  for update using (user_id is null or user_id = auth.uid());

-- Note: repos.cli_secret is intentionally readable only under the same
-- "own repos" policy above — a user can see their own repo's secret via
-- an authenticated dashboard call (e.g. to display/rotate it), but the
-- CLI itself receives it once at registration time and stores it locally,
-- it doesn't re-fetch it via an authenticated session.

-- ============================================================
-- RPC: process_scan_complete
-- Atomic updates for B3 telemetry.
-- ============================================================
create or replace function public.process_scan_complete(
    p_bank_id text,
    p_repo_name text,
    p_branch text,
    p_provider text,
    p_model text,
    p_test_command text,
    p_thresholds jsonb,
    p_duration_ms int,
    p_findings jsonb,
    p_muted jsonb,
    p_blocked boolean
) returns void as $$
declare
    v_owner_id uuid;
    v_github_username text;
    v_repo_id uuid;
    v_finding jsonb;
    v_issue text;
    v_action text;
    v_secrets int := 0;
    v_vulns int := 0;
    v_hallucinated_deps int := 0;
    v_mute text;
begin
    v_github_username := substring(p_bank_id from 12 for (length(p_bank_id) - 11 - length(p_repo_name) - 1));

    select id into v_owner_id from public.profiles where github_username = v_github_username;

    if v_owner_id is null then
        raise exception 'Profile not found for github_username: %', v_github_username;
    end if;

    insert into public.repos (owner_id, name, bank_id, provider, model, test_command, thresholds, last_scan_at, branch, avg_scan_duration_ms)
    values (v_owner_id, p_repo_name, p_bank_id, p_provider, p_model, p_test_command, p_thresholds, now(), p_branch, p_duration_ms)
    on conflict (owner_id, name) do update set
        provider = excluded.provider,
        model = excluded.model,
        test_command = excluded.test_command,
        thresholds = excluded.thresholds,
        last_scan_at = excluded.last_scan_at,
        branch = excluded.branch,
        avg_scan_duration_ms = case
          when public.repos.avg_scan_duration_ms is null then excluded.avg_scan_duration_ms
          else ((public.repos.avg_scan_duration_ms + excluded.avg_scan_duration_ms) / 2)
        end
    returning id into v_repo_id;

    for v_finding in select * from jsonb_array_elements(p_findings)
    loop
        v_issue := v_finding->>'issue';
        v_action := v_finding->>'action';

        if v_action = 'fixed' or v_action = 'blocked' then
            if v_issue = 'hardcoded_secret' then
                v_secrets := v_secrets + 1;
            elsif v_issue = 'hallucinated_dependency' then
                v_hallucinated_deps := v_hallucinated_deps + 1;
            else
                v_vulns := v_vulns + 1;
            end if;
        end if;
    end loop;

    insert into public.repo_stats (repo_id, total_scans, secrets_caught, vulns_caught, hallucinated_deps_caught, pushes_blocked, pushes_allowed, updated_at)
    values (
        v_repo_id,
        1,
        v_secrets,
        v_vulns,
        v_hallucinated_deps,
        case when p_blocked then 1 else 0 end,
        case when not p_blocked then 1 else 0 end,
        now()
    )
    on conflict (repo_id) do update set
        total_scans = repo_stats.total_scans + 1,
        secrets_caught = repo_stats.secrets_caught + excluded.secrets_caught,
        vulns_caught = repo_stats.vulns_caught + excluded.vulns_caught,
        hallucinated_deps_caught = repo_stats.hallucinated_deps_caught + excluded.hallucinated_deps_caught,
        pushes_blocked = repo_stats.pushes_blocked + excluded.pushes_blocked,
        pushes_allowed = repo_stats.pushes_allowed + excluded.pushes_allowed,
        updated_at = now();

    if p_muted is not null then
        for v_mute in select * from jsonb_array_elements_text(p_muted)
        loop
            insert into public.muted_rules (repo_id, issue_type, muted_at)
            values (v_repo_id, v_mute, now())
            on conflict (repo_id, issue_type) do nothing;
        end loop;
    end if;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.process_scan_complete from anon, authenticated;
grant execute on function public.process_scan_complete to service_role;

-- ============================================================
-- wallet_links
-- ============================================================
create table public.wallet_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  algorand_address text not null,
  is_active boolean not null default true,
  linked_at timestamptz not null default now()
);

-- ============================================================
-- payment_sessions
-- ============================================================
create table public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  repo_id uuid references public.repos(id) on delete cascade,
  amount_microalgos bigint not null,
  receiver_address text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'consumed', 'failed', 'expired')),
  algorand_tx_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

alter table public.wallet_links enable row level security;
alter table public.payment_sessions enable row level security;

create policy "own wallet links" on public.wallet_links
  for all using (auth.uid() = user_id);

create policy "own payment sessions" on public.payment_sessions
  for all using (auth.uid() = user_id);
