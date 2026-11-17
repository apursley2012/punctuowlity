/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /account-page.js                                                      *
 * Purpose: Loads and validates browser-local account profile changes and      *
 *          updates the current session username.                              *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

function initializeAccountPage() {
  if (document.body.dataset.page !== 'account') {
    return;
  }
  if (!currentDemoAccount()) {
    location.replace('index.html');
    return;
  }
  // Profile changes require a fresh demo sign-in, not an old open tab.
  const authenticatedAt = Number(sessionStorage.getItem(STORAGE_KEYS.authenticatedAt));
  if (Date.now() - authenticatedAt >= 15 * 60 * 1000) {
    sessionStorage.removeItem(STORAGE_KEYS.authenticated);
    sessionStorage.removeItem(STORAGE_KEYS.authenticatedAt);
    sessionStorage.removeItem(STORAGE_KEYS.currentUsername);
    location.replace('index.html');
    return;
  }
  const users = getUsers();
  const currentUsername = sessionStorage.getItem(STORAGE_KEYS.currentUsername) || '';
  const currentIndex = users.findIndex((user) => String(user.username || '').toLowerCase() ===
    currentUsername.toLowerCase());
  if (currentIndex < 0) {
    showToast('Account information is unavailable');
    return;
  }
  const account = users[currentIndex];
  const fields = {
    firstName: document.querySelector('#accountFirstName'),
    lastName: document.querySelector('#accountLastName'),
    email: document.querySelector('#accountEmail'),
    phone: document.querySelector('#accountPhone'),
    username: document.querySelector('#accountUsername'),
  };
  Object.entries(fields).forEach(([key, field]) => {
    field.value = String(account[key] || '');
  });
  document.querySelector('#accountForm').addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(document.querySelector('#accountForm'));
    const updated = {
      ...account,
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      phone: fields.phone.value.trim(),
      username: fields.username.value.trim(),
    };
    if (!updated.firstName ||
      !updated.lastName ||
      !updated.email ||
      !updated.username) {
      const requiredFields = [
        fields.firstName,
        fields.lastName,
        fields.email,
        fields.username,
      ];
      showFieldError(requiredFields.find((field) => !field.value.trim()), 'All required fields must be completed');
      return;
    }
    if (!isValidEmail(updated.email)) {
      showFieldError(fields.email, 'Enter a valid email address');
      return;
    }
    if (!isValidOptionalPhone(updated.phone)) {
      showFieldError(fields.phone, 'Enter a valid phone number or leave it blank');
      return;
    }
    const duplicate = users.some((user, index) => {
      if (index === currentIndex) {
        return false;
      }
      return (String(user.username || '').trim().toLowerCase() ===
        updated.username.toLowerCase() ||
        String(user.email || '').trim().toLowerCase() === updated.email ||
        String(user.email || '').trim().toLowerCase() ===
          updated.username.toLowerCase() ||
        String(user.username || '').trim().toLowerCase() === updated.email);
    });
    if (duplicate) {
      showFieldError(fields.username, 'That username or email is already registered');
      return;
    }
    const updatedUsers = [...users];
    updatedUsers[currentIndex] = updated;
    if (!saveUsers(updatedUsers)) {
      showToast('Account update failed');
      return;
    }
    sessionStorage.setItem(STORAGE_KEYS.currentUsername, updated.username);
    showToast('Account Updated Successfully');
  });
}
