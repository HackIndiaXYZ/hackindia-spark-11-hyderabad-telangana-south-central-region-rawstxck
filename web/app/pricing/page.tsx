import GlobalNav from '@/components/GlobalNav';
import Link from 'next/link';
import Web3PricingButton from '@/components/Web3PricingButton';
import ByoKeyButton from '@/components/ByoKeyButton';
import styles from './page.module.css';

export const metadata = {
  title: 'SecurePush | Pricing',
};

export default function PricingPage() {
  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        <header className={styles.pageHead}>
          <h1>Account & plan</h1>
          <p className={styles.lead}>
            This controls the <b>hosted</b> option only. BYO-key and local (Ollama) modes never need a plan —
            the CLI runs the same either way, this just decides whether SecurePush hosts the AI calls and memory for you.
          </p>
        </header>

        <section className={styles.planGrid} aria-label="Plans">
          <div className={`${styles.planCard} ${styles.current}`}>
            <div className={styles.planNameRow}>
              <div className={styles.planName}>Free</div>
              <span className={styles.currentBadge}>CURRENT</span>
            </div>
            <div className={styles.price}><b>$0</b> /mo</div>
            <ul className={styles.planFeatures}>
              <li>Public repos, unlimited scans</li>
              <li>Groq + Gemini fast tier</li>
              <li>Repo memory, 30-day history</li>
            </ul>
            <button className={`${styles.planBtn} ${styles.currentBtn}`} disabled>Current plan</button>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planNameRow}>
              <div className={styles.planName}>Pro</div>
            </div>
            <div className={styles.price}><b>$10</b> /mo</div>
            <ul className={styles.planFeatures}>
              <li>Private repos</li>
              <li>Claude escalation tier</li>
              <li>Full history, no retention limit</li>
              <li>Priority scan queue</li>
            </ul>
            <Link href="/login" className={styles.planBtn}>Select Pro</Link>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planNameRow}>
              <div className={styles.planName}>BYO-key</div>
            </div>
            <div className={styles.price}><b>$0</b> /mo</div>
            <ul className={styles.planFeatures}>
              <li>Use your own Groq / Gemini / Claude key</li>
              <li>No hosted inference cost</li>
              <li>Memory still hosted</li>
            </ul>
            <ByoKeyButton className={styles.planBtn} />
          </div>

          <div className={styles.planCard}>
            <div className={styles.planNameRow}>
              <div className={styles.planName}>Web3 Pay-per-scan</div>
              <span className={`${styles.currentBadge} ${styles.web3Badge}`}>CONNECTED</span>
            </div>
            <div className={styles.price}><b>$0.15</b> /scan</div>
            <ul className={styles.planFeatures}>
              <li>Pay seamlessly with Pera Wallet</li>
              <li>Uses Algorand TestNet</li>
              <li>No subscription required</li>
              <li>Perfect for occasional scans</li>
            </ul>
            <Web3PricingButton className={styles.planBtn} />
          </div>
        </section>

        <section className={styles.faqSection}>
          <h2>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>Does BYO-key send my code anywhere?</h3>
              <p>Yes, directly to the AI provider you configure (Anthropic, Google, Groq). Your code bypasses our inference proxy, but we still store the history and memory insights in our database so your dashboard works.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Is local mode really zero-login?</h3>
              <p>Yes. If you point the CLI at a local Ollama instance, nothing touches our servers. You miss out on cross-machine memory sync and the web dashboard, but your code never leaves your laptop.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>What happens after I hit the free-tier limit?</h3>
              <p>The CLI will start returning a soft warning instead of blocking your pushes, and history won't be saved until you upgrade or switch to BYO-key.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Can I switch plans later?</h3>
              <p>Yes. You can move between Hosted, BYO-key, and Local modes at any time. Your history remains intact regardless of which inference method you use.</p>
            </div>
          </div>
        </section>

        <div className={styles.notice}>
          <b>This page is visual only for now.</b> Selecting a plan updates your account preference — there's no real billing wired up yet. Local and BYO-key modes work fully today with no account needed at all.
        </div>
      </main>
    </>
  );
}
