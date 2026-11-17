/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /bootstrap.js                                                         *
 * Purpose: Initializes shared browser components and dispatches to the active *
 *          page controller.                                                   *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

function initializeCurrentPage() {
  if (typeof initializeTopbar === 'function') {
    initializeTopbar();
  }
  if (typeof initializeContentNavigation === 'function') {
    initializeContentNavigation();
  }
  if (typeof initializeArticleList === 'function') {
    initializeArticleList();
  }
  if (typeof initializePasswordToggles === 'function') {
    initializePasswordToggles();
  }
  const page = document.body.dataset.page;
  const pageInitializers = {
    account: typeof initializeAccountPage === 'function'
      ? initializeAccountPage
      : null,
    add: typeof initializeEventFormPage === 'function'
      ? initializeEventFormPage
      : null,
    login: typeof initializeLoginForm === 'function'
      ? initializeLoginForm
      : null,
    main: typeof initializeMainPage === 'function'
      ? initializeMainPage
      : null,
    signup: typeof initializeSignupForm === 'function'
      ? initializeSignupForm
      : null,
    sms: typeof initializeSmsChoices === 'function'
      ? initializeSmsChoices
      : null,
  };
  pageInitializers[page]?.();
}
initializeCurrentPage();
