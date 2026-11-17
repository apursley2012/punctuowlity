/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /topbar.js                                                            *
 * Purpose: Builds the shared top bar and handles back navigation and optional *
 *          menus.                                                             *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// The page chooses a menu variant through data-menu; topbar markup itself stays centralized.
function initializeTopbar() {
  const topbar = document.querySelector('[data-topbar]');
  if (!topbar) {
    return;
  }
  topbar.replaceChildren();
  const backButton = document.createElement('button');
  backButton.className = 'icon-button back';
  backButton.type = 'button';
  backButton.setAttribute('aria-label', 'Go back');
  backButton.append(createIconElement('back'));
  backButton.addEventListener('click', () => {
    const page = location.pathname.split('/').pop();
    const articlePages = new Set([
      'article-responsive-conversion.html',
      'article-useful-reminders.html',
    ]);
    let destination = 'events.html';
    if (articlePages.has(page)) {
      destination = 'articles.html';
    }
    else if (page === 'events.html' || page === 'signup.html' || page === 'sms.html') {
      destination = 'index.html';
    }
    else if (page === 'index.html') {
      destination = 'events.html';
    }
    location.assign(destination);
  });
  topbar.append(backButton);
  if (topbar.dataset.menu === 'account' &&
    typeof buildEventMenu === 'function' &&
    typeof initializeMenu === 'function') {
    const menu = buildEventMenu();
    topbar.append(menu);
    initializeMenu(menu);
  }
}
