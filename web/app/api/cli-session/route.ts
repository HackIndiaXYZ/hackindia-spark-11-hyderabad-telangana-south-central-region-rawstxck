import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const { device_label = 'SecurePush CLI' } = payload;

    const supabase = await createClient();

    // Insert an unclaimed session
    // RLS: "anyone can create a session" allows insert with check(true)
    const { data: session, error } = await supabase
      .from('cli_sessions')
      .insert({
        device_label,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error || !session) {
      console.error('Failed to create CLI session', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ id: session.id, status: 'pending' });
  } catch (err: any) {
    console.error('Create session error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
