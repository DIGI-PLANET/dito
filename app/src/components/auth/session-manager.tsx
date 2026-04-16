'use client';

import { useSessionManager } from '@/hooks/useSessionManager';

/**
 * Session manager component - handles session tracking and cleanup
 * Should be mounted once in the app layout
 */
export function SessionManager() {
  useSessionManager();
  return null; // This component renders nothing
}