'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUp,
  Book,
  Code2,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Github,
  Flame,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { getGuideContent, GuideSection } from '@/lib/guide-content';

type TabKey = 'seekers' | 'devs' | 'faq';

function renderInline(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="mt-3 text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8 first:mt-0">
      {parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      })}
    </p>
  );
}

function RichContent({ content }: { content: string }) {
  return (
    <div className="space-y-0">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        return renderInline(line, i);
      })}
    </div>
  );
}

export default function GuidePage() {
  const { lang } = useI18n();
  const isKo = lang === 'ko';
  const [tab, setTab] = useState<TabKey>('seekers');
  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const allSections = useMemo<GuideSection[]>(() => getGuideContent(lang), [lang]);

  // Seeker tab: core narrative sections (exclude FAQ — FAQ tab owns that)
  const seekerSections = useMemo(
    () => allSections.filter((s) => s.id !== 'faq'),
    [allSections]
  );

  const faqSection = useMemo(
    () => allSections.find((s) => s.id === 'faq'),
    [allSections]
  );

  // Parse FAQ content into Q/A pairs (content blocks separated by blank lines,
  // each starting with **Question?** on first line and answer following).
  const faqItems = useMemo(() => {
    if (!faqSection) return [] as Array<{ q: string; a: string }>;
    const blocks = faqSection.content.split(/\n\s*\n/);
    const items: Array<{ q: string; a: string }> = [];
    for (const block of blocks) {
      const lines = block.split('\n');
      const first = lines[0]?.trim() ?? '';
      const qMatch = first.match(/^\*\*(.+?)\*\*$/);
      if (!qMatch) continue;
      const q = qMatch[1];
      const a = lines.slice(1).join('\n').trim();
      items.push({ q, a });
    }
    return items;
  }, [faqSection]);

  const headerTitle = isKo ? '가이드' : 'Guide';
  const heroTitle = isKo ? '가이드 & 문서' : 'Guide & Docs';
  const heroSub = isKo
    ? 'Seeker를 위한 이야기, 개발자를 위한 레퍼런스.'
    : 'Story for Seekers, reference for builders.';
  const tocLabel = isKo ? '목차' : 'Table of Contents';
  const backToTop = isKo ? '맨 위로' : 'Back to top';
  const tabs: { key: TabKey; label: string; icon: typeof Book }[] = [
    { key: 'seekers', label: isKo ? 'Seeker용' : 'For Seekers', icon: Book },
    { key: 'devs', label: isKo ? '개발자용' : 'For Devs', icon: Code2 },
    { key: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  // Track active section on scroll for seeker tab
  useEffect(() => {
    if (tab !== 'seekers') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    seekerSections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [seekerSections, tab]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Reset active section when tab changes
    setActiveId('');
    setTocOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tab]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Developer content strings
  const dev = {
    title: isKo ? '개발자 문서' : 'Developer Docs',
    intro: isKo
      ? 'DITO의 OAuth2 흐름, 핵심 엔드포인트, 그리고 에이전트 통합 예시.'
      : "DITO's OAuth2 flow, core endpoints, and agent integration example.",
    quickstartTitle: isKo ? '1. 빠른 시작 (OAuth2)' : '1. Quickstart (OAuth2)',
    quickstartBody: isKo
      ? 'Seeker의 Soul 포트폴리오에 읽기 전용 접근을 받으려면 표준 OAuth2 Authorization Code 플로우를 사용하세요.'
      : "Use the standard OAuth2 Authorization Code flow to get read-only access to a Seeker's Soul portfolio.",
    endpointsTitle: isKo ? '2. 핵심 엔드포인트' : '2. Core endpoints',
    sdkTitle: isKo ? '3. SDK — @dito/sdk' : '3. SDK — @dito/sdk',
    sdkBody: isKo
      ? 'TypeScript/JavaScript 프로젝트에서 몇 줄로 Soul 데이터를 가져올 수 있습니다.'
      : 'Pull Soul data into your TypeScript/JavaScript project in a few lines.',
    agentTitle: isKo ? '4. 에이전트 통합' : '4. Agent integration',
    agentBody: isKo
      ? 'Claude 함수 호출(tool use)로 Ember Soul을 네이티브로 다룰 수 있습니다.'
      : 'Let your Claude agent read Ember Souls natively via function-calling.',
    githubLabel: 'GitHub',
  };

  return (
    <div
      data-landing-page
      className="relative min-h-screen w-full bg-background font-(family-name:--font-sans,Pretendard) text-foreground"
    >
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-3 px-4 md:px-8">
          <Link
            href="/"
            aria-label={isKo ? '뒤로' : 'Back'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {headerTitle}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 md:px-8 md:pt-10">
        {/* Hero */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            {heroTitle}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground md:text-base">{heroSub}</p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label={isKo ? '가이드 섹션' : 'Guide sections'}
          className="sticky top-14 z-30 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border/60 bg-background/80 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-background/60 md:mx-0 md:rounded-full md:border md:px-2"
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ' +
                  (active
                    ? 'bg-[#faaf2e] text-[#4b3002] shadow-sm'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground')
                }
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Layout: sidebar + content (desktop), stacked mobile */}
        <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
          {/* Sidebar / TOC */}
          {tab === 'seekers' && (
            <aside className="md:sticky md:top-30 md:self-start">
              {/* Mobile accordion toggle */}
              <button
                type="button"
                onClick={() => setTocOpen((v) => !v)}
                aria-expanded={tocOpen}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground md:hidden"
              >
                <span className="inline-flex items-center gap-2">
                  <Book className="h-4 w-4 text-[#faaf2e]" />
                  {tocLabel}
                </span>
                <ChevronDown
                  className={
                    'h-4 w-4 text-muted-foreground transition-transform ' +
                    (tocOpen ? 'rotate-180' : '')
                  }
                />
              </button>

              <nav
                className={
                  'mt-3 overflow-hidden rounded-2xl border border-border bg-card md:mt-0 md:block ' +
                  (tocOpen ? 'block' : 'hidden md:block')
                }
              >
                <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tocLabel}
                </div>
                <ul className="pb-2">
                  {seekerSections.map((s) => {
                    const active = activeId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => scrollTo(s.id)}
                          className={
                            'block w-full border-l-2 px-4 py-2 text-left text-sm transition-colors ' +
                            (active
                              ? 'border-[#faaf2e] bg-[#faaf2e]/10 font-semibold text-foreground'
                              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground')
                          }
                        >
                          {s.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          )}
          {tab !== 'seekers' && <div className="hidden md:block" />}

          {/* Content */}
          <div className="mt-6 md:mt-0 md:max-w-[720px]">
            {tab === 'seekers' && (
              <div className="space-y-6">
                {seekerSections.map((s) => (
                  <section
                    key={s.id}
                    id={s.id}
                    className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 md:p-7"
                  >
                    <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {s.title}
                    </h2>
                    <RichContent content={s.content} />
                  </section>
                ))}

                {/* Pro Tip callout */}
                <div className="rounded-2xl border border-[#faaf2e]/40 bg-[#faaf2e]/10 p-5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#4b3002] dark:text-[#faaf2e]">
                    <Flame className="h-4 w-4" />
                    {isKo ? '팁: 꾸준함' : 'Pro Tip: Consistency'}
                  </div>
                  <p className="text-[15px] leading-7 text-foreground/90">
                    {isKo
                      ? '매일 작은 체크인이 드문 장문보다 Ember에 더 큰 배수를 줍니다. 불꽃을 꺼뜨리지 마세요.'
                      : 'Daily check-ins yield a higher multiplier for Ember processing than large, sporadic interactions. Keep the flame steady.'}
                  </p>
                </div>
              </div>
            )}

            {tab === 'devs' && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-[#faaf2e]" />
                    {dev.title}
                  </div>
                  <p className="text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                    {dev.intro}
                  </p>
                </section>

                {/* Quickstart */}
                <section id="quickstart" className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 md:p-7">
                  <h2 className="mb-3 text-xl font-semibold tracking-tight md:text-2xl">
                    {dev.quickstartTitle}
                  </h2>
                  <p className="mb-4 text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                    {dev.quickstartBody}
                  </p>
                  <CodeBlock
                    language="http"
                    code={`GET https://api.dito.guru/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyour.app%2Fcallback
  &scope=souls.read
  &response_type=code

POST https://api.dito.guru/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_SECRET`}
                  />
                </section>

                {/* Core endpoints */}
                <section id="api" className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 md:p-7">
                  <h2 className="mb-3 text-xl font-semibold tracking-tight md:text-2xl">
                    {dev.endpointsTitle}
                  </h2>
                  <ul className="space-y-3 text-[15px] leading-7 text-muted-foreground">
                    <li>
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
                        GET /v1/seekers/me
                      </code>{' '}
                      — {isKo ? '현재 인증된 Seeker 프로필' : 'Current authenticated Seeker profile'}
                    </li>
                    <li>
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
                        GET /v1/seekers/:address/souls
                      </code>{' '}
                      — {isKo ? '공개 Soul 포트폴리오' : 'Public Soul portfolio'}
                    </li>
                    <li>
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
                        GET /v1/souls/:mint
                      </code>{' '}
                      — {isKo ? 'Soul 메타데이터 + 현재 단계' : 'Soul metadata + current stage'}
                    </li>
                  </ul>
                  <div className="mt-4">
                    <CodeBlock
                      language="bash"
                      code={`curl https://api.dito.guru/v1/seekers/me \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}
                    />
                  </div>
                </section>

                {/* SDK */}
                <section id="sdk" className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 md:p-7">
                  <h2 className="mb-3 text-xl font-semibold tracking-tight md:text-2xl">
                    {dev.sdkTitle}
                  </h2>
                  <p className="mb-4 text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                    {dev.sdkBody}
                  </p>
                  <CodeBlock language="bash" code={`npm install @dito/sdk`} />
                  <div className="h-3" />
                  <CodeBlock
                    language="ts"
                    code={`import { DitoClient } from '@dito/sdk';

const dito = new DitoClient({ accessToken: process.env.DITO_TOKEN! });

const souls = await dito.seekers.listSouls('7xK...wallet');
for (const soul of souls) {
  console.log(soul.talent, soul.stage);
}`}
                  />
                </section>

                {/* Agent integration */}
                <section id="agent" className="scroll-mt-32 rounded-2xl border border-border bg-card p-5 md:p-7">
                  <h2 className="mb-3 text-xl font-semibold tracking-tight md:text-2xl">
                    {dev.agentTitle}
                  </h2>
                  <p className="mb-4 text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                    {dev.agentBody}
                  </p>
                  <CodeBlock
                    language="ts"
                    code={`const tools = [
  {
    name: 'get_seeker_souls',
    description: 'Fetch a Seeker\\'s public Soul portfolio from DITO.',
    input_schema: {
      type: 'object',
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address' },
      },
      required: ['wallet'],
    },
  },
];

const res = await anthropic.messages.create({
  model: 'claude-opus-4-7',
  tools,
  messages: [{ role: 'user', content: 'What is 7xK...wallet good at?' }],
});`}
                  />
                </section>

                {/* Callout: GitHub */}
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    <Zap className="h-4 w-4" />
                    {isKo ? '오픈 소스' : 'Open source'}
                  </div>
                  <p className="mb-3 text-[15px] leading-7 text-foreground/90">
                    {isKo
                      ? 'DITO는 BUSL 1.1 라이선스로 공개되어 있습니다. 이슈, PR, 포크 모두 환영입니다.'
                      : 'DITO is published under BUSL 1.1. Issues, PRs, and forks welcome.'}
                  </p>
                  <a
                    href="https://github.com/digiplanet/dito"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
                  >
                    <Github className="h-4 w-4" />
                    {dev.githubLabel}
                  </a>
                </div>
              </div>
            )}

            {tab === 'faq' && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <HelpCircle className="h-4 w-4 text-[#faaf2e]" />
                    {faqSection?.title ?? 'FAQ'}
                  </div>
                  <p className="text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                    {isKo
                      ? '가장 자주 받는 질문들. 답을 못 찾으셨다면 privacy@dito.guru로 연락 주세요.'
                      : "The questions we hear most. Can't find yours? Email privacy@dito.guru."}
                  </p>
                </section>

                {/* Grouped FAQ sections */}
                <div className="space-y-3">
                  {faqItems.map((item, i) => {
                    const open = openFaq === i;
                    return (
                      <div
                        key={i}
                        className="overflow-hidden rounded-2xl border border-border bg-card"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(open ? null : i)}
                          aria-expanded={open}
                          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                        >
                          <span className="text-[15px] font-semibold text-foreground md:text-base">
                            {item.q}
                          </span>
                          <ChevronDown
                            className={
                              'h-4 w-4 shrink-0 text-muted-foreground transition-transform ' +
                              (open ? 'rotate-180' : '')
                            }
                          />
                        </button>
                        {open && (
                          <div className="border-t border-border px-5 py-4">
                            <p className="whitespace-pre-line text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Roadmap callout (soft) */}
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                    {isKo ? '로드맵 — 팀 배포' : 'Roadmap — Team deployments'}
                  </div>
                  <p className="text-[15px] leading-7 text-foreground/90">
                    {isKo
                      ? '자체 Supabase와 Gemini 키로 DITO를 운영할 수 있는 셀프 호스팅 가이드가 준비 중입니다. BUSL 1.1.'
                      : 'A self-hosted deployment guide — run DITO on your own Supabase and Gemini keys — is coming. BUSL 1.1.'}
                  </p>
                </div>

                {/* License note */}
                <div className="rounded-2xl border border-[#faaf2e]/30 bg-[#faaf2e]/10 p-5">
                  <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#4b3002] dark:text-[#faaf2e]">
                    <Flame className="h-4 w-4" />
                    {isKo ? '라이선스 — BUSL 1.1' : 'License — BUSL 1.1'}
                  </div>
                  <p className="text-[15px] leading-7 text-foreground/90">
                    {isKo
                      ? 'DITO의 소스 코드는 Business Source License 1.1로 공개되어 있습니다. 비상업적 용도와 개인 학습은 자유롭게 가능합니다.'
                      : 'DITO source is released under the Business Source License 1.1 — free for non-commercial use and personal study.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex flex-col items-center gap-3 border-t border-border pt-8">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              {isKo ? '개인정보' : 'Privacy Policy'}
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-foreground">
              {isKo ? '이용약관' : 'Terms of Service'}
            </Link>
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {backToTop}
          </button>
        </div>
      </main>

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={backToTop}
          className="fixed bottom-6 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#faaf2e] text-[#4b3002] shadow-lg transition-all hover:brightness-110 md:bottom-10 md:right-10"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-zinc-950">
      {language && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <span>{language}</span>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6 text-zinc-100">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
