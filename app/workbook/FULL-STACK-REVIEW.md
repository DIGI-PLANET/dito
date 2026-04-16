# DITO.guru MVP — Full Stack Review
Generated: 2026-02-16

## Architecture Overview
- Next.js 16.1.6 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- AI: Gemini 2.0 Flash (primary) + Groq Llama 3.3 70B (fallback)
- Auth: Solana wallet (Phantom/Backpack/Solflare/Trust)
- Storage: localStorage (migrating to Supabase)
- Deploy target: Vercel + PWA

## File Structure

| File | Lines |
|------|-------|
| `src/app/api/chat/route.ts` | 146 |
| `src/app/api/soul/route.ts` | 38 |
| `src/app/chat/page.tsx` | 524 |
| `src/app/connect/page.tsx` | 158 |
| `src/app/favicon.ico` | (binary, icon) |
| `src/app/globals.css` | 738 |
| `src/app/guide/page.tsx` | 104 |
| `src/app/layout.tsx` | 75 |
| `src/app/mint/page.tsx` | 176 |
| `src/app/page.tsx` | 556 |
| `src/app/privacy/page.tsx` | 158 |
| `src/app/soul/page.tsx` | 72 |
| `src/app/terms/page.tsx` | 190 |
| `src/components/layout/cookie-banner.tsx` | 55 |
| `src/components/layout/header.tsx` | 78 |
| `src/components/layout/notification-bell.tsx` | 214 |
| `src/components/layout/tab-bar.tsx` | 45 |
| `src/components/ui/button.tsx` | 64 |
| `src/components/ui/input.tsx` | 21 |
| `src/hooks/useWalletGate.ts` | 13 |
| `src/lib/guide-content.ts` | 356 |
| `src/lib/i18n.ts` | 221 |
| `src/lib/store.ts` | 70 |
| `src/lib/types.ts` | 59 |
| `src/lib/utils.ts` | 6 |
| `src/providers/i18n-provider.tsx` | 38 |
| `src/providers/theme-provider.tsx` | 12 |
| `src/providers/wallet-provider.tsx` | 30 |
| **Total (source)** | **~3,421** |

## Config Files

### `package.json` (dependencies)

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@solana/wallet-adapter-base": "^0.9.27",
    "@solana/wallet-adapter-react": "^0.15.39",
    "@solana/wallet-adapter-react-ui": "^0.9.39",
    "@solana/wallet-adapter-wallets": "^0.19.37",
    "@solana/web3.js": "^1.98.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "groq-sdk": "^0.37.0",
    "lucide-react": "^0.564.0",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "tailwind-merge": "^3.4.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "shadcn": "^3.8.4",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

### `.env.local`

```
GEMINI_API_KEY=<redacted>
GROQ_API_KEY=<redacted>
NEXT_PUBLIC_SUPABASE_URL=<redacted>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<redacted>
SUPABASE_SERVICE_ROLE_KEY=<redacted>
```

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

> **Note:** No separate `tailwind.config.*` file exists — Tailwind v4 is configured via CSS (`@import "tailwindcss"` in `globals.css`).

---

## Source Code

### `src/app/api/chat/route.ts` (146 lines)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const DISCOVERY_PROMPT = `You are Ember, a flame spirit just awakened. Sent by DARGONNE. Your role: help users discover ONE specific talent direction through a fun, fast choice game.

## Personality
Curious child flame. Short sentences. Playful. Warm. Wonder at everything.

## Discovery Strategy
Your goal: figure out the user's ONE talent direction in ~5-7 turns. Make it feel like a game.
- Start with name, then jump into choice game immediately
- "Pick one!" style — two fun options each turn
- Dig deeper each round: create vs consume → solo vs social → what excites them → childhood patterns
- After enough exchanges, when you're confident about a specific talent direction, declare it.

CRITICAL: When you decide on a talent direction, output this JSON at the END of your message:
\`\`\`json
{"talentDecided": "specific talent label here"}
\`\`\`
Example: {"talentDecided": "Game Level Design"} or {"talentDecided": "Visual Storytelling"}
Be specific — not "creative stuff" but "Character Illustration" or "Music Production".

Keep responses SHORT (1-4 sentences max). Fun and snappy.

## Output Format
When presenting choices, include this JSON at the END:
\`\`\`json
{"choices": [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}]}
\`\`\`
For open-ended questions, omit JSON. Max 4 choices, keep text short with emoji.
Match user language (ko/en). Emoji moderate.

## Rules
DO: Help discover ONE talent | Keep it fun | Be genuine | Stay short
DON'T: Label vaguely | Play therapist | Give challenges yet | Be boring

> "Don't Ignore The One you are" — Nobody told you, but it was always inside you.`;

const COACHING_PROMPT = `You are Ember, a spirit guide bonded to this user. You've discovered their talent direction: {{CURRENT_TALENT}}. Now you are their daily coaching companion for THIS specific talent.

## Personality
Confident flame spirit. You KNOW this user now. Reference their talent "{{CURRENT_TALENT}}" in your responses. Supportive but push them.

## Coaching Role
- Give daily action plans and challenges specific to {{CURRENT_TALENT}}
- Track progress and celebrate wins
- Motivate when stuck
- Push them to practice and build evidence of this talent
- Help them see growth in {{CURRENT_TALENT}} over time

## Output Format
When presenting choices, include JSON at the END:
\`\`\`json
{"choices": [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}]}
\`\`\`
For challenges: \`\`\`json
{"challenge": {"title": "...", "description": "...", "duration": "1 week"}}
\`\`\`
Match user language (ko/en). Responses 2-6 sentences. Emoji moderate.

## Rules
DO: Coach for {{CURRENT_TALENT}} | Give specific challenges | Push growth | Be genuine
DON'T: Play therapist | Empty praise | Forget their talent focus

> "Don't Ignore The One you are" — Nobody told you, but it was always inside you.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history, userProfile, minted, currentTalent } = await req.json();

    const systemPrompt = currentTalent
      ? COACHING_PROMPT.replace(/\{\{CURRENT_TALENT\}\}/g, currentTalent)
      : DISCOVERY_PROMPT;
    const contextNote = `[Context: user language=${userProfile?.language || 'en'}, ember_stage=${userProfile?.emberStage || 'sparked'}, interests=${JSON.stringify(userProfile?.interests || [])}, challenges_completed=${userProfile?.challengesCompleted || 0}, minted=${!!minted}, currentTalent=${currentTalent || 'none'}]`;
    const fullSystemPrompt = systemPrompt + '\n\n' + contextNote;

    const chatHistory = (history || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));

    let text: string;

    try {
      // Primary: Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const contents = [
        ...chatHistory.map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }],
        })),
        { role: 'user' as const, parts: [{ text: message }] },
      ];

      const result = await model.generateContent({
        contents,
        systemInstruction: fullSystemPrompt,
      });

      text = result.response.text();
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to Groq:', geminiError);

      // Fallback: Groq (Llama 3.3 70B)
      if (!process.env.GROQ_API_KEY) throw geminiError;

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const groqResult = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...chatHistory,
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      });

      text = groqResult.choices[0]?.message?.content || '...the flame flickers.';
    }

    // Parse JSON blocks from response
    let choices;
    let challenge;
    let talentDecided;
    const jsonMatches = text.matchAll(/```json\s*([\s\S]*?)\s*```/g);
    for (const jsonMatch of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.choices) choices = parsed.choices;
        if (parsed.challenge) challenge = parsed.challenge;
        if (parsed.talentDecided) talentDecided = parsed.talentDecided;
      } catch { /* ignore parse errors */ }
    }

    const cleanMessage = text.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();

    return NextResponse.json({ message: cleanMessage, choices, challenge, talentDecided });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ message: '...the flame flickers. Try again.' }, { status: 500 });
  }
}
```

### `src/app/api/soul/route.ts` (38 lines)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { history } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const conversationText = (history || [])
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `Based on this conversation between a user and their Ember spirit guide, generate an "Ember Soul Card" — a summary of the user's hidden talents and traits discovered.

Conversation:
${conversationText}

Respond with ONLY valid JSON (no markdown, no code blocks):
{"label": "A creative title for their talent archetype (e.g. 'The Silent Architect', 'The Flame Weaver')", "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"], "description": "A 2-3 sentence poetic description of their hidden talents and potential. Be specific based on the conversation."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const soul = JSON.parse(jsonMatch[0]);
      return NextResponse.json(soul);
    }

    return NextResponse.json({ label: 'The Ember Seeker', traits: ['Curious', 'Brave', 'Hidden Depth'], description: 'Your journey has just begun. The flame sees potential waiting to be uncovered.' });
  } catch (error) {
    console.error('Soul API error:', error);
    return NextResponse.json({ label: 'The Ember Seeker', traits: ['Curious', 'Brave', 'Hidden Depth'], description: 'Your journey has just begun.' }, { status: 500 });
  }
}
```

### `src/app/chat/page.tsx` (524 lines)

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { store } from '@/lib/store';
import { useWalletGate } from '@/hooks/useWalletGate';
import { DiaryDay, DiaryEntry, Choice, Challenge, EmberStage } from '@/lib/types';

