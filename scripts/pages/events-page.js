/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /events-page.js                                                       *
 * Purpose: Renders the browser event list and handles category filtering,     *
 *          search, and event actions.                                         *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// Event filtering and rendering remain page-owned while persistence stays in the shared core module.
function initializeMainPage() {
  if (document.body.dataset.page !== 'main') {
    return;
  }
  if (!currentDemoAccount()) {
    location.replace('index.html');
    return;
  }
  else if (localStorage.getItem(demoAccountStorageKey(STORAGE_KEYS.smsPreference)) === null) {
    location.replace('sms.html');
    return;
  }
  let category = 'all';
  const now = new Date();
  let selectedYear = now.getFullYear();
  let selectedMonth = now.getMonth();
  // An event just saved in another month must be visible after the redirect.
  const requestedMonth = new URLSearchParams(location.search).get('month');
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth || '')) {
    selectedYear = Number(requestedMonth.slice(0, 4));
    selectedMonth = Number(requestedMonth.slice(5, 7)) - 1;
  }
  const monthLabel = document.querySelector('#displayMonth');
  function changeMonth(offset) {
    const next = new Date(selectedYear, selectedMonth + offset, 1);
    selectedYear = next.getFullYear();
    selectedMonth = next.getMonth();
    renderEvents();
  }
  document.querySelector('#previousMonth').addEventListener('click', () => changeMonth(-1));
  document.querySelector('#nextMonth').addEventListener('click', () => changeMonth(1));
  const eventsGrid = document.querySelector('#eventsGrid');
  const eventSearch = document.querySelector('#eventSearch');
  function renderEvents() {
    monthLabel.textContent = new Date(selectedYear, selectedMonth, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const query = eventSearch.value.trim().toLowerCase();
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
    const rows = getEvents()
      .filter((event) => event.fullDate.startsWith(monthKey) &&
        (category === 'all' || event.category === category) &&
        event.title.toLowerCase().includes(query))
      .sort((first, second) => first.fullDate.localeCompare(second.fullDate) ||
        (first.rawTime || '').localeCompare(second.rawTime || '') ||
        first.title.localeCompare(second.title));
    if (rows.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'empty-state';
      emptyState.textContent = query
        ? 'No matching events in this month.'
        : category === 'all'
          ? 'No events scheduled for this month.'
          : 'No events in this category for this month.';
      if (!query && category === 'all') {
        const addLink = document.createElement('a');
        addLink.href = 'add-event.html';
        addLink.textContent = 'Add your first event';
        addLink.className = 'empty-add-link';
        emptyState.append(document.createElement('br'), addLink);
      }
      eventsGrid.replaceChildren(emptyState);
      return;
    }
    eventsGrid.replaceChildren(...rows.map(createEventCard));
  }
  eventSearch.addEventListener('input', renderEvents);
  document.querySelectorAll('.tabs button').forEach((tab) => {
    tab.addEventListener('click', () => {
      document
        .querySelector('.tabs .active')
        .classList.remove('active');
      tab.classList.add('active');
      document.querySelectorAll('.tabs button').forEach((button) => {
        button.setAttribute('aria-pressed', String(button === tab));
      });
      category = tab.dataset.category;
      renderEvents();
    });
  });
  // Permission is requested on the user's explicit welcome-screen choice,
  // not automatically when the events page loads.
  if ('Notification' in window &&
    Notification.permission === 'granted' &&
    localStorage.getItem(demoAccountStorageKey(STORAGE_KEYS.smsPreference)) === 'allowed') {
    // UTC dates can be a day ahead or behind the user's local reminder date.
    const today = localDateKey(new Date());
    getEvents()
      .filter((event) => event.alert &&
      event.fullDate === today)
      .forEach((event) => {
      const notificationKey = `punctuowlity-notified-${currentDemoAccount().id}-${event.id}-${today}`;
      if (!sessionStorage.getItem(notificationKey)) {
        try {
          new Notification(event.title, {
            body: `Scheduled for ${event.time}`,
          });
          sessionStorage.setItem(notificationKey, 'true');
        }
        catch {
          // Notification support/permission can change after the initial check.
        }
      }
    });
  }
  eventsGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.event-card');
    if (!card) {
      return;
    }
    if (event.target.closest('.delete')) {
      const savedEvents = getEvents();
      const selectedEvent = savedEvents.find((storedEvent) => storedEvent.id === card.dataset.id);
      const eventName = selectedEvent?.title || 'this event';
      if (!window.confirm(`Delete "${eventName}"?`)) {
        return;
      }
      const remainingEvents = savedEvents.filter((storedEvent) => storedEvent.id !== card.dataset.id);
      if (!saveEvents(remainingEvents)) {
        showToast('Event could not be deleted in this browser');
        return;
      }
      renderEvents();
      showToast('Event Deleted');
    }
    if (event.target.closest('.edit')) {
      location.assign(`add-event.html?id=${encodeURIComponent(card.dataset.id)}`);
    }
  });
  renderEvents();
}
