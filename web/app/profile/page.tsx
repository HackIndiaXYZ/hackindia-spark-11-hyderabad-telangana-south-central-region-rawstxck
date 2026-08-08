import GlobalNav from '@/components/GlobalNav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WalletConnect from '@/components/WalletConnect';
import styles from './page.module.css';

export const metadata = {
  title: 'SecurePush | Account',
};

export default async function ProfilePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const promptWallet = searchParams.prompt_wallet === '1';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profile');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch active wallet
  const { data: walletLink } = await supabase
    .from('wallet_links')
    .select('algorand_address')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  // Fetch active CLI sessions
  const { data: sessions } = await supabase
    .from('cli_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'linked')
    .order('last_seen_at', { ascending: false });

  const currentPlan = profile?.plan_type || 'free';
  const githubUsername = profile?.github_username || user.user_metadata?.user_name || 'N/A';
  const avatarInitials = githubUsername.substring(0, 2).toUpperCase();

  return (
    <>
      <GlobalNav />
      <main className={styles.shell}>
        
        <header className={styles.pageHead}>
          <h1>Profile</h1>
          <p className={styles.lead}>
            Manage your connected identities and CLI sessions.
          </p>
        </header>

        <section className={styles.profileGrid}>
          <div className={styles.profileCard}>
            <h2>GitHub Identity</h2>
            <div className={styles.identityRow}>
              <div className={styles.avatar} style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                {avatarInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>{githubUsername}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accepted)' }}>✓ Linked</span>
              </div>
            </div>
          </div>

          <div className={styles.profileCard}>
            <h2>Web3 Identity</h2>
            <WalletConnect initialAddress={walletLink?.algorand_address || null} autoPrompt={promptWallet} />
          </div>

          <div className={styles.profileCard}>
            <h2>Authorized CLI Sessions</h2>
            {sessions && sessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sessions.map((session) => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(242, 240, 234, 0.08)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px' }}>{session.device_label || 'Unknown Device'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-faint)' }}>
                        Linked: {new Date(session.linked_at).toLocaleDateString()} · Last seen: {new Date(session.last_seen_at).toLocaleDateString()}
                      </span>
                    </div>
                    <form action={`/api/cli-session/${session.id}/revoke`} method="POST">
                      <button type="submit" className={styles.button}>Revoke</button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                No authorized CLI sessions found. Run <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>securepush login</code> from your terminal to link a device.
              </div>
            )}
          </div>
        </section>

        <footer className={styles.footer}>
          <span>~/securepush $ account</span>
          <span>Linked GitHub account is what your CLI syncs its memory bank to</span>
        </footer>
      </main>
    </>
  );
}
