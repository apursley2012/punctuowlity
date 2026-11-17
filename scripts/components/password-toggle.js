/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /password-toggle.js                                                   *
 * Purpose: Keeps password visibility controls consistent across browser       *
 *          forms.                                                             *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// One delegated pattern keeps login and signup password controls behaviorally consistent.
function renderPasswordToggleIcon(button, passwordIsVisible) {
  button.replaceChildren(createIconElement(passwordIsVisible ? 'eye-off' : 'eye'));
}
function initializePasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach((button) => {
    const passwordInput = button.previousElementSibling;
    if (!passwordInput) {
      return;
    }
    renderPasswordToggleIcon(button, passwordInput.type === 'text');
    button.addEventListener('click', () => {
      const passwordIsVisible = passwordInput.type === 'password';
      passwordInput.type = passwordIsVisible ? 'text' : 'password';
      button.setAttribute('aria-label', passwordIsVisible ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', String(passwordIsVisible));
      renderPasswordToggleIcon(button, passwordIsVisible);
    });
  });
}
