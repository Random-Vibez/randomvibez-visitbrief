const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const window = { __VISITBRIEF_TEST__: true };
vm.runInNewContext(source, { window, JSON, Date, Number, Object, Array, String }, { filename: 'app.js' });
const api = window.__VISITBRIEF_TEST_API__;
assert(api, 'test API is exposed only in test harness');
const blank = api.blankState();
assert.equal(api.validState(blank), true, 'blank export shape is valid');
const good = { ...blank, appointment: { date: '2026-09-24', type: 'Follow-up' }, topConcern: '<img src=x onerror=alert(1)>', concerns: [{ text: 'A note', when: 'Last week', impact: 'Interrupted plans' }], questions: ['What should I ask?'] };
assert.equal(api.validState(good), true, 'bounded valid state accepted');
assert.equal(api.readCandidate(JSON.stringify(good)).topConcern, good.topConcern, 'text preserved literally for text-only rendering');
for (const [label, invalid] of [
  ['too many concerns', { ...good, concerns: Array.from({ length: 4 }, () => ({ text: 'x', when: '', impact: '' })) }],
  ['too many questions', { ...good, questions: Array(6).fill('Question') }],
  ['invalid calendar date', { ...good, appointment: { date: '2026-02-30', type: '' } }],
  ['unknown schema field', { ...good, surprise: 'field' }],
  ['overlong concern', { ...good, topConcern: 'x'.repeat(301) }],
  ['unsupported appointment type', { ...good, appointment: { date: '', type: 'Emergency' } }],
]) assert.equal(api.validState(invalid), false, `${label} rejected`);
assert.throws(() => api.readCandidate('{"app":"wrong"}'), /valid VisitBrief export/);
assert.equal(api.validState({ ...good, concerns: [{ text: '', when: 'yesterday', impact: '' }] }), true, 'partially entered row can be saved during editing');
console.log('VisitBrief runtime schema checks: PASS (8 assertions)');
