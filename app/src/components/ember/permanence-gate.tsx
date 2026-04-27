'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type PermanenceGateProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Label text (bilingual allowed). Default: EN "I know I can't edit or delete this." */
  label?: string;
  /** Optional secondary/translated label underneath. */
  subLabel?: string;
  className?: string;
};

/**
 * Permanence gate — the "I understand this is permanent" checkbox.
 * Blocks commit until user acknowledges immutability.
 */
export function PermanenceGate({
  checked,
  onChange,
  label = "I know I can't edit or delete this.",
  subLabel,
  className,
}: PermanenceGateProps) {
  const [focused, setFocused] = useState(false);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        'flex w-full items-start gap-3 rounded-md p-3 text-left transition',
        checked
          ? 'border border-ember/40 bg-ember-soft'
          : 'border border-border bg-transparent hover:bg-muted/50',
        focused && 'ring-2 ring-ember/50',
        className
      )}
      style={{
        borderColor: checked ? 'var(--ember)' : 'var(--rule-strong)',
        backgroundColor: checked ? 'var(--ember-soft)' : 'transparent',
      }}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition'
        )}
        style={{
          borderColor: checked ? 'var(--ember)' : 'var(--rule-strong)',
          backgroundColor: checked ? 'var(--ember)' : 'transparent',
        }}
      >
        {checked && (
          <Check
            className="h-3.5 w-3.5"
            strokeWidth={3}
            style={{ color: 'var(--fg-on-ember)' }}
          />
        )}
      </span>
      <span className="flex flex-col gap-0.5">
        <span
          className="font-display text-[15px]"
          style={{
            color: checked ? 'var(--fg)' : 'var(--fg-dim)',
            letterSpacing: '-0.005em',
            lineHeight: 1.45,
          }}
        >
          {label}
        </span>
        {subLabel && (
          <span
            className="font-display text-[12.5px]"
            style={{ color: 'var(--fg-dimmer)', lineHeight: 1.45 }}
          >
            {subLabel}
          </span>
        )}
      </span>
    </button>
  );
}
