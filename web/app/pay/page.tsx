"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";

import styles from "../profile/page.module.css";

const peraWallet = new PeraWalletConnect({ chainId: 416002 });

export default function PayPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [status, setStatus] = useState<string>("loading");
  const [sessionData, setSessionData] = useState<{ amount_microalgos: number; receiver_address: string } | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("No session ID provided.");
      return;
    }

    fetch(`/api/payment/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setErrorMsg(data.error);
        } else if (data.status === "pending") {
          setStatus("pending");
          setSessionData({
            amount_microalgos: data.amount_microalgos,
            receiver_address: data.receiver_address,
          });
        } else {
          setStatus(data.status); // confirmed, failed, etc.
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message);
      });
  }, [sessionId]);

  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        peraWallet.connector?.on("disconnect", () => {
          setAccountAddress(null);
        });
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
      })
      .catch((e) => console.log(e));
  }, []);

  const connectWallet = () => {
    peraWallet
      .connect()
      .then((accounts) => {
        setAccountAddress(accounts[0]);
      })
      .catch((e) => console.log(e));
  };

  const handleApprove = async () => {
    if (!accountAddress || !sessionData || !sessionId) return;
    setIsProcessing(true);
    setErrorMsg("");

    try {
      // We need suggested params for the transaction
      // Since this is a client component, we use the algonode public endpoint directly
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      
      const suggestedParams = await algodClient.getTransactionParams().do();

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress,
        receiver: sessionData.receiver_address,
        amount: sessionData.amount_microalgos,
        suggestedParams,
        note: new Uint8Array(Buffer.from(`securepush-payment:${sessionId}`)),
      });

      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [accountAddress] }]]);
      
      const response = await algodClient.sendRawTransaction(signedTxns).do();
      const txId = (response as any).txId || (response as any).txid;

      setStatus("confirming");
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Tell backend to verify
      const res = await fetch(`/api/payment/${sessionId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_id: txId }),
      });

      const confirmData = await res.json();
      if (confirmData.error) {
        throw new Error(confirmData.error);
      }

      setStatus("confirmed");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Payment failed or was rejected.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading") {
    return (
      <>

        <main className={styles.shell}>
          <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>Loading session...</div>
        </main>
      </>
    );
  }

  if (status === "confirmed" || status === "consumed") {
    return (
      <>

        <main className={styles.shell}>
          <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
            <h2 style={{ color: "var(--success)" }}>Payment Confirmed</h2>
            <p>You can return to your terminal. The scan will proceed automatically.</p>
          </div>
        </main>
      </>
    );
  }

  if (status === "error" || status === "failed" || status === "expired") {
    return (
      <>

        <main className={styles.shell}>
          <div className={styles.card} style={{ textAlign: "center", padding: "40px" }}>
            <h2 style={{ color: "var(--error)" }}>Payment Failed</h2>
            <p>{errorMsg || `Session status: ${status}`}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>

      <main className={styles.shell}>
        <div className={styles.card} style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center" }}>
          <h2 style={{ marginBottom: "16px" }}>Approve Payment</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Please approve the payment to proceed with the cloud scan.
            <br />
            <strong style={{ color: 'var(--warning, #f5a623)' }}>Testnet — no real funds.</strong>
          </p>

          <div style={{ background: "var(--surface-soft)", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>
              {sessionData ? sessionData.amount_microalgos / 1_000_000 : 0} ALGO
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              To: {sessionData?.receiver_address}
            </div>
          </div>

          {!accountAddress ? (
            <button 
              onClick={connectWallet}
              style={{ padding: '12px 24px', background: '#ffe44d', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: "100%" }}
            >
              Connect Pera Wallet
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Connected as {accountAddress.slice(0, 6)}...{accountAddress.slice(-6)}
              </div>
              <button 
                onClick={handleApprove}
                disabled={isProcessing || status === "confirming"}
                style={{ padding: '12px 24px', background: 'var(--primary)', color: 'var(--bg-default)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: "100%" }}
              >
                {status === "confirming" ? "Confirming on-chain..." : isProcessing ? "Please sign in Pera..." : "Approve Payment"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
