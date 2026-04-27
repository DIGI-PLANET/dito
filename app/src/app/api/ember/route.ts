import { NextRequest } from 'next/server';
import { proxyToGateway } from '@/lib/gateway';

export async function GET(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/ember',
    forwardQuery: true,
  });
}

export async function POST(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/ember',
    forwardBody: true,
  });
}

export async function PUT(req: NextRequest) {
  return proxyToGateway(req, {
    path: '/api/ember',
    forwardBody: true,
  });
}
