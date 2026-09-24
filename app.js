const APP_ID = 'visitbrief';
const VERSION = 1;
const STORAGE_KEY = 'visitbrief:v1';
const MAX_STATE = 12000;
const MAX_FILE = 24000;
const FIELD_LIMITS = { topConcern: 300, observations: 500, clinicianContext: 160 };
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (obj, keys) => isRecord(obj) && Object.keys(obj).length === keys.length && keys.every(key => own(obj, key));
const boundedText = (value, max) => typeof value === 'string' && value.length <= max;
const validDate = value => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value);
const blankState = () => ({ app: APP_ID, version: VERSION, appointment: { date: '', type: '' }, topConcern: '', concerns: [], observations: '', questions: [], clinicianContext: '' });
function validState(value) {
  if (!exactKeys(value, ['app', 'version', 'appointment', 'topConcern', 'concerns', 'observations', 'questions', 'clinicianContext'])) return false;
  if (value.app !== APP_ID || value.version !== VERSION || !exactKeys(value.appointment, ['date', 'type'])) return false;
  if (!validDate(value.appointment.date) || !['', 'Routine check-in', 'Follow-up', 'New concern', 'Test or procedure discussion', 'Other'].includes(value.appointment.type)) return false;
  if (!boundedText(value.topConcern, FIELD_LIMITS.topConcern) || !boundedText(value.observations, FIELD_LIMITS.observations) || !boundedText(value.clinicianContext, FIELD_LIMITS.clinicianContext)) return false;
  if (!Array.isArray(value.concerns) || value.concerns.length > 3 || !value.concerns.every(row => exactKeys(row, ['text', 'when', 'impact']) && boundedText(row.text, 180) && boundedText(row.when, 120) && boundedText(row.impact, 180) && (row.text.trim() !== '' || row.when.trim() !== '' || row.impact.trim() !== ''))) return false;
  if (!Array.isArray(value.questions) || value.questions.length > 5 || !value.questions.every(question => boundedText(question, 220) && question.trim() !== '')) return false;
  return JSON.stringify(value).length <= MAX_STATE;
}
function readCandidate(raw) {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!validState(value)) throw new Error('This file is not a valid VisitBrief export.');
  return value;
}
if (typeof window !== 'undefined' && window.__VISITBRIEF_TEST__) window.__VISITBRIEF_TEST_API__ = { validState, readCandidate, blankState, MAX_STATE, MAX_FILE };

