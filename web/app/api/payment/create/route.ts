import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECEIVER_ADDRESS } from "@/lib/algorand";

// Hardcode scan price to 1 ALGO
const PRICE_MICROALGOS = 1_000_000;
const PRICE_ALGO = "1.00";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { bank_id } = await req.json();

    if (!bank_id) {
      return NextResponse.json({ error: "bank_id is required" }, { status: 400 });
    }

    // 1. Resolve profile from bank_id
    const usernameMatch = bank_id.match(/^securepush-([^-]+)-/);
    if (!usernameMatch) {
      return NextResponse.json({ error: "Invalid bank_id format" }, { status: 400 });
    }
    const githubUsername = usernameMatch[1];
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("github_username", githubUsername)
      .single();

    if (profileError || !profile) {
      console.error("[payment/create] No profile found for username:", githubUsername, profileError);
      return NextResponse.json(
        { error: "No linked account found for this repo — run `securepush login` first." },
        { status: 404 }
      );
    }

    // 2. Check active wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallet_links")
      .select("algorand_address")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .maybeSingle();

    if (walletError || !wallet) {
      console.error("[payment/create] No active wallet for user:", profile.id, walletError);
      return NextResponse.json(
        { error: "No wallet linked — visit /profile to connect a Pera Wallet first." },
        { status: 400 }
      );
    }

    // 3. Confirm receiver address is actually configured
    if (!RECEIVER_ADDRESS) {
      console.error("[payment/create] ALGORAND_RECEIVER_ADDRESS is not set in this environment.");
      return NextResponse.json(
        { error: "Server misconfiguration — payment receiver not set." },
        { status: 500 }
      );
    }

    // 3.5 Auto-register the repo if it's the first time we see it
    const repoName = bank_id.replace(/^securepush-[^-]+-/, "");
    const { error: upsertError } = await supabaseAdmin.from("repos").upsert(
      {
        bank_id: bank_id,
        owner_id: profile.id,
        name: repoName,
        branch: "main",
        provider: "cloud",
        thresholds: { file_shrink_max_pct: 30, cascadeflow_confidence: 0.7 }
      },
      { onConflict: "bank_id" }
    );

    if (upsertError) {
      console.error("[payment/create] Failed to auto-register repo:", upsertError);
      return NextResponse.json({ error: "Failed to register repository" }, { status: 500 });
    }

    // 4. Insert session
    const { data: session, error: insertError } = await supabaseAdmin
      .from("payment_sessions")
      .insert({
        user_id: profile.id,
        bank_id: bank_id,
        amount_microalgos: PRICE_MICROALGOS,
        receiver_address: RECEIVER_ADDRESS,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !session) {
      console.error("[payment/create] Insert failed:", insertError);
      return NextResponse.json({ error: `Database error: ${insertError?.message || 'Unknown'}` }, { status: 500 });
    }

    return NextResponse.json({
      id: session.id,
      amount_algo: PRICE_ALGO,
    });
  } catch (err: any) {
    console.error("[payment/create] Uncaught error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
