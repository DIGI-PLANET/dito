import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'edge';
export const alt = 'DITO.guru Soul Card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const STAGE_COLORS: Record<string, string> = {
  sparked: '#facc15',
  burning: '#f97316',
  blazing: '#ef4444',
  radiant: '#a855f7',
  eternal: '#fbbf24',
};

const STAGE_LABELS: Record<string, string> = {
  sparked: '🕯️ Sparked',
  burning: '🔥 Burning',
  blazing: '🔥🔥 Blazing',
  radiant: '✨ Radiant',
  eternal: '💎 Eternal',
};

function defaultOG() {
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
        <div style={{ fontSize: 72, fontWeight: 800, display: 'flex', marginBottom: 16 }}>
          <span style={{ color: '#D9582C' }}>DITO</span>
          <span style={{ color: '#ffffff80' }}>.guru</span>
        </div>
        <div style={{ fontSize: 28, color: '#ffffffcc', marginBottom: 24 }}>
          Don&apos;t Ignore The One you are
        </div>
        <div style={{ fontSize: 22, color: '#D9582C' }}>Find your Ember 🔥</div>
      </div>
    ),
    { ...size }
  );
}

export default async function Image({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  try {
    const params = await searchParams;
    const id = params?.id;
    if (!id) return defaultOG();

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('souls')
      .select('talent_label, traits, description, status')
      .eq('id', id)
      .single();

    if (error || !data) return defaultOG();

    const soul = data as { talent_label: string; traits: string[]; description: string; status: string };
    const stage = soul.status === 'minted' ? 'burning' : 'sparked';
    const stageColor = STAGE_COLORS[stage] || '#D9582C';
    const stageLabel = STAGE_LABELS[stage] || '🕯️ Sparked';

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
            padding: '40px 60px',
          }}
        >
          <div style={{ fontSize: 18, color: stageColor, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            {stageLabel}
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#ffffff', textAlign: 'center', marginBottom: 20, lineHeight: 1.2 }}>
            {soul.talent_label}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(soul.traits || []).slice(0, 5).map((trait: string, i: number) => (
              <div
                key={i}
                style={{
                  fontSize: 16,
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: `${stageColor}20`,
                  color: stageColor,
                  border: `1px solid ${stageColor}40`,
                }}
              >
                {trait}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, color: '#ffffffaa', textAlign: 'center', maxWidth: 800, lineHeight: 1.5, marginBottom: 32 }}>
            {soul.description?.slice(0, 150)}
          </div>
          <div style={{ fontSize: 16, color: '#D9582C' }}>Discovered on DITO.guru 🔥</div>
        </div>
      ),
      { ...size }
    );
  } catch {
    return defaultOG();
  }
}
