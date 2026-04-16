import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const date = searchParams.get('date');

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('diary_entries')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ entries: [] });
    }

    return NextResponse.json({ entries: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, content, date } = body;

    if (!email || !content) {
      return NextResponse.json({ error: 'email and content required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        email: email.toLowerCase(),
        content,
        date: date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save diary entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
