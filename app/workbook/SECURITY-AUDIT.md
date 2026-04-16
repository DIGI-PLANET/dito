# DITO.guru Security Audit — 2026-02-16

## Summary

| Category | Status | Severity |
|----------|--------|----------|
| API Key Exposure | ✅ Safe | — |
| SQL Injection | ✅ Safe (Supabase SDK) | — |
| XSS | ⚠️ Low risk | Low |
| Auth Bypass | 🔴 **Vulnerable** | High |
| RLS Policies | 🔴 **Misconfigured** | High |
| Input Validation | ⚠️ Incomplete | Medium |
| Rate Limiting | ⚠️ Missing | Medium (MVP ok) |
| Secrets in Repo | ✅ Safe | — |
| Schema Mismatches | 🔴 **Breaking** | High |

---

## 1. API Key Exposure — ✅ Safe

- `GEMINI_API_KEY`: Used only in server-side API routes (`/api/chat/route.ts`, `/api/soul/route.ts`). Never exposed to client.
- `GROQ_API_KEY`: Used only in `/api/chat/route.ts` server-side. Never exposed to client.
- `SUPABASE_SERVICE_ROLE_KEY`: Used only in `createServiceClient()` server-side. Never exposed to client.
- `.env*` is in `.gitignore` ✅
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public by design (Supabase client-side pattern).

**Note:** The embedding API call in `/api/chat/route.ts` passes `GEMINI_API_KEY` as a URL parameter (`?key=${process.env.GEMINI_API_KEY}`). This is Google's standard pattern for embedding API but means the key appears in server-side request URLs (logged by proxies/CDNs). Low risk for server-to-server but worth noting.

## 2. SQL Injection — ✅ Safe

All database queries use the Supabase SDK with parameterized queries. No raw SQL is executed from user input. The `match_diary_entries` RPC function uses parameterized PL/pgSQL.

## 3. XSS — ⚠️ Low Risk

- React auto-escapes JSX content by default.
- Diary content and chat messages are rendered as text, not `dangerouslySetInnerHTML`.
- **No HTML sanitization** is applied to stored content, but React's rendering handles this.
- **Recommendation:** If markdown rendering is ever added, use a sanitizer.

## 4. Auth Bypass — 🔴 VULNERABLE

**Critical: No authentication whatsoever.** All API routes accept `wallet_address` as a plain string parameter. Anyone can:

1. Call `GET /api/profile?wallet_address=<any_wallet>` to read anyone's profile
2. Call `PUT /api/profile` with any `wallet_address` to modify anyone's profile
3. Call `POST /api/chat` with any `wallet_address` to chat as anyone and pollute their diary
4. Call `GET /api/notifications?wallet_address=<any>` to read anyone's notifications
5. Call `GET /api/diary?wallet=<any>` to read anyone's diary

**There is no wallet signature verification.** The `wallet_address` parameter is trusted blindly.

### Recommendation (MVP)
At minimum, verify wallet ownership by requiring a signed message. For MVP, consider:
- Requiring a session token derived from wallet signature
- Or at least adding a simple API key header for client requests

## 5. RLS Policies — 🔴 MISCONFIGURED

All RLS policies in `schema.sql` are:
```sql
CREATE POLICY "Service role full access" ON <table> FOR ALL USING (true) WITH CHECK (true);
```

This means **anyone with the anon key can read/write all data**. The `supabase` client (anon key) is exported from `supabase.ts` and available client-side.

While API routes use `createServiceClient()` (service role), the anon key client could be imported and used directly from client code, bypassing all API routes.

### Recommendation
Add proper per-user RLS policies:
```sql
CREATE POLICY "Users read own data" ON profiles FOR SELECT USING (wallet_address = current_setting('app.wallet_address'));
```
Or restrict anon key access entirely and keep service-role-only pattern (current approach is fine if anon client is never used client-side for data access).

## 6. Input Validation — ⚠️ Incomplete

| Route | wallet_address format check | Content length limit | Other |
|-------|---------------------------|---------------------|-------|
| POST /api/chat | ❌ No | ❌ No (message can be unlimited) | ❌ No history size limit |
| GET /api/profile | ❌ No | N/A | |
| PUT /api/profile | ❌ No | ❌ No display_name limit | |
| POST /api/soul | ❌ No | ❌ No history limit | |
| GET /api/notifications | ❌ No | N/A | |
| PUT /api/notifications | ❌ No | N/A | |
| POST /api/diary | ❌ No | ❌ No content limit | |

### Recommendations
- Validate `wallet_address` is a valid Solana base58 address (32-44 chars)
- Limit message content to 10,000 chars
- Limit chat history to 50 messages
- Limit display_name to 100 chars

## 7. Rate Limiting — ⚠️ Missing (MVP acceptable)

No rate limiting on any endpoint. The `/api/chat` route makes external API calls (Gemini/Groq) per request, which could be abused.

### Recommendation for post-MVP
- Add rate limiting via middleware (e.g., `next-rate-limit` or Vercel edge config)
- Especially important for `/api/chat` (AI API costs) and `/api/soul` (AI API costs)

## 8. Secrets in Repo — ✅ Safe

`.gitignore` includes `.env*` which covers `.env.local`, `.env.production`, etc.

---

## 9. Schema Mismatches — 🔴 BREAKING

**Critical inconsistencies between schema.sql and API route code:**

| Issue | Schema (SQL) | API Code |
|-------|-------------|----------|
| FK column name | `user_id` | `profile_id` (chat route) |
| Diary table structure | `user_id, date, role, content, embedding` | Some routes use `wallet_address, entry_date` (diary routes) |
| match_diary_entries param | `match_user_id` | `p_profile_id` (chat route) |
| Souls FK | `user_id` | `profile_id` (soul route), `wallet_address` (souls route) |

The schema and API routes are **not aligned**. The `diary/route.ts` and `souls/route.ts` query by `wallet_address` directly, but the schema has no `wallet_address` column on those tables — only `user_id` FK.

**The chat route correctly looks up `profile_id` first**, but uses `p_profile_id` as the RPC parameter while the schema function expects `match_user_id`.

### Fix Required
Either:
1. Update schema to add `wallet_address` columns, or
2. Update API routes to always look up profile first and use `user_id`/`profile_id`
3. Align the RPC parameter names

## 10. Notification Bell HTTP Method Mismatch — ⚠️ Bug

`notification-bell.tsx` calls `POST /api/notifications` to mark notifications as read, but the API route only defines `GET` and `PUT` handlers. The POST request will get a 405 Method Not Allowed.

**Fix:** Change the fetch call in `notification-bell.tsx` from `method: 'POST'` to `method: 'PUT'`, and update the body to match `{ wallet_address, notification_ids }`.

---

## Fixes Applied

### Fix 1: notification-bell.tsx POST → PUT
Changed HTTP method from POST to PUT to match the API route handler.

### Fix 2: Input validation added to chat route
Added wallet_address format check and message length limit.
