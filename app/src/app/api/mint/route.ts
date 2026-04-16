import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { soul_id, wallet_address, transaction_signature } = body;

    if (!soul_id || !wallet_address) {
      return NextResponse.json({ error: 'soul_id and wallet_address are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Update soul status to minted
    const { data, error } = await supabase
      .from('souls')
      .update({
        status: 'minted',
        wallet_address,
        mint_transaction: transaction_signature || null,
        minted_at: new Date().toISOString(),
      })
      .eq('id', soul_id)
      .select()
      .single();

    if (error) {
      console.error('Mint update error:', error);
      return NextResponse.json({ error: 'Failed to update mint status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      soul: data,
      mintAddress: data?.wallet_address,
    });
  } catch {
    return NextResponse.json({ error: 'Mint failed' }, { status: 500 });
  }
}
