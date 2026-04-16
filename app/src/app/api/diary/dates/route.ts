import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('diary_entries')
      .select('date')
      .eq('email', email.toLowerCase())
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ dates: [] });
    }

    const dates = [...new Set((data || []).map(d => d.date))];
    return NextResponse.json({ dates });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
