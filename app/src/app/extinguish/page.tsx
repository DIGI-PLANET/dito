'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store } from '@/lib/store';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { FlameShape } from '@/components/ember/flame-shape';
import { Eyebrow } from '@/components/ember/eyebrow';
import { EmberLine } from '@/components/ember/ember-line';
import { PermanenceGate } from '@/components/ember/permanence-gate';

type Stage = 'confirm' | 'reflect' | 'seal' | 'done';

export default function ExtinguishPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>('confirm');
  const [talent, setTalent] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const profile = store.getProfile();
    setTalent(profile.current_talent || '');
  }, []);

  const handleSeal = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const wallet = getWalletCookie();
      const profile = store.getProfile();
      const email = profile.email || (wallet ? `${wallet}@wallet.local` : null);

      if (email) {
        // Look up active ember, mark it sealed
        try {
          const r = await fetch(`/api/ember?email=${encodeURIComponent(email)}`);
          const { ember } = await r.json();
          if (ember?.id) {
            await fetch('/api/ember', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: ember.id,
                abandoned_at: new Date().toISOString(),
              }),
            });
          }
        } catch {
          /* silent */
        }
      }

      // Clear local current talent
      store.setProfile({ ...profile, current_talent: undefined });
      setStage('done');
    } finally {
      setSubmitting(false);
    }
  }, [submitting]);

  if (!mounted) return null;

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      <header className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => router.back()}
          disabled={stage === 'done'}
          className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30"
          style={{ color: 'var(--fg-dim)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Eyebrow spacing="wide" tone="teal">— {isKo ? '봉인' : 'extinguish'}</Eyebrow>
        <div className="w-9" />
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pb-10">
        {stage === 'confirm' && (
          <div className="flex w-full max-w-105 flex-col items-center pt-6 text-center">
            <FlameShape stage="dormant" size={140} dim />
            <div className="mt-8">
              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(24px, 5.5vw, 30px)',
                  letterSpacing: '-0.025em',
                  color: 'var(--fg)',
                  lineHeight: 1.2,
                }}
              >
                {isKo ? `${talent || '이 불꽃'} 을(를) 끄려고?` : `Ending ${talent || 'this ember'}?`}
              </h1>
              <p
                className="mt-4 font-display text-[15px]"
                style={{ color: 'var(--fg-dim)', lineHeight: 1.55 }}
              >
                {isKo
                  ? '쓴 기록은 삭제되지 않아. 이 불꽃이 끝났다는 것만 남아.'
                  : "Your entries won't disappear. Only this ember — this chapter — closes."}
              </p>
            </div>
            <div className="mt-8 w-full">
              <EmberLine
                quote={
                  isKo
                    ? '끄는 것도 용기야. 부끄러운 일이 아니야.'
                    : 'Ending takes courage. Nothing to be ashamed of.'
                }
                translation={
                  isKo
                    ? 'nothing to be ashamed of.'
                    : '부끄러운 일이 아니야.'
                }
                accent="teal"
              />
            </div>
            <div className="mt-auto flex w-full gap-2 pt-10">
              <button
                onClick={() => router.back()}
                className="flex-1 rounded-full py-3.5 font-mono text-[11px] uppercase"
                style={{
                  letterSpacing: '0.22em',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '계속 돌볼래' : 'keep tending'}
              </button>
              <button
                onClick={() => setStage('reflect')}
                className="flex-1 rounded-full py-3.5 font-mono text-[11px] uppercase"
                style={{
                  letterSpacing: '0.22em',
                  backgroundColor: 'var(--teal)',
                  color: 'var(--fg-on-teal)',
                }}
              >
                {isKo ? '그래도 끈다' : 'continue'}
              </button>
            </div>
          </div>
        )}

        {stage === 'reflect' && (
          <div className="flex w-full max-w-120 flex-col pt-6">
            <Eyebrow spacing="wide" tone="teal">— {isKo ? '마지막 한 줄' : 'a last line'}</Eyebrow>
            <h1
              className="mt-3 font-display"
              style={{
                fontSize: 'clamp(22px, 5vw, 26px)',
                letterSpacing: '-0.025em',
                color: 'var(--fg)',
                lineHeight: 1.25,
              }}
            >
              {isKo ? '이 불꽃에게 뭘 남기고 싶어?' : 'What do you want to leave for this ember?'}
            </h1>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={
                isKo
                  ? '어떻게 시작했고, 어떻게 끝났는지. 느리게 써도 돼.'
                  : 'How it began, how it ended. Take your time.'
              }
              rows={6}
              className="mt-5 w-full resize-none rounded-md border px-4 py-3 font-display text-[15.5px] outline-none"
              style={{
                backgroundColor: 'var(--bg-1)',
                borderColor: 'var(--rule-strong)',
                color: 'var(--fg)',
              }}
            />
            <div className="mt-auto pt-10">
              <button
                onClick={() => setStage('seal')}
                disabled={reflection.trim().length < 2}
                className="w-full rounded-full py-3.5 font-mono text-[11px] uppercase transition disabled:opacity-40"
                style={{
                  letterSpacing: '0.22em',
                  backgroundColor: 'var(--teal)',
                  color: 'var(--fg-on-teal)',
                }}
              >
                {isKo ? '다음' : 'next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'seal' && (
          <div className="flex w-full max-w-120 flex-col pt-6">
            <Eyebrow spacing="wide" tone="teal">— {isKo ? '봉인' : 'sealing'}</Eyebrow>
            <h1
              className="mt-3 font-display"
              style={{
                fontSize: 'clamp(22px, 5vw, 26px)',
                letterSpacing: '-0.025em',
                color: 'var(--fg)',
                lineHeight: 1.25,
              }}
            >
              {isKo ? '이 불꽃을 닫을게.' : "I'll close this ember."}
            </h1>
            <p
              className="mt-3 font-display text-[14.5px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              {isKo
                ? '이 재능은 「재」로 옮겨져. 다시 열 수는 없어. 읽을 수는 있어.'
                : "This talent moves to Ashes. You can't reopen it. You can read it."}
            </p>
            <div className="mt-6">
              <PermanenceGate
                checked={ack}
                onChange={setAck}
                label={
                  isKo
                    ? '이 불꽃은 더 이상 열리지 않는다는 걸 알아.'
                    : "I understand this ember can't be reopened."
                }
              />
            </div>
            <div className="mt-auto flex w-full gap-2 pt-10">
              <button
                onClick={() => setStage('reflect')}
                className="flex-1 rounded-full py-3.5 font-mono text-[11px] uppercase"
                style={{
                  letterSpacing: '0.22em',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '← 돌아가기' : '← back'}
              </button>
              <button
                onClick={handleSeal}
                disabled={!ack || submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-mono text-[11px] uppercase transition disabled:opacity-40"
                style={{
                  letterSpacing: '0.22em',
                  backgroundColor: ack ? 'var(--teal)' : 'var(--bg-2)',
                  color: ack ? 'var(--fg-on-teal)' : 'var(--fg-dim)',
                }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isKo ? '봉인한다' : 'seal'}
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="flex w-full max-w-105 flex-col items-center pt-10 text-center">
            <FlameShape stage="dormant" size={120} dim />
            <h1
              className="mt-8 font-display"
              style={{
                fontSize: 'clamp(22px, 5vw, 28px)',
                letterSpacing: '-0.025em',
                color: 'var(--fg)',
              }}
            >
              {isKo ? '이 장은 닫혔어.' : 'This chapter is closed.'}
            </h1>
            <p
              className="mt-3 font-display text-[15px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              {isKo
                ? '언젠가 다시 새 불꽃을 켜도 돼. 서두를 필요는 없어.'
                : 'You can light a new ember whenever. No rush.'}
            </p>
            <div className="mt-8 flex w-full flex-col gap-2">
              <button
                onClick={() => router.replace('/ashes')}
                className="rounded-full py-3.5 font-mono text-[11px] uppercase"
                style={{
                  letterSpacing: '0.22em',
                  border: '1px solid var(--rule-strong)',
                  color: 'var(--fg)',
                }}
              >
                {isKo ? '재(Ashes) 보기' : 'See Ashes'}
              </button>
              <button
                onClick={() => router.replace('/onboarding')}
                className="rounded-full py-3.5 font-mono text-[11px] uppercase"
                style={{
                  letterSpacing: '0.22em',
                  backgroundColor: 'var(--ember)',
                  color: 'var(--fg-on-ember)',
                  boxShadow: '0 6px 18px rgba(201,80,45,0.3)',
                }}
              >
                {isKo ? '새 불꽃 켜기' : 'Light a new one'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
