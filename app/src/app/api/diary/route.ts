import { NextRequest } from 'next/server';
import { proxyToGateway } from '@/lib/gateway';

export async function GET(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/diary',
    forwardQuery: true,
  });
}

export async function POST(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/diary',
    forwardBody: true,
  });
}

// No PUT / DELETE — entries are immutable once committed.
// The Gateway's DB trigger enforces this even if a caller finds another path.
