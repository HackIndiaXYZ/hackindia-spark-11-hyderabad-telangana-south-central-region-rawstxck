import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, buildDiffPrompt, parseFindingsResponse } from "@/lib/scan-shared";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { payment_session_id, files, pastPatterns = [] } = await req.json();

    if (!payment_session_id || !files) {
      return NextResponse.json({ error: "payment_session_id and files are required" }, { status: 400 });
    }

    // 1. Look up the payment_sessions row
    const { data: session } = await supabase
      .from("payment_sessions")
      .select("status, user_id")
      .eq("id", payment_session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Payment session not found" }, { status: 404 });
    }

    if (session.status !== "confirmed") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 401 });
    }

    // Rate limit check: max 20 scans per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("payment_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user_id)
      .eq("status", "consumed")
      .gte("created_at", oneHourAgo);

    if (countError) {
      return NextResponse.json({ error: "Failed to check rate limit" }, { status: 500 });
    }

    if (count !== null && count >= 20) {
      return NextResponse.json({ error: "Rate limit exceeded: maximum 20 paid scans per hour." }, { status: 429 });
    }
    // 2. Mark the session status = 'consumed'
    const { error: updateError } = await supabase
      .from("payment_sessions")
      .update({ status: "consumed" })
      .eq("id", payment_session_id)
      .eq("status", "confirmed"); // concurrency guard

    if (updateError) {
      return NextResponse.json({ error: "Failed to consume payment session" }, { status: 500 });
    }

    // 3. Run the review logic
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "Server missing GROQ_API_KEY" }, { status: 500 });
    }

    const diffPrompt = buildDiffPrompt(files);
    
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: buildSystemPrompt(pastPatterns) },
          { role: "user", content: diffPrompt },
        ],
        temperature: 0,
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      console.error("Groq API error:", text);
      return NextResponse.json({ error: "AI provider error" }, { status: 502 });
    }

    const data = await groqRes.json();
    const content = data.choices[0]?.message?.content || "";

    const { findings, parseFailed } = parseFindingsResponse(content);

    // 4. Return { findings }
    return NextResponse.json({ findings });
  } catch (err: any) {
    console.error("Paid scan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
