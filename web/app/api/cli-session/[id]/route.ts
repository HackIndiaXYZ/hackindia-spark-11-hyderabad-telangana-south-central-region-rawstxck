import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
    }

    const supabase = await createClient();
    const supabaseAdmin = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // The CLI can poll this. If it's unclaimed, user_id is null.
    // If it's claimed, RLS allows the linked user OR unlinked users to view it.
    // We only need the status and the github_username (if linked).
    const { data: session, error } = await supabaseAdmin
      .from('cli_sessions')
      .select('status, user_id, profiles(github_username)')
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    // Update last_seen_at
    await supabaseAdmin.from('cli_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', id);

    let github_username = null;
    let wallet_connected = false;
    if (session.status === 'linked' && session.profiles) {
      // Supabase join syntax returns either an array or an object depending on the relationship.
      // Since it's a many-to-one (session -> profile), it returns an object or array of objects.
      const profile = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
      github_username = profile?.github_username;
      
      if (session.user_id) {
        const { data: wallet } = await supabaseAdmin
          .from('wallet_links')
          .select('algorand_address')
          .eq('user_id', session.user_id)
          .eq('is_active', true)
          .maybeSingle();
          
        if (wallet?.algorand_address) {
          wallet_connected = true;
        }
      }
    }

    return NextResponse.json({
      status: session.status,
      github_username,
      wallet_connected
    });
  } catch (err: any) {
    console.error('Session poll error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
