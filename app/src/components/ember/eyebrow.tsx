import { cn } from '@/lib/utils';

type EyebrowProps = {
  children: React.ReactNode;
  /** Spacing: tight (0.22em) or wide (0.32em). */
  spacing?: 'tight' | 'wide';
  tone?: 'dim' | 'ember' | 'teal' | 'gold';
  className?: string;
};

/**
 * Mono uppercase eyebrow label — the "— LABEL" pattern from the handoff.
 * Always JetBrains Mono, always uppercase, generous letter-spacing.
 */
export function Eyebrow({
  children,
  spacing = 'tight',
  tone = 'dim',
  className,
}: EyebrowProps) {
  const toneColor =
    tone === 'ember'
      ? 'var(--ember)'
      : tone === 'teal'
      ? 'var(--teal)'
      : tone === 'gold'
      ? 'var(--gold)'
      : 'var(--fg-dimmer)';

  return (
    <span
      className={cn('inline-block font-mono text-[10px] uppercase', className)}
      style={{
        fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
        letterSpacing: spacing === 'wide' ? '0.32em' : '0.22em',
        color: toneColor,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}
