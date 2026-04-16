import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendEmail, createPasswordResetEmail } from '@/lib/resend';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if email exists (don't reveal to client for security)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (!profile) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    await supabase
      .from('password_resets')
      .upsert({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt,
      });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dito.guru';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const lang = req.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en';
    const { subject, html } = createPasswordResetEmail(resetUrl, lang);
    await sendEmail({ to: email, subject, html });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
