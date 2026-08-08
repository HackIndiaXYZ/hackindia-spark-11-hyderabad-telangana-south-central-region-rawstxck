import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data: session } = await supabaseAdmin
      .from("payment_sessions")
      .select("status, amount_microalgos, receiver_address")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "pending") {
      return NextResponse.json({
        status: session.status,
        amount_microalgos: session.amount_microalgos,
        receiver_address: session.receiver_address,
      });
    }

    // For any other status (confirmed, consumed, failed, expired), just return the status
    return NextResponse.json({ status: session.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
