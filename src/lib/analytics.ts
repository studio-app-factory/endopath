// ============================================================
// ENDOPATH — Local analytics
//
// Events are stored locally in IndexedDB and never transmitted off the
// device. This file's job is to keep a queryable on-device log of what
// the user did (paywall_viewed, flare_logged, ads_consent_accepted, …)
// so debug screens and Pro reports can use it later — NOT to push to a
// third-party tracker. Privacy policy and Data Safety form must match
// this stance.
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

/** Record an event in the on-device log. Never transmitted off-device. */
export function track(
  event: PortfolioEvent,
  params: Record<string, string | number | boolean | string[]> = {},
): void {
  const db = getDB();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  db.analyticsEvents
    .put({
      id,
      event,
      timestamp,
      params: {
        ...params,
        session_id: sessionId,
        user_id: getUserId(),
        app_id: 'endopath',
        platform: 'local',
      },
    })
    .catch(() => {
      // Best-effort: if Dexie write fails we don't want to break the
      // user-facing flow that triggered the event.
    });

  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, params);
  }
}

/** No-op: kept for future use if we ever wire a real provider. */
export function identify(_properties: Record<string, string | number | boolean | string[]>): void {
  // Intentionally empty — see file header.
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
