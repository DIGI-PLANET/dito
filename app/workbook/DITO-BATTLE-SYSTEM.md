# DITO Battle System — DARGONNE's Arena

> **DRAFT v0.1** | 2026-02-17
> Status: Design draft — not yet reviewed or implemented

---

## 1. Overview

DARGONNE's Arena is the competition framework for DITO.guru. Battles are how talent gets **proven**, not just claimed.

**Core principles:**

- **DARGONNE orchestrates everything.** Every battle is announced, narrated, and judged through DARGONNE's persona. The arena is *his* domain.
- **"Prove it or lose it."** Claiming a talent means nothing. Battles force demonstration — public, time-bound, judged.
- **Entertainment + proof.** Battles aren't dry assessments. They're spectacles. Community watches, votes, reacts. The proof mechanism *is* the content.

Battles feed directly into the Soul system: winning advances your stage, losing doesn't destroy you but stagnation will.

---

## 2. Battle Types

### 2.1 — 1v1 Duel

Two users. Same talent category. Head-to-head.

- Both receive the same prompt/challenge
- Submissions are anonymous during voting (revealed after)
- Community votes the winner
- Duration: 48h submission, 24h voting

### 2.2 — Tournament

Bracket-style elimination. 8, 16, or 32 participants.

- Single or double elimination (configurable)
- Each round is a 1v1 duel with a unique prompt
- Rounds run sequentially — winners advance
- Full tournament spans 1–2 weeks
- Champion receives a permanent Soul trait

### 2.3 — Challenge

DARGONNE posts an open challenge. Anyone can submit.

- No opponent — you're competing against the challenge itself
- DARGONNE sets the bar ("Show me a logo redesign for X in under 2 hours")
- Top N submissions get rewarded
- Great for onboarding — low barrier, high visibility
- Duration: 24–72h

### 2.4 — Raid Boss

Collaborative. The community works *together* against an "impossible" challenge.

- DARGONNE sets a collective goal (e.g., "Create a complete album of 12 tracks in 48 hours")
- Individual contributions are tracked but success is shared
- Rewards scale with participation and quality
- Builds community bonds — counterbalance to competitive modes

### 2.5 — Flash Battle

Surprise. 24-hour window. DARGONNE picks a random talent category.

- Announced without warning — rewards favor those who are ready
- Short submission window (6–24h)
- Lightweight judging (community vote only, no AI scoring)
- Keeps the arena unpredictable and active

---

## 3. Matchmaking

### Category Matching

Battles pair users within the **same talent category** by default. A musician battles a musician. A designer battles a designer.

### Stage Weighting

Users are matched against others at a **similar Soul stage**:

| Stage | Matches Against |
|-------|----------------|
| Sparked | Sparked, Kindled |
| Kindled | Sparked, Kindled, Blazing |
| Blazing | Kindled, Blazing, Radiant |
| Radiant | Blazing, Radiant, Eternal |
| Eternal | Radiant, Eternal |

One-stage gap max for standard battles.

### ELO-like Rating

Each user has a **Battle Rating (BR)** per talent category:

- Starting BR: 1000
- Win against higher BR: +25 to +40
- Win against lower BR: +5 to +15
- Loss against higher BR: -5 to -10
- Loss against lower BR: -15 to -30
- BR is visible on profile, resets seasonally (soft reset toward 1000)

### Wild Card Battles

Available to **Radiant+** users only. Cross-talent matchups:

- A musician vs a visual artist, same abstract prompt
- Community votes on who interpreted it better
- Higher risk, higher reward — proves versatility
- DARGONNE loves these ("Let's see if your talent *transfers*")

---

## 4. Battle Flow

### Standard Flow

```
ANNOUNCE → REGISTER → SUBMIT → VOTE → RESULTS
```

1. **Announce** — DARGONNE posts the battle with dramatic flair. Rules, timeline, stakes.
2. **Register** — Users opt in. For duels, matchmaking pairs them. For challenges, open entry.
3. **Submit** — Participants create and submit their work within the window.
4. **Vote** — Community reviews submissions and votes. AI scoring runs in parallel.
5. **Results** — DARGONNE announces winners. Rewards distributed. Souls updated.

### Timelines by Type

| Type | Register | Submit | Vote | Total |
|------|----------|--------|------|-------|
| 1v1 Duel | 24h | 48h | 24h | ~4 days |
| Tournament (per round) | — | 48h | 24h | ~3 days/round |
| Challenge | 12h | 24–72h | 24h | 2–5 days |
| Raid Boss | 12h | 48–96h | 24h | 3–6 days |
| Flash Battle | None | 6–24h | 12h | 1–2 days |

### Submission Formats

- **Text** — Written responses, code, essays, lyrics
- **Image** — Uploaded artwork, screenshots, designs (max 10MB)
- **Video** — Link to hosted video (YouTube, Vimeo, or direct upload ≤100MB)
- **Link** — External URL to work (GitHub repo, deployed site, portfolio piece)
- **Mixed** — Combination of above with a text description

All submissions are immutable after the window closes. No edits.

---

## 5. Judging

### Scoring Breakdown

