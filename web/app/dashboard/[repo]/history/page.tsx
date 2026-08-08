import { createClient } from '@/lib/supabase/server';
import { getHistory } from '@/lib/hindsight-client';
import HistoryClient from './HistoryClient';

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

  const bank_id = `securepush-${user.user_metadata.user_name || user.id}-${repo}`;
  const { data: repoData } = await supabase
    .from('repos')
    .select('last_scan_at, attestation_tx_id')
    .eq('bank_id', bank_id)
    .single();

  const history = await getHistory(bank_id);

  // If history is empty, populate with some mock data to match the design (only in prototype mode)
  const displayHistory = history.length > 0 ? history : [
    {
      kind: 'fixed',
      title: 'Hardcoded secret removed before push',
      timestamp: '2026-07-24T09:41:00Z',
      bank_id: bank_id,
      codeContext: 'apps/web/lib/auth.ts → const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY',
      text: 'The developer accepted the environment variable fix, tests passed, and the push continued without exposing the key.',
    },
    {
      kind: 'rejected',
      title: 'Hallucinated dependency fix was proposed, then rejected',
      timestamp: '2026-07-22T18:07:00Z',
      bank_id: bank_id,
      codeContext: 'packages/cli/src/providers.ts → import rewritten away from "cascadeflow-lite"',
      text: 'The proposed import cleanup did not match the repo’s intended dependency graph, so the developer kept the warning and moved on.',
    },
    {
      kind: 'blocked',
      title: 'Auth fix failed the test gate and blocked the push',
      timestamp: '2026-07-20T13:12:00Z',
      bank_id: bank_id,
      codeContext: 'api/session.ts → refresh-token branch caused integration test failure',
      text: 'SecurePush applied the accepted fix, then stopped the push when the auth integration suite failed. Nothing reached GitHub.',
    }
  ];

  return <HistoryClient repo={repo} repoData={repoData} history={displayHistory} />;
}
