create or replace function public.increment_repo_stats(
  p_repo_id uuid,
  p_total_scans int,
  p_secrets_caught int,
  p_vulns_caught int,
  p_hallucinated_deps_caught int,
  p_pushes_blocked int,
  p_pushes_allowed int
) returns void as $$
begin
  insert into public.repo_stats (
    repo_id,
    total_scans,
    secrets_caught,
    vulns_caught,
    hallucinated_deps_caught,
    pushes_blocked,
    pushes_allowed,
    updated_at
  ) values (
    p_repo_id,
    p_total_scans,
    p_secrets_caught,
    p_vulns_caught,
    p_hallucinated_deps_caught,
    p_pushes_blocked,
    p_pushes_allowed,
    now()
  ) on conflict (repo_id) do update set
    total_scans = public.repo_stats.total_scans + excluded.total_scans,
    secrets_caught = public.repo_stats.secrets_caught + excluded.secrets_caught,
    vulns_caught = public.repo_stats.vulns_caught + excluded.vulns_caught,
    hallucinated_deps_caught = public.repo_stats.hallucinated_deps_caught + excluded.hallucinated_deps_caught,
    pushes_blocked = public.repo_stats.pushes_blocked + excluded.pushes_blocked,
    pushes_allowed = public.repo_stats.pushes_allowed + excluded.pushes_allowed,
    updated_at = now();
end;
$$ language plpgsql security definer;