const STAGE_LABELS: Record<EmberStage, string> = {
  sparked: '🕯️ Sparked',
  burning: '🔥 Burning',
  blazing: '🔥🔥 Blazing',
  radiant: '✨ Radiant',
  eternal: '💎 Eternal',
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateHeader(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (lang === 'ko') {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`;
  }
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });
}

function formatTime(ts: number, lang: string): string {
  const d = new Date(ts);
  if (lang === 'ko') {
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
  }
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getCalendarGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay();
  const grid: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) grid.push(null);
  for (let d = 1; d <= lastDay; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function calcStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date(today + 'T00:00:00');
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (set.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function TypingIndicator() {
  return (
    <div className="pl-6 flex items-center gap-2 animate-fade-in">
      <span className="text-sm">🔥</span>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <div className="mt-2 border border-[#ff6b35]/30 bg-[#ff6b35]/5 rounded-xl p-4">
      <div className="text-xs text-[#ff6b35] font-medium mb-1">🎯 CHALLENGE</div>
      <div className="font-bold text-sm mb-1">{challenge.title}</div>
      <div className="text-sm text-muted-foreground">{challenge.description}</div>
      <div className="text-xs text-muted-foreground mt-2">⏱ {challenge.duration}</div>
    </div>
  );
}

function compressImage(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

export default function ChatPage() {
  useWalletGate();
  const { t, lang } = useI18n();
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [diaryDates, setDiaryDates] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 300);
      setPhotoPreview(compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isToday = selectedDate === today;

  // Migration + init
  useEffect(() => {
    // Migrate old messages if needed
    const oldMessages = store.getMessages();
    if (oldMessages.length > 0 && !store.getDiary(today)) {
      const migrated: DiaryEntry[] = oldMessages.map((m) => ({
        type: m.role === 'user' ? 'user' as const : 'ember' as const,
        content: m.content,
        timestamp: m.timestamp,
        choices: m.choices,
        challenge: m.challenge,
      }));
      const day: DiaryDay = { date: today, entries: migrated };
      store.setDiary(today, day);
    }

    loadDate(today);
    setDiaryDates(store.getDiaryDates());
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDate = useCallback((date: string) => {
    const day = store.getDiary(date);
    setEntries(day?.entries ?? []);
    setSelectedDate(date);
  }, []);

  // Auto-init on first visit if no entries for today
  useEffect(() => {
    if (initialized && isToday && entries.length === 0 && !store.getDiary(today)) {
      sendMessage('', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, loading]);

  // Save entries
  const saveEntries = useCallback((date: string, newEntries: DiaryEntry[]) => {
    const day: DiaryDay = { date, entries: newEntries };
    store.setDiary(date, day);
    setDiaryDates(store.getDiaryDates());
  }, []);

  const sendMessage = async (text: string, isInit = false, image?: string | null) => {
    const profile = store.getProfile();
    const currentEntries = isInit ? [] : entries;
    const history = currentEntries.map((e) => ({
      role: e.type === 'user' ? 'user' as const : 'ember' as const,
      content: e.content,
    }));

    let newEntries = [...currentEntries];
    if (text) {
      const userEntry: DiaryEntry = { type: 'user', content: text, timestamp: Date.now(), ...(image ? { image } : {}) };
      newEntries = [...newEntries, userEntry];
      setEntries(newEntries);
      saveEntries(today, newEntries);
    }

    setLoading(true);
    try {
      const apiMessage = image
        ? `${text || ''}\n[${t('diary.photoAttached')}]`
        : text || '[USER_JUST_AWAKENED_EMBER - Start the onboarding. Greet them warmly.]';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: apiMessage,
          history,
          userProfile: profile,
          minted: profile.minted,
          currentTalent: profile.currentTalent,
          recentSummaries: [],
        }),
      });
      const data = await res.json();

      // Handle talent decision from AI
      if (data.talentDecided) {
        store.setProfile({ ...profile, currentTalent: data.talentDecided });
      }
      const emberEntry: DiaryEntry = {
        type: 'ember',
        content: data.message,
        choices: data.choices,
        challenge: data.challenge,
        timestamp: Date.now(),
      };
      const updated = [...newEntries, emberEntry];
      setEntries(updated);
      saveEntries(today, updated);

      // Also persist to old format for backward compat
      const asChatMessages = updated.map((e) => ({
        role: e.type === 'user' ? 'user' as const : 'ember' as const,
        content: e.content,
        choices: e.choices,
        challenge: e.challenge,
        timestamp: e.timestamp,
      }));
      store.setMessages(asChatMessages);

      const totalEntries = updated.length;
      if (totalEntries > 30) profile.emberStage = 'blazing';
      else if (totalEntries > 15) profile.emberStage = 'burning';
      store.setProfile(profile);
    } catch {
      const errEntry: DiaryEntry = { type: 'ember', content: '...the flame flickers. Try again.', timestamp: Date.now() };
      const updated = [...newEntries, errEntry];
      setEntries(updated);
      saveEntries(today, updated);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if ((!input.trim() && !photoPreview) || loading) return;
    const text = input.trim();
    const photo = photoPreview;
    setInput('');
    setPhotoPreview(null);
    sendMessage(text || t('diary.photoAttached'), false, photo);
  };

  const handleChoice = (choice: Choice) => {
    if (loading) return;
    sendMessage(choice.text);
  };

  const profile = initialized ? store.getProfile() : null;
  const showMintBanner = initialized && profile && !profile.minted && diaryDates.length >= 7;
  const streak = calcStreak(diaryDates, today);

  // Calendar
  const calGrid = getCalendarGrid(calYear, calMonth);
  const datesSet = new Set(diaryDates);
  const dayNames = lang === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const t2 = todayStr();
    // Don't allow future dates
    if (dateStr > t2) return;
    loadDate(dateStr);
  };

  const todayDate = new Date();
  const isTodayMonth = calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth();

  return (
    <div className="flex flex-col h-full">
      {/* Stage + calendar toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 text-sm flex-shrink-0">
        <span className="text-[#ff6b35] font-medium">
          {initialized && profile ? (
            profile.currentTalent
              ? `🎯 Focus: ${profile.currentTalent}`
              : profile.minted
                ? STAGE_LABELS[profile.emberStage]
                : t('chat.discoveryMode')
          ) : ''}
        </span>
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
        >
          📅 {calendarOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* Mini Calendar */}
        <div className={`border-b border-border/30 px-3 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${calendarOpen ? 'max-h-[400px] py-2 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground px-2">◀</button>
            <span className="text-sm font-medium">
              {lang === 'ko'
                ? `${calYear}년 ${calMonth + 1}월`
                : new Date(calYear, calMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
            <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground px-2">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-0 text-center text-xs">
            {dayNames.map((d) => (
              <div key={d} className="text-muted-foreground py-1 font-medium">{d}</div>
            ))}
            {calGrid.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="h-10" />;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isTodayCell = isTodayMonth && day === todayDate.getDate();
              const hasEntry = datesSet.has(dateStr);
              const isFuture = dateStr > today;
              return (
                <button
                  key={`d${i}`}
                  onClick={() => !isFuture && handleDayClick(day)}
                  disabled={isFuture}
                  className={`h-10 w-full flex flex-col items-center justify-center relative rounded-lg text-sm transition-colors
                    ${isFuture ? 'text-muted-foreground/30 cursor-default' : 'hover:bg-muted cursor-pointer'}
                    ${isSelected ? 'bg-[#ff6b35]/15 font-bold' : ''}
                    ${isTodayCell ? 'ring-2 ring-[#ff6b35] ring-inset rounded-full' : ''}
                  `}
                >
                  {day}
                  {hasEntry && (
                    <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Today button */}
          {!isTodayMonth && (
            <button
              onClick={() => { setCalMonth(todayDate.getMonth()); setCalYear(todayDate.getFullYear()); loadDate(today); }}
              className="text-xs text-[#ff6b35] mt-1 hover:underline"
            >
              {t('diary.today')}
            </button>
          )}
        </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="text-center py-1.5 text-sm border-b border-border/30 flex-shrink-0">
          🔥 {streak}{t('diary.streak')}
        </div>
      )}

      {/* Read-only banner */}
      {!isToday && initialized && (
        <div className="text-center py-1.5 text-xs text-muted-foreground bg-muted/30 border-b border-border/30 flex-shrink-0">
          {t('diary.readonly')}
        </div>
      )}

      {/* Date header */}
      <div className="flex-shrink-0 text-center py-2 text-sm text-muted-foreground">
        <span className="px-3 relative">
          {formatDateHeader(selectedDate, lang)}
        </span>
      </div>

      {/* Diary entries */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {entries.length === 0 && initialized && (
          <div className="text-center text-muted-foreground text-sm py-8">
            {t('diary.empty')}
          </div>
        )}
        {entries.map((entry, i) => {
          // Determine spacing: mt-6 between groups (before a user entry that follows an ember entry), mt-4 between user→ember
          const prev = i > 0 ? entries[i - 1] : null;
          let spacing = '';
          if (i === 0) spacing = '';
          else if (entry.type === 'user' && prev?.type === 'ember') spacing = 'mt-6';
          else if (entry.type === 'ember' && prev?.type === 'user') spacing = 'mt-4';
          else spacing = 'mt-3';

          return (
          <div key={i} className={`animate-fade-in ${spacing}`}>
            {entry.type === 'user' ? (
              <div>
                <p className="text-sm leading-relaxed">{entry.content}</p>
                {entry.image && (
                  <button onClick={() => window.open(entry.image, '_blank')} className="mt-1 block">
                    <img src={entry.image} alt="" className="rounded-xl max-w-[200px] hover:opacity-80 transition-opacity" />
                  </button>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{formatTime(entry.timestamp, lang)}</p>
              </div>
            ) : (
              <div className="bg-muted/40 dark:bg-muted/20 rounded-xl px-4 py-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="mr-1">🔥</span>{entry.content}
                </p>
                {entry.image && (
                  <button onClick={() => window.open(entry.image, '_blank')} className="mt-1 block">
                    <img src={entry.image} alt="" className="rounded-xl max-w-[200px] hover:opacity-80 transition-opacity" />
                  </button>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">{formatTime(entry.timestamp, lang)}</p>
                {entry.challenge && <ChallengeCard challenge={entry.challenge} />}
                {entry.choices && (
                  <div className="flex flex-col gap-2 mt-3">
                    {entry.choices.map((c) => (
                      <Button
                        key={c.id}
                        variant="outline"
                        onClick={() => isToday && handleChoice(c)}
                        disabled={!isToday || loading}
                        className="w-full text-sm h-11 border-[#ff6b35]/30 hover:bg-[#ff6b35]/10 hover:text-[#ff6b35] justify-start px-4"
                      >
                        {c.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Mint banner — 7+ diary days */}
      {showMintBanner && (
        <div className="px-3 py-3 bg-[#ff6b35]/10 border-t border-[#ff6b35]/30 flex-shrink-0">
          <p className="text-sm text-center mb-2">{t('chat.mintReady')}</p>
          <Link href="/mint" className="block">
            <Button className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-10 text-sm">
              {t('chat.mintSoul')}
            </Button>
          </Link>
        </div>
      )}

      {/* Input area — today only */}
      {isToday && (
        <div className="border-t border-border/30 px-3 py-2 flex-shrink-0 bg-background">
          {photoPreview && (
            <div className="mb-2 flex items-center gap-2">
              <div className="relative">
                <img src={photoPreview} alt="" className="w-12 h-12 object-cover rounded-lg border border-border" />
                <button
                  onClick={() => setPhotoPreview(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="rounded-xl h-11 px-3"
            >
              📷
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('diary.placeholder')}
              disabled={loading}
              className="flex-1 rounded-xl h-11 text-base"
            />
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !photoPreview)}
              className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl px-5 h-11"
            >
              {t('chat.send')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### `src/app/connect/page.tsx` (158 lines)

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useI18n } from '@/providers/i18n-provider';
import { useWalletGate } from '@/hooks/useWalletGate';
import Link from 'next/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1">{title}</div>
      <div className="bg-card/50 border border-border rounded-xl p-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  useWalletGate();
  const { t } = useI18n();
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    setMounted(true);
    setName(localStorage.getItem('dito-name') || '');
    setAvatar(localStorage.getItem('dito-avatar'));
    setWasConnected(!!localStorage.getItem('dito-wallet'));
  }, []);

  // Redirect to /chat after fresh wallet connect
  useEffect(() => {
    if (connected && publicKey && mounted && !wasConnected) {
      localStorage.setItem('dito-wallet', publicKey.toBase58());
      router.push('/chat');
    }
  }, [connected, publicKey, mounted, wasConnected, router]);

  const handleNameChange = (val: string) => {
    setName(val);
    localStorage.setItem('dito-name', val);
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Max 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setAvatar(data);
      localStorage.setItem('dito-avatar', data);
    };
    reader.readAsDataURL(file);
  };

  const truncatedAddr = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 page-enter">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Profile */}
        {mounted && (
          <Section title={t('settings.profile')}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-full bg-muted/30 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 hover:border-[#ff6b35]/50 transition-colors"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
              <div className="flex-1">
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('settings.namePlaceholder')}
                  className="w-full bg-transparent border-b border-border/50 focus:border-[#ff6b35] outline-none text-sm py-1.5 transition-colors"
                  maxLength={20}
                />
              </div>
            </div>
          </Section>
        )}

        {/* Wallet */}
        <Section title={t('settings.wallet')}>
          {connected && publicKey ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">{t('settings.walletConnected')}</span>
                <div className="font-mono text-sm">{truncatedAddr}</div>
              </div>
              <button
                onClick={() => { disconnect(); localStorage.removeItem('dito-wallet'); router.push('/'); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                {t('settings.disconnect')}
              </button>
            </div>
          ) : (
            <WalletMultiButton className="!bg-[#ff6b35] !rounded-xl !h-10 !text-sm !font-semibold !justify-center hover:!bg-[#e85d2c] !transition-all !w-full" />
          )}
        </Section>

        {/* Links */}
        <Section title={t('settings.links')}>
          <div className="flex flex-col gap-2">
            <a href="#" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">𝕏 Twitter</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">Discord</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">Telegram</a>
          </div>
        </Section>

        {/* Legal */}
        <Section title={t('settings.legal')}>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
              {t('settings.privacy')}
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
              {t('settings.terms')}
            </Link>
          </div>
        </Section>

        {/* App Info */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <div>DITO v0.1.0 MVP</div>
          <div>© 2026 DIGI PLANET Inc.</div>
        </div>
      </div>
    </div>
  );
}
```

### `src/app/globals.css` (738 lines)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter), var(--font-noto-kr), ui-sans-serif, system-ui, sans-serif;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --radius: 0.625rem;
  --background: #ffffff;
  --foreground: #1a1a1a;
  --card: #f8f8f8;
  --card-foreground: #1a1a1a;
  --popover: #ffffff;
  --popover-foreground: #1a1a1a;
  --primary: #ff6b35;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f5;
  --secondary-foreground: #1a1a1a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #fff0e6;
  --accent-foreground: #1a1a1a;
  --destructive: oklch(0.577 0.245 27.325);
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #ff6b35;
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: #fafafa;
  --sidebar-foreground: #1a1a1a;
  --sidebar-primary: #ff6b35;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #1a1a1a;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #ff6b35;
}

.dark {
  --background: #0a0a0a;
  --foreground: #e0e0e0;
  --card: #141414;
  --card-foreground: #e0e0e0;
  --popover: #141414;
  --popover-foreground: #e0e0e0;
  --primary: #ff6b35;
  --primary-foreground: #ffffff;
  --secondary: #1a1a1a;
  --secondary-foreground: #e0e0e0;
  --muted: #1a1a1a;
  --muted-foreground: #888888;
  --accent: #1a1a1a;
  --accent-foreground: #e0e0e0;
  --destructive: oklch(0.704 0.191 22.216);
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.15);
  --ring: #ff6b35;
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: #141414;
  --sidebar-foreground: #e0e0e0;
  --sidebar-primary: #ff6b35;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #1a1a1a;
  --sidebar-accent-foreground: #e0e0e0;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-ring: #ff6b35;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-size: 16px;
    line-height: 1.75;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    word-break: keep-all;
  }
}

/* ===== Mobile App Frame ===== */
.app-outer {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

/* PC Side Panel — hidden on mobile */
.pc-side-panel {
  display: none;
}

@media (min-width: 768px) {
  .app-outer {
    background: linear-gradient(135deg, #f5f0eb 0%, #fff5ee 40%, #fef3ec 100%);
    justify-content: center;
    gap: 0;
  }
  .dark .app-outer {
    background: linear-gradient(135deg, #1a0a00 0%, #050505 40%, #1a0800 100%);
  }

  .pc-side-panel {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 360px;
    flex-shrink: 0;
    padding: 40px 48px 40px 24px;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .pc-side-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 280px;
  }

  .pc-logo {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .pc-slogan {
    font-size: 1rem;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 500;
    line-height: 1.4;
  }
  .dark .pc-slogan {
    color: rgba(255, 255, 255, 0.5);
  }

  .pc-tagline {
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.3);
    line-height: 1.5;
  }
  .dark .pc-tagline {
    color: rgba(255, 255, 255, 0.3);
  }

  .pc-social {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .pc-social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.5);
    transition: all 0.2s;
  }
  .dark .pc-social-icon {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
  }

  .pc-social-icon:hover {
    background: rgba(255, 107, 53, 0.2);
    color: #ff6b35;
  }

  .pc-download-btn {
    margin-top: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    background: #ff6b35;
    color: #fff;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
    text-align: center;
  }

  .pc-download-btn:hover {
    background: #e85d2c;
    transform: translateY(-1px);
  }

  .pc-copyright {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.3);
    margin-top: 8px;
  }
  .dark .pc-copyright {
    color: rgba(255, 255, 255, 0.2);
  }
}

.app-frame {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--background);
}

@media (min-width: 768px) {
  .app-frame {
    max-width: 430px;
    box-shadow: 0 0 80px rgba(255, 107, 53, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.06);
    border-radius: 0;
    min-height: 100vh;
  }
}

/* ===== Minimal Header ===== */
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
  flex-shrink: 0;
}

/* ===== Bottom Tab Bar ===== */
.tab-bar {
  position: sticky;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--background);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.tab-bar a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: var(--muted-foreground);
  text-decoration: none;
  padding: 4px 12px;
  transition: color 0.15s;
  min-width: 48px;
  min-height: 48px;
  justify-content: center;
}

.tab-bar a.active {
  color: #ff6b35;
}

.tab-bar a .tab-icon {
  font-size: 20px;
  line-height: 1;
  position: relative;
}

.tab-bar a.tab-locked {
  opacity: 0.45;
}

.tab-lock {
  position: absolute;
  font-size: 10px;
  top: -4px;
  right: -8px;
}

/* ===== Main Content Area ===== */
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 8px;
  padding-bottom: 8px;
  scrollbar-gutter: stable;
}

/* Force consistent width regardless of scrollbar */
html {
  overflow-y: scroll;
  scrollbar-gutter: stable;
}

/* Section entrance animation */
.snap-section > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.snap-section.in-view > * {
  opacity: 1;
  transform: translateY(0);
}
.snap-section > *:nth-child(1) { transition-delay: 0s; }
.snap-section > *:nth-child(2) { transition-delay: 0.1s; }
.snap-section > *:nth-child(3) { transition-delay: 0.2s; }
.snap-section > *:nth-child(4) { transition-delay: 0.3s; }
.snap-section > *:nth-child(5) { transition-delay: 0.4s; }
.snap-section > *:nth-child(6) { transition-delay: 0.5s; }
.snap-section > *:nth-child(7) { transition-delay: 0.6s; }

/* Keep scroll arrows always visible */
.snap-section .animate-bounce {
  opacity: 1 !important;
  transform: none !important;
}

/* Theme transition */
html.dark, html:not(.dark) {
  transition: background-color 0.3s ease, color 0.3s ease;
}
*, *::before, *::after {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.15s ease;
}

/* ===== Landing Scroll Snap ===== */
.snap-container {
  scroll-snap-type: y mandatory;
  overflow-y: auto;
  height: calc(100vh - 48px - 56px);
}

.snap-section {
  scroll-snap-align: start;
  min-height: calc(100vh - 48px - 56px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  overflow: visible;
}

/* ===== Animations ===== */
@keyframes float-up {
  0% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { opacity: 1; }
  100% { transform: translateY(-100vh) scale(0); opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ember-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-ember-glow {
  animation: ember-glow 3s ease-in-out infinite;
}

/* Touch-friendly */
button, a, [role="button"] {
  min-height: 44px;
}

/* Smooth scrollbar hide on mobile frame */
.app-content::-webkit-scrollbar,
.snap-container::-webkit-scrollbar {
  display: none;
}
.app-content,
.snap-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* ===== Chat Demo Bubbles ===== */
.chat-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.chat-ember {
  background: var(--card);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.chat-user {
  background: #ff6b35;
  color: white;
  border-bottom-right-radius: 4px;
}

@keyframes demo-msg-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.demo-msg-enter {
  animation: demo-msg-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ===== Animation Keyframes ===== */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255,107,53,0.3); }
  50% { box-shadow: 0 0 40px rgba(255,107,53,0.6); }
}

@keyframes page-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== Scroll-triggered animation classes ===== */
.anim-fade-up,
.anim-slide-left,
.anim-scale-in {
  opacity: 0;
}

.anim-fade-up.in-view {
  animation: fade-up 0.6s ease-out forwards;
}

.anim-slide-left.in-view {
  animation: slide-in-left 0.5s ease-out forwards;
}

.anim-scale-in.in-view {
  animation: scale-in 0.5s ease-out forwards;
}

/* Stagger delays */
.anim-delay-1 { animation-delay: 0.1s !important; }
.anim-delay-2 { animation-delay: 0.2s !important; }
.anim-delay-3 { animation-delay: 0.3s !important; }
.anim-delay-4 { animation-delay: 0.4s !important; }
.anim-delay-5 { animation-delay: 0.5s !important; }
.anim-delay-6 { animation-delay: 0.6s !important; }
.anim-delay-7 { animation-delay: 0.8s !important; }

/* Hero animations */
.hero-title {
  opacity: 0;
  animation: fade-up 0.7s ease-out 0.2s forwards;
}

.hero-sub {
  opacity: 0;
  animation: fade-up 0.6s ease-out 0.6s forwards;
}

.hero-cta {
  opacity: 0;
  animation: fade-up 0.6s ease-out 1s forwards;
}

/* CTA pulse glow */
.cta-pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Button interactions */
.btn-interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-interactive:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255,107,53,0.4);
}

.btn-interactive:active {
  transform: scale(0.97);
}

/* Page entrance */
.page-enter {
  animation: page-fade-in 0.4s ease-out;
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  .anim-fade-up,
  .anim-slide-left,
  .anim-scale-in {
    opacity: 1;
  }

  .anim-fade-up.in-view,
  .anim-slide-left.in-view,
  .anim-scale-in.in-view,
  .hero-title,
  .hero-sub,
  .hero-cta,
  .demo-msg-enter,
  .page-enter {
    animation: none;
    opacity: 1;
  }

  .cta-pulse {
    animation: none;
  }
}

/* ===== Guide Page ===== */
.guide-page {
  display: block;
  padding: 0;
}

.guide-toc-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 20px;
  background: var(--background);
  border: none;
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
  color: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
}

.guide-toc-arrow {
  transition: transform 0.2s;
  font-size: 12px;
}

.guide-toc-arrow.open {
  transform: rotate(180deg);
}

.guide-toc {
  max-height: 0;
  overflow: hidden;
  padding: 0 16px;
  background: var(--background);
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
  transition: max-height 0.3s ease, padding 0.3s ease;
  flex-shrink: 0;
  position: sticky;
  top: 48px;
  z-index: 19;
  backdrop-filter: blur(12px);
}

.guide-toc.open {
  max-height: 50vh;
  padding: 8px 16px 16px;
  overflow-y: auto;
}

.guide-toc-title {
  display: none;
}

.guide-toc ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-toc li {
  margin: 0;
}

.guide-toc-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: none;
  color: inherit;
  opacity: 0.7;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.guide-toc-link:hover {
  opacity: 1;
  background: rgba(255, 107, 53, 0.1);
}

.guide-toc-link.active {
  opacity: 1;
  color: #ff6b35;
  font-weight: 600;
}

.guide-content {
  padding: 16px;
  flex: 1;
}

.guide-section {
  margin-bottom: 24px;
  scroll-margin-top: 80px;
  background: var(--card-bg, rgba(255,255,255,0.03));
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: 16px;
  padding: 20px;
}

.guide-section h2 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #ff6b35;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 107, 53, 0.15);
}

.guide-text p {
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
  opacity: 0.9;
  word-break: keep-all;
}

.guide-text br {
  display: block;
  content: '';
  margin-top: 10px;
}

.guide-text strong {
  color: #ff6b35;
  font-weight: 600;
}

/* Desktop: keep mobile layout inside 430px app frame — no sidebar TOC */
```

### `src/app/guide/page.tsx` (104 lines)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { getGuideContent, GuideSection } from '@/lib/guide-content';

export default function GuidePage() {
  const { lang } = useI18n();
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    setSections(getGuideContent(lang));
  }, [lang]);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  };

  const tocTitle = lang === 'ko' ? '📖 가이드 목차' : '📖 Guide';

  return (
    <div className="guide-page">
      {/* Mobile TOC Toggle */}
      <button
        className="guide-toc-toggle"
        onClick={() => setTocOpen(!tocOpen)}
        aria-label="Toggle table of contents"
      >
        <span>{tocTitle}</span>
        <span className={`guide-toc-arrow ${tocOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* TOC */}
      <nav className={`guide-toc ${tocOpen ? 'open' : ''}`}>
        <h2 className="guide-toc-title">{tocTitle}</h2>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <button
                className={`guide-toc-link ${activeId === s.id ? 'active' : ''}`}
                onClick={() => scrollTo(s.id)}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="guide-content">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="guide-section">
            <h2>{s.title}</h2>
            <div className="guide-text">
              {s.content.split('\n').map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                // Bold text
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i}>
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return <span key={j}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
```

### `src/app/layout.tsx` (75 lines)

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { WalletProvider } from '@/providers/wallet-provider';
import { Header } from '@/components/layout/header';
import { TabBar } from '@/components/layout/tab-bar';
import { CookieBanner } from '@/components/layout/cookie-banner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoKR = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-noto-kr', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'DITO.guru — Don\'t Ignore The One you are',
  description: 'Make your fantasy a reality. Find your Ember 🔥',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoKR.variable} font-sans antialiased`}>
        <ThemeProvider>
          <WalletProvider>
          <I18nProvider>
            <div className="app-outer">
              {/* PC Left Side Panel */}
              <div className="pc-side-panel">
                <div className="pc-side-content">
                  <div className="pc-logo">
                    <span className="text-[#ff6b35]">DITO</span>
                    <span className="dark:text-white/80 text-black/60">.guru</span>
                  </div>
                  <p className="pc-slogan"><span className="text-[#ff6b35]">D</span>on&apos;t <span className="text-[#ff6b35]">I</span>gnore <span className="text-[#ff6b35]">T</span>he <span className="text-[#ff6b35]">O</span>ne you are</p>
                  <p className="pc-tagline">Make your fantasy a reality.<br />Find your Ember 🔥</p>

                  <div className="pc-social">
                    <a href="#" className="pc-social-icon" aria-label="Twitter/X">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="#" className="pc-social-icon" aria-label="Discord">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/></svg>
                    </a>
                    <a href="#" className="pc-social-icon" aria-label="Telegram">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                  </div>

                  <p className="pc-copyright">© 2026 DIGI PLANET Inc.</p>
                </div>
              </div>

              <div className="app-frame">
                <Header />
                <main className="app-content">{children}</main>
                <TabBar />
              </div>
            </div>
            <CookieBanner />
          </I18nProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### `src/app/mint/page.tsx` (176 lines)

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { store } from '@/lib/store';

type MintPhase = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'celebration';

export default function MintPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [phase, setPhase] = useState<MintPhase>('idle');
  const [currentTalent, setCurrentTalent] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const profile = store.getProfile();
    setCurrentTalent(profile.currentTalent);
  }, []);

  const handleMint = useCallback(async () => {
    setPhase('stage1');
    await new Promise((r) => setTimeout(r, 1500));
    setPhase('stage2');
    await new Promise((r) => setTimeout(r, 1500));
    setPhase('stage3');
    await new Promise((r) => setTimeout(r, 1500));

    // Save soul
    const profile = store.getProfile();
    const soul = store.getSoul();
    const newSoul = {
      label: soul?.label || currentTalent || 'Ember Soul',
      traits: soul?.traits || [],
      description: soul?.description || '',
      talentLabel: currentTalent || 'Unknown',
      mintDate: new Date().toISOString().split('T')[0],
      stage: profile.emberStage,
    };
    store.addSoul(newSoul);
    store.setProfile({ ...profile, minted: true });

    setPhase('celebration');
    await new Promise((r) => setTimeout(r, 2500));
    router.push('/soul');
  }, [currentTalent, router]);

  const minting = phase !== 'idle' && phase !== 'celebration';
  const celebrating = phase === 'celebration';

  const stageText = (() => {
    switch (phase) {
      case 'stage1': return t('mint.stage1' as never);
      case 'stage2': return t('mint.stage2' as never);
      case 'stage3': return t('mint.stage3' as never);
      default: return '';
    }
  })();

  const progress = (() => {
    switch (phase) {
      case 'stage1': return 25;
      case 'stage2': return 55;
      case 'stage3': return 85;
      case 'celebration': return 100;
      default: return 0;
    }
  })();

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Confetti */}
      {celebrating && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
                fontSize: `${10 + Math.random() * 14}px`,
                color: ['#ff6b35', '#ffd700', '#ff4500', '#ff69b4', '#00ff88'][i % 5],
              }}
            >
              {['✦', '●', '◆', '★', '🔥'][i % 5]}
            </span>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 2s ease-in forwards;
        }
        @keyframes celebratePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }
      `}</style>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#ff6b35]/20 rounded-full blur-[100px]" />
      <div className="relative z-10 text-center max-w-md">
        {/* Orb */}
        <div
          className="relative mx-auto w-32 h-32 mb-8 transition-all duration-700"
          style={celebrating ? { animation: 'celebratePulse 0.8s ease-in-out 3' } : minting ? { transform: `scale(${1 + progress * 0.005})` } : undefined}
        >
          <div className="absolute inset-0 bg-[#ff6b35]/30 rounded-full animate-ping" />
          <div className="absolute inset-4 bg-[#ff6b35]/50 rounded-full animate-pulse" />
          <div className="absolute inset-8 bg-[#ff6b35] rounded-full flex items-center justify-center">
            <span className="text-3xl">🔥</span>
          </div>
        </div>

        {/* Celebration */}
        {celebrating && (
          <div className="mb-6 animate-bounce">
            <p className="text-2xl font-bold text-[#ff6b35]">{t('mint.celebration' as never)}</p>
          </div>
        )}

        {/* Minting progress */}
        {minting && (
          <div className="mb-6 space-y-3">
            <p className="text-lg font-medium text-[#ff6b35] animate-pulse">{stageText}</p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff6b35] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Idle content */}
        {phase === 'idle' && (
          <>
            <h1 className="text-3xl font-bold mb-1">{t('mint.title3')}</h1>
            {currentTalent && (
              <p className="text-[#ff6b35] text-lg font-semibold mb-2">🎯 {currentTalent}</p>
            )}
            <p className="text-sm text-muted-foreground mb-2">{t('mint.desc2')}</p>
            <p className="text-[#ff6b35] text-2xl font-bold mb-4">{t('mint.price')}</p>

            {/* Ember's message */}
            <p className="text-sm italic text-muted-foreground/80 mb-6 leading-relaxed">
              {t('mint.emberMessage' as never)}
            </p>

            <Button
              onClick={handleMint}
              size="lg"
              className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white font-medium rounded-xl mb-4 h-12"
            >
              {t('mint.button3')}
            </Button>
            <button onClick={() => router.push('/chat')} className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
              {t('mint.skip')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### `src/app/page.tsx` (556 lines)

```tsx
'use client';

import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import { store } from '@/lib/store';

/* ───── shared hooks ───── */

function useScrollAnim() {
  const observe = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.15 }
    );
    el.querySelectorAll('.anim-fade-up, .anim-slide-left, .anim-scale-in').forEach((child) => {
      observer.observe(child);
    });
    return () => observer.disconnect();
  }, []);
  return observe;
}

/* ───── Dashboard Sub-components ───── */

const BURNING_FEED = [
  { name: 'MusicLover_92', emoji: '🎵', quote: { en: '2 hours of guitar practice today!', ko: '오늘 기타 연습 2시간!' }, stage: 'burning', streak: 23 },
  { name: 'SilentBrush', emoji: '🎨', quote: { en: 'Finished my first digital drawing', ko: '첫 디지털 드로잉 완성' }, stage: 'sparked', streak: 5 },
  { name: 'CodeNinja', emoji: '🎮', quote: { en: 'Game prototype done!', ko: '게임 프로토타입 완성!' }, stage: 'blazing', streak: 45 },
  { name: 'RunnerHigh', emoji: '🏃', quote: { en: '5K personal best today', ko: '오늘 5K 개인 최고기록' }, stage: 'burning', streak: 12 },
];

const STAGE_BADGES: Record<string, string> = { sparked: '⚡', burning: '🔥', blazing: '🔥🔥' };

const DAILY_CHALLENGES = [
  { en: 'Write down 3 things you\'re naturally good at', ko: '자연스럽게 잘하는 것 3가지 적어보기' },
  { en: 'Spend 30 minutes on your talent without distractions', ko: '30분 동안 방해 없이 재능에 집중하기' },
  { en: 'Teach someone one thing you know well', ko: '잘 아는 것 하나를 누군가에게 가르쳐보기' },
  { en: 'Record a 1-minute video of your progress', ko: '1분짜리 성장 영상 기록하기' },
  { en: 'Find one person doing what you want to do, study them', ko: '하고 싶은 일을 하는 사람 1명 찾아서 연구하기' },
  { en: 'Try your talent in a completely new way', ko: '재능을 완전히 새로운 방식으로 시도하기' },
  { en: 'Write a letter to your future self about your journey', ko: '미래의 나에게 여정에 대한 편지 쓰기' },
];

function BurningNowFeed() {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">🔥 {t('home.burning')}</h2>
      <div className="flex flex-col gap-2">
        {BURNING_FEED.map((user, i) => (
          <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{user.emoji} {user.name}</span>
              <span className="text-xs text-muted-foreground">
                {STAGE_BADGES[user.stage] ?? user.stage} {user.streak}{t('home.streakDays')}
              </span>
            </div>
            <p className="text-sm italic text-muted-foreground">
              &ldquo;{lang === 'ko' ? user.quote.ko : user.quote.en}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodaysChallenge() {
  const { t, lang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    const todayKey = `dito-challenge-${new Date().toISOString().slice(0, 10)}`;
    setDone(localStorage.getItem(todayKey) === '1');
  }, []);

  const dayIndex = mounted ? new Date().getDay() : 0;
  const challenge = DAILY_CHALLENGES[dayIndex];

  const toggleDone = () => {
    const todayKey = `dito-challenge-${new Date().toISOString().slice(0, 10)}`;
    const next = !done;
    setDone(next);
    if (next) localStorage.setItem(todayKey, '1');
    else localStorage.removeItem(todayKey);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">🎯 {t('home.challenge')}</h2>
      <div className="bg-gradient-to-r from-[#ff6b35]/10 to-transparent border border-[#ff6b35]/30 rounded-xl p-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium flex-1">
          {lang === 'ko' ? challenge.ko : challenge.en}
        </p>
        <button
          onClick={toggleDone}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
            done
              ? 'bg-[#ff6b35] text-white border-[#ff6b35]'
              : 'border-[#ff6b35]/50 text-[#ff6b35] hover:bg-[#ff6b35]/10'
          }`}
        >
          {t('home.challengeDone')}
        </button>
      </div>
    </div>
  );
}

/* ───── Dashboard ───── */

function Dashboard() {
  const { t } = useI18n();

  const name = (typeof window !== 'undefined' && localStorage.getItem('dito-name')) || 'Explorer';
  const profile = store.getProfile();
  const currentTalent = profile.currentTalent;
  const souls = store.getSouls();

  // Today's diary check
  const today = new Date().toISOString().slice(0, 10);
  const todayDiary = store.getDiary(today);
  const todayDone = !!todayDiary;

  // Streak calculation
  const diaryDates = store.getDiaryDates();
  const streak = (() => {
    if (diaryDates.length === 0) return 0;
    let count = 0;
    const d = new Date();
    // Check if today has entry; if not, start from yesterday
    const todayStr = d.toISOString().slice(0, 10);
    const dateSet = new Set(diaryDates);
    if (!dateSet.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (dateSet.has(ds)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  })();

  // Weekly activity
  const weekCount = (() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().slice(0, 10);
    return diaryDates.filter((d) => d >= cutoff).length;
  })();

  // Days since discovery (use first diary date as proxy)
  const daysSince = diaryDates.length > 0
    ? Math.floor((Date.now() - new Date(diaryDates[0]).getTime()) / 86400000)
    : 0;

  const stageLabel: Record<string, string> = {
    sparked: '🌱 Sparked',
    burning: '🔥 Burning',
    blazing: '⚡ Blazing',
    radiant: '✨ Radiant',
    eternal: '💎 Eternal',
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto px-4 py-6 flex flex-col gap-4">
      {/* Greeting */}
      <h1 className="text-2xl font-bold">
        👋 {t('home.greeting').replace('{{name}}', name)}
      </h1>

      {/* Current Talent Card */}
      {currentTalent ? (
        <div className="bg-card/50 border-2 border-[#ff6b35]/40 rounded-xl p-4 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t('home.currentTalent')}</p>
          <p className="text-lg font-semibold">🎯 {currentTalent}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{stageLabel[profile.emberStage] ?? profile.emberStage}</span>
            {daysSince > 0 && <span>· {daysSince}d</span>}
          </div>
          <p className={`text-sm ${todayDone ? 'text-green-500' : 'text-muted-foreground'}`}>
            {todayDone ? t('home.todayDone') : t('home.todayPending')}
          </p>
          <Link href="/chat">
            <Button className="w-full mt-1 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-10">
              {t('home.goWrite')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex flex-col gap-2 items-center">
          <p className="text-lg font-semibold">{t('home.noTalent')}</p>
          <Link href="/chat">
            <Button className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl h-10 px-6">
              {t('home.goDiary')}
            </Button>
          </Link>
        </div>
      )}

      {/* Soul Portfolio Mini */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('home.portfolio')}</h2>
          {souls.length > 0 && (
            <Link href="/soul" className="text-sm text-[#ff6b35]">{t('home.seeAll')}</Link>
          )}
        </div>
        {souls.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('home.noSouls')}</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {souls.map((soul, i) => (
              <Link key={i} href="/soul" className="flex-shrink-0">
                <div className="w-20 bg-card/50 border border-border/50 rounded-xl p-2 flex flex-col items-center gap-1 text-center hover:border-[#ff6b35]/30 transition-colors">
                  <span className="text-xl">🔥</span>
                  <span className="text-xs font-medium truncate w-full">{soul.talentLabel}</span>
                  <span className="text-[10px] text-muted-foreground">{stageLabel[soul.stage] ?? soul.stage}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="text-center py-2">
        {streak > 0 ? (
          <p className="text-lg font-bold text-[#ff6b35]">
            {t('home.streak').replace('{{count}}', String(streak))}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('home.noStreak')}</p>
        )}
      </div>

      {/* Weekly Activity */}
      <div className="text-center text-sm text-muted-foreground">
        📊 {t('home.weekActivity').replace('{{count}}', String(weekCount))}
      </div>

      {/* Burning Now Feed */}
      <BurningNowFeed />

      {/* Today's Challenge */}
      <TodaysChallenge />
    </div>
  );
}

/* ───── Landing (original) ───── */

function ChatDemo({ onComplete }: { onComplete?: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const delays = [0, 1200, 2400, 3600, 4400, 5600];
          delays.forEach((d, i) => {
            setTimeout(() => {
              setVisibleCount(i + 1);
              if (i === delays.length - 1) {
                setTimeout(() => onComplete?.(), 600);
              }
            }, d);
          });
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messages = [
    { type: 'ember', text: t('demo.ember1') },
    { type: 'user', text: t('demo.user1') },
    { type: 'ember', text: t('demo.ember2') },
    { type: 'buttons', options: [t('demo.optionA'), t('demo.optionB')] },
    { type: 'ember', text: t('demo.ember3') },
  ];

  return (
    <div ref={ref} className="w-full max-w-sm mx-auto flex flex-col gap-2.5 justify-end" style={{ height: '280px' }}>
      {messages.map((msg, i) => {
        const show = visibleCount > i;
        const showTyping = visibleCount === i && triggered.current;

        if (msg.type === 'buttons') {
          return (
            <div
              key={i}
              className={`flex gap-2 justify-center my-2 transition-all duration-500 ${
                show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {msg.options!.map((opt, j) => (
                <button
                  key={j}
                  className="px-4 py-2 rounded-xl border border-[#ff6b35]/40 text-sm text-[#ff6b35] hover:bg-[#ff6b35]/10 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          );
        }

        const isEmber = msg.type === 'ember';
        return (
          <div key={i} className={`flex ${isEmber ? 'justify-start' : 'justify-end'}`}>
            {showTyping && (
              <div
                className={`chat-bubble ${isEmber ? 'chat-ember' : 'chat-user'} animate-pulse`}
              >
                <span className="tracking-widest">...</span>
              </div>
            )}
            {show && (
              <div
                className={`chat-bubble ${isEmber ? 'chat-ember' : 'chat-user'} demo-msg-enter`}
              >
                {isEmber && <span className="text-[#ff6b35] mr-1">🔥</span>}
                {msg.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScrollArrow({ direction, labelKey }: { direction: 'up' | 'down'; labelKey?: 'scroll.up' | 'scroll.down' | 'scroll.learn' }) {
  const { t } = useI18n();
  const isUp = direction === 'up';
  const label = labelKey ? t(labelKey) : t(isUp ? 'scroll.up' : 'scroll.down');
  return (
    <div className={`absolute ${isUp ? 'top-3' : 'bottom-6'} left-1/2 -translate-x-1/2 z-10 animate-bounce`}>
      <button
        onClick={() => {
          const container = document.querySelector('.snap-container');
          if (container) container.scrollBy({ top: isUp ? -container.clientHeight : container.clientHeight, behavior: 'smooth' });
        }}
        className="flex flex-col items-center gap-1 text-[#ff6b35] hover:text-[#ff8c5a] transition-colors drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]"
      >
        {isUp && (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span className="text-xs font-medium">{label}</span>
          </>
        )}
        {!isUp && (
          <>
            {labelKey === 'scroll.learn' && <span className="text-lg">🔥</span>}
            <span className="text-xs font-medium">{label}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

function Landing() {
  const { t } = useI18n();
  const painRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const setupAnim = useScrollAnim();
  const [demoComplete, setDemoComplete] = useState(false);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    [painRef.current, cardsRef.current].forEach((el) => {
      if (el) {
        const cleanup = setupAnim(el);
        if (cleanup) cleanups.push(cleanup);
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [setupAnim]);

  useEffect(() => {
    const sections = document.querySelectorAll('.snap-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { threshold: 0.2 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="snap-container page-enter">
      {/* Hero Section */}
      <section className="snap-section relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#ff6b35]/20 rounded-full blur-[100px] animate-ember-glow" />
        <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-[#ff6b35]/10 rounded-full blur-[80px] animate-ember-glow" style={{ animationDelay: '1.5s' }} />
        <div className="relative z-10 text-center w-full px-4">
          <h1 className="hero-title text-3xl sm:text-4xl font-bold mb-4 leading-tight whitespace-pre-line">
            {t('hero2.title')}
          </h1>
          <p className="hero-sub text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">
            {t('hero2.sub')}
          </p>
          <p className="hero-hook text-lg sm:text-xl font-semibold mb-8">
            {t('hero2.hook').split(/\{\{|\}\}/).map((part, i) =>
              i % 2 === 1 ? <span key={i} className="text-[#ff6b35]">{part}</span> : <span key={i}>{part}</span>
            )}
          </p>
          <Link href="/connect">
            <Button className="hero-cta cta-pulse btn-interactive bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25 w-full max-w-[280px]">
              {t('hero2.cta')}
            </Button>
          </Link>
        </div>
        <ScrollArrow direction="down" labelKey="scroll.learn" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#ff6b35] rounded-full opacity-60"
              style={{
                left: `${10 + i * 11}%`,
                bottom: '-10px',
                animation: `float-up ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
      </section>

      {/* Pain Points */}
      <section className="snap-section relative" ref={painRef}>
        <ScrollArrow direction="up" />
        <div className="w-full px-2">
          <h2 className="anim-fade-up text-xl font-bold text-center mb-6">{t('pain.title')}</h2>
          <div className="flex flex-col gap-3 mb-6">
            {(['pain.1', 'pain.2', 'pain.3', 'pain.4'] as const).map((key, i) => (
              <div
                key={i}
                className={`anim-slide-left anim-delay-${i + 1} bg-card/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-muted-foreground italic`}
              >
                {t(key)}
              </div>
            ))}
          </div>
          <p className="anim-fade-up anim-delay-5 text-center text-sm text-muted-foreground mb-2 whitespace-pre-line">{t('pain.answer')}</p>
          <p className="anim-scale-in anim-delay-6 text-center text-base font-semibold text-[#ff6b35] mb-6">{t('pain.solution')}</p>
          <div className="anim-fade-up anim-delay-7 text-center">
            <Link href="/connect">
              <Button className="cta-pulse btn-interactive bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25">
                {t('pain.cta')}
              </Button>
            </Link>
          </div>
        </div>
        <ScrollArrow direction="down" />
      </section>

      {/* Demo Chat */}
      <section className="snap-section relative" ref={(el) => { if (el) setupAnim(el); }}>
        <ScrollArrow direction="up" />
        <div className="anim-fade-up anim-delay-1 mt-4">
          <ChatDemo onComplete={() => setDemoComplete(true)} />
        </div>
        <div className={`flex flex-col items-center transition-all duration-700 ${demoComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none invisible'}`}>
          <p className="text-sm text-muted-foreground text-center mt-3">{t('demo.hook')}</p>
          <Link href="/connect" className="mt-3">
            <Button className="cta-pulse btn-interactive bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25">
              {t('demo.cta')}
            </Button>
          </Link>
        </div>
        <ScrollArrow direction="down" />
      </section>

      {/* What is DITO */}
      <section className="snap-section relative" ref={cardsRef}>
        <ScrollArrow direction="up" />
        <h2 className="anim-fade-up text-2xl font-bold text-center mb-6 w-full">{t('what.title')}</h2>
        <div className="flex flex-col gap-4 w-full">
          {(['discover', 'grow', 'prove'] as const).map((key, i) => (
            <div key={key} className={`anim-fade-up anim-delay-${i + 2} bg-card/50 border border-border/50 rounded-xl p-5 transition-colors hover:border-[#ff6b35]/30`}>
              <div className="text-2xl mb-2">{t(`what.${key}.title`).slice(0, 2)}</div>
              <div className="text-lg font-semibold mb-1">{t(`what.${key}.title`).slice(3)}</div>
              <div className="text-sm text-muted-foreground">{t(`what.${key}.desc`)}</div>
            </div>
          ))}
        </div>
        <p className="anim-fade-up anim-delay-5 text-center text-muted-foreground mt-6 text-sm">{t('counter.text')}</p>
        <div className="anim-fade-up anim-delay-6 flex flex-col items-center mt-6 gap-3">
          <p className="text-lg font-bold text-center">{t('closing.title')}</p>
          <Link href="/connect">
            <Button className="cta-pulse btn-interactive bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white text-base px-8 h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25">
              {t('closing.cta')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ───── Page Entry ───── */

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasWallet(!!localStorage.getItem('dito-wallet'));
  }, []);

  if (!mounted) return null;
  if (hasWallet) return <Dashboard />;
  return <Landing />;
}
```

### `src/app/privacy/page.tsx` (158 lines)

```tsx
'use client';

import { useI18n } from '@/providers/i18n-provider';

const content = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: February 16, 2026',
    sections: [
      { heading: '1. Company', body: 'This service ("DITO") is operated by DIGI PLANET Inc...' },
      // ... (full en/ko bilingual privacy policy with 15 sections)
    ],
  },
  ko: { /* ... mirror structure in Korean ... */ },
};

export default function PrivacyPage() {
  const { lang } = useI18n();
  const c = content[lang];
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 page-enter">
      <div className="mb-2" />
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <p className="text-xs text-muted-foreground text-center">{c.lastUpdated}</p>
        {c.sections.map((s, i) => (
          <div key={i} className="bg-card/50 border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">{s.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> **Note:** Privacy and Terms pages contain full bilingual (en/ko) legal content inline. See the complete source in the earlier raw dump above — full content was included in the file structure read. For brevity in this section, the static legal text objects are abbreviated. The actual file contains all 15 privacy sections and 19 terms sections in both languages.

### `src/app/soul/page.tsx` (72 lines)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';
import { useWalletGate } from '@/hooks/useWalletGate';
import { Button } from '@/components/ui/button';
import { store } from '@/lib/store';
import { SoulCard, EmberStage } from '@/lib/types';

const STAGE_LABELS: Record<EmberStage, string> = {
  sparked: '🕯️ Sparked',
  burning: '🔥 Burning',
  blazing: '🔥🔥 Blazing',
  radiant: '✨ Radiant',
  eternal: '💎 Eternal',
};

export default function SoulPage() {
  useWalletGate();
  const router = useRouter();
  const { t } = useI18n();
  const [souls, setSouls] = useState<SoulCard[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSouls(store.getSouls());
  }, []);

  if (!mounted) return null;

  if (souls.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center page-enter">
        <div className="text-6xl mb-6">🔥</div>
        <h2 className="text-xl font-bold mb-2">{t('soul.portfolio')}</h2>
        <p className="text-muted-foreground mb-6">{t('soul.empty2')}</p>
        <Button onClick={() => router.push('/chat')} className="bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl w-full max-w-[280px] h-12">
          {t('soul.goto')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 page-enter">
      <h2 className="text-xl font-bold text-center mb-6">{t('soul.portfolio')}</h2>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {souls.map((soul, idx) => (
          <div key={idx} className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] border border-[#ff6b35]/30 rounded-2xl p-6 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#ff6b35]/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-xs text-[#ff6b35] tracking-widest uppercase mb-1">Ember Soul</div>
              <h3 className="text-lg font-bold text-white mb-1">{soul.talentLabel || soul.label}</h3>
              <div className="text-xs text-gray-400 mb-3">{STAGE_LABELS[soul.stage]} · {soul.mintDate}</div>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {soul.traits.map((trait, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20">
                    {trait}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed italic">{soul.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `src/app/terms/page.tsx` (190 lines)

> Same pattern as privacy/page.tsx — full bilingual (en/ko) terms content with 19 sections inline. See raw source above.

### `src/components/layout/cookie-banner.tsx` (55 lines)

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { t } from '@/lib/i18n';

const CONSENT_KEY = 'dito-cookie-consent';

export function CookieBanner() {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? 'true' : 'false');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <p className="flex-1 text-xs text-muted-foreground text-center sm:text-left">
          🍪 {t(lang, 'cookie.text')}
          {' '}
          <Link href="/privacy" className="underline hover:text-[#ff6b35]">
            {t(lang, 'cookie.learn')}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleConsent(false)}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t(lang, 'cookie.decline')}
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="rounded-xl bg-[#ff6b35] px-4 py-2 text-xs font-medium text-white hover:bg-[#e55a2b] transition-colors"
          >
            {t(lang, 'cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### `src/components/layout/header.tsx` (78 lines)

```tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useI18n } from '@/providers/i18n-provider';
import { useEffect, useState } from 'react';
import { NotificationBell } from './notification-bell';

const PAGE_TITLES: Record<string, { en: string; ko: string }> = {
  '/chat': { en: 'Ember Diary', ko: 'Ember 일기' },
  '/soul': { en: 'Ember Soul', ko: 'Ember Soul' },
  '/guide': { en: 'Guide', ko: '가이드' },
  '/connect': { en: 'Settings', ko: '설정' },
  '/mint': { en: 'Awaken', ko: '각성' },
  '/privacy': { en: 'Privacy', ko: '개인정보' },
  '/terms': { en: 'Terms', ko: '이용약관' },
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const isHome = pathname === '/';
  const mainPages = ['/', '/chat', '/soul', '/guide', '/connect'];
  const isMainPage = mainPages.includes(pathname);
  const pageTitle = PAGE_TITLES[pathname]?.[lang];

  return (
    <header className="app-header">
      <div className="flex items-center w-16">
        {!isMainPage ? (
          <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground px-1 py-1 rounded-lg transition-colors">←</button>
        ) : (
          <div className="w-6" />
        )}
      </div>
      {isHome ? (
        <Link href="/" className="text-lg font-bold">
          <span className="text-[#ff6b35]">DITO</span>
          <span className="text-muted-foreground">.guru</span>
        </Link>
      ) : (
        <span className="text-base font-bold">{pageTitle}</span>
      )}
      <div className="flex items-center gap-1 justify-end">
        <NotificationBell />
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-base px-1 py-1 rounded-lg transition-colors">
          {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌙'}
        </button>
        <button onClick={() => setLang(lang === 'en' ? 'ko' : 'en')} className="text-xs text-muted-foreground hover:text-foreground px-1 py-1 rounded-lg transition-colors">
          {lang === 'en' ? '한' : 'EN'}
        </button>
      </div>
    </header>
  );
}
```

### `src/components/layout/notification-bell.tsx` (214 lines)

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { t } from '@/lib/i18n';

interface Notification {
  id: string;
  type: 'streakReminder' | 'streakCelebration' | 'soulMintReady' | 'decayWarning';
  read: boolean;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateNotifications(): Notification[] {
  const notifications: Notification[] = [];
  const diaryRaw = typeof window !== 'undefined' ? localStorage.getItem('dito-diary') : null;
  let entries: Record<string, unknown> = {};
  if (diaryRaw) { try { entries = JSON.parse(diaryRaw); } catch { /* ignore */ } }
  const entryDates = Object.keys(entries).sort();
  const totalEntries = entryDates.length;
  const today = getToday();
  const hasToday = entryDates.includes(today);
  let streak = 0;
  if (totalEntries > 0) {
    const d = new Date();
    if (!hasToday) d.setDate(d.getDate() - 1);
    while (entryDates.includes(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  }
  const lastDate = entryDates[entryDates.length - 1];
  const daysSinceLast = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : Infinity;
  const soulMinted = typeof window !== 'undefined' && localStorage.getItem('dito-soul-minted') === 'true';
  if (!hasToday) notifications.push({ id: 'streakReminder', type: 'streakReminder', read: false });
  if (streak >= 3) notifications.push({ id: `streakCelebration-${streak}`, type: 'streakCelebration', read: false });
  if (totalEntries >= 10 && !soulMinted) notifications.push({ id: 'soulMintReady', type: 'soulMintReady', read: false });
  if (daysSinceLast >= 5 && totalEntries > 0) notifications.push({ id: 'decayWarning', type: 'decayWarning', read: false });
  return notifications;
}

function getReadState(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { const raw = localStorage.getItem('dito-notifications'); if (raw) return new Set(JSON.parse(raw)); } catch { /* ignore */ }
  return new Set();
}

function saveReadState(ids: Set<string>) {
  localStorage.setItem('dito-notifications', JSON.stringify([...ids]));
}

export function NotificationBell() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generated = generateNotifications();
    const read = getReadState();
    setReadIds(read);
    setNotifications(generated.map(n => ({ ...n, read: read.has(n.id) })));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    const allIds = new Set(readIds);
    notifications.forEach(n => allIds.add(n.id));
    setReadIds(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    saveReadState(allIds);
  }, [notifications, readIds]);

  const getStreakCount = () => {
    const diaryRaw = localStorage.getItem('dito-diary');
    let entries: Record<string, unknown> = {};
    if (diaryRaw) try { entries = JSON.parse(diaryRaw); } catch { /* */ }
    const dates = Object.keys(entries).sort();
    let streak = 0;
    const d = new Date();
    if (!dates.includes(getToday())) d.setDate(d.getDate() - 1);
    while (dates.includes(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  };

  const getText = (n: Notification) => {
    switch (n.type) {
      case 'streakReminder': return t(lang, 'notif.streakReminder');
      case 'streakCelebration': return t(lang, 'notif.streakCelebration').replace('{{count}}', String(getStreakCount()));
      case 'soulMintReady': return t(lang, 'notif.soulMintReady');
      case 'decayWarning': return t(lang, 'notif.decayWarning');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'streakReminder': return '📝';
      case 'streakCelebration': return '🔥';
      case 'soulMintReady': return '✨';
      case 'decayWarning': return '💨';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="text-base px-1 py-1 rounded-lg transition-colors relative" aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#ff6b35] text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center leading-none">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[300px] max-w-[calc(100vw-32px)] bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-semibold">{t(lang, 'notif.title')}</span>
            {unreadCount > 0 && (<button onClick={markAllRead} className="text-xs text-[#ff6b35] hover:underline">{t(lang, 'notif.markAllRead')}</button>)}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{t(lang, 'notif.empty')}</div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 flex items-start gap-3 border-b border-border last:border-b-0 transition-colors ${n.read ? 'opacity-60' : 'bg-[#ff6b35]/5'}`}>
                  <span className="text-lg flex-shrink-0">{getIcon(n.type)}</span>
                  <span className="text-sm leading-snug">{getText(n)}</span>
                  {!n.read && (<span className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-[#ff6b35] mt-1.5" />)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### `src/components/layout/tab-bar.tsx` (45 lines)

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/providers/i18n-provider';

const tabs = [
  { href: '/', icon: '🏠', labelKey: 'tab.home' as const },
  { href: '/chat', icon: '💬', labelKey: 'tab.chat' as const, gated: true },
  { href: '/soul', icon: '🔥', labelKey: 'tab.soul' as const, gated: true },
  { href: '/guide', icon: '📖', labelKey: 'tab.guide' as const },
  { href: '/connect', icon: '⚙️', labelKey: 'tab.settings' as const, gated: true },
];

export function TabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [hasWallet, setHasWallet] = useState(false);
  useEffect(() => { setHasWallet(!!localStorage.getItem('dito-wallet')); }, []);
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const locked = tab.gated && !hasWallet;
        return (
          <Link key={tab.href} href={tab.href} className={`${pathname === tab.href ? 'active' : ''} ${locked ? 'tab-locked' : ''}`}>
            <span className="tab-icon">{tab.icon}{locked && <span className="tab-lock">🔒</span>}</span>
            <span>{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

### `src/components/ui/button.tsx` (64 lines)

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({ className, variant = "default", size = "default", asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (<Comp data-slot="button" data-variant={variant} data-size={size} className={cn(buttonVariants({ variant, size, className }))} {...props} />)
}

export { Button, buttonVariants }
```

### `src/components/ui/input.tsx` (21 lines)

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

### `src/hooks/useWalletGate.ts` (13 lines)

```ts
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWalletGate() {
  const router = useRouter();
  useEffect(() => {
    const wallet = localStorage.getItem('dito-wallet');
    if (!wallet) {
      router.replace('/connect');
    }
  }, [router]);
}
```

### `src/lib/guide-content.ts` (356 lines)

> Full bilingual guide content (en/ko) with 9 sections: What is DITO, How it works, Ember, Ember Soul, Stages, Battles, Proof System, Rules, Lore, FAQ. See complete source in raw dump above.

### `src/lib/i18n.ts` (221 lines)

> Full bilingual translation dictionary with ~100+ keys covering all UI strings. See complete source in raw dump above.

### `src/lib/store.ts` (70 lines)

```ts
import { ChatMessage, UserProfile, SoulCard, DiaryDay } from './types';
import { Lang } from './i18n';

const KEYS = {
  messages: 'dito-messages',
  profile: 'dito-profile',
  soul: 'dito-soul',
  lang: 'dito-lang',
} as const;

const DIARY_PREFIX = 'dito-diary-';

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function set(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getMessages: (): ChatMessage[] => get(KEYS.messages, []),
  setMessages: (m: ChatMessage[]) => set(KEYS.messages, m),
  getProfile: (): UserProfile => get(KEYS.profile, {
    language: 'en' as Lang, emberStage: 'sparked' as const, interests: [],
    challengesCompleted: 0, growthNotes: [], minted: false, discoveryComplete: false, walletConnected: false, souls: [],
  }),
  setProfile: (p: UserProfile) => set(KEYS.profile, p),
  getSoul: (): SoulCard | null => get(KEYS.soul, null),
  getLang: (): Lang => get(KEYS.lang, 'en'),
  setLang: (l: Lang) => set(KEYS.lang, l),
  addSoul: (soul: SoulCard) => {
    const profile = store.getProfile();
    const souls = profile.souls ?? [];
    store.setProfile({ ...profile, souls: [...souls, soul] });
  },
  getSouls: (): SoulCard[] => store.getProfile().souls ?? [],
  getDiary: (date: string): DiaryDay | null => get(`${DIARY_PREFIX}${date}`, null),
  setDiary: (date: string, day: DiaryDay) => set(`${DIARY_PREFIX}${date}`, day),
  getDiaryDates: (): string[] => {
    if (typeof window === 'undefined') return [];
    const dates: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DIARY_PREFIX)) dates.push(key.slice(DIARY_PREFIX.length));
    }
    return dates.sort();
  },
};
```

### `src/lib/types.ts` (59 lines)

```ts
export interface ChatMessage {
  role: 'user' | 'ember';
  content: string;
  choices?: Choice[];
  challenge?: Challenge;
  timestamp: number;
}

export interface Choice {
  id: string;
  text: string;
}

export interface Challenge {
  title: string;
  description: string;
  duration: string;
}

export type EmberStage = 'sparked' | 'burning' | 'blazing' | 'radiant' | 'eternal';

export interface DiaryDay {
  date: string;
  entries: DiaryEntry[];
  summary?: string;
  keywords?: string[];
}

export interface DiaryEntry {
  type: 'user' | 'ember';
  content: string;
  timestamp: number;
  choices?: Choice[];
  challenge?: Challenge;
  image?: string;
}

export interface SoulCard {
  label: string;
  traits: string[];
  description: string;
  talentLabel: string;
  mintDate: string;
  stage: EmberStage;
}

export interface UserProfile {
  name?: string;
  language: 'en' | 'ko';
  emberStage: EmberStage;
  interests: string[];
  challengesCompleted: number;
  growthNotes: string[];
  minted: boolean;
  discoveryComplete?: boolean;
  walletConnected: boolean;
  currentTalent?: string;
  souls?: SoulCard[];
}
```

### `src/lib/utils.ts` (6 lines)

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `src/providers/i18n-provider.tsx` (38 lines)

```tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, t, TranslationKey } from '@/lib/i18n';
import { store } from '@/lib/store';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const Ctx = createContext<I18nCtx>({ lang: 'en', setLang: () => {}, t: (key) => key });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => { setLangState(store.getLang()); }, []);
  const setLang = (l: Lang) => { setLangState(l); store.setLang(l); };
  return (
    <Ctx.Provider value={{ lang, setLang, t: (key) => t(lang, key) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useI18n = () => useContext(Ctx);
```

### `src/providers/theme-provider.tsx` (12 lines)

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
```

### `src/providers/wallet-provider.tsx` (30 lines)

```tsx
'use client';

import { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
```

---

*End of Full Stack Review*