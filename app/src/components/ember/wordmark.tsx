import { cn } from '@/lib/utils';

type WordmarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accent?: boolean;
  className?: string;
};

/**
 * DITO wordmark. Always Unbounded regardless of surrounding language context.
 * Use this component anywhere the brand appears — never hand-code "DITO".
 */
export function Wordmark({ size = 'md', accent = true, className }: WordmarkProps) {
  const sizeClass = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl md:text-6xl',
  }[size];

  return (
    <span
      className={cn(
        'font-display tracking-tight',
        sizeClass,
        accent && 'text-ember',
        className
      )}
      style={{ fontFamily: 'var(--font-unbounded), sans-serif', letterSpacing: '-0.025em' }}
    >
      DITO
    </span>
  );
}
