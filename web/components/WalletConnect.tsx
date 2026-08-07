'use client';

import { PeraWalletConnect } from '@perawallet/connect';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const peraWallet = new PeraWalletConnect({
  chainId: 416002, // Algorand TestNet
  shouldShowSignTxnToast: false
});

export default function WalletConnect({ initialAddress }: { initialAddress: string | null }) {
  const [accountAddress, setAccountAddress] = useState<string | null>(initialAddress);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        peraWallet.connector?.on("disconnect", () => {
          setAccountAddress(null);
          saveWalletToProfile(null);
        });
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
      })
      .catch((e) => console.log(e));
  }, []);

  const saveWalletToProfile = async (address: string | null) => {
    await fetch("/api/wallet/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ algorand_address: address }),
    });
  };

  const handleConnect = () => {
    setIsConnecting(true);
    peraWallet
      .connect()
      .then((newAccounts) => {
        const address = newAccounts[0];
        setAccountAddress(address);
        saveWalletToProfile(address);
        peraWallet.connector?.on("disconnect", () => {
          setAccountAddress(null);
          saveWalletToProfile(null);
        });
      })
      .catch((error) => {
        if (error?.data?.type !== 'USER_REJECT') {
          console.log(error);
        }
      })
      .finally(() => {
        setIsConnecting(false);
      });
  };

  const handleDisconnect = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
    saveWalletToProfile(null);
  };

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Algorand Testnet Wallet</h3>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.9em', color: 'var(--text-muted)' }}>
        Connect your Pera Wallet to enable the pay-per-scan demo. <br />
        <strong style={{ color: 'var(--warning, #f5a623)' }}>Testnet — no real funds.</strong>
      </p>
      
      {accountAddress ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9em', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
            {accountAddress.slice(0, 8)}...{accountAddress.slice(-8)}
          </span>
          <button onClick={handleDisconnect} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={handleConnect} 
          disabled={isConnecting}
          style={{ padding: '8px 16px', background: '#ffe44d', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isConnecting ? 'Connecting...' : 'Connect Pera Wallet'}
        </button>
      )}
    </div>
  );
}
