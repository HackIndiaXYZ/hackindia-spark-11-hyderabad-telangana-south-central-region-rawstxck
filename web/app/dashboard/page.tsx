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
  const username = user.user_metadata?.user_name || user.email?.split('@')[0] || 'user';

  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        <header className={styles.pageHead}>
          <div className={styles.headCopy}>
            <div className={styles.eyebrow}>dashboard</div>
            <h1>Your repos.</h1>
            <p className={styles.lead}>
              Every repo SecurePush has scanned, with its most recent activity.
              Pick one to see its full history and memory.
            </p>
          </div>
          <Link href="/pricing" className={styles.action}>Manage plan</Link>
        </header>

        {!hasRepos ? (
          <section className={`${styles.emptyState} ${styles.active}`} aria-live="polite">
            <div className={styles.emptyMark}>＋</div>
            <h2>No pushes scanned yet.</h2>
            <p>
              Run <code>securepush init</code> in a repo to install the pre-push
              hook and start scanning. This page fills in as soon as your first push
              runs through SecurePush.
            </p>
            <div className={styles.emptyCommand}>
              <span>~/your-project $</span> securepush init
            </div>
          </section>
        ) : (
          <section className={`${styles.repoList} ${styles.active}`} aria-label="Scanned repositories">
            {repos.map((repo) => {
              const nearMisses = repo.total_near_misses || 0;
              let dotClass = styles.green;
              if (nearMisses > 5) dotClass = styles.red;
              else if (nearMisses > 0) dotClass = styles.amber;

              return (
                <Link key={repo.id} className={styles.repoCard} href={`/dashboard/${repo.repo_name}`}>
                  <div className={styles.repoMain}>
                    <div className={styles.repoNameRow}>
                      <span className={`${styles.statusDot} ${dotClass}`} aria-hidden="true"></span>
                      <span className={styles.repoName}>{repo.repo_name}</span>
                    </div>
                    <div className={styles.repoMeta}>
                      bank_id <b>securepush-{username}-{repo.repo_name}</b> · last scan {new Date(repo.last_scan_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.repoSide}>
                    <div className={styles.repoStat}>
                      <div className={styles.num}>{nearMisses}</div>
                      <div className={styles.label}>near misses</div>
                    </div>
                    <div className={styles.repoStat}>
                      <div className={styles.num}>{repo.acceptance_rate || 100}%</div>
                      <div className={styles.label}>gate pass</div>
                    </div>
                    <span className={styles.chevron}>→</span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        <footer className={styles.footer}>
          <span>~/securepush $ dashboard</span>
          <span>Pick a repo to open its full history and memory timeline</span>
        </footer>
      </main>
    </>
  );
}
