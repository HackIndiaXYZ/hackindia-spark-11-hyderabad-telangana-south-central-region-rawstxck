import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECEIVER_ADDRESS } from "@/lib/algorand";

// Hardcode scan price to 1 ALGO
const PRICE_MICROALGOS = 1_000_000;
const PRICE_ALGO = "1.00";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { bank_id } = await req.json();

    if (!bank_id) {
      return NextResponse.json({ error: "bank_id is required" }, { status: 400 });
    }

    // Resolve owner_id from bank_id (e.g., bank_xxxxx_githubusername_reponame)
    // Actually, bank_id format is `bank_${random}_${github_username}_${repo_name}`
    // But since the CLI passes bank_id, we can look up the user by github_username directly,
    // or we can just query the `repos` table for this `bank_id`.
    const { data: repo } = await supabase
      .from("repos")
      .select("id, owner_id")
      .eq("bank_id", bank_id)
      .single();

    if (!repo) {
      return NextResponse.json({ error: "Repo not found for this bank_id. Run securepush login first." }, { status: 400 });
    }

    // Check if the user has an active wallet linked
    const { data: walletLink } = await supabase
      .from("wallet_links")
      .select("id")
      .eq("user_id", repo.owner_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!walletLink) {
      return NextResponse.json({ error: "no wallet linked — run `securepush login` and link a wallet at /profile first" }, { status: 400 });
    }

    // Create payment session
    const { data: session, error } = await supabase
      .from("payment_sessions")
      .insert({
        user_id: repo.owner_id,
        repo_id: repo.id,
        amount_microalgos: PRICE_MICROALGOS,
        receiver_address: RECEIVER_ADDRESS,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
    }

    return NextResponse.json({
      id: session.id,
      amount_algo: PRICE_ALGO,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
