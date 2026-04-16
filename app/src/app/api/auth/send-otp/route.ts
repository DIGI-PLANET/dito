import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, getRedis, otpMemory, type OtpData } from '@/lib/otp-store';
import { sendEmail, createOTPEmail } from '@/lib/resend';

const OTP_TTL = 300; // 5 minutes
const MAX_SENDS = 3;
const COOLDOWN_SEC = 60;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const key = `otp:${email.toLowerCase()}`;
    const redis = await getRedis();
    let otpData: OtpData | null = null;

    // Check existing OTP data
    if (redis) {
      const existing = await redis.get<OtpData>(key);
      if (existing) otpData = existing;
    } else {
      otpData = otpMemory.get(key) || null;
    }

    // Check send limits
    if (otpData) {
      if (otpData.sendCount >= MAX_SENDS) {
        return NextResponse.json({ error: 'Max OTP sends reached', maxReached: true }, { status: 429 });
      }
      const elapsed = Date.now() - otpData.lastSentAt;
      if (elapsed < COOLDOWN_SEC * 1000) {
        return NextResponse.json({ error: 'Please wait before requesting another code' }, { status: 429 });
      }
    }

    const code = generateOTP();
    const newData: OtpData = {
      code,
      attempts: 0,
      sendCount: (otpData?.sendCount || 0) + 1,
      lastSentAt: Date.now(),
    };

    // Store OTP
    if (redis) {
      await redis.set(key, newData, { ex: OTP_TTL });
    } else {
      otpMemory.set(key, newData);
      setTimeout(() => otpMemory.delete(key), OTP_TTL * 1000);
    }

    // Send email
    const lang = req.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en';
    const { subject, html } = createOTPEmail(code, lang);
    await sendEmail({ to: email, subject, html });

    return NextResponse.json({
      success: true,
      ttl: OTP_TTL,
      resendLeft: MAX_SENDS - newData.sendCount,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
