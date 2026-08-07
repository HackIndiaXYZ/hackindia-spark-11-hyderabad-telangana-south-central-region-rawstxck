import { createClient } from '@/lib/supabase/server';
import { getSmartInsight } from '@/lib/hindsight-client';

export const metadata = {
  title: 'SecurePush | Insights',
};

export default async function RepoInsightsPage(props: { params: Promise<{ repo: string }> }) {
  const { repo } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const bank_id = `securepush-${user.user_metadata.user_name || user.id}-${repo}`;
  const insight = await getSmartInsight(bank_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Semantic Codebase Insight</h3>
        {insight ? (
          <div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{insight.text}</p>
            <div style={{ marginTop: '16px', display: 'inline-block', background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>
              Recurring: {insight.pattern}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
            <p>Not enough data yet.</p>
            <p>Hindsight will analyze your codebase over time to provide actionable feedback.</p>
          </div>
        )}
      </div>
    </div>
  );
}
