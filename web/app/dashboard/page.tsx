import GlobalNav from '@/components/GlobalNav';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'SecurePush | Dashboard',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  // Fetch repos (MVP)
  const { data: repos } = await (await supabase)
    .from('repos')
    .select('*')
    .eq('owner_id', user.id)
    .order('last_scan_at', { ascending: false });

  const hasRepos = repos && repos.length > 0;

  // Aggregated stats
  const totalScans = hasRepos ? repos.reduce((acc, repo) => acc + (repo.total_scans || 0), 0) : 0;
  const totalNearMisses = hasRepos ? repos.reduce((acc, repo) => acc + (repo.total_near_misses || 0), 0) : 0;
  const avgAcceptance = hasRepos 
    ? Math.round(repos.reduce((acc, repo) => acc + (repo.acceptance_rate || 0), 0) / repos.length) 
    : 0;

  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        <header className={styles.pageHead}>
          <h1 className={styles.title}>Welcome back.</h1>
          <p className={styles.lead}>
            You are monitoring {hasRepos ? repos.length : 0} repositories with a total of {totalScans} scans.
          </p>
        </header>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Repositories</span>
            <span className={styles.statValue}>{hasRepos ? repos.length : 0}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Scans</span>
            <span className={styles.statValue}>{totalScans}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Near Misses</span>
            <span className={styles.statValue}>{totalNearMisses}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Acceptance Rate</span>
            <span className={styles.statValue}>{hasRepos ? `${avgAcceptance}%` : '--'}</span>
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.mainColumn}>
            <h2 className={styles.sectionTitle}>Repositories</h2>
            
            {!hasRepos ? (
              <div className="emptyState">
                <div className="emptyStateIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 7V17C4 19.2091 5.79086 21 8 21H16C18.2091 21 20 19.2091 20 17V7" strokeLinecap="round"/>
                    <path d="M9 13L12 16L15 13" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 7L20 7" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>No repositories linked yet</h3>
                <p>Run the following command in any Git repository to install the SecurePush hooks. Every time you push, we will verify the code automatically.</p>
                <div className="command-line" style={{ marginTop: '16px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--accepted)' }}>$</span> npx securepush init
                </div>
              </div>
            ) : (
              <div className={styles.repoGrid}>
                {repos.map((repo) => (
                  <Link key={repo.id} href={`/dashboard/${repo.repo_name}`} className={styles.repoCard}>
                    <div className={styles.repoHeader}>
                      <span className={styles.repoName}>{repo.repo_name}</span>
                      <span className={styles.repoStatus}>Active</span>
                    </div>
                    <div className={styles.repoMetrics}>
                      <div className={styles.metric}>
                        Health Score
                        <b>{repo.health_score || 100}/100</b>
                      </div>
                      <div className={styles.metric}>
                        Near Misses
                        <b>{repo.total_near_misses || 0}</b>
                      </div>
                      <div className={styles.metric}>
                        Acceptance
                        <b>{repo.acceptance_rate || 100}%</b>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.panelBox}>
              <h2 className={styles.sectionTitle} style={{ fontSize: '16px' }}>Recent Activity</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Coming soon</div>
            </div>
            
            <div className={styles.panelBox}>
              <h2 className={styles.sectionTitle} style={{ fontSize: '16px' }}>Memory Preview</h2>
              {hasRepos ? (
                <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Top Repeated Mistake</div>
                    <div>Hardcoded credentials in tests</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Most Vulnerable Repo</div>
                    <div>{repos[0]?.repo_name || 'N/A'}</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No memory insights yet.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
