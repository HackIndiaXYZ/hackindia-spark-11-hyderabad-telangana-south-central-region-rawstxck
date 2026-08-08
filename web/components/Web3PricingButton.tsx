'use client';
import { useState, useEffect } from 'react';
import { getPeraWallet } from '@/lib/pera';

export default function Web3PricingButton({ className }: { className?: string }) {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    const peraWallet = getPeraWallet();
    if (!peraWallet) return;
    
    // Auto-reconnect if a session exists
    peraWallet.reconnectSession().then((accounts) => {
      peraWallet.connector?.on("disconnect", () => {
        setAccountAddress(null);
      });
      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    }).catch(console.error);
  }, []);

  const connectWallet = () => {
    const peraWallet = getPeraWallet();
    if (!peraWallet) return;
    peraWallet
      .connect()
      .then((accounts) => {
        setAccountAddress(accounts[0]);
        // Also save it via the wallet link API
        fetch('/api/wallet/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ algorandAddress: accounts[0] }),
        }).catch(console.error);
      })
      .catch((e) => {
        if (e?.message?.includes("Session currently connected")) {
          // If stuck in connected state, force disconnect and try again
          peraWallet.disconnect();
          connectWallet(); // retry after disconnecting
        } else {
          console.error("PeraWallet connection failed:", e);
        }
      });
  };

  const disconnectWallet = () => {
    const peraWallet = getPeraWallet();
    if (!peraWallet) return;
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  if (accountAddress) {
    return (
      <button 
        onClick={disconnectWallet}
        className={`${className || "button"} connectedBtn`}
      >
        Disconnect {accountAddress.slice(0, 6)}...
      </button>
    );
  }

  return (
    <button 
      onClick={connectWallet}
      className={className || "button"}
    >
      Connect Pera Wallet
    </button>
  );
}
