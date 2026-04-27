import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "DITO.guru — Don't Ignore The One you are";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🔥</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            display: 'flex',
            marginBottom: 16,
          }}
        >
          <span style={{ color: '#D9582C' }}>DITO</span>
          <span style={{ color: '#ffffff80' }}>.guru</span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#ffffffcc',
            marginBottom: 24,
          }}
        >
          Don&apos;t Ignore The One you are
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#D9582C',
          }}
        >
          Find your Ember 🔥
        </div>
      </div>
    ),
    { ...size }
  );
}