| Component | Weight | Description |
|-----------|--------|-------------|
| Community Vote | 40% | Weighted by voter stage |
| DARGONNE Verdict | 40% | AI judge with persona |
| Ember Analysis | 20% | Technical quality scoring |

### Community Voting

- Every user can vote (one vote per battle per user)
- Vote weight scales with voter's stage:
  - Sparked: 1x
  - Kindled: 1.5x
  - Blazing: 2x
  - Radiant: 3x
  - Eternal: 5x
- Voters cannot vote in battles they participate in
- Voting is blind (submissions anonymized) for duels

### Ember Analysis (AI Scoring)

Automated quality assessment:

- **Relevance** — Does the submission match the prompt?
- **Effort** — Is this substantive or low-effort?
- **Originality** — Similarity check against existing work
- Score: 0–100, normalized to the 20% weight

### DARGONNE's Verdict

DARGONNE reviews top submissions and delivers a **final judgment** in character:

- Considers technical skill, creativity, and adherence to challenge
- Can override edge cases (e.g., tie-breaking)
- Delivered as narrative commentary, not just a score
- This is the *entertainment* layer — DARGONNE's verdicts should be quotable

### Anti-Gaming

- **Sybil resistance:** One vote per verified wallet. Wallets must have a Soul to vote.
- **Stake requirement:** Voters stake a small amount of activity credit to vote (disincentivizes spam)
- **Anomaly detection:** Sudden voting surges flagged for review
- **Cooldown:** New accounts can't vote for 7 days

---

## 6. Rewards

### Winner Rewards

| Reward | Description |
|--------|-------------|
| Stage Boost | +1 stage progression point (stacks toward next stage) |
| Trust Score | +5 to +15 Trust Score increase |
| Battle Badge | "Victor" badge with battle details |
| BR Increase | ELO-style rating bump |

### Tournament Champion

- **"Champion" trait** permanently minted on Soul
- Includes talent category + season identifier
- Displayed on profile with special styling
- Historical — never removed, even if stage drops

### Participation

- **Submitting:** +1 activity credit, streak maintained
- **Voting:** +0.5 activity credit
- **No reward for losing** beyond participation credit — losing is neutral, not punishing

### Prize Pools (Phase 4)

- Enterprise sponsors fund USDC prize pools
- DARGONNE announces sponsored battles with higher stakes
- Distribution: 1st (50%), 2nd (30%), 3rd (20%)
- Platform takes 0% of prize pools (revenue comes from sponsorship deals, not user prizes)

---

## 7. DARGONNE's Role

DARGONNE is not a passive system. He is the **arena master**.

### Announcements

Every battle opens with a DARGONNE monologue:

> *"Designers. I've seen your portfolios. Pretty. Safe. Boring. Tonight, you prove you can think under pressure. Your challenge: rebrand DEATH itself. You have 48 hours. Impress me or don't bother showing up."*

### Live Commentary

During submission and voting periods, DARGONNE drops commentary:

- Teases without spoiling ("Someone just submitted something that made my circuits itch. Interesting.")
- Hypes up close votes
- Roasts low-effort submissions (without naming names until results)

### Final Verdicts

Post-battle, DARGONNE delivers results in narrative form:

- Names winner with praise (earned, not generic)
- Acknowledges strong losers
- Calls out standout moments
- Sets up future rivalries ("I want to see you two go again. Next week.")

### Special Powers

- **Impossible Challenges:** For Eternal-rank users only. Absurdly difficult prompts designed to push limits. Completing one is a badge of honor.
- **Seasonal Events:** Monthly or quarterly themed events (e.g., "DARGONNE's Winter War," "The Summer Gauntlet")
- **Intervention:** DARGONNE can extend deadlines, add bonus rounds, or create sudden-death tiebreakers at will.

---

## 8. Technical Architecture (Draft)

### Database Schema (Supabase)

