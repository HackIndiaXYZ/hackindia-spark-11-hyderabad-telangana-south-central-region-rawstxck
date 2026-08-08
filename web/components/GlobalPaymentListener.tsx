'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';

export default function GlobalPaymentListener() {
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    let channel: any = null;
    let mounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const userId = user.id;

      const peraWallet = new PeraWalletConnect({ shouldShowSignTxnToast: false });
      await peraWallet.reconnectSession().catch(() => {});

      // Initial check for pending payments
      const { data: initialPending } = await supabase
        .from('testnet_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (initialPending && mounted) {
        setPendingPayment(initialPending);
      }

      if (!mounted) return;

      // Subscribe to new pending payments
      channel = supabase.channel(`testnet_payments_${userId}_${Date.now()}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'testnet_payments',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (payload.new.status === 'pending') {
            setPendingPayment(payload.new);
          }
        })
        .subscribe();
    };

    init();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingPayment) return;

    const handlePayment = async () => {
      try {
        const peraWallet = new PeraWalletConnect({ shouldShowSignTxnToast: false });
        const accounts = await peraWallet.reconnectSession();
        
        if (!accounts || accounts.length === 0) {
          throw new Error("Pera Wallet not connected. Please connect in your Profile.");
        }

        const sender = accounts[0];
        
        // Setup Algod client
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
        const params = await algodClient.getTransactionParams().do();
        
        // Create transaction
        // NOTE: We should fetch TESTNET_RECEIVING_ADDRESS from an API or env, but this is a client component.
        // For security, Next.js allows NEXT_PUBLIC_ env vars. We will assume NEXT_PUBLIC_ALGO_RECEIVER is set.
        const receiver = process.env.NEXT_PUBLIC_ALGO_RECEIVER || sender; // Fallback to self if not set for demo
        
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender,
          receiver,
          amount: pendingPayment.amount_microalgos,
          suggestedParams: params
        });

        const txGroups = [{ txn, signers: [sender] }];
        const signedTxns = await peraWallet.signTransaction([txGroups]);
        
        // Send transaction
        const response = await algodClient.sendRawTransaction(signedTxns).do();
        const txidStr = (response as any).txId || (response as any).txid; // Fallback for SDK version differences

        // Update DB
        await supabase
          .from('testnet_payments')
          .update({ status: 'completed', tx_id: txidStr })
          .eq('id', pendingPayment.id);
          
        setPendingPayment(null);

      } catch (err: any) {
        console.error("Payment failed", err);
        // Mark as failed in DB
        await supabase
          .from('testnet_payments')
          .update({ status: 'failed' })
          .eq('id', pendingPayment.id);
          
        setPendingPayment(null);
      }
    };

    handlePayment();
  }, [pendingPayment]);

  // We can render a small toast or overlay if a payment is pending
  if (!pendingPayment) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--surface)',
      border: '1px solid var(--warning, #f5a623)',
      padding: '16px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Testnet Payment Pending</h4>
      <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>
        Please approve the transaction in your Pera Wallet to continue the scan. 
        <br/><strong style={{ color: 'var(--warning, #f5a623)' }}>Testnet — no real funds.</strong>
      </p>
    </div>
  );
}
