/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /core.js                                                              *
 * Purpose: Defines browser storage keys, event normalization, validation      *
 *          helpers, and event persistence.                                    *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

'use strict';
// Shared event/storage rules live here so every browser page uses the same normalized data.
const STORAGE_KEYS = Object.freeze({
  events: 'punctuowlity-events',
  users: 'punctuowlity-users',
  authenticated: 'punctuowlity-authenticated',
  authenticatedAt: 'punctuowlity-authenticated-at',
  currentUsername: 'punctuowlity-current-username',
  smsPreference: 'punctuowlity-sms',
});
const TOAST_VISIBLE_DURATION_MS = 2400;
const TOAST_REMOVE_DELAY_MS = 250;
const SIGNUP_REDIRECT_DELAY_MS = 900;
const EVENT_REDIRECT_DELAY_MS = 600;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
const MINIMUM_PASSWORD_LENGTH = 8;
const DEMO_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim());
}
function isValidOptionalPhone(value) {
  const normalized = String(value || '').trim();
  return !normalized || PHONE_PATTERN.test(normalized);
}
/**
 * Keeps persisted IDs unique even when events are created in the same millisecond.
 * @param {Object[]} records - Existing event records.
 * @returns {string} A timestamp-style ID not present in records.
 */
function createUniqueTimestampId(records) {
  const existingIds = new Set(records.map((record) => String(record.id)));
  let candidate = Date.now();
  while (existingIds.has(String(candidate))) {
    candidate += 1;
  }
  return String(candidate);
}
/**
 * Uses the device's local calendar day for reminder matching, not UTC.
 * @param {Date} date - The date to format.
 * @returns {string} A YYYY-MM-DD date in the local time zone.
 */
function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
/**
 * Accepts historical event date/time shapes at the storage boundary.
 * @param {Object} event - Previously stored event record.
 * @returns {Object} A normalized event record for browser rendering.
 */
function normalizeEvent(event) {
  const rawDate = String(event.fullDate || event.date || '').trim();
  let parsedDate = null;
  let fullDate = event.fullDate || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    fullDate = rawDate;
    parsedDate = new Date(`${rawDate}T00:00:00`);
  }
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    const [month, day, year] = rawDate.split('/');
    fullDate = `${year}-${month}-${day}`;
    parsedDate = new Date(`${fullDate}T00:00:00`);
  }
  else if (event.fullDate) {
    parsedDate = new Date(`${event.fullDate}T00:00:00`);
  }
  // Date construction can silently roll invalid dates into the next month.
  const hasValidDate = parsedDate !== null &&
    !Number.isNaN(parsedDate.getTime()) &&
    localDateKey(parsedDate) === fullDate;
  const rawTime = String(event.rawTime || event.time || '').trim();
  let displayTime = rawTime || 'ALL DAY';
  if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(rawTime)) {
    const [hours, minutes] = rawTime.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    displayTime =
      `${String(hour).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')}${suffix}`;
  }
  const title = String(event.title || '');
  const lowerTitle = title.toLowerCase();
  let category = event.category || 'general';
  // Infer a category only for legacy records that do not already define one.
  if (!event.category && lowerTitle.includes('birthday')) {
    category = 'birthday';
  }
  else if (!event.category &&
    /(appointment|dentist|dental|doctor)/.test(lowerTitle)) {
    category = 'appointment';
  }
  else if (!event.category &&
    /(trip|travel|vacation)/.test(lowerTitle)) {
    category = 'trip';
  }
  return {
    ...event,
    id: String(event.id || Date.now()),
    day: hasValidDate
      ? parsedDate
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase()
      : event.day || '---',
    date: hasValidDate
      ? String(parsedDate.getDate()).padStart(2, '0')
      : /^\d{1,2}$/.test(String(event.date || ''))
        ? String(event.date).padStart(2, '0')
        : '00',
    fullDate,
    rawTime,
    time: displayTime,
    title,
    category,
    alert: Boolean(event.alert),
  };
}
/**
 * Browser-only account separation. This is not server-side authorization:
 * anyone controlling this browser's storage can impersonate a demo account.
 */
