import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, buildDiffPrompt, parseFindingsResponse } from "@/lib/scan-shared";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { bank_id, files, pastPatterns = [] } = await req.json();

    if (!files || !bank_id) {
      return NextResponse.json({ error: "bank_id and files are required" }, { status: 400 });
    }

    // Look up the repo and owner
    const { data: repo } = await supabase
      .from("repos")
      .select("owner_id")
      .eq("bank_id", bank_id)
      .single();

    if (!repo) {
      return NextResponse.json({ error: "Repo not found or not connected to an account." }, { status: 404 });
    }

    // Look up the user's BYO key
    const { data: profile } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", repo.owner_id)
      .single();

    const byoKey = profile?.settings?.byo_key;

    if (!byoKey || !byoKey.key) {
      return NextResponse.json({ error: "No BYO key found in profile settings" }, { status: 400 });
    }

    // Support Groq for now (can expand to others based on byoKey.provider)
    const apiKey = byoKey.key;
    const provider = byoKey.provider || 'groq';

    if (provider !== 'groq') {
       return NextResponse.json({ error: "Only Groq is supported for BYO-key scans right now" }, { status: 400 });
    }

    const diffPrompt = buildDiffPrompt(files);
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    if (!res.ok) {
      const text = await res.text();
      console.error(`${provider} API error:`, text);
      return NextResponse.json({ error: "AI provider error with BYO key" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content || "";

    const { findings, parseFailed } = parseFindingsResponse(content);

    return NextResponse.json({ findings });
  } catch (err: any) {
    console.error("BYO scan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
