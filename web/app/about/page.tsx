import GlobalNav from '@/components/GlobalNav';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'SecurePush | About',
};

export default function AboutPage() {
  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        <header className={styles.pageHead}>
          <h1>About SecurePush</h1>
        </header>

        <div className={styles.content}>
          <section>
            <h2>What SecurePush is</h2>
            <p>SecurePush is an automatic verification layer that runs before every Git push. It catches hardcoded secrets, dangerous patterns, and broken tests before they reach GitHub. It is built specifically for solo developers, indie hackers, and vibe coders who use AI coding agents.</p>
          </section>

          <section>
            <h2>Why it exists</h2>
            <p>We built SecurePush to close the AI agent code verification gap. You shouldn't have to remember to ask AI if your code is safe. Every push is verified automatically before it leaves your machine, providing peace of mind for small teams without dedicated security engineers.</p>
          </section>

          <section>
            <h2>Architecture</h2>
            <p>SecurePush unifies fragmented security tools directly into your workflow. Instead of running separate scanning tools in CI after code is already pushed, SecurePush automatically verifies, fixes, and tests code locally before the push happens. One click to fix, test, and safely ship.</p>
          </section>

          <section>
            <h2>Built with</h2>
            <p>We rely on standard borrowed infra like Next.js for routing and Hindsight for memory. Our earned moat is the data: as SecurePush runs, it learns your specific repository patterns and historical mistakes, providing increasingly accurate context that generic tools lack.</p>
          </section>

          <section>
            <h2>Roadmap</h2>
            <ul>
              <li><strong>CLI memory sync:</strong> Cross-machine learning for your entire team.</li>
              <li><strong>Weekly trend charts</strong> <span className={styles.postHackathon}>Post-Hackathon</span></li>
              <li><strong>Folder-level insights</strong> <span className={styles.postHackathon}>Post-Hackathon</span></li>
              <li><strong>Editable settings sync</strong> <span className={styles.postHackathon}>Post-Hackathon</span></li>
            </ul>
          </section>

          <section>
            <div className={styles.links}>
              <a href="https://github.com/securepush/securepush" target="_blank" rel="noopener noreferrer" className="button">GitHub Repo</a>
              <Link href="/pricing" className="button">Pricing</Link>
              <Link href="/login" className="button button-primary">Sign In</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
