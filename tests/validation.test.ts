import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applicationSchema, extraAnswersSchema, extractExtraAnswers, templateSchema, topicSchema } from '../lib/validation';

const valid = {
  topic_id: 'a4f621a2-7bf2-4215-8c32-cb2a06cd0001', full_name: '  Yassine Amrani  ', age: '21', city: 'Rabat',
  whatsapp: '06 12 34 56 78', message: 'Hadi l histoire dyali li bghit ncharek m3akoum.', instagram: '@yassine.amrani', website: ''
};
test('shared schema transforms form data into a normalized application', () => {
  const parsed = applicationSchema.parse(valid);
  assert.equal(parsed.full_name, 'Yassine Amrani');
  assert.equal(parsed.whatsapp, '212612345678');
  assert.equal(parsed.age, 21);
  assert.equal(parsed.instagram, 'yassine.amrani');
  assert.equal(applicationSchema.parse({ ...valid, instagram: '' }).instagram, null);
});
test('age boundaries and the minimum message length are enforced', () => {
  for (const age of ['', '14', '100', '15.5', 'NaN']) assert.equal(applicationSchema.safeParse({ ...valid, age }).success, false);
  for (const age of ['15', '99']) assert.equal(applicationSchema.safeParse({ ...valid, age }).success, true);
  assert.equal(applicationSchema.safeParse({ ...valid, message: 'x'.repeat(19) }).success, false);
  assert.equal(applicationSchema.safeParse({ ...valid, message: 'x'.repeat(20) }).success, true);
});
test('invalid IDs, incomplete profiles, and malformed Instagram usernames are rejected', () => {
  for (const change of [{ topic_id: 'invalid' }, { full_name: ' ' }, { city: '' }, { instagram: 'https://instagram.com/test' }]) {
    assert.equal(applicationSchema.safeParse({ ...valid, ...change }).success, false);
  }
});
test('normal, court, and clinic forms normalize WhatsApp and validate their extra answers', () => {
  const normalPhone = applicationSchema.parse({ ...valid, whatsapp: '+212 6 12 34 56 78' }).whatsapp;
  assert.match(normalPhone, /^212[67][0-9]{8}$/);
  assert.deepEqual(extraAnswersSchema([]).parse({}), {});

  const court = new FormData();
  court.append('extra.opponent', 'الطرف الثاني');
  assert.deepEqual(extraAnswersSchema([
    { key: 'opponent', label: 'شكون هو الخصم؟', type: 'text', required: true },
    { key: 'message', label: 'شنو كان الخلاف؟', type: 'textarea', required: true }
  ]).parse(extractExtraAnswers(court)), { opponent: 'الطرف الثاني' });

  const clinic = new FormData();
  clinic.append('extra.relationship', 'فعلاقة');
  assert.deepEqual(extraAnswersSchema([
    { key: 'message', label: 'شنو المشكل؟', type: 'textarea', required: true },
    { key: 'relationship', label: 'شنو الحالة ديالك؟', type: 'select', required: true, options: ['عازب', 'مخطوب', 'فعلاقة', 'متفرقين'] }
  ]).parse(extractExtraAnswers(clinic)), { relationship: 'فعلاقة' });
});
test('topic deadlines require real ISO datetimes and templates require both variables', () => {
  assert.equal(topicSchema.safeParse({ title: 'L ghorba', description: '7ki lina 3la tajriba dyalek f l ghorba.', deadline: 'tomorrow', is_active: true }).success, false);
  assert.equal(templateSchema.safeParse('Salam {name}, t9belti f {topic}.').success, true);
  assert.equal(templateSchema.safeParse('Salam, t9belti f l programme.').success, false);
});
