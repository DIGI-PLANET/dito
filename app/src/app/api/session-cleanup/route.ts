import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Session cleanup beacon — just acknowledge
  return NextResponse.json({ success: true });
}
