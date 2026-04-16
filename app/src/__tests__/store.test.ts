/**
 * Store Tests — DITO.guru
 * Tests in-memory cache + DB async functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock document.cookie for wallet-cookie
Object.defineProperty(global, 'document', {
  value: { cookie: '' },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('In-memory store (no wallet)', () => {
  it('getProfile returns DEFAULT_PROFILE initially', async () => {
    const { store } = await import('../lib/store');
    const profile = store.getProfile();
    expect(profile.language).toBe('en');
    expect(profile.ember_stage).toBe('sparked');
    expect(profile.walletConnected).toBe(false);
  });

  it('setProfile updates in-memory cache', async () => {
    const { store } = await import('../lib/store');
    store.setProfile({ ...store.getProfile(), name: 'Test' });
    expect(store.getProfile().name).toBe('Test');
  });

  it('setMessages stores in memory', async () => {
    const { store } = await import('../lib/store');
    const msgs = [{ role: 'user' as const, content: 'hi', timestamp: Date.now() }];
    store.setMessages(msgs);
    expect(store.getMessages()).toEqual(msgs);
  });

  it('messages are empty by default', async () => {
    const { store } = await import('../lib/store');
    expect(store.getMessages()).toEqual([]);
  });
});

describe('DB async functions', () => {
  it('getProfileAsync calls /api/profile', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ display_name: 'Test', language: 'ko', ember_stage: 'burning' }),
    });

    const { store } = await import('../lib/store');
    const profile = await store.getProfileAsync();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/profile?'));
    expect(profile.walletConnected).toBe(true);
    expect(profile.language).toBe('ko');
  });

  it('getDiaryAsync returns null when no wallet', async () => {
    const { store } = await import('../lib/store');
    const result = await store.getDiaryAsync('2026-02-21');
    expect(result).toBeNull();
  });

  it('getSoulsAsync returns empty array when no wallet', async () => {
    const { store } = await import('../lib/store');
    const souls = await store.getSoulsAsync();
    expect(souls).toEqual([]);
  });

  it('getSoulsAsync calls /api/souls', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ souls: [{ label: 'Test', traits: ['a'], description: 'desc', talent_label: 'tl', mint_date: '2026-01-01', stage: 'sparked' }] }),
    });

    const { store } = await import('../lib/store');
    const souls = await store.getSoulsAsync();
    expect(souls.length).toBe(1);
    expect(souls[0].label).toBe('Test');
  });

  it('falls back to default when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

    const { store } = await import('../lib/store');
    const profile = await store.getProfileAsync();
    expect(profile.language).toBe('en');
  });
});
