import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize an admin client to bypass RLS for this specific operation
    // as per SecurePush_Backend_Schema.md requirements
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch the session to verify it's still pending and not expired
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('cli_sessions')
      .select('status, expires_at, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'linked') {
      if (session.user_id === user.id) {
        // It was already linked to this user (e.g. by the OAuth callback)
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Session already claimed by another user' }, { status: 400 });
    }

    if (session.status !== 'pending') {
      return NextResponse.json({ error: 'Session already claimed or revoked' }, { status: 400 });
    }

    if (new Date() > new Date(session.expires_at)) {
      return NextResponse.json({ error: 'Session expired' }, { status: 400 });
    }

    // 2. Claim it
    const { error: updateError } = await supabaseAdmin
      .from('cli_sessions')
      .update({
        status: 'linked',
        user_id: user.id,
        linked_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending');

    if (updateError) {
      return NextResponse.json({ error: 'Failed to claim session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Session claim error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
