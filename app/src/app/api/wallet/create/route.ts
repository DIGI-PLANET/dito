import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, wallet_address } = body;

    if (!email || !wallet_address) {
      return NextResponse.json({ error: 'email and wallet_address are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Link wallet to user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        wallet_address,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
