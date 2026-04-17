import { NextRequest, NextResponse } from 'next/server';
import { sanitizePrompt, sanitizeHistory } from '@/lib/auth';

const GATEWAY_URL = process.env.NEXT_PUBLIC_DITO_API_URL || 'http://localhost:8091';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, lang, name } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Sanitize on frontend side before forwarding
    const sanitizedMessage = sanitizePrompt(message);
    const sanitizedHistory = sanitizeHistory(history);

    // Get JWT from cookie or generate a service token
    const accessToken = req.cookies.get('sb-access-token')?.value;
    const serviceToken = process.env.DITO_API_TOKEN || '';
    const authToken = accessToken || serviceToken;

    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check Accept header — pass through for SSE
    const wantsSSE = req.headers.get('Accept')?.includes('text/event-stream');

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/chat${wantsSSE ? '/stream' : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...(wantsSSE ? { 'Accept': 'text/event-stream' } : {}),
      },
      body: JSON.stringify({
        message: sanitizedMessage,
        mode: body.mode || 'discovery',
        history: sanitizedHistory.map(h => ({
          role: h.role,
          content: h.content,
        })),
        lang: lang || 'ko',
        name: name || 'Seeker',
      }),
    });

    if (!gatewayRes.ok) {
      const errBody = await gatewayRes.text();
      console.error('Gateway chat error:', gatewayRes.status, errBody);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: gatewayRes.status }
      );
    }

    // SSE: stream through
    if (wantsSSE && gatewayRes.body) {
      return new NextResponse(gatewayRes.body as ReadableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-SSE: forward JSON response
    const data = await gatewayRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
