'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ByoKeyButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('groq');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();

  const handleSave = async () => {
    if (!apiKey) {
      setErrorMsg('API Key is required');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/settings/byo-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName, apiKey, provider })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save key');
      }

      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setApiKey('');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={className || "button"}
      >
        Select BYO-key
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)', padding: '32px', borderRadius: '12px',
            width: '100%', maxWidth: '400px', border: '1px solid var(--border)'
          }}>
            <h2 style={{ marginBottom: '16px' }}>Add your API Key</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Your key will be encrypted and stored securely. We will use this key for your scans when you select BYO-key mode.
            </p>

            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Provider</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-default)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
              >
                <option value="groq">Groq</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter (Claude, etc)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Key Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. My Groq Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-default)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>API Key</label>
              <input 
                type="password" 
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-default)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none' }}
              />
            </div>

            {status === 'error' && <div style={{ color: 'var(--error)', marginBottom: '16px', fontSize: '0.9rem' }}>{errorMsg}</div>}
            {status === 'success' && <div style={{ color: 'var(--success)', marginBottom: '16px', fontSize: '0.9rem' }}>Key saved successfully!</div>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={status === 'loading' || status === 'success'}
                style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: 'var(--bg-default)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {status === 'loading' ? 'Saving...' : 'Save Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
