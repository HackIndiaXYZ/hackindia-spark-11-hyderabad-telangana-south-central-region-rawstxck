import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getHistory } from '@/lib/hindsight-client';

export const metadata = {
  title: 'SecurePush | History',
};

export default async function RepoHistoryPage(props: { params: Promise<{ repo: string }> }) {
  const { repo } = await props.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Get the repo's latest scan and attestation
  const bank_id = `securepush-${user.user_metadata.user_name || user.id}-${repo}`;
  const { data: repoData } = await supabase
    .from('repos')
    .select('last_scan_at, attestation_tx_id')
    .eq('bank_id', bank_id)
    .single();

  const history = await getHistory(bank_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {repoData && repoData.last_scan_at ? (
        <div className="card">
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Latest Scan</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>
            Completed on {new Date(repoData.last_scan_at).toLocaleString()}
            {repoData.attestation_tx_id && (
              <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--accepted)' }}>✓</span>
                <Link 
                  href={`https://testnet.algoexplorer.io/tx/${repoData.attestation_tx_id}`} 
                  target="_blank"
                  style={{ color: 'var(--text-muted)', fontSize: '0.9em', textDecoration: 'underline' }}
                >
                  Verified on-chain
                </Link>
              </span>
            )}
          </p>
          <div style={{ color: 'var(--accepted)' }}>Status: Passed</div>
        </div>
      ) : (
        <div className="emptyState">
          <div className="emptyStateIcon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>No latest scan</h3>
          <p>Your previous scan results will appear here once you push code.</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Semantic Memory Timeline</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item: any, i: number) => (
              <li key={i} style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
