/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /menu.js                                                              *
 * Purpose: Builds and manages the event-list overflow navigation menu.        *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

const EVENT_MENU_LINKS = Object.freeze([
  ['My Account / Settings', 'account.html'],
  ['Case Study', 'case-study.html'],
  ['Articles', 'articles.html'],
]);
function buildEventMenu() {
  const wrapper = document.createElement('div');
  wrapper.className = 'topbar-menu';
  const button = document.createElement('button');
  button.className = 'menu-button overflow-menu-button';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Open account menu');
  const overflow = document.createElement('span');
  overflow.setAttribute('aria-hidden', 'true');
  overflow.textContent = '⋮';
  button.append(overflow);
  const panel = document.createElement('nav');
  panel.className = 'menu-panel';
  panel.id = 'events-menu';
  panel.setAttribute('aria-label', 'Application menu');
  button.setAttribute('aria-controls', panel.id);
  EVENT_MENU_LINKS.forEach(([label, href]) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    panel.append(link);
  });
  const logout = document.createElement('button');
  logout.className = 'menu-logout';
  logout.type = 'button';
  logout.textContent = 'Logout';
  panel.append(logout);
  wrapper.append(button, panel);
  return wrapper;
}
function initializeMenu(menuRoot) {
  if (!menuRoot) {
    return;
  }
  const menuButton = menuRoot.querySelector('.menu-button');
  const menuPanel = menuRoot.querySelector('.menu-panel');
  function closeMenu() {
    menuRoot.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open account menu');
    menuPanel.hidden = true;
  }
  // A closed menu must also be absent from keyboard tab order.
  menuPanel.hidden = true;
  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = menuRoot.classList.toggle('open');
    menuPanel.hidden = !isOpen;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close account menu' : 'Open account menu');
  });
  menuPanel.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  const logout = menuPanel.querySelector('.menu-logout');
  logout.addEventListener('click', () => {
    sessionStorage.removeItem(STORAGE_KEYS.authenticated);
    sessionStorage.removeItem(STORAGE_KEYS.authenticatedAt);
    sessionStorage.removeItem(STORAGE_KEYS.currentUsername);
    location.assign('index.html');
  });
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuRoot.classList.contains('open')) {
      closeMenu();
      menuButton.focus();
    }
  });
}
