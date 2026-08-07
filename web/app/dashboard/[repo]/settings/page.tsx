import { createClient } from '@/lib/supabase/server';
import PaymentModeToggle from '@/components/PaymentModeToggle';

export const metadata = {
  title: 'SecurePush | Settings',
};

export default async function RepoSettingsPage(props: { params: Promise<{ repo: string }> }) {
  const { repo } = await props.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Not authenticated</div>;
  }

  const bank_id = `securepush-${user.user_metadata.user_name || user.id}-${repo}`;
  const { data: repoData } = await supabase
    .from('repos')
    .select('payment_mode')
    .eq('bank_id', bank_id)
    .single();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PaymentModeToggle bankId={bank_id} initialMode={repoData?.payment_mode || 'none'} />
      
      <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--surface-soft)', borderRadius: '12px', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
        <p>More Settings coming soon.</p>
        <p>You will be able to manage rules and CLI configurations here.</p>
      </div>
    </div>
  );
}
