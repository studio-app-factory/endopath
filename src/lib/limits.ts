// ============================================================
// ENDOPATH — free-tier feature limits
//
// Single source of truth for what the free tier sees. The numbers and rules
// here are referenced from every gated view so changes happen in one place.
// ============================================================

/**
 * Days of history visible to free users. Older data stays in IndexedDB
 * (no deletion) but is filtered out of free-tier views and shown behind a
 * Pro lock when the user scrolls past the cutoff.
 */
export const FREE_HISTORY_DAYS = 90;

/**
 * ISO date string (YYYY-MM-DD) for the earliest day a free user can see.
 * Pro users get `null` — no cutoff.
 */
export function freeWindowCutoffDate(): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FREE_HISTORY_DAYS);
  return cutoff.toISOString().split('T')[0];
}

/**
 * Returns the date string a free user is allowed to see, or null if Pro.
 * Pass this into Dexie .between() queries: callers do
 *   if (cutoff) query.filter(e => e.date >= cutoff)
 */
export function historyCutoffFor(isEffectivePro: boolean): string | null {
  return isEffectivePro ? null : freeWindowCutoffDate();
}
