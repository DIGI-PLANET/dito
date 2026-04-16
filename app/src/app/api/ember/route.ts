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
      .from('embers')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ember: null });
    }

    return NextResponse.json({ ember: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, ember_name, talent, talent_category, discovery_conversation, lang } = body;

    if (!email || !ember_name || !talent) {
      return NextResponse.json({ error: 'email, ember_name, and talent are required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('embers')
      .insert({
        email: email.toLowerCase(),
        ember_name,
        talent,
        talent_category: talent_category || 'hybrid',
        discovery_conversation: discovery_conversation || [],
        ember_stage: 'sparked',
        lang: lang || 'ko',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Ember creation error:', error);
      return NextResponse.json({ error: 'Failed to create ember' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ember: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ember id is required' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('embers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update ember' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ember: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
