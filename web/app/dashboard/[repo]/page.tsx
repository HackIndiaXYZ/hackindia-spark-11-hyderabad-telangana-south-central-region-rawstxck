'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function RepoHistoryPage(props: { params: Promise<{ repo: string }> }) {
  const { repo } = use(props.params);
  const [filter, setFilter] = useState('all');

  const timelineEntries = [
    {
      id: 1,
      kind: 'fixed',
      date: '2026-07-24 09:41',
      title: 'Hardcoded secret removed before push',
      code: 'apps/web/lib/auth.ts → const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY',
      desc: 'The developer accepted the environment variable fix, tests passed, and the push continued without exposing the key.',
      badges: [{ label: 'Fixed', class: styles.badgeAccepted }, { label: 'Critical', class: styles.badgeRemoved }]
    },
    {
      id: 2,
      kind: 'rejected',
      date: '2026-07-22 18:07',
      title: 'Hallucinated dependency fix was proposed, then rejected',
      code: 'packages/cli/src/providers.ts → import rewritten away from "cascadeflow-lite"',
      desc: 'The proposed import cleanup did not match the repo’s intended dependency graph, so the developer kept the warning and moved on.',
      badges: [{ label: 'Rejected', class: styles.badgeProposed }, { label: 'Medium', class: styles.badgeProposed }]
    },
    {
      id: 3,
      kind: 'blocked',
      date: '2026-07-20 13:12',
      title: 'Auth fix failed the test gate and blocked the push',
      code: 'api/session.ts → refresh-token branch caused integration test failure',
      desc: 'SecurePush applied the accepted fix, then stopped the push when the auth integration suite failed. Nothing reached GitHub.',
      badges: [{ label: 'Blocked', class: styles.badgeRemoved }, { label: 'High', class: styles.badgeRemoved }]
    },
    {
      id: 4,
      kind: 'fixed',
      date: '2026-07-18 16:33',
      title: 'Unsafe logging removed from webhook handler',
      code: 'apps/api/webhooks/stripe.ts → deleted request-body console dump',
      desc: 'The developer accepted the fix after seeing request payload data in the diff, then the push passed on the next test run.',
      badges: [{ label: 'Fixed', class: styles.badgeAccepted }, { label: 'Warn', class: styles.badgeProposed }]
    }
  ];

  const filteredEntries = filter === 'all' ? timelineEntries : timelineEntries.filter(e => e.kind === filter);

  // Demo toggle state
  const [isEmpty, setIsEmpty] = useState(false);

  return (
    <div className={styles.page}>
      
      {/* Demo toggle for previewing states */}
      <div style={{ display: 'flex', gap: '6px', padding: '4px', borderRadius: '999px', background: 'var(--surface)', width: 'max-content', margin: '32px 0' }}>
        <button 
          onClick={() => setIsEmpty(false)} 
          style={{ border: 'none', background: !isEmpty ? 'var(--surface-raised)' : 'transparent', color: !isEmpty ? 'var(--text-primary)' : 'var(--text-faint)', font: '600 11px/1 var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '8px 14px', borderRadius: '999px', cursor: 'pointer' }}
        >Populated</button>
        <button 
          onClick={() => setIsEmpty(true)}
          style={{ border: 'none', background: isEmpty ? 'var(--surface-raised)' : 'transparent', color: isEmpty ? 'var(--text-primary)' : 'var(--text-faint)', font: '600 11px/1 var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '8px 14px', borderRadius: '999px', cursor: 'pointer' }}
        >Empty state</button>
      </div>

      {isEmpty ? (
        <section className={styles.emptyState}>
          <div className={styles.emptyMark}>＋</div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '-0.02em' }}>No pushes scanned yet.</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.7', maxWidth: '52ch' }}>
            Run <code>securepush init</code> in this repository to install the pre-push
            hook and start scanning. This page will fill with history and insights as soon as your first push
            runs through SecurePush.
          </p>
          <div className={styles.emptyCommand}>
            <span>~/your-project $</span> securepush init
          </div>
        </section>
      ) : (
        <>
          <section className={styles.hero}>
            <div>
              <div className={styles.eyebrow}>history / insights for {repo}</div>
              <h1>The repo remembers what almost shipped.</h1>
              <p className={styles.lead}>
                This is the differentiator made visible: a chronological log of findings, the
                developer decision on each one, and the patterns that keep showing up in the same repo.
              </p>
              <div className={styles.repoMeta} aria-label="Status legend">
                <div className={styles.smallChip}><span className={`${styles.statusDot} ${styles.green}`} aria-hidden="true"></span>Fixed / accepted</div>
                <div className={styles.smallChip}><span className={`${styles.statusDot} ${styles.amber}`} aria-hidden="true"></span>Proposed / rejected</div>
                <div className={styles.smallChip}><span className={`${styles.statusDot} ${styles.red}`} aria-hidden="true"></span>Blocked / failed gate</div>
              </div>
              <div className={styles.actions}>
                <a className={`${styles.action} ${styles.actionPrimary}`} href="#timeline">Review timeline</a>
                <Link className={styles.action} href="/dashboard">Back to dashboard</Link>
              </div>
            </div>

            <aside className={styles.statCard} aria-label="Near miss summary">
              <div className={styles.statTop}>
                <div>
                  <div className={styles.statLabel}>Near misses caught</div>
                  <div className={styles.statValue}>12</div>
                </div>
                <div className={styles.smallChip}><span className={`${styles.statusDot} ${styles.green}`} aria-hidden="true"></span>zero incidents</div>
              </div>
              <p className={styles.statCopy}>
                SecurePush has caught <strong>7 secrets</strong>, <strong>3 hallucinated dependencies</strong>,
                and <strong>2 auth vulnerabilities</strong> before they reached GitHub in this seeded repo.
              </p>
              <div className={styles.statBreakdown}>
                <div className={styles.breakItem}>
                  <strong style={{ color: 'var(--accepted)' }}>7</strong>
                  <span>Hardcoded keys swapped to environment variables.</span>
                </div>
                <div className={styles.breakItem}>
                  <strong style={{ color: 'var(--proposed)' }}>3</strong>
                  <span>Hallucinated packages rejected before they landed in package.json.</span>
                </div>
                <div className={styles.breakItem}>
                  <strong style={{ color: 'var(--removed)' }}>2</strong>
                  <span>Auth changes blocked because the test gate failed.</span>
                </div>
              </div>
            </aside>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.eyebrow}>repo health</div>
              <h2>Recent behavior at a glance.</h2>
              <p className={styles.sectionCopy}>
                These widgets stay factual: what happened, how often, and where the repo still needs guardrails.
              </p>
            </div>
            <div className={styles.dashboardGrid}>
              <article className={styles.widget}>
                <div className={styles.widgetHead}>
                  <div className={styles.widgetLabel}>First-pass test success</div>
                  <div className={styles.widgetMeta}>last 30 pushes</div>
                </div>
                <div className={styles.widgetValue}>94%</div>
                <div className={styles.widgetMeter} aria-hidden="true"><span style={{ width: '94%' }}></span></div>
                <p>Accepted fixes passed the test gate on the first run across the last 30 pushes.</p>
              </article>
              <article className={styles.widget}>
                <div className={styles.widgetHead}>
                  <div className={styles.widgetLabel}>Secret findings this week</div>
                  <div className={styles.widgetMeta}>repeat cluster</div>
                </div>
                <div className={styles.widgetValue}>3x</div>
                <div className={styles.widgetMeter} aria-hidden="true"><span style={{ width: '68%' }}></span></div>
                <p>Hardcoded secret findings came from the same auth and config areas again.</p>
              </article>
              <article className={styles.widget}>
                <div className={styles.widgetHead}>
                  <div className={styles.widgetLabel}>Memory scope</div>
                  <div className={styles.widgetMeta}>shared bank</div>
                </div>
                <div className={styles.widgetValue}>1 repo</div>
                <div className={styles.widgetMeter} aria-hidden="true"><span style={{ width: '100%' }}></span></div>
                <p>One shared memory bank ties the CLI scan and dashboard history together.</p>
              </article>
            </div>
          </section>

          <section className={styles.section} id="insights">
            <div className={styles.sectionHead}>
              <div className={styles.eyebrow}>memory callouts</div>
              <h2>Patterns worth acting on next.</h2>
              <p className={styles.sectionCopy}>
                Hindsight is most useful when it turns repeated issues into a concrete next move, not just a count.
              </p>
            </div>
            <div className={styles.insightGrid}>
              <article className={styles.insightCard}>
                <div className={styles.tag}>Most repeated</div>
                <strong>Secrets keep landing in auth and config files.</strong>
                <p>Three fixes this week came from the same area. Suggest an environment-template scaffold the next time this repo is initialized.</p>
              </article>
              <article className={styles.insightCard}>
                <div className={styles.tag}>Decision pattern</div>
                <strong>Rejected fixes cluster around generated import rewrites.</strong>
                <p>Two amber findings were rejected in utility packages. Tighten prompts or add a repo rule for dependency changes.</p>
              </article>
              <article className={styles.insightCard}>
                <div className={styles.tag}>Risk gate</div>
                <strong>The test gate blocked both auth regressions before push.</strong>
                <p>That is the last hard stop in the flow. Keep it configured even for small personal repos.</p>
              </article>
            </div>
          </section>

          <section className={styles.section} id="timeline">
            <div className={styles.sectionHead}>
              <div className={styles.eyebrow}>terminal log</div>
              <h2>Chronological repo history.</h2>
              <p className={styles.sectionCopy}>
                Monospace timestamps, file-path formatting, and action labels make the sequence readable like a real git log instead of another stack of generic cards.
              </p>
            </div>
            
            <div className={styles.filters} role="toolbar" aria-label="Timeline filters">
              <button 
                className={`${styles.filter} ${filter === 'all' ? styles.active : ''}`} 
                type="button" 
                onClick={() => setFilter('all')}
              >All findings</button>
              <button 
                className={`${styles.filter} ${filter === 'fixed' ? styles.active : ''}`} 
                type="button" 
                onClick={() => setFilter('fixed')}
              >Fixed</button>
              <button 
                className={`${styles.filter} ${filter === 'rejected' ? styles.active : ''}`} 
                type="button" 
                onClick={() => setFilter('rejected')}
              >Rejected</button>
              <button 
                className={`${styles.filter} ${filter === 'blocked' ? styles.active : ''}`} 
                type="button" 
                onClick={() => setFilter('blocked')}
              >Blocked</button>
            </div>

            <div className={styles.timeline} id="timeline-list">
              {filteredEntries.map(entry => (
                <article key={entry.id} className={styles.entry} data-kind={entry.kind}>
                  <div className={styles.timelineHead}>
                    <div>
                      <div className={styles.timelineMeta}>{entry.date} / {repo} / bank_id securepush-user-{repo}</div>
                      <h3>{entry.title}</h3>
                    </div>
                    <div className={styles.badgeRow}>
                      {entry.badges.map((badge, i) => (
                        <span key={i} className={`${styles.badge} ${badge.class}`}>{badge.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.timelineCode}>{entry.code}</div>
                  <p>{entry.desc}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className={styles.footer}>
        <span>~/securepush/history $ timeline --repo {repo}</span>
        <span><Link href="/dashboard">Back to dashboard</Link></span>
      </footer>
    </div>
  );
}