function currentDemoAccount() {
  try {
    if (sessionStorage.getItem(STORAGE_KEYS.authenticated) !== 'true') {
      return null;
    }
    const username = sessionStorage.getItem(STORAGE_KEYS.currentUsername);
    const loginAt = Number(sessionStorage.getItem(STORAGE_KEYS.authenticatedAt));
    const age = Date.now() - loginAt;
    if (!username || !Number.isFinite(loginAt) || loginAt <= 0 ||
      age < 0 || age >= DEMO_SESSION_MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEYS.authenticated);
      sessionStorage.removeItem(STORAGE_KEYS.currentUsername);
      sessionStorage.removeItem(STORAGE_KEYS.authenticatedAt);
      return null;
    }
    return getUsers().find((user) => String(user.username || '').toLowerCase() === username.toLowerCase()) || null;
  }
  catch {
    return null;
  }
}
function demoAccountStorageKey(baseKey) {
  const account = currentDemoAccount();
  if (!account || !account.id) {
    return null;
  }
  return `${baseKey}-account-${encodeURIComponent(String(account.id))}`;
}
/**
 * Legacy event storage had no owner. Claim it only when exactly one account
 * exists; ambiguous legacy data remains untouched rather than leaking to
 * another account.
 */
function migrateUnownedDemoEvents() {
  const key = demoAccountStorageKey(STORAGE_KEYS.events);
  if (!key) {
    return;
  }
  try {
    if (getUsers().length === 1 &&
      localStorage.getItem(key) === null &&
      localStorage.getItem(STORAGE_KEYS.events) !== null) {
      const legacy = JSON.parse(localStorage.getItem(STORAGE_KEYS.events));
      if (Array.isArray(legacy)) {
        localStorage.setItem(key, JSON.stringify(legacy.filter((event) => !isLegacyExampleEvent(event))));
        localStorage.removeItem(STORAGE_KEYS.events);
      }
    }
  }
  catch {
    // Keep legacy records intact if parsing or storage migration fails.
  }
}
/**
 * Recognizes only the four historical demonstration records that were
 * mistakenly shipped as account events. User-created records are preserved.
 */
function isLegacyExampleEvent(event) {
  const examples = {
    project: ['2025-04-05', 'Project Two Due'],
    birthday: ['2025-04-12', "Nich's Birthday"],
    dentist: ['2025-04-14', 'Dentist'],
    wedding: ['2025-04-20', "Jessica's Wedding"],
  };
  const expected = examples[String(event.id)];
  return Boolean(expected && event.fullDate === expected[0] && event.title === expected[1]);
}
/**
 * Returns an empty list when the account has no events or storage is malformed.
 * @returns {Object[]} Normalized event records.
 */
function getEvents() {
  const key = demoAccountStorageKey(STORAGE_KEYS.events);
  if (!key) {
    return [];
  }
  migrateUnownedDemoEvents();
  try {
    const savedEvents = JSON.parse(localStorage.getItem(key));
    const records = Array.isArray(savedEvents) ? savedEvents : [];
    // One corrupt record must not hide every valid saved event.
    return records
      .filter((record) => record && typeof record === 'object' && !Array.isArray(record) && !isLegacyExampleEvent(record))
      .map(normalizeEvent)
      .filter((event) => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(event.fullDate) &&
        Number.isFinite(new Date(`${event.fullDate}T00:00:00`).getTime()) &&
        localDateKey(new Date(`${event.fullDate}T00:00:00`)) === event.fullDate &&
        event.title.trim().length > 0);
  }
  catch {
    // Malformed or unavailable storage must not introduce fabricated events.
    return [];
  }
}
/**
 * Persists events under the existing browser storage key.
 * @param {Object[]} events - Event records to persist.
 * @returns {boolean} Whether the browser accepted the write.
 */
function saveEvents(events) {
  const key = demoAccountStorageKey(STORAGE_KEYS.events);
  if (!key || !Array.isArray(events)) {
    return false;
  }
  try {
    const serialized = JSON.stringify(events);
    localStorage.setItem(key, serialized);
    const confirmed = localStorage.getItem(key);
    if (confirmed === null) {
      return false;
    }
    const stored = JSON.parse(confirmed);
    return Array.isArray(stored) &&
      stored.length === events.length &&
      stored.every((event, index) =>
        String(event.id) === String(events[index].id) &&
        event.fullDate === events[index].fullDate &&
        event.title === events[index].title);
  }
  catch {
    return false;
  }
}
