/**
 * DITO.guru Structured Logger
 * Zero dependencies — pure console-based JSON logging
 */

import { getEnvMode } from './env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

const LEVEL_VALUE: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50,
};

const ENV_MIN_LEVEL: Record<string, LogLevel> = {
  development: 'DEBUG',
  test: 'WARN',
  production: 'INFO',
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  endpoint?: string;
  wallet?: string;
  ip?: string;
  duration_ms?: number;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// PII Masking
// ---------------------------------------------------------------------------

/**
 * Mask wallet address: first 4 chars + ... + last 4 chars
 * "7xKXabcdef9fPq" → "7xKX...9fPq"
 */
export function maskWallet(address: string | undefined | null): string | undefined {
  if (!address || address.length < 10) return address ?? undefined;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

function getMinLevel(): number {
  return LEVEL_VALUE[ENV_MIN_LEVEL[getEnvMode()] || 'INFO'];
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_VALUE[level] >= getMinLevel();
}

function emit(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (LEVEL_VALUE[entry.level] >= LEVEL_VALUE.ERROR) {
    console.error(line);
  } else if (entry.level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function log(level: LogLevel, event: string, extra?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'event'>>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...extra,
  };

  // Mask wallet if present
  if (entry.wallet) {
    entry.wallet = maskWallet(entry.wallet);
  }

  emit(entry);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const logger = {
  debug: (event: string, extra?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'event'>>) =>
    log('DEBUG', event, extra),

  info: (event: string, extra?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'event'>>) =>
    log('INFO', event, extra),

  warn: (event: string, extra?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'event'>>) =>
    log('WARN', event, extra),

  error: (event: string, extra?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'event'>>) =>
    log('ERROR', event, extra),

  critical: (event: string, extra?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'event'>>) =>
    log('CRITICAL', event, extra),

  /** Helper: format an Error for details */
  errorDetails(err: unknown): Record<string, unknown> {
    if (err instanceof Error) {
      const details: Record<string, unknown> = { error_message: err.message };
      if (process.env.NODE_ENV !== 'production') {
        details.error_stack = err.stack?.split('\n').slice(0, 3).join(' | ');
      }
      return details;
    }
    return { error_message: String(err) };
  },
};
