import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { indexerClient } from "@/lib/algorand";
import algosdk from "algosdk";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const sessionId = id;

    if (!sessionId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { tx_id } = await req.json();

    if (!tx_id) {
      return NextResponse.json({ error: "tx_id is required" }, { status: 400 });
    }

    // 1. Look up the payment_sessions row by id. Reject if not pending or if expires_at has passed.
    const { data: session } = await supabase
      .from("payment_sessions")
      .select("*, profiles(id), wallet_links(algorand_address)")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "pending") {
      return NextResponse.json({ error: `Session is no longer pending (status: ${session.status})` }, { status: 400 });
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("payment_sessions").update({ status: "expired" }).eq("id", sessionId);
      return NextResponse.json({ error: "Session has expired" }, { status: 400 });
    }

    // Get the user's linked active wallet. The join above might return an array if there are multiple,
    // so let's query wallet_links explicitly to ensure we get the active one.
    const { data: walletLink } = await supabase
      .from("wallet_links")
      .select("algorand_address")
      .eq("user_id", session.user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!walletLink) {
      await supabase.from("payment_sessions").update({ status: "failed" }).eq("id", sessionId);
      return NextResponse.json({ error: "No active wallet link found for user" }, { status: 400 });
    }

    // 2. Query the Algorand indexer directly for the transaction
    let txnInfo;
    try {
      const result = await indexerClient.lookupTransactionByID(tx_id).do();
      txnInfo = result.transaction;
    } catch (e: any) {
      return NextResponse.json({ error: "Transaction not found on-chain" }, { status: 400 });
    }

    // 3. Verify, independently, against the payment_sessions row
    let isMatch = true;
    let failureReason = "";

    const pTxn = (txnInfo as any)["payment-transaction"] || (txnInfo as any).paymentTransaction;
    if (!pTxn) {
      isMatch = false;
      failureReason = "Not a payment transaction";
    } else {
      if (pTxn.amount !== session.amount_microalgos) {
        isMatch = false;
        failureReason = `Amount mismatch (expected ${session.amount_microalgos}, got ${pTxn.amount})`;
      }
      if (pTxn.receiver !== session.receiver_address) {
        isMatch = false;
        failureReason = `Receiver mismatch`;
      }
    }

    if (txnInfo.sender !== walletLink.algorand_address) {
      isMatch = false;
      failureReason = `Sender mismatch (expected ${walletLink.algorand_address}, got ${txnInfo.sender})`;
    }

    let decodedNote = "";
    if (txnInfo.note) {
      // note can be Uint8Array or base64 string depending on the indexer response
      if (typeof txnInfo.note === "string") {
        decodedNote = Buffer.from(txnInfo.note, "base64").toString("utf-8");
      } else {
        decodedNote = Buffer.from(txnInfo.note).toString("utf-8");
      }
    }

    if (decodedNote !== `securepush-payment:${sessionId}`) {
      isMatch = false;
      failureReason = `Note mismatch or missing`;
    }

    const confirmedRound = (txnInfo as any)["confirmed-round"] || (txnInfo as any).confirmedRound;
    if (confirmedRound === undefined || confirmedRound === null || confirmedRound <= 0) {
      isMatch = false;
      failureReason = `Transaction not confirmed on-chain`;
    }

    // 4. Update status
    if (isMatch) {
      await supabase
        .from("payment_sessions")
        .update({ status: "confirmed", algorand_tx_id: tx_id })
        .eq("id", sessionId);

      return NextResponse.json({ success: true, status: "confirmed" });
    } else {
      await supabase
        .from("payment_sessions")
        .update({ status: "failed" })
        .eq("id", sessionId);

      return NextResponse.json({ error: `Verification failed: ${failureReason}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
