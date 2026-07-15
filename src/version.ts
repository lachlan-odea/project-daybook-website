/**
 * Beta build version, shown in the app header.
 * Format: YYYY.MM.DD.NNN — the date of the HEAD commit, then a per-day build
 * number (count of commits that day), starting at 001 each day.
 * Computed automatically at build time from git — see buildVersion() in vite.config.ts.
 */
export const APP_VERSION = __APP_VERSION__
