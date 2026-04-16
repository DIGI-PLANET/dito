# DITO Guru Refactor + Security Audit Report
Date: 2026-02-19

## 1) Refactoring Changes (No Functional/UI Behavior Change)

### Files modified
- `src/lib/auth.ts`
  - Added `getWalletParam()` helper to remove repeated wallet query extraction logic.
  - Added `sanitizeHistory()` helper to remove duplicated chat/soul history sanitization logic.
  - Updated `authenticateGet()` to use shared wallet param helper.
- `src/app/api/chat/route.ts`
  - Replaced inline history sanitization with shared `sanitizeHistory()` helper.
- `src/app/api/soul/route.ts`
  - Replaced inline history sanitization with shared `sanitizeHistory()` helper.
  - Removed now-unused imports.
- `src/app/api/profile/route.ts`
  - Replaced duplicated wallet query extraction with `getWalletParam()`.
- `src/app/api/diary/route.ts`
  - Replaced duplicated wallet query extraction with `getWalletParam()`.
- `src/app/api/diary/dates/route.ts`
  - Replaced duplicated wallet query extraction with `getWalletParam()`.
- `src/app/api/notifications/route.ts`
  - Replaced duplicated wallet query extraction with `getWalletParam()`.
- `src/app/api/mint/route.ts`
  - Removed unused `USDC_DECIMALS` constant.
- `src/app/api/souls/route.ts`
  - Removed unused POST arg and obsolete lint suppression comment.
- `src/middleware.ts`
  - Deleted redundant duplicate middleware file (root `middleware.ts` remains active).

## 2) Security Findings

| Severity | Issue | File | Status | Fix |
|---|---|---|---|---|
| **CRITICAL** | Payment verification is not bound to the authenticated payer wallet; a valid third-party payment tx can potentially be reused by another wallet before tx is marked used. | `src/app/api/mint/route.ts:26` | Open | In `verifyPaymentTx`, verify transfer source owner (or signer set) maps to `payerWallet`, and enforce DB uniqueness + atomic insert/check transaction for `tx_signature`. |
| **HIGH** | Soul card endpoint allows unauthenticated lookup by `id` or `wallet`, exposing draft soul metadata that may not be intended public. | `src/app/api/soul/card/route.tsx:53` | Open | Require auth for draft records, and only allow public access for minted/public souls; validate query params and return 404 on unauthorized access. |
| **MEDIUM** | Wallet auth permits replay inside 5-minute window (timestamp-only freshness, no nonce/jti tracking). | `src/lib/auth.ts:79` | Open | Add one-time nonce challenge (server-issued), store nonce/jti with short TTL, reject replays after first use. |
| **MEDIUM** | Chat route trusts client-supplied conversation history (including assistant-role content), enabling context poisoning/prompt-injection amplification. | `src/app/api/chat/route.ts:399` | Open | Build authoritative history server-side from DB for authenticated users; for anonymous users, restrict role to `user` only and cap history more aggressively. |
| **MEDIUM** | AI JSON output in soul generation is parsed and written to DB without strict schema validation/length checks for label/traits/description. | `src/app/api/soul/route.ts:45` | Open | Enforce schema and length limits before insert (e.g., zod); coerce/trim and reject invalid structures. |
| **LOW** | `/api/session` has no route-specific limiter, relying only on coarse middleware limits. | `src/app/api/session/route.ts:4` | Open | Add explicit `checkRateLimit('/api/session', ...)` rule with stricter threshold. |
| **LOW** | CSP allows `'unsafe-inline'` for scripts, weakening XSS containment. | `next.config.ts:15` | Open | Move to nonce/hash-based CSP and remove `'unsafe-inline'` from `script-src`. |

## 3) Remaining Issues Requiring Manual Attention

- Implement and test wallet-bound payment verification in mint flow (critical business/security control).
- Decide intended privacy model for soul cards (draft/private vs minted/public) and enforce at route level.
- Introduce nonce-based wallet auth to eliminate replay risk.
- Harden AI endpoints with strict output schemas and server-authoritative context.
- Revisit CSP strategy to phase out inline scripts.

## Additional audit checks completed

- **API input validation/auth/injection/rate limiting:** reviewed all routes in `src/app/api/`.
- **Middleware/proxy headers:** verified HSTS, X-Frame-Options, and CSP are configured in `next.config.ts`.
- **Hardcoded secrets:** no hardcoded credentials found in source files reviewed.
- **Supabase service-role usage:** currently used server-side route code; no direct client import path found in usage scan. Still recommended to split server/client Supabase modules for stronger guardrails.
- **Wallet auth:** ed25519 verification is implemented via `tweetnacl` + `PublicKey` checks.
- **XSS review:** no direct `dangerouslySetInnerHTML` usage found; primary residual risk is CSP permissiveness.
- **Prompt injection defenses:** basic regex sanitization + system footer exists, but can be bypassed; stronger structural defenses needed.
