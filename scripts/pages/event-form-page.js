/*                                                                              
 *******************************************************************************
 * PunctuOwlity —                                                              *
 * File: /event-form-page.js                                                   *
 * Purpose: Coordinates add/edit event form validation, persistence, and       *
 *          navigation in the browser companion.                               *
 * Author: Alysha Pursley                                                      *
 * Copyright: (c) 2026 Alysha Pursley.                                         *
 * License: Proprietary; see LICENSE.txt                                       *
 *******************************************************************************
 */                                                                             

// Add and edit use the same form path to prevent their validation and stored formats from drifting apart.
function initializeEventFormPage() {
  if (document.body.dataset.page !== 'add') {
    return;
  }
  // Event editing must follow the same signed-in flow as the event list.
  if (!currentDemoAccount()) {
    location.replace('index.html');
    return;
  }
  const params = new URLSearchParams(location.search);
  const eventId = params.get('id');
  const existingEvent = getEvents().find((event) => event.id === eventId);
  let eventWasSaved = false;
  // An invalid edit URL must not silently create a new event.
  if (eventId !== null && !existingEvent) {
    showToast('Event no longer exists');
    location.replace('events.html');
    return;
  }
  // Native date/time controls can display as empty white fields in iOS Safari.
  // A separate, non-interactive text layer always shows the selected values.
  const dateInput = document.querySelector('#eventDate');
  const timeInput = document.querySelector('#eventTime');
  const dateDisplay = document.querySelector('#eventDateDisplay');
  const timeDisplay = document.querySelector('#eventTimeDisplay');

  function updatePickerDisplays() {
    const dateValue = dateInput.value;
    if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      dateDisplay.textContent = new Date(year, month - 1, day)
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    else {
      dateDisplay.textContent = 'Choose a date';
    }
    dateDisplay.classList.toggle('is-placeholder', !dateValue);

    const timeValue = timeInput.value;
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      timeDisplay.textContent = `${hour12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    }
    else {
      timeDisplay.textContent = 'Choose a time';
    }
    timeDisplay.classList.toggle('is-placeholder', !timeValue);
  }

  for (const field of [dateInput, timeInput]) {
    field.addEventListener('input', updatePickerDisplays);
    field.addEventListener('change', updatePickerDisplays);
    field.addEventListener('blur', updatePickerDisplays);
  }

  if (existingEvent) {
    document.querySelector('#eventTitle').value =
      existingEvent.title;
    document.querySelector('#eventAlert').checked =
      existingEvent.alert;
    document.querySelector('#eventDate').value =
      existingEvent.fullDate || '';
    document.querySelector('#eventTime').value =
      existingEvent.rawTime || '';
    const categorySelect = document.querySelector('#eventCategory');
    if (categorySelect &&
      !Array.from(categorySelect.options).some((option) => option.value === existingEvent.category)) {
      const legacyOption = document.createElement('option');
      legacyOption.value = existingEvent.category;
      legacyOption.textContent =
        `Current category (${existingEvent.category})`;
      categorySelect.append(legacyOption);
    }
    if (categorySelect) {
      categorySelect.value = existingEvent.category;
    }
  }
  updatePickerDisplays();
  document
    .querySelector('#eventForm')
    .addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(document.querySelector('#eventForm'));
    // Prevent duplicate records while the successful-save redirect is pending.
    if (eventWasSaved) {
      return;
    }
    const title = document
      .querySelector('#eventTitle')
      .value.trim();
    const dateValue = document.querySelector('#eventDate').value;
    const time = document.querySelector('#eventTime').value;
    if (!title || !dateValue || !time) {
      const requiredFields = [
        document.querySelector('#eventTitle'),
        document.querySelector('#eventDate'),
        document.querySelector('#eventTime'),
      ];
      showFieldError(requiredFields.find((field) => !field.value.trim()), 'All fields are required');
      return;
    }
    const eventDate = new Date(`${dateValue}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
      Number.isNaN(eventDate.getTime()) ||
      eventDate.getFullYear() !== Number(dateValue.slice(0, 4)) ||
      eventDate.getMonth() + 1 !== Number(dateValue.slice(5, 7)) ||
      eventDate.getDate() !== Number(dateValue.slice(8, 10)) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      showToast('Enter a valid date and time');
      return;
    }
    const events = getEvents();
    const item = {
      id: eventId || createUniqueTimestampId(events),
      day: eventDate
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase(),
      date: String(eventDate.getDate()).padStart(2, '0'),
      fullDate: dateValue,
      rawTime: time,
      title,
      time: new Date(`2000-01-01T${time}`)
        .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
        .replace(' ', ''),
      category: document.querySelector('#eventCategory')?.value ||
        existingEvent?.category ||
        'general',
      alert: document.querySelector('#eventAlert').checked,
    };
    const eventIndex = events.findIndex((storedEvent) => storedEvent.id === eventId);
    const isUpdate = eventIndex >= 0;
    if (isUpdate) {
      events[eventIndex] = item;
    }
    else {
      events.push(item);
    }
    if (!saveEvents(events)) {
      showToast('Event could not be saved in this browser');
      return;
    }
    eventWasSaved = true;
    showToast(isUpdate ? 'Event Updated' : 'Event Added');
    setTimeout(() => {
      // Show the month of the saved event, even when it is not this month.
      location.assign(`events.html?month=${encodeURIComponent(dateValue.slice(0, 7))}`);
    }, EVENT_REDIRECT_DELAY_MS);
  });
}
