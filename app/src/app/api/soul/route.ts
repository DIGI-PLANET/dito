import { NextRequest } from 'next/server';
import { proxyToGateway } from '@/lib/gateway';

export async function GET(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/soul',
    forwardQuery: true,
  });
}

export async function POST(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/soul',
    forwardBody: true,
  });
}
