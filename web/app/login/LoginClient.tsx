'use client';

import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionId = searchParams.get('session');
  const redirect = searchParams.get('redirect');
  const error = searchParams.get('error');
  const requiresWallet = searchParams.get('requires_wallet') === 'true';

  const [isLinking, setIsLinking] = useState(false);
  const [linkedUser, setLinkedUser] = useState<string | null>(null);

  useEffect(() => {
    // If the user arrives here already authenticated, and there's a session to link,
    // we should link it immediately and show the success state.
    const checkAuthAndLink = async () => {
      const supabase = createClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (authSession?.user && sessionId) {
        setIsLinking(true);
        setLinkedUser(authSession.user.user_metadata?.user_name || authSession.user.email?.split('@')[0] || 'User');
        
        // Call the server-side API to claim the session bypassing restrictive RLS
        const claimRes = await fetch(`/api/cli-session/${sessionId}/claim`, {
          method: 'POST',
        });
        
        if (!claimRes.ok) {
          console.error('Failed to claim session');
        }
          
        // If there was an explicit redirect (e.g. they clicked Dashboard while logged out), go there.
        // If they just ran `securepush login`, they stay on this screen which tells them to close the tab.
        // If they ran `securepush init` with cloud provider, we need to prompt for a wallet connection.
        if (requiresWallet) {
          setTimeout(() => {
            router.push('/profile?prompt_wallet=1');
          }, 1500);
        } else if (redirect) {
          setTimeout(() => {
            router.push(redirect);
          }, 1500);
        }
      } else if (authSession?.user && redirect) {
        // Just redirect if they are already logged in and just hit /login?redirect=/dashboard
        router.push(redirect);
      }
    };
    
    checkAuthAndLink();
  }, [sessionId, redirect, router]);

  const handleGitHubLogin = async () => {
    const supabase = createClient();
    const callbackUrl = new URL(window.location.origin + '/auth/callback');
    
    if (redirect) callbackUrl.searchParams.set('next', redirect);
    else if (sessionId) {
      const nextUrl = `/login?session=${sessionId}${requiresWallet ? '&requires_wallet=true' : ''}`;
      callbackUrl.searchParams.set('next', nextUrl);
    }
    else callbackUrl.searchParams.set('next', '/dashboard');

    if (sessionId) {
      callbackUrl.searchParams.set('session', sessionId);
    }
    
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: callbackUrl.toString()
      }
    });
  };

  return (
    <div className="login-page">
      <div className="card" id="loginCard">
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-mark"></span> SecurePush
        </div>

        {!isLinking ? (
          <div className="pre-auth" style={{ display: 'grid', gap: '24px' }}>
            <div>
              <h1>{sessionId ? 'Sign in to link your CLI' : 'Sign in to SecurePush'}</h1>
              <p className="lead">
                {sessionId 
                  ? <>You ran <code>securepush login</code> in your terminal — sign in here and your CLI links to this GitHub account automatically.</>
                  : 'Review AI code before it reaches GitHub.'
                }
              </p>
              {error === 'auth-failed' && (
                <p className="error-text" style={{ color: 'var(--text-primary)', marginTop: '8px' }}>Authentication failed. Please try again.</p>
              )}
            </div>

            {sessionId && (
              <div className="session-pill" aria-live="polite">
                <span className="dot"></span> Waiting on session <span id="sessionId">{sessionId}</span>
              </div>
            )}

            <button className="button primary" id="githubBtn" type="button" onClick={handleGitHubLogin}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Sign in with GitHub
            </button>

            <div className="divider">or</div>

            <form className="field-group" id="emailForm" onSubmit={(e) => e.preventDefault()}>
              <input className="field" type="email" placeholder="Email" required />
              <input className="field" type="password" placeholder="Password" required />
              <button className="button" type="submit">Sign in with email</button>
            </form>

            <p className="fine-print" style={{ marginTop: '16px' }}>
              Only need to run SecurePush locally or with your own API key? <b>No login required</b> — this is only for hosted memory/history and account access.
            </p>
          </div>
        ) : (
          <div className="linking-state active" id="linkingState">
            <div className="spinner" role="status" aria-label="Linking"></div>
            <h1 style={{ fontSize: '22px' }}>Linking your CLI…</h1>
            <p className="lead">Signed in as <b id="linkedUser" style={{ color: 'var(--text-primary)' }}>{linkedUser}</b>. Your terminal will pick this up automatically — you can close this tab once it confirms.</p>
            <div className="session-pill" style={{ background: 'rgba(62,207,142,0.12)', color: 'var(--accepted)' }}>
              <span className="dot" style={{ background: 'var(--accepted)' }}></span> Session linked
            </div>
            {redirect && (
              <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Redirecting...</p>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font: 700 14px/1 var(--font-mono);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        .brand-mark {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid rgba(242, 240, 234, 0.14);
          background:
            linear-gradient(135deg, transparent 0 44%, rgba(242, 240, 234, 0.92) 44% 56%, transparent 56%),
            rgba(255, 255, 255, 0.04);
        }

        .card {
          width: 100%;
          max-width: 420px;
          display: grid;
          gap: 24px;
          text-align: center;
        }

        h1 {
          margin: 0;
          font-family: var(--font-display);
          font: 700 clamp(28px, 5vw, 34px)/1.1 var(--font-display);
          letter-spacing: -0.03em;
        }

        .lead {
          margin: 0;
          color: var(--text-muted);
          font-size: 15px;
          line-height: 1.6;
        }

        .session-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: center;
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--surface);
          color: var(--text-faint);
          font-size: 12px;
          letter-spacing: 0.04em;
        }

        .session-pill .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--proposed);
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 52px;
          padding: 0 24px;
          border-radius: 999px;
          border: 1px solid rgba(242, 240, 234, 0.14);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          font: 600 14px/1 var(--font-mono);
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
        }

        .button.primary {
          background: var(--text-primary);
          color: var(--bg);
          border-color: transparent;
        }

        .button:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(242, 240, 234, 0.28); transform: translateY(-1px); }
        .button.primary:hover { background: white; }

        .button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          color: var(--text-faint);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .field-group { display: grid; gap: 10px; text-align: left; }

        .field {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid transparent;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 15px;
        }

        .field:focus { outline: none; border-color: var(--text-faint); }
        .field::placeholder { color: var(--text-faint); }

        .fine-print {
          color: var(--text-faint);
          font-size: 13px;
          line-height: 1.6;
        }

        .fine-print b { color: var(--text-muted); font-weight: 500; }

        .linking-state {
          display: none;
          gap: 16px;
          justify-items: center;
          padding: 12px 0;
        }

        .linking-state.active { display: grid; }

        .spinner {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--border);
          border-top-color: var(--accepted);
          animation: spin 800ms linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .button { transition: none; }
          .spinner { animation-duration: 1600ms; }
        }
      `}</style>
    </div>
  );
}
