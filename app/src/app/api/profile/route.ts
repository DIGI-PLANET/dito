import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { authenticateGet, authenticateBody, sanitizeText } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Support both wallet auth and email-based lookup
    const email = searchParams.get('email');
    const walletAddress = searchParams.get('wallet_address') || searchParams.get('wallet');

    const supabase = createServiceClient();

    if (email) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    if (walletAddress) {
      const auth = await authenticateGet(searchParams);
      if (!auth.valid) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'email or wallet_address required' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    // Update profile
    const updates: Record<string, unknown> = {};
    if (body.display_name) updates.display_name = sanitizeText(body.display_name);
    if (body.current_talent) updates.current_talent = sanitizeText(body.current_talent);
    if (body.wallet_address) updates.wallet_address = body.wallet_address;
    if (body.discovery_complete !== undefined) updates.discovery_complete = body.discovery_complete;
    updates.updated_at = new Date().toISOString();

    if (body.email) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('email', body.email.toLowerCase())
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    if (body.wallet_address) {
      const auth = await authenticateBody(body);
      if (!auth.valid) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('wallet_address', body.wallet_address)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'email or wallet_address required' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
