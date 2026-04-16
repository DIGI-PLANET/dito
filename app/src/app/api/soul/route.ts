import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { talent_label, traits, wallet_address, email } = body;

    if (!talent_label) {
      return NextResponse.json({ error: 'talent_label is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Create draft soul record
    const soulData = {
      talent_label,
      traits: traits || [],
      wallet_address: wallet_address || null,
      email: email?.toLowerCase() || null,
      stage: 'sparked',
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('souls')
      .insert(soulData)
      .select()
      .single();

    if (error) {
      console.error('Soul creation error:', error);
      return NextResponse.json({ error: 'Failed to create soul' }, { status: 500 });
    }

    return NextResponse.json({ success: true, soul: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
