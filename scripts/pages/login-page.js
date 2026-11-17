/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /login-page.js                                                        *
 * Purpose: Verifies browser-local demo credentials and starts a signed-in     *
 *          session.                                                           *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

function initializeLoginForm() {
  const loginForm = document.querySelector('#loginForm');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(loginForm);
    const submitButton = loginForm.querySelector('[type="submit"]');
    const identity = document.querySelector('#editUsername').value.trim().toLowerCase();
    const password = document.querySelector('#editPassword').value;
    if (!identity || !password) {
      const missingField = identity
        ? document.querySelector('#editPassword')
        : document.querySelector('#editUsername');
      showFieldError(missingField, 'Enter your username and password');
      return;
    }
    const users = getUsers();
    const matchedIndex = users.findIndex((user) => {
      const username = String(user.username || '').trim().toLowerCase();
      const email = String(user.email || '').trim().toLowerCase();
      return identity === username || identity === email;
    });
    if (matchedIndex < 0) {
      showFieldError(document.querySelector('#editUsername'), 'Invalid Username or Password');
      return;
    }
    submitButton.disabled = true;
    try {
      const verification = await verifyDemoPassword(password, users[matchedIndex].password);
      if (!verification.valid) {
        showFieldError(document.querySelector('#editPassword'), 'Invalid Username or Password');
        return;
      }
      // Older demo accounts may lack stable IDs; assign one before accessing
      // account-scoped event data. Legacy plaintext passwords are rehashed.
      if (verification.legacy || !users[matchedIndex].id) {
        const updatedUsers = [...users];
        updatedUsers[matchedIndex] = {
          ...users[matchedIndex],
          id: users[matchedIndex].id || createUniqueTimestampId(users),
          password: verification.legacy
            ? await hashDemoPassword(password)
            : users[matchedIndex].password,
        };
        if (!saveUsers(updatedUsers)) {
          showToast('Account storage is unavailable');
          return;
        }
        users[matchedIndex] = updatedUsers[matchedIndex];
      }
      sessionStorage.setItem(STORAGE_KEYS.authenticatedAt, String(Date.now()));
      sessionStorage.setItem(STORAGE_KEYS.authenticated, 'true');
      sessionStorage.setItem(STORAGE_KEYS.currentUsername, String(users[matchedIndex].username || ''));
      location.assign('events.html');
    }
    catch {
      showToast('Secure sign-in is unavailable in this browser');
    }
    finally {
      submitButton.disabled = false;
    }
  });
}
