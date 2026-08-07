import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

    // Since RLS protects the cli_sessions table (user can only update their own)
    // we can use the regular authenticated client to delete it.
    const { error: deleteError } = await supabase
      .from('cli_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to revoke session', deleteError);
      return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
    }

    // Since this is called from a form action on the profile page, redirect back to profile
    redirect('/profile');
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Session revoke error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
