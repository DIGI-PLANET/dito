import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendEmail, createPasswordChangedEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'Email, token, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify reset token
    const { data: resetRecord } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('token', token)
      .maybeSingle();

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired' }, { status: 400 });
    }

    // Get user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Update password via Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password }
    );

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // Delete used reset token
    await supabase
      .from('password_resets')
      .delete()
      .eq('email', email.toLowerCase());

    // Send confirmation email
    const lang = req.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en';
    const { subject, html } = createPasswordChangedEmail(lang);
    sendEmail({ to: email, subject, html }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
