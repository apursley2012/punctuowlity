/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /feedback.js                                                          *
 * Purpose: Provides accessible toast messages and field-specific validation   *
 *          feedback for browser forms.                                        *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// Replacing an existing toast also cancels its pending removal timers.
let toastHideTimer = null;
let toastRemoveTimer = null;
function showToast(message) {
  clearTimeout(toastHideTimer);
  clearTimeout(toastRemoveTimer);
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  const notice = document.createElement('div');
  notice.className = 'toast';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.textContent = message;
  document.body.append(notice);
  requestAnimationFrame(() => {
    if (notice.isConnected) {
      notice.classList.add('show');
    }
  });
  toastHideTimer = setTimeout(() => {
    notice.classList.remove('show');
    toastRemoveTimer = setTimeout(() => {
      notice.remove();
    }, TOAST_REMOVE_DELAY_MS);
  }, TOAST_VISIBLE_DURATION_MS);
}
/*
 * Connects validation feedback to its field so visual and screen-reader users receive
 * the same correction guidance.
 */
function clearFieldErrors(form) {
  form?.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  });
  form?.querySelectorAll('.field-error').forEach((message) => {
    message.remove();
  });
}
function showFieldError(field, message) {
  if (!field) {
    showToast(message);
    return;
  }
  const errorId = `${field.id || 'field'}-error`;
  const error = document.createElement('p');
  error.id = errorId;
  error.className = 'field-error';
  error.setAttribute('role', 'alert');
  error.textContent = message;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', errorId);
  const container = field.closest('label, .field') || field.parentElement;
  container?.insertAdjacentElement('afterend', error);
  field.focus();
  showToast(message);
}
