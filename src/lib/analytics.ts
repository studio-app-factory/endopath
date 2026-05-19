// ============================================================
// ENDOPATH — Analytics Layer
// Mixpanel-compatible event tracking (local-first, no IDFA)
// Events are stored locally and can be flushed to Mixpanel
// ============================================================

import { getDB } from './db';
import type { PortfolioEvent } from '@/types';

let sessionId = crypto.randomUUID();
let userId = '';

function getUserId(): string {
  if (!userId) {
    userId = localStorage.getItem('endopath_user_id') || crypto.randomUUID();
    localStorage.setItem('endopath_user_id', userId);
  }
  return userId;
}

// Track an event (local-first, queue for server flush)
export function track(
  event: PortfolioEvent,
  params: Record<string, string | number | boolean | string[]> = {},
): void {
  const db = getDB();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Store locally
  db.analyticsEvents.put({
    id,
    event,
    timestamp,
    params: {
      ...params,
      session_id: sessionId,
      user_id: getUserId(),
      app_id: 'endopath',
      platform: 'web',
    },
  }).catch(() => {}); // Silently fail — analytics are best-effort

  // In production, this would flush to Mixpanel via their SDK
  if (import.meta.env.PROD && typeof navigator.sendBeacon === 'function') {
    const payload = JSON.stringify({
      event,
      properties: {
        ...params,
        session_id: sessionId,
        distinct_id: getUserId(),
        app_id: 'endopath',
        platform: 'web',
        time: Math.floor(Date.now() / 1000),
      },
    });
    // Replace with actual Mixpanel ingest endpoint in production
    navigator.sendBeacon('https://api.mixpanel.com/track', payload);
  }

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, params);
  }
}

// Identify user properties
export function identify(properties: Record<string, string | number | boolean | string[]>): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics] identify', properties);
  }
}

// Start a new session
export function newSession(): void {
  sessionId = crypto.randomUUID();
}

// Get all stored events (for debugging or manual flush)
export async function getStoredEvents() {
  const db = getDB();
  return db.analyticsEvents.orderBy('timestamp').toArray();
}

// Clear stored events after successful flush
export async function clearStoredEvents(): Promise<void> {
  const db = getDB();
  await db.analyticsEvents.clear();
}
