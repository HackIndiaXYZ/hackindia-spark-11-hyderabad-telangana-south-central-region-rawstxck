import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // Custom params passed through from login page
  const next = searchParams.get('next') ?? '/dashboard';
  const cliSessionId = searchParams.get('session');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      if (cliSessionId) {
        // Link the CLI session to this user
        await supabase
          .from('cli_sessions')
          .update({ 
            status: 'linked', 
            user_id: data.user.id 
          })
          .eq('id', cliSessionId)
          .is('status', 'pending');
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
