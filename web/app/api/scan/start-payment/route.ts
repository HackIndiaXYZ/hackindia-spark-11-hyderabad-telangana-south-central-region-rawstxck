import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { bank_id } = payload;

    if (!bank_id) {
      return NextResponse.json({ error: 'Missing bank_id' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch repo details
    const { data: repo, error: repoError } = await supabase
      .from('repos')
      .select('id, owner_id, payment_mode')
      .eq('bank_id', bank_id)
      .single();

    if (repoError || !repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    if (repo.payment_mode !== 'testnet_demo') {
      return NextResponse.json({ required: false });
    }

    // Insert pending payment
    const { data: payment, error: insertError } = await supabase
      .from('testnet_payments')
      .insert({
        user_id: repo.owner_id,
        repo_id: repo.id,
        amount_microalgos: 1000, // 0.001 ALGO per scan
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError || !payment) {
      console.error('Failed to create payment row', insertError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ required: true, payment_id: payment.id });
  } catch (error) {
    console.error('start-payment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
