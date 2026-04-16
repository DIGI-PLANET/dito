/**
 * Environment configuration helper
 * Provides type-safe access to environment variables with validation
 */

export type EnvMode = 'development' | 'test' | 'production';

export function getEnvMode(): EnvMode {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production' || env === 'test') return env;
  return 'development';
}

export function isDev(): boolean {
  return getEnvMode() === 'development';
}

export function isTest(): boolean {
  return getEnvMode() === 'test';
}

export function isProd(): boolean {
  return getEnvMode() === 'production';
}

export function isMaintenance(): boolean {
  return process.env.DITO_MAINTENANCE === 'true';
}

export function isPaymentSkipped(): boolean {
  return process.env.MVP_SKIP_PAYMENT === 'true';
}

/**
 * Get required env var — throws in production if missing
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (isProd()) {
      throw new Error(`Missing required env var: ${key}`);
    }
    // Logger not used here to avoid circular dependency (logger imports env)
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', event: 'env.missing', details: { key } }));
    return '';
  }
  return value;
}

/**
 * Solana network from env
 */
export function getSolanaNetwork(): 'devnet' | 'mainnet-beta' {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (network === 'mainnet-beta') return 'mainnet-beta';
  return 'devnet';
}

