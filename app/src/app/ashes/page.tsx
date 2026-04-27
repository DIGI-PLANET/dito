'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store } from '@/lib/store';
import { getWalletCookie } from '@/lib/wallet-cookie';
import { FlameShape } from '@/components/ember/flame-shape';
import { Eyebrow } from '@/components/ember/eyebrow';
import { EmberLine } from '@/components/ember/ember-line';

type SealedEmber = {
  id: string;
  talent: string;
  created_at?: string;
  abandoned_at?: string;
  ember_stage?: string;
  entries_count?: number;
};

export default function AshesPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  const [mounted, setMounted] = useState(false);
  const [sealed, setSealed] = useState<SealedEmber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const profile = store.getProfile();
    const wallet = getWalletCookie();
    const email = profile.email || (wallet ? `${wallet}@wallet.local` : null);
    if (!email) {
      setLoading(false);
      return;
    }
    // The GET /api/ember returns only the most recent. For true listing,
    // we'd need an "all embers" endpoint. For now, fetch and filter.
    fetch(`/api/ember?email=${encodeURIComponent(email)}&all=1`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.embers)
          ? data.embers
          : data.ember
          ? [data.ember]
          : [];
        setSealed(list.filter((e: SealedEmber) => !!e.abandoned_at));
      })
      .catch(() => setSealed([]))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={{ backgroundColor: 'var(--bg-0)', color: 'var(--fg)' }}
    >
      <header className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--rule)' }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: 'var(--fg-dim)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Eyebrow spacing="wide">— {isKo ? '재' : 'ashes'}</Eyebrow>
        <div className="w-9" />
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="mb-6 text-center">
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(22px, 5vw, 26px)',
              letterSpacing: '-0.025em',
              color: 'var(--fg)',
            }}
          >
            {isKo ? '봉인된 불꽃들.' : 'Embers you closed.'}
          </h1>
          <p
            className="mt-2 font-display text-[14px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            {isKo
              ? '다시 열 수는 없어. 읽을 수는 있어.'
              : "You can't reopen them. You can read them."}
          </p>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <span
              className="font-mono text-[10px] uppercase"
              style={{ letterSpacing: '0.24em', color: 'var(--fg-dimmer)' }}
            >
              loading…
            </span>
          </div>
        )}

        {!loading && sealed.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <FlameShape stage="dormant" size={96} dim />
            <p
              className="mt-5 font-display text-[15px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              {isKo
                ? '아직 재는 없어. 지금 돌보는 불꽃이 있다는 뜻이야.'
                : 'No ashes yet. You still have an ember to tend.'}
            </p>
            <Link
              href="/today"
              className="mt-6 rounded-full px-5 py-2.5 font-mono text-[11px] uppercase"
              style={{
                letterSpacing: '0.22em',
                border: '1px solid var(--rule-strong)',
                color: 'var(--fg)',
              }}
            >
              {isKo ? '오늘로' : 'go to today'}
            </Link>
          </div>
        )}

        {!loading && sealed.length > 0 && (
          <>
            <ul className="space-y-3">
              {sealed.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg px-4 py-4"
                  style={{
                    backgroundColor: 'var(--bg-1)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 pt-0.5">
                      <FlameShape stage="dormant" size={48} dim />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="font-mono text-[9.5px] uppercase"
                        style={{ letterSpacing: '0.22em', color: 'var(--fg-dimmer)' }}
                      >
                        {e.created_at?.slice(0, 10)} →{' '}
                        {e.abandoned_at?.slice(0, 10)}
                      </span>
                      <p
                        className="mt-1 font-display text-[16px]"
                        style={{
                          color: 'var(--fg)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {e.talent}
                      </p>
                      <p
                        className="mt-1 font-display text-[12.5px]"
                        style={{ color: 'var(--fg-dim)' }}
                      >
                        {isKo
                          ? `${e.entries_count || 0}일 지켰어 · ${e.ember_stage || 'sparked'}에서 멈춤`
                          : `${e.entries_count || 0} days kept · stopped at ${e.ember_stage || 'sparked'}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <EmberLine
                quote={
                  isKo
                    ? '여긴 실패의 명단이 아니야. 네가 무엇을 돌봤는지의 명단이야.'
                    : 'This is not a list of failures. It is a list of what you tended.'
                }
                translation={
                  isKo
                    ? 'what you tended.'
                    : '네가 돌봤던 것.'
                }
                small
                accent="teal"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