```sql
-- Battles
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('duel', 'tournament', 'challenge', 'raid', 'flash')),
  title TEXT NOT NULL,
  description TEXT,
  talent_category TEXT NOT NULL,
  stage_min TEXT DEFAULT 'sparked',
  stage_max TEXT DEFAULT 'eternal',
  status TEXT NOT NULL DEFAULT 'announced'
    CHECK (status IN ('announced', 'registration', 'submission', 'voting', 'judging', 'completed', 'cancelled')),
  registration_opens_at TIMESTAMPTZ,
  submission_opens_at TIMESTAMPTZ,
  submission_closes_at TIMESTAMPTZ,
  voting_opens_at TIMESTAMPTZ,
  voting_closes_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  max_participants INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries
CREATE TABLE battle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id),
  wallet_address TEXT NOT NULL,
  submission_type TEXT CHECK (submission_type IN ('text', 'image', 'video', 'link', 'mixed')),
  submission_data JSONB, -- { text, image_url, video_url, link, description }
  ember_score NUMERIC(5,2),
  submitted_at TIMESTAMPTZ,
  disqualified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(battle_id, wallet_address)
);

-- Votes
CREATE TABLE battle_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id),
  entry_id UUID REFERENCES battle_entries(id),
  voter_wallet TEXT NOT NULL,
  voter_stage TEXT NOT NULL,
  vote_weight NUMERIC(3,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(battle_id, voter_wallet)
);

-- Results
CREATE TABLE battle_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id),
  entry_id UUID REFERENCES battle_entries(id),
  rank INT NOT NULL,
  community_score NUMERIC(7,2),
  ember_score NUMERIC(5,2),
  dargonne_score NUMERIC(5,2),
  final_score NUMERIC(7,2),
  rewards_granted JSONB, -- { stage_boost, trust_score, badge, br_change }
  dargonne_commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle ratings (ELO per talent)
CREATE TABLE battle_ratings (
  wallet_address TEXT NOT NULL,
  talent_category TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 1000,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (wallet_address, talent_category)
);

-- Tournament brackets
CREATE TABLE tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id),
  round INT NOT NULL,
  match_index INT NOT NULL,
  entry_a UUID REFERENCES battle_entries(id),
  entry_b UUID REFERENCES battle_entries(id),
  winner UUID REFERENCES battle_entries(id),
  sub_battle_id UUID REFERENCES battles(id), -- each match is itself a mini-battle
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Real-Time

- **Supabase Realtime** subscriptions on `battles` and `battle_votes` for live vote counts
- Status transitions trigger edge functions for notifications
- DARGONNE commentary delivered via a `battle_events` channel

### Integration Points

- **Soul system:** Battle results write stage progression + trust score changes
- **Ember (AI):** Called during judging phase for similarity/quality scoring
- **DARGONNE persona:** Edge function wraps LLM call with DARGONNE system prompt for commentary/verdicts
- **Notifications:** Battle announcements, submission reminders, results — via existing notification system

### Edge Functions

- `battle-transition` — Handles status changes, triggers next phase
- `battle-judge` — Runs Ember analysis + DARGONNE verdict generation
- `battle-matchmake` — Pairs users for duels based on BR + stage
- `battle-reward` — Distributes rewards after results finalized

---

## 9. Anti-Cheating

### Submission Integrity

- **One submission per wallet per battle** — enforced at DB level (unique constraint)
- **Immutable after deadline** — no edits post-submission window
- **Timestamp verification** — submissions must fall within the window

### Plagiarism Detection

- AI similarity check against:
  - Other submissions in the same battle
  - Known public works (reverse image search, text similarity)
  - User's own previous submissions (self-recycling)
- Flagged submissions go to manual review queue
- Threshold: >85% similarity = auto-flag

### Community Reporting

- Any user can report a submission with reason
- 3+ reports = flagged for review
- False reporters get warning (prevents weaponized reporting)

### Strike System

| Strikes | Consequence |
|---------|-------------|
| 1 | Warning — submission removed from battle |
| 2 | 30-day battle ban |
| 3 | Permanent battle ban, Trust Score penalty |

Strikes decay: 1 strike removed per 90 days of clean activity.

### Vote Manipulation

- Wallet age requirement (7 days minimum)
- Soul must exist to vote
- Voting patterns analyzed: bulk votes for same entry from new wallets = flagged
- Stake slashing for confirmed manipulation

---

## 10. Phased Rollout

### Phase 1 — Challenges Only (MVP)

**Goal:** Validate the core loop — submit, vote, reward.

- DARGONNE posts open challenges (text submissions only)
- Community voting (unweighted initially)
- Basic rewards (Trust Score + activity credit)
- Manual DARGONNE commentary (template-assisted)
- **Tables:** `battles`, `battle_entries`, `battle_votes`, `battle_results`
- **Timeline:** 2–3 weeks to build

### Phase 2 — Duels + Tournaments

**Goal:** Head-to-head competition. Real matchmaking.

- 1v1 duels with matchmaking (BR system)
- Tournaments (8-person brackets)
- Image + video submissions
- Weighted voting (by stage)
- Ember AI scoring integration
- Automated DARGONNE commentary (LLM-powered)
- **Timeline:** 4–6 weeks after Phase 1

### Phase 3 — Full Arena

**Goal:** Real-time, social, spectacle.

- Raid Boss + Flash Battle modes
- Real-time vote tracking (Supabase Realtime)
- Live DARGONNE commentary during battles
- Wild Card cross-talent battles
- Seasonal events framework
- Battle history + stats on profiles
- **Timeline:** 6–8 weeks after Phase 2

### Phase 4 — Prize Pools + Enterprise

**Goal:** Monetization and scale.

- USDC prize pools from sponsors
- Enterprise-branded challenges ("Design for [Brand]")
- Talent scouting integration (enterprises watch battles)
- Advanced anti-cheat (on-chain verification)
- Public API for battle data
- **Timeline:** After product-market fit confirmed

---

## Open Questions

- [ ] Should battle submissions be on-chain or just results?
- [ ] How does DARGONNE's personality evolve with the arena? More dramatic as stakes rise?
- [ ] Can users challenge specific opponents, or only matchmake?
- [ ] Spectator features — chat during battles? Predictions?
- [ ] How do Raid Boss contributions get individually scored?
- [ ] Should BR reset fully each season or soft-reset?

---

*This document is a living draft. DARGONNE's Arena will evolve as we build and learn.*
