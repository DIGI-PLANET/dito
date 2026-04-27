'use client';

import { useState } from 'react';
import { Clock, Loader2, X } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Eyebrow } from '@/components/ember/eyebrow';

type Preset = '6m' | '1y' | '3y' | 'custom';

function addDuration(preset: Preset, custom: string): string {
  const d = new Date();
  if (preset === '6m') d.setMonth(d.getMonth() + 6);
  else if (preset === '1y') d.setFullYear(d.getFullYear() + 1);
  else if (preset === '3y') d.setFullYear(d.getFullYear() + 3);
  else return custom; // already YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

type Props = {
  entryId: string;
  email: string;
  currentUnlocksAt?: string | null;
  onScheduled: (unlocksAt: string) => void;
  onClose: () => void;
};

export function TimecapsuleSchedule({
  entryId,
  email,
  currentUnlocksAt,
  onScheduled,
  onClose,
}: Props) {
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [preset, setPreset] = useState<Preset>('1y');
  const [custom, setCustom] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const unlocksAt = addDuration(preset, custom);
  const valid = unlocksAt > today;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/timecapsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, entry_id: entryId, unlocks_at: unlocksAt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || (isKo ? '예약에 실패했어' : 'Failed to schedule'));
        return;
      }
      onScheduled(unlocksAt);
    } catch {
      setError(isKo ? '예약에 실패했어' : 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const presetOptions: { key: Preset; label: { en: string; ko: string } }[] = [
    { key: '6m', label: { en: '6 months', ko: '6개월' } },
    { key: '1y', label: { en: '1 year', ko: '1년' } },
    { key: '3y', label: { en: '3 years', ko: '3년' } },
    { key: 'custom', label: { en: 'Custom', ko: '직접' } },
  ];

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-120 rounded-t-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-1)',
          border: '1px solid var(--rule-strong)',
          boxShadow: 'var(--shadow-lift)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--rule)' }}>
          <div>
            <Eyebrow spacing="wide" tone="teal">— {isKo ? '타임캡슐' : 'timecapsule'}</Eyebrow>
            <h2
              className="mt-1 font-display text-[18px]"
              style={{ letterSpacing: '-0.01em', color: 'var(--fg)' }}
            >
              {currentUnlocksAt
                ? isKo
                  ? '열림 시점 바꾸기'
                  : 'Change unlock date'
                : isKo
                ? '미래의 나에게 보낸다'
                : 'Send to future me'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: 'var(--fg-dim)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-6">
          <p
            className="font-display text-[14px]"
            style={{ color: 'var(--fg-dim)', lineHeight: 1.55 }}
          >
            {isKo
              ? '이 기록은 그 날까지 아무도, 심지어 너도, 읽을 수 없어. 그 날이 오면 조용히 열려.'
              : "Until that day, no one — not even you — can read this. On that day, it opens quietly."}
          </p>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {presetOptions.map((opt) => {
              const active = preset === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setPreset(opt.key)}
                  className="rounded-lg py-2.5 font-mono text-[10px] uppercase transition"
                  style={{
                    letterSpacing: '0.18em',
                    backgroundColor: active ? 'var(--teal-soft)' : 'transparent',
                    color: active ? 'var(--teal)' : 'var(--fg-dim)',
                    border: `1px solid ${active ? 'var(--teal)' : 'var(--rule-strong)'}`,
                  }}
                >
                  {isKo ? opt.label.ko : opt.label.en}
                </button>
              );
            })}
          </div>

          {preset === 'custom' && (
            <input
              type="date"
              value={custom}
              min={today}
              onChange={(e) => setCustom(e.target.value)}
              className="mt-3 w-full rounded-md border px-3 py-2.5 font-display text-[14px] outline-none"
              style={{
                backgroundColor: 'var(--bg-2)',
                borderColor: 'var(--rule-strong)',
                color: 'var(--fg)',
              }}
            />
          )}

          <div
            className="mt-5 flex items-center gap-2 rounded-md px-3.5 py-2.5 font-mono text-[11px] uppercase"
            style={{
              letterSpacing: '0.2em',
              color: 'var(--teal)',
              backgroundColor: 'var(--teal-soft)',
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{isKo ? `${unlocksAt}에 열림` : `Opens on ${unlocksAt}`}</span>
          </div>

          {error && (
            <p className="mt-3 text-[12.5px]" style={{ color: 'var(--destructive)' }}>
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-full py-3 font-mono text-[11px] uppercase"
              style={{
                letterSpacing: '0.22em',
                border: '1px solid var(--rule-strong)',
                color: 'var(--fg)',
              }}
            >
              {isKo ? '취소' : 'cancel'}
            </button>
            <button
              onClick={submit}
              disabled={!valid || submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-mono text-[11px] uppercase transition disabled:opacity-40"
              style={{
                letterSpacing: '0.22em',
                backgroundColor: 'var(--teal)',
                color: 'var(--fg-on-teal)',
              }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isKo ? '봉인한다' : 'seal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
