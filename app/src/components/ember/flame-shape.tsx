'use client';

import Image from 'next/image';
import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type EmberStage =
  | 'dormant'
  | 'sparked'
  | 'burning'
  | 'blazing'
  | 'radiant'
  | 'eternal';

type StageDef = {
  id: EmberStage;
  name: string;
  short: string;
  scale: number;
  opacity: number;
  sat: number;
  bright: number;
  glow: number;
};

export const EMBER_STAGES: StageDef[] = [
  { id: 'dormant', name: 'Dormant', short: 'not lit yet',        scale: 0.55, opacity: 0.25, sat: 0.10, bright: 0.50, glow: 0.00 },
  { id: 'sparked', name: 'Sparked', short: 'first flame',        scale: 0.70, opacity: 0.70, sat: 0.55, bright: 0.85, glow: 0.30 },
  { id: 'burning', name: 'Burning', short: 'habit auto-engages', scale: 0.85, opacity: 0.90, sat: 0.85, bright: 1.00, glow: 0.60 },
  { id: 'blazing', name: 'Blazing', short: 'public-ready',       scale: 1.00, opacity: 1.00, sat: 1.05, bright: 1.08, glow: 0.85 },
  { id: 'radiant', name: 'Radiant', short: 'teaching others',    scale: 1.18, opacity: 1.00, sat: 1.15, bright: 1.12, glow: 1.05 },
  { id: 'eternal', name: 'Eternal', short: 'shapes the field',   scale: 1.35, opacity: 1.00, sat: 1.20, bright: 1.18, glow: 1.30 },
];

export function stageDef(stage: EmberStage): StageDef {
  return EMBER_STAGES.find((s) => s.id === stage) ?? EMBER_STAGES[2];
}

type FlameShapeProps = {
  stage?: EmberStage;
  size?: number;
  breathe?: boolean;
  rare?: boolean;
  dim?: boolean;
  src?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * FlameShape — the canonical Ember visual.
 * A single PNG re-styled across six stages via CSS filters only.
 * Size, opacity, brightness, saturation, and drop-shadow glow vary per stage.
 * No SVG redraw — the logo IS the flame.
 */
export function FlameShape({
  stage = 'burning',
  size = 96,
  breathe = false,
  rare = false,
  dim = false,
  src = '/ember-logo.png',
  className,
  style,
}: FlameShapeProps) {
  const s = stageDef(stage);
  const isDormant = dim || stage === 'dormant';
  const isEternal = stage === 'eternal' || rare;

  const px = Math.round(size * s.scale);
  const opacity = isDormant ? 0.22 : s.opacity;
  const glow = isDormant ? 0 : s.glow;
  const sat = isDormant ? 0.05 : s.sat;
  const bright = isDormant ? 0.45 : s.bright;

  const filter = [
    `saturate(${sat})`,
    `brightness(${bright})`,
    glow > 0 ? `drop-shadow(0 0 ${8 * glow}px rgba(232,119,72,${0.35 * glow}))` : '',
    glow > 0.5 ? `drop-shadow(0 0 ${20 * glow}px rgba(201,80,45,${0.22 * glow}))` : '',
    isEternal ? 'drop-shadow(0 0 24px rgba(240,215,168,0.35))' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        breathe && 'animate-ember-breathe',
        className
      )}
      style={{ width: px, height: px, ...style }}
    >
      {isEternal && (
        <span
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            inset: '-18%',
            background:
              'radial-gradient(circle at 50% 50%, rgba(240,215,168,0.28) 0%, transparent 62%)',
          }}
        />
      )}
      <Image
        src={src}
        alt=""
        width={px}
        height={px}
        priority={stage === 'blazing' || stage === 'radiant' || stage === 'eternal'}
        unoptimized
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity,
          filter,
          transition: 'opacity 400ms, filter 400ms',
        }}
      />
    </div>
  );
}
