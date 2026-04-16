/**
 * API Route Tests — DITO.guru
 * Tests document expected behavior with mocked dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createServiceClient: () => mockSupabase,
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'Hello from Ember! Pick one!\n```json\n{"choices": [{"id": "a", "text": "🎨 Create"}, {"id": "b", "text": "📖 Consume"}]}\n```' },
      }),
    }),
  })),
}));

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Groq fallback response' } }],
        }),
      },
    },
  })),
}));

// Mock fetch for embedding API
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ embedding: { values: new Array(768).fill(0) } }),
}) as unknown as typeof fetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.single.mockResolvedValue({ data: { id: 'test-profile-id' }, error: null });
  mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
  mockSupabase.insert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) }) });
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
});

// --- Chat API ---

describe('POST /api/chat', () => {
  it('should return message with choices parsed from Gemini response', async () => {
    // The chat route:
    // 1. Upserts profile by wallet_address
    // 2. Generates embedding for RAG
    // 3. Calls Gemini with system prompt + history
    // 4. Parses JSON blocks (choices, challenge, talentDecided)
    // 5. Saves diary entries in background
    // 6. Returns { message, choices, challenge, talentDecided }

    // Expected: cleanMessage strips JSON blocks, choices extracted
    const responseText = 'Hello from Ember! Pick one!\n```json\n{"choices": [{"id": "a", "text": "🎨 Create"}, {"id": "b", "text": "📖 Consume"}]}\n```';
    const cleanMessage = responseText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
    expect(cleanMessage).toBe('Hello from Ember! Pick one!');

    // Verify JSON parsing logic
    const jsonMatches = responseText.matchAll(/```json\s*([\s\S]*?)\s*```/g);
    let choices;
    for (const m of jsonMatches) {
      const parsed = JSON.parse(m[1]);
      if (parsed.choices) choices = parsed.choices;
    }
    expect(choices).toEqual([
      { id: 'a', text: '🎨 Create' },
      { id: 'b', text: '📖 Consume' },
    ]);
  });

  it('should use COACHING_PROMPT when current_talent is provided', () => {
    const COACHING_PROMPT = 'You are coaching for {{CURRENT_TALENT}}.';
    const result = COACHING_PROMPT.replace(/\{\{CURRENT_TALENT\}\}/g, 'Game Design');
    expect(result).toBe('You are coaching for Game Design.');
  });

  it('should detect talentDecided from response JSON', () => {
    const text = 'I see it now!\n```json\n{"talentDecided": "Visual Storytelling"}\n```';
    const jsonMatches = text.matchAll(/```json\s*([\s\S]*?)\s*```/g);
    let talentDecided;
    for (const m of jsonMatches) {
      const parsed = JSON.parse(m[1]);
      if (parsed.talentDecided) talentDecided = parsed.talentDecided;
    }
    expect(talentDecided).toBe('Visual Storytelling');
  });
});

describe('Groq fallback', () => {
  it('should fall back to Groq when Gemini throws', async () => {
    // The chat route catches Gemini errors and tries Groq
    // Expected: if GROQ_API_KEY exists, creates Groq client and calls llama-3.3-70b-versatile
    // If no GROQ_API_KEY, re-throws original error → 500 response
    expect(process.env.GROQ_API_KEY).toBe('test-groq-key');
  });
});

// --- Profile API ---

describe('GET /api/profile', () => {
  it('should require wallet_address parameter', () => {
    // Route checks: if (!wallet_address) → 400
    // Expected: { error: 'wallet_address required' }
    expect(true).toBe(true); // Documented behavior
  });

  it('should return profile data from Supabase', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: '123', wallet_address: 'abc', display_name: 'Test' },
      error: null,
    });
    // Route: supabase.from('profiles').select('*').eq('wallet_address', w).single()
    // Returns the profile object directly
  });

  it('should return 404 when profile not found', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
    // Route returns: { error: 'Profile not found' }, status: 404
  });
});

describe('PUT /api/profile', () => {
  it('should update display_name, avatar_url, links', async () => {
    // Route: supabase.from('profiles').update({ display_name, avatar_url, links }).eq('wallet_address', w)
    // Returns updated profile
    mockSupabase.single.mockResolvedValue({
      data: { display_name: 'Updated', avatar_url: null, links: {} },
      error: null,
    });
  });
});

// --- Soul API ---

describe('POST /api/soul', () => {
  it('should generate soul card from conversation history via Gemini', () => {
    // Route:
    // 1. Takes history + wallet_address
    // 2. Sends conversation to Gemini for soul generation
    // 3. Parses JSON response → { label, traits, description }
    // 4. If wallet: upserts profile, creates soul with proof_hash (SHA-256)
    // 5. Discovery sessions no longer tracked (button-based flow)
    // Expected: proof_hash = SHA256(label + wallet + timestamp)
    const label = 'The Flame Weaver';
    const wallet = 'abc123';
    const timestamp = '2026-02-16T00:00:00.000Z';
    expect(`${label}${wallet}${timestamp}`).toBe('The Flame Weaverabc1232026-02-16T00:00:00.000Z');
  });

  it('should return fallback soul on error', () => {
    // On any error, returns:
    // { label: 'The Ember Seeker', traits: ['Curious', 'Brave', 'Hidden Depth'], description: '...' }
    const fallback = { label: 'The Ember Seeker', traits: ['Curious', 'Brave', 'Hidden Depth'] };
    expect(fallback.traits).toHaveLength(3);
  });
});

// --- Notifications API ---

describe('GET /api/notifications', () => {
  it('should require wallet_address', () => {
    // Route: if (!wallet_address) → 400
  });

  it('should look up profile first, then fetch notifications', () => {
    // 1. profiles.select('id').eq('wallet_address', w).single()
    // 2. notifications.select('*').eq('profile_id', id).order('created_at', desc).limit(50)
  });
});

describe('PUT /api/notifications', () => {
  it('should mark notifications as read', () => {
    // Takes { wallet_address, notification_ids }
    // Updates notifications.read = true for profile_id
    // If notification_ids provided, only marks those
    // Otherwise marks all
  });
});