if (typeof document !== 'undefined') {
  const $ = selector => document.querySelector(selector);
  const status = $('#status');
  const form = $('#briefForm');
  let state = loadState();
  function loadState() {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? readCandidate(saved) : blankState(); }
    catch { return blankState(); }
  }
  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }
  function addTextSection(parent, heading, value, className) {
    if (!value) return;
    const section = node('section', className || 'brief-section');
    section.append(node('h3', '', heading), node('p', '', value));
    parent.append(section);
  }
  function captureForm() {
    const concerns = [];
    for (let i = 0; i < 3; i += 1) {
      const row = { text: $(`[data-concern="text"][data-index="${i}"]`).value.trim(), when: $(`[data-concern="when"][data-index="${i}"]`).value.trim(), impact: $(`[data-concern="impact"][data-index="${i}"]`).value.trim() };
      if (row.text) concerns.push(row);
    }
    const questions = [];
    for (let i = 0; i < 5; i += 1) { const value = $(`[data-question="${i}"]`).value.trim(); if (value) questions.push(value); }
    return { app: APP_ID, version: VERSION, appointment: { date: $('#appointmentDate').value, type: $('#appointmentType').value }, topConcern: $('#topConcern').value.trim(), concerns, observations: $('#observations').value.trim(), questions, clinicianContext: $('#clinicianContext').value.trim() };
  }
  function paintPreview() {
    const preview = $('#briefPreview');
    preview.replaceChildren();
    const title = node('p', 'paper-kicker', 'VISITBRIEF · APPOINTMENT NOTES');
    const h = node('h2', 'paper-title', 'What I want to discuss');
    preview.append(title, h);
    const meta = [];
    if (state.appointment.date) meta.push(`Date: ${state.appointment.date}`);
    if (state.appointment.type) meta.push(`Visit: ${state.appointment.type}`);
    if (state.clinicianContext) meta.push(`For: ${state.clinicianContext}`);
    if (meta.length) preview.append(node('p', 'paper-meta', meta.join('  ·  ')));
    addTextSection(preview, 'My main concern or goal', state.topConcern, 'brief-section main-point');
    if (state.concerns.length) {
      const section = node('section', 'brief-section');
      section.append(node('h3', '', 'Other concerns and observations'));
      const list = node('ul', 'brief-list');
      state.concerns.forEach(item => {
        const li = node('li', '', item.text || 'Details to add');
        const detail = [item.when ? `When: ${item.when}` : '', item.impact ? `Impact: ${item.impact}` : ''].filter(Boolean).join(' · ');
        if (detail) li.append(node('span', 'detail', detail));
        list.append(li);
      });
      section.append(list); preview.append(section);
    }
    addTextSection(preview, 'Changes and other things I have noticed', state.observations, 'brief-section');
    if (state.questions.length) {
      const section = node('section', 'brief-section'); section.append(node('h3', '', 'Questions I want to ask'));
      const list = node('ol', 'brief-list questions-list');
      state.questions.forEach(question => list.append(node('li', '', question)));
      section.append(list); preview.append(section);
    }
    if (!state.topConcern && !state.concerns.length && !state.observations && !state.questions.length) preview.append(node('p', 'empty-preview', 'Your notes will take shape here. Start with the one thing you most want to discuss.'));
    preview.append(node('p', 'paper-footer', 'A personal conversation aid · In your own words'));
  }
  function persist(next, quiet) {
    try {
      const encoded = JSON.stringify(next);
      if (encoded.length > MAX_STATE) throw new Error('too large');
      localStorage.setItem(STORAGE_KEY, encoded);
      state = next;
      if (!quiet) status.textContent = 'Saved in this browser.';
      return true;
    } catch {
      state = next;
      if (!quiet) status.textContent = 'Preview updated, but this browser could not save it. Export a copy if you want to keep it.';
      return false;
    }
  }
  function onEdit() {
    const next = captureForm();
    const saved = persist(next, true);
    paintPreview();
    status.textContent = saved ? 'Saved in this browser. No information is sent anywhere.' : 'Preview updated, but this browser could not save it. Export a copy if you want to keep it.';
  }
  function fillForm(next) {
    $('#appointmentDate').value = next.appointment.date;
    $('#appointmentType').value = next.appointment.type;
    $('#topConcern').value = next.topConcern;
    $('#observations').value = next.observations;
    $('#clinicianContext').value = next.clinicianContext;
    for (let i = 0; i < 3; i += 1) {
      const row = next.concerns[i] || { text: '', when: '', impact: '' };
      for (const field of ['text', 'when', 'impact']) $(`[data-concern="${field}"][data-index="${i}"]`).value = row[field];
    }
    for (let i = 0; i < 5; i += 1) $(`[data-question="${i}"]`).value = next.questions[i] || '';
    document.querySelectorAll('[data-counter]').forEach(counter => { const field = $(`#${counter.dataset.counter}`); counter.textContent = `${field.value.length} / ${field.maxLength}`; });
  }
  function render() {
    paintPreview();
    document.querySelectorAll('[data-counter]').forEach(counter => { const field = $(`#${counter.dataset.counter}`); counter.textContent = `${field.value.length} / ${field.maxLength}`; });
  }
  function exportFile() {
    const data = JSON.stringify(state, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = node('a', '', 'Download'); link.href = url; link.download = 'visitbrief.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'JSON copy downloaded. It is unencrypted; store it carefully.';
  }
  form.addEventListener('input', event => { const field = event.target; if (field.id && field.maxLength > 0) { const counter = $(`[data-counter="${field.id}"]`); if (counter) counter.textContent = `${field.value.length} / ${field.maxLength}`; } onEdit(); });
  form.addEventListener('change', onEdit);
  $('#printButton').addEventListener('click', () => window.print());
  $('#exportButton').addEventListener('click', exportFile);
  $('#clearButton').addEventListener('click', () => {
    if (!confirm('Clear this VisitBrief from this browser? This cannot be undone.')) return;
    const empty = blankState();
    try { localStorage.removeItem(STORAGE_KEY); } catch { status.textContent = 'Could not clear browser storage. Existing data may remain in this browser.'; return; }
    state = empty; fillForm(state); render(); status.textContent = 'This brief was cleared from this browser.';
  });
  $('#importFile').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0]; event.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE) { status.textContent = 'Import rejected: file is larger than the 24 KB limit. Your current brief is unchanged.'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const candidate = readCandidate(String(reader.result));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
        state = candidate; fillForm(state); render(); status.textContent = 'VisitBrief imported and saved in this browser.';
      } catch { status.textContent = 'Import rejected. Choose an unmodified, valid VisitBrief JSON export. Your current brief is unchanged.'; }
    };
    reader.onerror = () => { status.textContent = 'Could not read that file. Your current brief is unchanged.'; };
    reader.readAsText(file);
  });
  fillForm(state); render();
}
