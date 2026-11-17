/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /event-card.js                                                        *
 * Purpose: Constructs reusable event cards with safe DOM text insertion and   *
 *          edit/delete controls.                                              *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// DOM construction keeps user-entered event text out of HTML parsing while reusing one card structure.
function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.dataset.id = event.id;
  const cardTop = document.createElement('div');
  cardTop.className = 'card-top';
  const day = document.createElement('span');
  day.className = 'day';
  day.textContent = event.day;
  const alarm = document.createElement('span');
  alarm.className = `alarm ${event.alert ? 'on' : 'off'}`;
  alarm.title = event.alert ? 'Alert on' : 'Alert off';
  alarm.append(createIconElement(event.alert ? 'alarm-on' : 'alarm-off'));
  const alarmStatus = document.createElement('span');
  alarmStatus.className = 'sr-only';
  alarmStatus.textContent = event.alert
    ? 'Reminder enabled'
    : 'Reminder disabled';
  alarm.append(alarmStatus);
  cardTop.append(day, alarm);
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const editButton = document.createElement('button');
  editButton.className = 'edit';
  editButton.type = 'button';
  editButton.setAttribute('aria-label', `Edit ${event.title}`);
  editButton.append(createIconElement('edit'));
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', `Delete ${event.title}`);
  deleteButton.append(createIconElement('delete'));
  actions.append(editButton, deleteButton);
  const date = document.createElement('span');
  date.className = 'date';
  date.textContent = event.date;
  const title = document.createElement('span');
  title.className = 'event-title';
  title.textContent = event.title;
  const time = document.createElement('span');
  time.className = 'event-time';
  time.textContent = event.time;
  card.append(cardTop, actions, date, title, time);
  return card;
}
