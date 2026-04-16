# DITO Soul

> AI-powered talent discovery platform with Soulbound Tokens on Solana

DITO Soul helps users discover hidden talents through conversations with Ember, an AI coaching agent, and mint them as non-transferable Soulbound Tokens (SBTs) on Solana. Each Soul evolves through five stages with a psychology-based achievement rate system.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│   Gateway    │────▶│   Solana        │
│   Next.js    │     │   Rust       │     │   Anchor (Rust) │
│   React 19   │     │   Actix-web  │     │   Soul SBT      │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│  Gemini AI  │     │  Supabase    │
│  (Ember)    │     │  PostgreSQL  │
└─────────────┘     └──────────────┘
```

## Projects

| Directory | Stack | Description |
|-----------|-------|-------------|
| `anchor/` | Rust, Anchor, Solana | Soul NFT smart contracts — minting, stage evolution, decay, treasury |
| `app/` | Next.js 16, React 19, TypeScript | Frontend with Ember AI chat, wallet integration, Soul minting UI |
| `gateway/` | Rust, Actix-web | Agent-First API gateway — command interface, 2FA, Soul/Talent/Arena APIs |
| `sdk/` | TypeScript | Developer SDK for DITO API integration |

## Key Features

- **Ember AI Coach** — Discover hidden talents through AI-guided conversations (Gemini API)
- **Soulbound Tokens** — Non-transferable NFTs on Solana representing verified talents
- **5-Stage Evolution** — Sparked → Burning → Blazing → Radiant → Eternal
- **Achievement Rate System** — Flexible progression (80-85% over period, not consecutive streaks)
- **$1 USDC Minting** — Conviction-based minting with minimal barrier
- **Agent-First API** — Command interface for AI agent integration
- **Full Rust Backend** — Type-safe gateway with Actix-web

## Quick Start

### Prerequisites

- Rust 1.85+
- Node.js 18+
- Solana CLI
- Anchor CLI 0.31+

### Gateway (Rust)

```bash
cd gateway
cargo run
# Starts on http://localhost:8080
```

### Frontend

```bash
cd app
npm install
npm run dev
# Starts on http://localhost:3000
```

### Smart Contracts

```bash
cd anchor
anchor build
anchor deploy --provider.cluster devnet
```

## Soul Stage Progression

| Transition | Requirement | Period |
|------------|-------------|--------|
| Sparked → Burning | 20/25 days (80%) | ~3-4 weeks |
| Burning → Blazing | 56/70 days (80%) + ID verification | ~9-10 weeks |
| Blazing → Radiant | 95/112 days (85%) | ~14-16 weeks |
| Radiant → Eternal | Authority decision | — |

## API

### Command API

```bash
POST /command
Authorization: Bearer <jwt>

{"action": "get_soul"}
{"action": "get_ember_balance"}
{"action": "help"}
```

### REST API

```
GET  /health
GET  /api/souls
GET  /api/souls/me
POST /api/souls
GET  /api/talents/discover
GET  /api/talents/trending
GET  /api/arena/live
POST /api/arena/join
```

## Environment Variables

Copy `.env.example` and configure:

```bash
# Gateway
DITO_JWT_SECRET=your-secret
PORT=8080

# Frontend
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## License

Apache License 2.0 — See [LICENSE](LICENSE)
