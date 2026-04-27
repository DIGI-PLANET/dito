#!/usr/bin/env node
/**
 * Migration runner — applies a single SQL file against Supabase via PostgREST's
 * `pg_raw` RPC. Uses SUPABASE_SERVICE_ROLE_KEY from .env.local / environment.
 *
 * Usage:
 *   node scripts/run-migration.mjs supabase/003_ember_journal.sql
 *   node scripts/run-migration.mjs supabase/003_ember_journal.sql --dry-run
 *
 * Requires an `exec_sql` function in your Supabase project:
 *   create or replace function exec_sql(sql text) returns void
 *   language plpgsql security definer as $$
 *   begin execute sql; end; $$;
 *   grant execute on function exec_sql(text) to service_role;
 *
 * If `exec_sql` isn't available, the script prints the SQL and instructs you
 * to run it manually via the Supabase SQL Editor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

// Load env from .env.local if dotenv-style values are present
function loadEnv() {
  const file = path.join(APP_ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = args.find((a) => !a.startsWith('--'));

if (!target) {
  console.error('usage: node scripts/run-migration.mjs <sql-file> [--dry-run]');
  process.exit(1);
}

const sqlPath = path.isAbsolute(target) ? target : path.join(APP_ROOT, target);
if (!fs.existsSync(sqlPath)) {
  console.error(`file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('─────────────────────────────────────────────');
console.log(`migration: ${path.relative(APP_ROOT, sqlPath)}`);
console.log(`bytes:     ${sql.length}`);
console.log(`mode:      ${dryRun ? 'DRY RUN' : 'APPLY'}`);
console.log('─────────────────────────────────────────────');

if (dryRun) {
  console.log(sql);
  console.log('\n(dry run — no changes made)');
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || url === 'CHANGE_ME' || !key || key === 'CHANGE_ME') {
  console.error('\n✖ missing Supabase env:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nFix: ensure .env.local is populated, or run via the Supabase SQL editor.');
  console.error('\n── Manual alternative ──');
  console.error(
    '  1. Open https://app.supabase.com → your project → SQL Editor'
  );
  console.error(`  2. Paste the contents of ${path.relative(APP_ROOT, sqlPath)}`);
  console.error('  3. Run.');
  process.exit(2);
}

async function callExecSql(statementSql) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ sql: statementSql }),
  });
  return res;
}

// Try a no-op first to detect whether exec_sql exists
const probe = await callExecSql('select 1;');
if (probe.status === 404 || probe.status === 400) {
  const body = await probe.text();
  console.error('\n✖ Supabase rejected exec_sql probe:', probe.status);
  console.error(body);
  console.error(
    '\nThis usually means the `exec_sql(text)` helper is not installed.'
  );
  console.error(
    'Install it once via SQL Editor, or run the migration manually from that editor.'
  );
  console.error('\n── Helper to install (one-time) ──\n');
  console.error(`create or replace function exec_sql(sql text) returns void
language plpgsql security definer as $$
begin execute sql; end; $$;
grant execute on function exec_sql(text) to service_role;`);
  process.exit(3);
}

const res = await callExecSql(sql);
if (!res.ok) {
  const body = await res.text();
  console.error(`✖ migration failed: ${res.status}`);
  console.error(body);
  process.exit(4);
}

console.log('✓ migration applied.');
