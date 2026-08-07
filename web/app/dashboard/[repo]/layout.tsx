import GlobalNav from '@/components/GlobalNav';
import Link from 'next/link';
import TabNav from './TabNav';
import GlobalPaymentListener from '@/components/GlobalPaymentListener';
import styles from './layout.module.css';

export default async function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;

  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        <header className={styles.pageHead}>
          <div className={styles.headerRow}>
            <div className={styles.titleWrapper}>
              <div className={styles.breadcrumb}>
                <Link href="/dashboard">~/dashboard</Link> / {repo}
              </div>
              <h1 className={styles.repoName}>{repo}</h1>
            </div>
            <div className={styles.healthBadge}>
              Health Score: <span className={styles.healthScore}>100</span>
            </div>
          </div>
          
          <TabNav repo={repo} />
        </header>

        {children}
      </main>
      <GlobalPaymentListener />
    </>
  );
}
