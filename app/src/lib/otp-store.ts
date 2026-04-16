// 공유 OTP 저장소 — send-otp, verify-otp 간 동일 인스턴스 사용
// Redis가 없는 로컬 개발 환경에서 in-memory fallback을 공유하기 위함

export interface OtpData {
  code: string;
  attempts: number;
  sendCount: number;
  lastSentAt: number;
}

// ─── Redis singleton ───
let _redis: import('@upstash/redis').Redis | null | undefined;

export async function getRedis(): Promise<import('@upstash/redis').Redis | null> {
  if (_redis !== undefined) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    _redis = null;
    return null;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    _redis = Redis.fromEnv();
    return _redis;
  } catch {
    _redis = null;
    return null;
  }
}

// ─── In-memory fallback (단일 인스턴스) ───
export const otpMemory = new Map<string, OtpData>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
