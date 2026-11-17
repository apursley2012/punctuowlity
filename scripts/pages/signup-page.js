/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /signup-page.js                                                       *
 * Purpose: Validates new browser-demo accounts and stores password hashes in  *
 *          browser-local storage.                                             *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

function initializeSignupForm() {
  const signupForm = document.querySelector('#signupForm');
  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(signupForm);
    const submitButton = signupForm.querySelector('[type="submit"]');
    const firstName = document.querySelector('#firstName').value.trim();
    const lastName = document.querySelector('#lastName').value.trim();
    const email = document.querySelector('#editEmail').value.trim().toLowerCase();
    const phone = document.querySelector('#phone').value.trim();
    const username = document.querySelector('#signupUsername').value.trim();
    const password = document.querySelector('#signupPassword').value;
    const confirmedPassword = document.querySelector('#confirmPassword').value;
    if (!firstName ||
      !lastName ||
      !email ||
      !username ||
      !password ||
      !confirmedPassword) {
      const requiredFields = [
        document.querySelector('#firstName'),
        document.querySelector('#lastName'),
        document.querySelector('#editEmail'),
        document.querySelector('#signupUsername'),
        document.querySelector('#signupPassword'),
        document.querySelector('#confirmPassword'),
      ];
      showFieldError(requiredFields.find((field) => !field.value.trim()), 'All required fields must be completed');
      return;
    }
    if (!isValidEmail(email)) {
      showFieldError(document.querySelector('#editEmail'), 'Enter a valid email address');
      return;
    }
    if (!isValidOptionalPhone(phone)) {
      showFieldError(document.querySelector('#phone'), 'Enter a valid phone number or leave it blank');
      return;
    }
    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      showFieldError(document.querySelector('#signupPassword'), `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmedPassword) {
      showFieldError(document.querySelector('#confirmPassword'), 'Passwords do not match!');
      return;
    }
    const users = getUsers();
    const normalizedUsername = username.toLowerCase();
    const accountAlreadyExists = users.some((user) => {
      const storedUsername = String(user.username || '').trim().toLowerCase();
      const storedEmail = String(user.email || '').trim().toLowerCase();
      return (storedUsername === normalizedUsername ||
        storedEmail === email ||
        storedEmail === normalizedUsername ||
        storedUsername === email);
    });
    if (accountAlreadyExists) {
      showFieldError(document.querySelector('#signupUsername'), 'That username or email is already registered');
      return;
    }
    submitButton.disabled = true;
    try {
      const passwordHash = await hashDemoPassword(password);
      const newAccount = {
        id: createUniqueTimestampId(users),
        firstName,
        lastName,
        email,
        phone,
        username,
        password: passwordHash,
      };
      users.push(newAccount);
      if (!saveUsers(users)) {
        showToast('Account creation failed!');
        submitButton.disabled = false;
        return;
      }
      const accountWasSaved = getUsers().some((user) => String(user.id) === newAccount.id);
      if (!accountWasSaved) {
        showToast('Account creation failed!');
        submitButton.disabled = false;
        return;
      }
      // A newly registered user proceeds directly to the one-time welcome step.
      sessionStorage.setItem(STORAGE_KEYS.authenticatedAt, String(Date.now()));
      sessionStorage.setItem(STORAGE_KEYS.authenticated, 'true');
      sessionStorage.setItem(STORAGE_KEYS.currentUsername, newAccount.username);
      showToast('Account Created Successfully');
      setTimeout(() => {
        location.replace('sms.html');
      }, SIGNUP_REDIRECT_DELAY_MS);
    }
    catch {
      showToast('Secure account storage is unavailable in this browser');
      submitButton.disabled = false;
    }
  });
}
