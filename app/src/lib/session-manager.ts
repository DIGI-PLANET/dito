/**
 * Session management for duplicate login detection
 *
 * SECURITY NOTE (RLS / client-side Supabase access):
 * This module runs on the client and uses the anon Supabase client to
 * read/write the `sessions` table directly. This is acceptable ONLY if
 * Supabase Row-Level Security (RLS) policies are enabled on the `sessions`
 * table to restrict access per wallet_address. Ensure:
 *   - INSERT: wallet_address must match the authenticated identity or be
 *     constrained by a policy.
 *   - SELECT/UPDATE/DELETE: scoped to the user's own wallet_address.
 *
 * TODO (post-MVP): Migrate session CRUD to server-side API routes
 * (e.g., /api/sessions) to eliminate direct client DB access entirely.
 */

import { getSupabase } from '@/lib/supabase';

export interface Session {
  id: string;
  wallet_address: string;
  device_id: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
  last_active: string;
  is_active: boolean;
}

/**
 * Generate unique device identifier
 */
export function generateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
  ];
  
  // Create hash from components + random component for uniqueness
  const fingerprint = components.join('|');
  const random = Date.now().toString(36) + Math.random().toString(36);
  
  // Simple hash function (not crypto-secure, just for identification)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${Math.abs(hash).toString(36)}_${random}`;
}

/**
 * Get or create device ID (stored in localStorage for persistence)
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  
  const key = 'dito-device-id';
  let deviceId: string | null = null;
  
  try {
    deviceId = localStorage.getItem(key);
  } catch (error) {
    console.warn('[SessionManager] localStorage not available:', error);
    return generateDeviceId(); // Return new ID each time if localStorage fails
  }
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    try {
      localStorage.setItem(key, deviceId);
    } catch (error) {
      console.warn('[SessionManager] Cannot save device ID to localStorage:', error);
    }
  }
  
  return deviceId;
}

/**
 * Get client IP address (best effort)
 */
export async function getClientIP(): Promise<string> {
  try {
    // Try to get real IP via external service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    // Fallback - won't get real IP but that's okay
    return 'unknown';
  }
}

/**
 * Check for active sessions for a wallet address
 */
export async function getActiveSessions(walletAddress: string): Promise<Session[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('is_active', true)
    .order('last_active', { ascending: false });

  if (error) {
    console.error('[SessionManager] Error fetching sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Create new session
 */
export async function createSession(walletAddress: string): Promise<Session | null> {
  const deviceId = getDeviceId();
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'server';
  const ipAddress = await getClientIP();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      wallet_address: walletAddress,
      device_id: deviceId,
      user_agent: userAgent,
      ip_address: ipAddress,
    })
    .select()
    .single();

  if (error) {
    console.error('[SessionManager] Error creating session:', error);
    return null;
  }

  console.log('[SessionManager] Session created:', data.id);
  return data;
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(walletAddress: string): Promise<void> {
  const deviceId = getDeviceId();

  const supabase = getSupabase();
  const { error } = await supabase
    .from('sessions')
    .update({ last_active: new Date().toISOString() })
    .eq('wallet_address', walletAddress)
    .eq('device_id', deviceId)
    .eq('is_active', true);

  if (error) {
    console.error('[SessionManager] Error updating session activity:', error);
  }
}

/**
 * Deactivate session (logout)
 */
export async function deactivateSession(walletAddress: string, deviceId?: string): Promise<void> {
  const targetDeviceId = deviceId || getDeviceId();

  const supabase = getSupabase();
  const { error } = await supabase
    .from('sessions')
    .update({ is_active: false })
    .eq('wallet_address', walletAddress)
    .eq('device_id', targetDeviceId);

  if (error) {
    console.error('[SessionManager] Error deactivating session:', error);
    return;
  }

  console.log('[SessionManager] Session deactivated for device:', targetDeviceId);
}

/**
 * Deactivate all other sessions except current device
 */
export async function deactivateOtherSessions(walletAddress: string): Promise<void> {
  const currentDeviceId = getDeviceId();

  const supabase = getSupabase();
  const { error } = await supabase
    .from('sessions')
    .update({ is_active: false })
    .eq('wallet_address', walletAddress)
    .neq('device_id', currentDeviceId)
    .eq('is_active', true);

  if (error) {
    console.error('[SessionManager] Error deactivating other sessions:', error);
    return;
  }

  console.log('[SessionManager] Other sessions deactivated for wallet:', walletAddress);
}

/**
 * Get session info for display
 */
export function getSessionDisplayInfo(session: Session): {
  deviceName: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
} {
  const currentDeviceId = getDeviceId();
  const userAgent = session.user_agent || '';
  
  // Parse device info from user agent
  let deviceName = 'Unknown Device';
  if (userAgent.includes('Mobile')) deviceName = '📱 Mobile Device';
  else if (userAgent.includes('Tablet')) deviceName = '📱 Tablet';
  else if (userAgent.includes('Windows')) deviceName = '🖥️ Windows PC';
  else if (userAgent.includes('Mac')) deviceName = '🖥️ Mac';
  else if (userAgent.includes('Linux')) deviceName = '🖥️ Linux PC';
  
  // Add browser info
  if (userAgent.includes('Chrome')) deviceName += ' (Chrome)';
  else if (userAgent.includes('Firefox')) deviceName += ' (Firefox)';
  else if (userAgent.includes('Safari')) deviceName += ' (Safari)';
  
  const location = session.ip_address === 'unknown' ? 'Unknown Location' : session.ip_address;
  
  const lastActive = new Date(session.last_active).toLocaleString();
  
  const isCurrent = session.device_id === currentDeviceId;

  return {
    deviceName,
    location,
    lastActive,
    isCurrent,
  };
}