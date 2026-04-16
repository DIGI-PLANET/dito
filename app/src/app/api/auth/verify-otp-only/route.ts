import { NextRequest, NextResponse } from 'next/server';
import { getRedis, otpMemory, type OtpData } from '@/lib/otp-store';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const key = `otp:${email.toLowerCase()}`;
    const redis = await getRedis();
    let otpData: OtpData | null = null;

    if (redis) {
      otpData = await redis.get<OtpData>(key);
    } else {
      otpData = otpMemory.get(key) || null;
    }

    if (!otpData) {
      return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
    }

    if (otpData.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
    }

    otpData.attempts += 1;

    if (otpData.code !== otp) {
      if (redis) {
        await redis.set(key, otpData, { keepTtl: true });
      } else {
        otpMemory.set(key, otpData);
      }
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP verified — clean up
    if (redis) {
      await redis.del(key);
    } else {
      otpMemory.delete(key);
    }

    return NextResponse.json({ success: true, verified: true });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
