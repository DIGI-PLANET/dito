import { cn } from '@/lib/utils';

type EmberLineProps = {
  /** Primary quote (any language). Shown large, display font. */
  quote: string;
  /** Optional translation/gloss shown underneath in dim color. */
  translation?: string;
  /** Compact size variant. */
  small?: boolean;
  /** Accent strip on the left (default: ember). */
  accent?: 'ember' | 'teal' | 'none';
  className?: string;
};

/**
 * EmberLine — Ember's bilingual voice block.
 * Primary line in display font, optional translation underneath.
 * This is Ember speaking — never attribute to Dargonne. No signature.
 */
export function EmberLine({
  quote,
  translation,
  small = false,
  accent = 'ember',
  className,
}: EmberLineProps) {
  const accentClass =
    accent === 'ember'
      ? 'border-l-2 border-ember bg-ember-soft'
      : accent === 'teal'
      ? 'border-l-2 border-teal bg-teal-soft'
      : '';

  return (
    <div
      className={cn(
        'rounded-r-md px-4 py-3.5',
        accentClass,
        className
      )}
      style={
        accent === 'ember'
          ? { backgroundColor: 'var(--ember-soft)', borderLeftColor: 'var(--ember)' }
          : accent === 'teal'
          ? { backgroundColor: 'var(--teal-soft)', borderLeftColor: 'var(--teal)' }
          : undefined
      }
    >
      <p
        className={cn(
          'm-0 font-display',
          small ? 'text-[17px]' : 'text-[21px]'
        )}
        style={{
          color: 'var(--fg)',
          letterSpacing: '-0.01em',
          lineHeight: 1.45,
        }}
      >
        {quote}
      </p>
      {translation && (
        <p
          className={cn(
            'mt-1.5 m-0 font-display',
            small ? 'text-[12px]' : 'text-[13.5px]'
          )}
          style={{ color: 'var(--fg-dimmer)', lineHeight: 1.45 }}
        >
          — {translation}
        </p>
      )}
    </div>
  );
}
