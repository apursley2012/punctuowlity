/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /sms-page.js                                                          *
 * Purpose: Handles browser reminder preference selection after session        *
 *          validation; no SMS is sent by the browser demo.                    *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

function initializeSmsChoices() {
  // Only a signed-in user may change the demo reminder preference.
  if (!currentDemoAccount()) {
    location.replace('index.html');
    return;
  }
  const account = currentDemoAccount();
  const phoneInput = document.querySelector('#welcomePhone');
  if (phoneInput) {
    phoneInput.value = account.phone || '';
  }
  phoneInput?.addEventListener('input', () => phoneInput.setCustomValidity(''));
  document.querySelectorAll('.sms-choice').forEach((button) => {
    button.addEventListener('click', async () => {
      const phone = phoneInput?.value.trim() || '';
      if (!isValidOptionalPhone(phone)) {
        phoneInput.setCustomValidity('Enter a valid phone number or leave it blank');
        phoneInput.reportValidity();
        return;
      }
      const users = getUsers();
      const index = users.findIndex((user) => String(user.id) === String(account.id));
      if (index < 0) {
        showToast('Account could not be found');
        return;
      }
      users[index] = { ...users[index], phone };
      if (!saveUsers(users)) {
        showToast('Phone preference could not be saved');
        return;
      }
      try {
        localStorage.setItem(demoAccountStorageKey(STORAGE_KEYS.smsPreference), button.dataset.sms);
      }
      catch {
        showToast('Reminder preference could not be saved in this browser');
        return;
      }
      if (button.dataset.sms === 'allowed' &&
        'Notification' in window &&
        Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        }
        catch {
          // Permission is optional; the user's event data remains accessible.
        }
      }
      location.assign('events.html');
    });
  });
}
