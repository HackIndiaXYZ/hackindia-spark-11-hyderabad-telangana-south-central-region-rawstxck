import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { algorand_address } = await req.json();

    if (algorand_address) {
      // Set existing links to inactive
      await supabase
        .from("wallet_links")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Insert new active link
      await supabase
        .from("wallet_links")
        .insert({
          user_id: user.id,
          algorand_address,
          is_active: true,
        });
    } else {
      // User is unlinking (disconnecting)
      await supabase
        .from("wallet_links")
        .update({ is_active: false })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
