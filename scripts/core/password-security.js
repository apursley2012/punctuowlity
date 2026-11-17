/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /password-security.js                                                 *
 * Purpose: Implements PBKDF2 hashing and verification for browser-demo        *
 *          credentials, including legacy migration.                           *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

'use strict';
// Persisted hashes embed their iteration count so older credentials remain verifiable.
const DEMO_PASSWORD_ITERATIONS = 120000;
const DEMO_PASSWORD_SALT_BYTES = 16;
const DEMO_PASSWORD_KEY_BITS = 256;
const DEMO_PASSWORD_PREFIX = 'pbkdf2-sha256';
function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
async function deriveDemoPassword(password, salt, iterations) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure browser cryptography is unavailable.');
  }
  const passwordBytes = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt,
    iterations,
  }, keyMaterial, DEMO_PASSWORD_KEY_BITS);
  return new Uint8Array(bits);
}
async function hashDemoPassword(password) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure browser randomness is unavailable.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(DEMO_PASSWORD_SALT_BYTES));
  const derived = await deriveDemoPassword(password, salt, DEMO_PASSWORD_ITERATIONS);
  return [
    DEMO_PASSWORD_PREFIX,
    DEMO_PASSWORD_ITERATIONS,
    bytesToBase64(salt),
    bytesToBase64(derived),
  ].join(':');
}
// Compare all bytes without exiting early on the first mismatch.
function constantTimeBytesEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index];
  }
  return difference === 0;
}
async function verifyDemoPassword(password, storedValue) {
  const parts = String(storedValue || '').split(':');
  if (parts.length !== 4 || parts[0] !== DEMO_PASSWORD_PREFIX) {
    // Only unstructured legacy plaintext may migrate; malformed hash-like values fail closed.
    const isLegacyPlaintext = typeof storedValue === 'string' &&
      storedValue.length > 0 &&
      !storedValue.includes(':');
    return {
      valid: isLegacyPlaintext && storedValue === password,
      legacy: isLegacyPlaintext,
    };
  }
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) ||
    iterations < 10000 ||
    iterations > 1000000) {
    return { valid: false, legacy: false };
  }
  try {
    const salt = base64ToBytes(parts[2]);
    const expected = base64ToBytes(parts[3]);
    if (salt.length !== DEMO_PASSWORD_SALT_BYTES ||
      expected.length !== DEMO_PASSWORD_KEY_BITS / 8) {
      return { valid: false, legacy: false };
    }
    const actual = await deriveDemoPassword(password, salt, iterations);
    return {
      valid: constantTimeBytesEqual(expected, actual),
      legacy: false,
    };
  }
  catch {
    return { valid: false, legacy: false };
  }
}
