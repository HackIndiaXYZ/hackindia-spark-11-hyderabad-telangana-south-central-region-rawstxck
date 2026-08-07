'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PaymentModeToggle({ 
  bankId, 
  initialMode 
}: { 
  bankId: string, 
  initialMode: 'none' | 'testnet_demo' 
}) {
  const [mode, setMode] = useState(initialMode);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  const handleToggle = async () => {
    setIsUpdating(true);
    const newMode = mode === 'none' ? 'testnet_demo' : 'none';
    
    const { error } = await supabase
      .from('repos')
      .update({ payment_mode: newMode })
      .eq('bank_id', bankId);
      
    if (!error) {
      setMode(newMode);
    } else {
      console.error(error);
    }
    setIsUpdating(false);
  };

  return (
    <div style={{ padding: '16px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'left' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Testnet Pay-Per-Scan Demo</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.9em', color: 'var(--text-muted)' }}>
        Opt-in to the Web3 pay-per-scan flow for this repository. <br />
        <strong style={{ color: 'var(--warning, #f5a623)' }}>Testnet — no real funds.</strong> Requires Pera Wallet connection in Profile.
      </p>
      
      <button 
        onClick={handleToggle} 
        disabled={isUpdating}
        style={{ 
          padding: '8px 16px', 
          background: mode === 'testnet_demo' ? 'var(--accepted)' : 'var(--surface)', 
          color: mode === 'testnet_demo' ? '#fff' : 'var(--text-primary)', 
          border: '1px solid var(--border)', 
          borderRadius: '6px', 
          cursor: 'pointer', 
          fontWeight: 'bold' 
        }}
      >
        {isUpdating ? 'Updating...' : mode === 'testnet_demo' ? 'Enabled (Testnet)' : 'Disabled'}
      </button>
    </div>
  );
}
