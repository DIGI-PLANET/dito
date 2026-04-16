# DITO Supabase Schema Design

## Tables

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | = wallet address hash |
| wallet_address | text UNIQUE NOT NULL | Solana pubkey |
| display_name | text | nullable |
| avatar_url | text | nullable |
| links | jsonb | {x, discord, telegram} |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### diary_entries
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| user_id | uuid FK → profiles.id | |
| date | date NOT NULL | YYYY-MM-DD |
| role | text NOT NULL | 'user' or 'assistant' |
| content | text NOT NULL | |
| image | text | base64 or storage URL |
| embedding | vector(768) | pgvector, for RAG |
| created_at | timestamptz | default now() |

**Index:** (user_id, date), embedding (ivfflat or hnsw)

### souls
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid FK → profiles.id | |
| talent_label | text NOT NULL | |
| traits | text[] | |
| description | text | |
| stage | text NOT NULL | sparked/burning/blazing/radiant/eternal |
| mint_date | date | |
| proof_hash | text | SHA-256 |
| entries_count | int | default 0 |
| streak | int | default 0 |
| last_activity | timestamptz | for decay calc |
| created_at | timestamptz | |

### discovery_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid FK → profiles.id | |
| status | text | 'active' / 'decided' |
| decided_talent | text | nullable, set when talent locked |
| turn_count | int | default 0 |
| created_at | timestamptz | |

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid FK → profiles.id | |
| type | text | streak_reminder/decay_warning/mint_ready/etc |
| message | text | |
| read | boolean | default false |
| created_at | timestamptz | |

## pgvector Setup
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Embedding model: Gemini text-embedding-004 (768 dimensions, free tier)

## RAG Strategy
- Store embedding for each diary entry
- On new chat: query top-5 similar past entries + full today + last 3 days summaries
- Cosine similarity search via pgvector

## RLS (Row Level Security)
- All tables: users can only read/write their own rows
- Policy: `auth.uid() = user_id` (but we use wallet auth, not Supabase auth)
- Alternative: use service role key server-side, validate wallet signature client-side

## Migration from localStorage
- On first login after DB ready: bulk insert localStorage diary entries
- One-time migration flag in localStorage
