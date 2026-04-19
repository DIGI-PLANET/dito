'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/providers/i18n-provider';
import type { Lang } from '@/lib/i18n';
import {
  Flame,
  Target,
  Zap,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Code2,
  Menu,
  Palette,
  Dumbbell,
  Brain,
  MessageCircle,
  Wrench,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
 * Landing copy — local to this page. Structured by language
 * so adding locales (ja, zh, ar, ...) only requires a new key.
 * Migrate to lib/i18n.ts once keys stabilize.
 * ────────────────────────────────────────────────────────── */
const copy = {
  en: {
    nav: { howItWorks: 'How it works', developers: 'Developers', start: 'Start' },
    hero: {
      titleA: "Find a talent you didn't know you had",
      titleB: '— in 90 days,',
      titleC: 'on Solana.',
      subtitle:
        "90 days. An AI coach. A Soulbound proof on-chain. Stop guessing what you're good at.",
      description:
        'Join the discovery pipeline. Secure, bilingual, and fully integrated with the modern Web3 ecosystem.',
      ctaPrimary: 'Start with Ember',
      ctaSecondary: 'Read the Docs',
    },
    problem: {
      eyebrow: 'The Problem',
      items: [
        {
          title: 'Wasting time on generic tutorials without clear direction.',
          sub: "Most learning paths aren't built for the talent hiding inside you.",
        },
        {
          title: 'Lack of verifiable proof for your newly acquired skills.',
          sub: "A cert in a database doesn't travel with you across apps.",
        },
        {
          title: 'Disconnected from the active Web3 builder community.',
          sub: "Talent grows faster when it's visible to the right people.",
        },
      ],
    },
    solution: {
      title: 'The Solution',
      subtitle: 'How we solve it',
      items: [
        {
          icon: 'zap' as const,
          title: 'Curated 90-Day Path',
          desc: 'Structured daily challenges tailored to your latent potential.',
        },
        {
          icon: 'shield' as const,
          title: 'On-Chain Verification',
          desc: 'Your progress is permanently recorded as Soulbound tokens on Solana.',
        },
      ],
    },
    steps: {
      title: 'How It Works',
      subtitle: 'Three steps, ninety days.',
      list: [
        { label: 'STEP 01', title: 'Ignite', desc: 'Sign up and create your basic Seeker profile.' },
        { label: 'STEP 02', title: 'Discover', desc: 'Take the aptitude test to find your true element.' },
        { label: 'STEP 03', title: 'Develop', desc: 'Follow the 90-day pipeline and mint your Soul gem.' },
      ],
    },
    categories: {
      title: 'What could you actually be good at?',
      subtitle: 'Six directions. Ember helps you figure out which one is really yours.',
      items: [
        { icon: 'palette' as const, name: 'Creative', ex: 'Art · Music · Writing · Design' },
        { icon: 'dumbbell' as const, name: 'Physical', ex: 'Sports · Dance · Martial arts' },
        { icon: 'brain' as const, name: 'Intellectual', ex: 'Math · Science · Strategy' },
        { icon: 'message' as const, name: 'Social', ex: 'Speaking · Community · Teaching' },
        { icon: 'wrench' as const, name: 'Technical', ex: 'Coding · Making · Architecture' },
        { icon: 'sparkles' as const, name: 'Hybrid', ex: 'Cross-domain talents' },
      ],
    },
    agent: {
      eyebrow: 'Agent Integration',
      title: 'Built Agent-first. One OAuth2 flow plugs Ember into any AI agent.',
      desc:
        "Your users don't need another app. Bring the DITO discovery engine directly into your existing Claude, GPT, or custom agent interfaces.",
      cta: 'Read API Docs',
    },
    cta: {
      title: 'Ready to find your talent?',
      sub: "Spend 10 minutes with Ember today. Walk away with a candid read on what's actually inside you.",
      button: 'Light the Spark',
    },
    footer: {
      tagline: 'The talent discovery protocol on Solana.',
      product: 'Product',
      howItWorks: 'How it works',
      developers: 'Developers',
      souls: 'Souls',
      legal: 'Legal',
      privacy: 'Privacy',
      terms: 'Terms',
      copy: '© 2026 DIGI PLANET',
    },
  },
  ko: {
    nav: { howItWorks: '이용 방법', developers: '개발자', start: '시작' },
    hero: {
      titleA: '몰랐던 재능을 찾자',
      titleB: '— 90일 안에,',
      titleC: 'Solana 위에.',
      subtitle: '90일. AI 코치. 온체인 Soulbound 증명. 내가 뭘 잘하는지 이제 추측하지 않아도 된다.',
      description:
        '검증 가능한 90일 파이프라인에 합류. 안전하고, 이중 언어 지원, 현대 Web3 생태계와 완전 통합.',
      ctaPrimary: 'Ember과 시작',
      ctaSecondary: '문서 보기',
    },
    problem: {
      eyebrow: '문제',
      items: [
        {
          title: '방향성 없는 일반적인 튜토리얼로 인한 시간 낭비.',
          sub: '대부분의 학습 경로는 당신 안에 숨어 있는 재능을 위해 만들어지지 않았다.',
        },
        {
          title: '새로 습득한 기술에 대한 검증 가능한 증명 부족.',
          sub: 'DB에 저장된 수료증은 다른 앱으로 따라오지 않는다.',
        },
        {
          title: '활발한 Web3 빌더 커뮤니티와의 단절.',
          sub: '재능은 제대로 된 사람들 눈에 보일 때 더 빨리 자란다.',
        },
      ],
    },
    solution: {
      title: '솔루션',
      subtitle: '어떻게 해결하는가',
      items: [
        {
          icon: 'zap' as const,
          title: '큐레이션된 90일 경로',
          desc: '당신의 잠재력에 맞춘 일일 구조화된 챌린지.',
        },
        {
          icon: 'shield' as const,
          title: '온체인 검증',
          desc: '성장 기록이 Solana에 Soulbound 토큰으로 영구 기록됨.',
        },
      ],
    },
    steps: {
      title: '이용 방법',
      subtitle: '세 단계, 90일.',
      list: [
        { label: 'STEP 01', title: '점화', desc: '가입하고 기본 Seeker 프로필을 만들자.' },
        { label: 'STEP 02', title: '발견', desc: '적성 검사로 자신의 요소를 찾자.' },
        { label: 'STEP 03', title: '성장', desc: '90일 파이프라인을 따라 Soul Gem 민팅.' },
      ],
    },
    categories: {
      title: '진짜 잘하는 게 뭘까?',
      subtitle: '6가지 방향. Ember이 그 중 정말 내 것인 걸 찾아준다.',
      items: [
        { icon: 'palette' as const, name: '크리에이티브', ex: '아트 · 음악 · 글쓰기 · 디자인' },
        { icon: 'dumbbell' as const, name: '피지컬', ex: '스포츠 · 댄스 · 무술' },
        { icon: 'brain' as const, name: '지적', ex: '수학 · 과학 · 전략' },
        { icon: 'message' as const, name: '사회적', ex: '말하기 · 커뮤니티 · 가르치기' },
        { icon: 'wrench' as const, name: '기술적', ex: '코딩 · 제작 · 건축' },
        { icon: 'sparkles' as const, name: '하이브리드', ex: '영역을 넘나드는 재능' },
      ],
    },
    agent: {
      eyebrow: 'Agent 연동',
      title: 'Agent-first 설계. OAuth2 한 번으로 어떤 AI 에이전트에도 Ember 연결.',
      desc:
        '사용자가 또 다른 앱을 설치할 필요 없다. Claude, GPT, 커스텀 에이전트 안에서 바로 DITO 탐색 엔진을 사용.',
      cta: 'API 문서 보기',
    },
    cta: {
      title: '재능을 찾을 준비됐어요?',
      sub: '오늘 Ember과 10분. 내 안에 실제로 뭐가 있는지 솔직하게 들어보자.',
      button: '불꽃 점화',
    },
    footer: {
      tagline: 'Solana 위의 재능 발견 프로토콜.',
      product: '제품',
      howItWorks: '이용 방법',
      developers: '개발자',
      souls: 'Souls',
      legal: '법적 고지',
      privacy: '개인정보',
      terms: '이용약관',
      copy: '© 2026 DIGI PLANET',
    },
  },
} satisfies Record<Lang, unknown>;

type LandingCopy = (typeof copy)['en'];

/* ──────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { lang, setLang } = useI18n();
  const c = copy[lang];

  return (
    <div
      data-landing-page
      className="relative min-h-screen w-full bg-background text-foreground antialiased overflow-x-hidden"
    >
      <LandingNav c={c.nav} lang={lang} setLang={setLang} />
      <main className="relative">
        <Hero c={c.hero} />
        <Problem c={c.problem} />
        <Solution c={c.solution} />
        <Steps c={c.steps} />
        <Categories c={c.categories} />
        <AgentCode c={c.agent} />
        <FinalCTA c={c.cta} />
      </main>
      <LandingFooter c={c.footer} lang={lang} setLang={setLang} />
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'dark';
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/80 transition hover:bg-foreground/10"
    >
      {mounted && current === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">{children}</div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Nav (sticky, glass)
 * ────────────────────────────────────────────────────────── */
function LandingNav({
  c,
  lang,
  setLang,
}: {
  c: LandingCopy['nav'];
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-4 md:h-[72px] md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/30">
            <Flame className="h-4 w-4 text-[#faaf2e]" />
          </span>
          <span className="text-[15px] font-bold tracking-tight md:text-[18px]">DITO Soul</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <a href="#how-it-works" className="text-sm text-muted-foreground transition hover:text-foreground/90">
            {c.howItWorks}
          </a>
          <a href="#agent" className="text-sm text-muted-foreground transition hover:text-foreground/90">
            {c.developers}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden rounded-full border border-border p-0.5 md:flex">
            <button
              onClick={() => setLang('en')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                lang === 'en' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ko')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                lang === 'ko' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              KO
            </button>
          </div>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-full bg-[#faaf2e] px-4 py-1.5 text-xs font-bold text-[#4b3002] shadow-[0_2px_8px_rgba(250,175,46,0.3)] transition hover:bg-[#e8a129]"
          >
            {c.start}
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/80 transition hover:bg-foreground/10 md:hidden"
            aria-label="Toggle language"
            onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────
 * Hero — single column, centered, warm glow only.
 * No geometric crystals or orbiting gems.
 * ────────────────────────────────────────────────────────── */
function Hero({ c }: { c: LandingCopy['hero'] }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* warm radial glow — dark-mode only (too bright on light) */}
      <div className="pointer-events-none absolute left-1/2 top-[-10%] hidden h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#faaf2e]/20 blur-[120px] dark:block md:h-[640px] md:w-[640px]" />
      <div className="pointer-events-none absolute left-1/2 top-[20%] hidden h-[220px] w-[420px] -translate-x-1/2 rounded-full bg-[#faaf2e]/10 blur-[100px] dark:block md:h-[320px] md:w-[720px]" />

      <div className="relative mx-auto w-full max-w-[960px] px-4 pt-16 pb-20 text-center md:px-8 md:pt-28 md:pb-32">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#faaf2e]/10 shadow-[0_0_40px_rgba(250,175,46,0.35)] ring-1 ring-[#faaf2e]/40 md:mb-10 md:h-16 md:w-16">
          <Flame className="h-6 w-6 text-[#faaf2e] md:h-7 md:w-7" />
        </div>

        <h1 className="text-[36px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[64px] lg:text-[76px]">
          <span>{c.titleA}</span>
          <br />
          <span className="text-[#faaf2e]">{c.titleB}</span> <span>{c.titleC}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-[560px] text-[15px] leading-relaxed text-foreground/75 md:mt-7 md:text-[18px] md:leading-[1.6]">
          {c.subtitle}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#faaf2e] px-7 text-[15px] font-semibold text-[#4b3002] shadow-[0_10px_24px_rgba(250,175,46,0.3),0_4px_6px_rgba(250,175,46,0.2)] transition hover:bg-[#e8a129]"
          >
            {c.ctaPrimary}
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/guide"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background/40 px-6 text-[15px] font-medium text-foreground/85 transition hover:border-white/20 hover:bg-foreground/5"
          >
            {c.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Problem
 * ────────────────────────────────────────────────────────── */
function Problem({ c }: { c: LandingCopy['problem'] }) {
  return (
    <section className="relative w-full border-y border-border/60 bg-[rgba(250,175,46,0.04)] py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#faaf2e]/80 md:text-xs">
          {c.eyebrow}
        </p>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {c.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#faaf2e]/80 md:h-5 md:w-5" />
              <div>
                <p className="text-[14px] font-medium leading-[1.45] text-foreground/90 md:text-[15px]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[11px] leading-[1.5] text-muted-foreground md:text-[13px]">
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Solution
 * ────────────────────────────────────────────────────────── */
function Solution({ c }: { c: LandingCopy['solution'] }) {
  return (
    <Section className="py-16 md:py-24">
      <div className="mb-8 md:mb-12">
        <h2 className="text-[22px] font-bold tracking-tight md:text-[32px]">{c.title}</h2>
        {c.subtitle ? (
          <p className="mt-1.5 text-[12px] text-muted-foreground md:text-sm">{c.subtitle}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {c.items.map((item, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-[14px] border border-border bg-card p-5 md:p-7"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#faaf2e]/20 bg-[#faaf2e]/10 md:h-12 md:w-12">
              {item.icon === 'zap' ? (
                <Zap className="h-5 w-5 text-[#faaf2e] md:h-6 md:w-6" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-[#faaf2e] md:h-6 md:w-6" />
              )}
            </div>
            <h3 className="mt-4 text-[16px] font-semibold md:text-[18px]">{item.title}</h3>
            <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground md:text-[14px]">
              {item.desc}
            </p>

            <div className="pointer-events-none absolute right-0 top-0 opacity-[0.04]">
              {item.icon === 'zap' ? (
                <Zap className="h-28 w-28 md:h-36 md:w-36" />
              ) : (
                <ShieldCheck className="h-28 w-28 md:h-36 md:w-36" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Steps (How It Works)
 * ────────────────────────────────────────────────────────── */
function Steps({ c }: { c: LandingCopy['steps'] }) {
  return (
    <section
      id="how-it-works"
      className="w-full border-y border-border/60 bg-secondary/60 py-14 md:py-20"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="mb-8 md:mb-12">
          <h2 className="text-[22px] font-bold tracking-tight md:text-[32px]">{c.title}</h2>
          {c.subtitle ? (
            <p className="mt-1.5 text-[12px] text-muted-foreground md:text-sm">{c.subtitle}</p>
          ) : null}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {c.list.map((step, i) => (
            <div
              key={i}
              className="relative min-w-[240px] shrink-0 overflow-hidden rounded-[14px] border border-border bg-card p-5 md:min-w-0 md:p-7"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#faaf2e] md:text-xs">
                {step.label}
              </p>
              <h3 className="mt-2 text-[18px] font-bold md:text-[22px]">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground md:text-[14px]">
                {step.desc}
              </p>
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 bottom-0 text-[60px] font-extrabold leading-none text-[#faaf2e]/[0.06] md:text-[96px]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Talent categories — replaces crypto-style "Live Network" stats.
 * Six directions a Seeker can head toward.
 * ────────────────────────────────────────────────────────── */
function Categories({ c }: { c: LandingCopy['categories'] }) {
  const iconFor = (name: (typeof c.items)[number]['icon']) => {
    switch (name) {
      case 'palette':
        return Palette;
      case 'dumbbell':
        return Dumbbell;
      case 'brain':
        return Brain;
      case 'message':
        return MessageCircle;
      case 'wrench':
        return Wrench;
      case 'sparkles':
        return Sparkles;
    }
  };

  return (
    <Section className="py-16 md:py-24">
      <div className="mb-8 max-w-[640px] md:mb-12">
        <h2 className="text-[22px] font-bold leading-tight tracking-tight md:text-[32px]">
          {c.title}
        </h2>
        <p className="mt-2 text-[13px] text-muted-foreground md:text-[15px]">{c.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {c.items.map((item, i) => {
          const Icon = iconFor(item.icon);
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[14px] border border-border bg-card p-4 transition hover:border-[#faaf2e]/40 md:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/25 md:h-12 md:w-12">
                <Icon className="h-5 w-5 text-[#faaf2e] md:h-6 md:w-6" />
              </div>
              <p className="mt-4 text-[15px] font-semibold md:text-[17px]">{item.name}</p>
              <p className="mt-1.5 text-[11px] leading-normal text-muted-foreground md:text-[13px]">
                {item.ex}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Agent code
 * ────────────────────────────────────────────────────────── */
function AgentCode({ c }: { c: LandingCopy['agent'] }) {
  return (
    <section id="agent" className="w-full border-y border-border/60 bg-background py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
              <Code2 className="h-3 w-3" />
              {c.eyebrow}
            </span>
            <h2 className="mt-4 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] md:text-[36px]">
              {c.title}
            </h2>
            <p className="mt-4 text-[14px] leading-[1.6] text-muted-foreground md:text-[16px] md:leading-[1.7]">
              {c.desc}
            </p>
            <Link
              href="/guide#api"
              className="mt-6 inline-flex h-10 items-center gap-1 rounded-[10px] border border-border bg-card px-4 text-sm font-medium text-foreground/85 transition hover:border-white/20 hover:bg-foreground/5 md:h-11 md:px-5"
            >
              {c.cta}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-border bg-[#0a0a10] shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 border-b border-border/60 bg-foreground/[0.04] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#faaf2e]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#2dd4bf]/70" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">agent.ts</span>
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[11px] leading-[1.7] text-foreground/85 md:text-[13px]">
              <code>
                <span className="text-foreground/70">const ember </span>
                <span className="text-[#faaf2e]">=</span>
                <span className="text-foreground/70">{` await dito.`}</span>
                <span className="text-[#2dd4bf]">auth</span>
                <span className="text-foreground/70">{`({ agentId: "my-claude-fn" })\n`}</span>
                <span className="text-foreground/70">const status </span>
                <span className="text-[#faaf2e]">=</span>
                <span className="text-foreground/70">{` await ember.`}</span>
                <span className="text-[#2dd4bf]">ask</span>
                <span className="text-foreground/70">{`("How's my coding talent?")\n\n`}</span>
                <span className="text-muted-foreground">{`// → "You hit 82%. Ready for Blazing. Next step: ..."`}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Final CTA
 * ────────────────────────────────────────────────────────── */
function FinalCTA({ c }: { c: LandingCopy['cta'] }) {
  return (
    <Section className="py-16 md:py-28">
      <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/30 md:h-14 md:w-14">
          <Flame className="h-5 w-5 text-[#faaf2e] md:h-6 md:w-6" />
        </div>
        <h2 className="text-[24px] font-bold tracking-[-0.02em] md:text-[40px]">{c.title}</h2>
        <p className="mt-3 text-[13px] leading-[1.6] text-muted-foreground md:max-w-[480px] md:text-[15px]">
          {c.sub}
        </p>
        <Link
          href="/auth/signup"
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[#faaf2e] px-7 text-sm font-semibold text-[#4b3002] shadow-[0_10px_24px_rgba(250,175,46,0.25),0_4px_6px_rgba(250,175,46,0.2)] transition hover:bg-[#e8a129] md:h-12 md:px-8 md:text-[15px]"
        >
          {c.button}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Footer
 * ────────────────────────────────────────────────────────── */
function LandingFooter({
  c,
  lang,
  setLang,
}: {
  c: LandingCopy['footer'];
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-12 md:px-8 md:py-14">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#faaf2e]/10 ring-1 ring-[#faaf2e]/30">
              <Flame className="h-3.5 w-3.5 text-[#faaf2e]" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">DITO</span>
          </div>
          <p className="mt-4 max-w-[220px] text-[12px] text-muted-foreground">{c.tagline}</p>
        </div>

        <div>
          <p className="mb-3 text-[13px] font-semibold">{c.product}</p>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            <li>
              <a href="#how-it-works" className="transition hover:text-foreground/80">
                {c.howItWorks}
              </a>
            </li>
            <li>
              <a href="#agent" className="transition hover:text-foreground/80">
                {c.developers}
              </a>
            </li>
            <li>
              <Link href="/soul" className="transition hover:text-foreground/80">
                {c.souls}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-[13px] font-semibold">{c.legal}</p>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            <li>
              <Link href="/privacy" className="transition hover:text-foreground/80">
                {c.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-foreground/80">
                {c.terms}
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex rounded-full border border-border p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                lang === 'en' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ko')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                lang === 'ko' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              KO
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/70">{c.copy}</p>
        </div>
      </div>

      <div className="border-t border-border/60 py-4 text-center text-[11px] uppercase tracking-[1px] text-muted-foreground/70">
        Built for Solana Hackathon 2026 · BUSL 1.1 · Open development
      </div>
    </footer>
  );
}
