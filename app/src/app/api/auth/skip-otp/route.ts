import { NextRequest, NextResponse } from 'next/server';
import { getRedis, otpMemory } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Clean up OTP (user chose to skip)
    const key = `otp:${email.toLowerCase()}`;
    const redis = await getRedis();

    if (redis) {
      await redis.del(key);
    } else {
      otpMemory.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to skip OTP' }, { status: 500 });
  }
}
