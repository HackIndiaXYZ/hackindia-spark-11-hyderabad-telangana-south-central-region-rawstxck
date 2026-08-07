import GlobalNav from '@/components/GlobalNav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WalletConnect from '@/components/WalletConnect';
import styles from './page.module.css';

export const metadata = {
  title: 'SecurePush | Profile',
};

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profile');
  }

  // Fetch profile
  const { data: profile } = await (await supabase)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch active wallet
  const { data: walletLink } = await (await supabase)
    .from('wallet_links')
    .select('algorand_address')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  // Fetch active CLI sessions
  const { data: sessions } = await (await supabase)
    .from('cli_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'linked')
    .order('last_seen_at', { ascending: false });

  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        <header className={styles.pageHead}>
          <h1 className={styles.title}>Your Profile</h1>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Information</h2>
          <div className="card">
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{user.email || profile?.email || 'N/A'}</span>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>GitHub Username</span>
              <span className={styles.value}>{profile?.github_username || 'Not connected'}</span>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Plan</span>
              <span className={styles.value} style={{ textTransform: 'capitalize' }}>
                {profile?.plan_type || 'free'}
              </span>
            </div>
          </div>
          <WalletConnect initialAddress={walletLink?.algorand_address || null} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Authorized CLI Sessions</h2>
          <div className="card">
            {sessions && sessions.length > 0 ? (
              <div className={styles.sessionList}>
                {sessions.map((session) => (
                  <div key={session.id} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionLabel}>{session.device_label || 'Unknown Device'}</span>
                      <span className={styles.sessionMeta}>
                        Linked: {new Date(session.linked_at).toLocaleDateString()} · Last seen: {new Date(session.last_seen_at).toLocaleDateString()}
                      </span>
                    </div>
                    <form action={`/api/cli-session/${session.id}/revoke`} method="POST">
                      <button type="submit" className="button">Revoke</button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="emptyState" style={{ padding: '32px 16px' }}>
                <p style={{ margin: 0 }}>No authorized CLI sessions found. Run <code>securepush login</code> from your terminal to link a device.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
