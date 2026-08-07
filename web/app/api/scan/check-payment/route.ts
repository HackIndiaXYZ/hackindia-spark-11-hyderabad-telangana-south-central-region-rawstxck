import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const paymentId = req.nextUrl.searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: payment, error } = await supabase
      .from('testnet_payments')
      .select('status, tx_id')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: payment.status,
      tx_id: payment.tx_id 
    });
  } catch (error) {
    console.error('check-payment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
