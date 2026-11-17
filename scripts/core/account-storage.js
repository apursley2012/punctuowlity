/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /account-storage.js                                                   *
 * Purpose: Encapsulates browser-local account persistence and fallback        *
 *          behavior when storage is unavailable.                              *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// localStorage access is kept behind these helpers because storage can be unavailable in restricted browsers.
function getAvailableAccountStorage() {
  const stores = [];
  try {
    stores.push(window.localStorage);
  }
  catch {
    // Browser privacy/security settings can make localStorage unavailable.
  }
  try {
    stores.push(window.sessionStorage);
  }
  catch {
    // Browser privacy/security settings can make sessionStorage unavailable.
  }
  return stores;
}
const ACCOUNT_STORAGE_FALLBACK_MARKER = 'punctuowlity-account-session-fallback';
const accountStorage = {
  /**
     * Reads the first valid account array from available browser storage.
     * @returns {Object[]} Locally stored account records.
     */
  get() {
    const stores = getAvailableAccountStorage();
    try {
      if (window.sessionStorage.getItem(ACCOUNT_STORAGE_FALLBACK_MARKER) === 'true') {
        stores.sort((first) => first === window.sessionStorage ? -1 : 1);
      }
    }
    catch {
      // Restricted session storage falls back to the available storage order.
    }
    for (const storage of stores) {
      try {
        const users = JSON.parse(storage.getItem(STORAGE_KEYS.users));
        if (Array.isArray(users)) {
          return users.filter((user) => user && typeof user === 'object' && !Array.isArray(user));
        }
      }
      catch {
        // Ignore an inaccessible/malformed store and try the next one.
      }
    }
    return [];
  },
  /**
     * Writes demo accounts to the first writable browser storage area.
     * @param {Object[]} users - Local account records.
     * @returns {boolean} Whether the browser accepted the write.
     */
  set(users) {
    if (!Array.isArray(users)) {
      return false;
    }
    let value;
    try {
      value = JSON.stringify(users);
    }
    catch {
      return false;
    }
    for (const storage of getAvailableAccountStorage()) {
      try {
        storage.setItem(STORAGE_KEYS.users, value);
        try {
          if (storage === window.sessionStorage) {
            window.sessionStorage.setItem(ACCOUNT_STORAGE_FALLBACK_MARKER, 'true');
          }
          else {
            window.sessionStorage.removeItem(ACCOUNT_STORAGE_FALLBACK_MARKER);
          }
        }
        catch {
          // The primary account write already succeeded.
        }
        return true;
      }
      catch {
        // Fall back only when the preferred browser store is unavailable.
      }
    }
    return false;
  },
};
function getUsers() {
  return accountStorage.get();
}
function saveUsers(users) {
  return accountStorage.set(users);
}
