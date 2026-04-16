import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendEmail, createWelcomeEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Email, username, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check email uniqueness
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check username uniqueness
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Create auth user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create account' }, { status: 500 });
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        display_name: username,
        discovery_complete: false,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Send welcome email (non-blocking)
    const lang = req.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en';
    const { subject, html } = createWelcomeEmail(username, lang);
    sendEmail({ to: email, subject, html }).catch(() => {});

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
