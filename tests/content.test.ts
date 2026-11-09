import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLINIC_TOPIC_ID, MAX_IMAGE_BYTES } from '../lib/config';
import { casablancaWeekday, topicHref } from '../lib/format';
import { imageExtension, isImageLocation } from '../lib/images';
import { extraAnswersSchema, extractExtraAnswers, formFieldsSchema, topicSchema } from '../lib/validation';
import type { FormField } from '../lib/types';

const fields: FormField[] = [
  { key: 'opponent', label: 'Chkoun l khsm?', type: 'text', required: true },
  { key: 'message', label: 'Chno kan lkhilaf?', type: 'textarea', required: true },
  { key: 'relationship', label: 'Chnou nta?', type: 'select', required: true, options: ['a3zeb', 'mkhtoub'] }
];
test('dynamic fields support an opponent, message override, and enumerated choices', () => {
  assert.equal(formFieldsSchema.safeParse(fields).success, true);
  assert.deepEqual(extraAnswersSchema(fields).parse({ opponent: '  Samir  ', relationship: 'a3zeb' }), { opponent: 'Samir', relationship: 'a3zeb' });
});
test('required answers and select choices cannot be bypassed', () => {
  for (const input of [{ relationship: 'a3zeb' }, { opponent: '  ', relationship: 'a3zeb' }, { opponent: 'Samir', relationship: 'invented' }, { opponent: 'Samir', relationship: 'a3zeb', injected: 'x' }]) assert.equal(extraAnswersSchema(fields).safeParse(input).success, false);
});
test('definitions reject duplicate/reserved keys and invalid message overrides', () => {
  for (const definitions of [fields.concat(fields[0]), [{ ...fields[0], key: 'status' }], [{ ...fields[0], key: 'constructor' }], [{ ...fields[0], key: '__proto__' }], [{ ...fields[1], required: false }], [{ ...fields[1], type: 'text' }], [{ ...fields[2], options: ['one'] }], [{ ...fields[2], options: ['one', 'one'] }]]) assert.equal(formFieldsSchema.safeParse(definitions).success, false);
});
test('optional answers can be blank; nonempty long answers require twenty characters', () => {
  const definition: FormField[] = [{ key: 'details', label: 'Details', type: 'textarea', required: false }];
  assert.deepEqual(extraAnswersSchema(definition).parse({}), { details: '' });
  assert.equal(extraAnswersSchema(definition).safeParse({ details: 'short' }).success, false);
  assert.equal(extraAnswersSchema(definition).safeParse({ details: 'x'.repeat(20) }).success, true);
});
test('extra data extraction separates identity from dynamic answers', () => {
  const form = new FormData(); form.set('full_name', 'Samir'); form.set('extra.opponent', 'Karim');
  assert.deepEqual(extractExtraAnswers(form), { opponent: 'Karim' });
});
test('topic editor validates colour, weekday, kind, and image source', () => {
  const topic = { title: "L'M7KAMA", description: '3endek khilaf? 7ki lina chno kan.', deadline: null, is_active: true, kind: 'special', weekday: 5, image_url: '/m7kama-poster.jpeg', badge: 'LIVE', accent_color: '#ffc94a', sort_order: -20, form_fields: fields };
  assert.equal(topicSchema.safeParse(topic).success, true);
  for (const change of [{ weekday: 7 }, { accent_color: 'red; background:url(x)' }, { kind: 'unknown' }, { image_url: 'javascript:alert(1)' }]) assert.equal(topicSchema.safeParse({ ...topic, ...change }).success, false);
});
test('image locations allow HTTPS/public rasters and reject unsafe schemes/traversal', () => {
  for (const path of ['/m7kama-poster.jpeg', '/programme.jpeg', '/images/team.png', 'https://example.com/photo.webp?v=2']) assert.equal(isImageLocation(path), true, path);
  for (const path of ['javascript:alert(1)', 'data:image/png;base64,x', '//evil.test/a.png', '/../private.png', '/x/../../a.jpg', '/image.svg', 'https://user:password@example.com/a.jpg']) assert.equal(isImageLocation(path), false, path);
});
test('upload validation checks signatures, MIME types and the three MB limit', () => {
  const jpg = new Uint8Array([255, 216, 255, 224, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const webp = new TextEncoder().encode('RIFF0000WEBP');
  assert.equal(imageExtension('image/jpeg', 100, jpg), 'jpg');
  assert.equal(imageExtension('image/png', MAX_IMAGE_BYTES, png), 'png');
  assert.equal(imageExtension('image/webp', 100, webp), 'webp');
  assert.equal(imageExtension('image/png', 100, jpg), null);
  assert.equal(imageExtension('image/svg+xml', 100, png), null);
  assert.equal(imageExtension('image/jpeg', MAX_IMAGE_BYTES + 1, jpg), null);
  assert.equal(imageExtension('image/jpeg', 0, jpg), null);
});
test('programme day follows Casablanca midnight independently of host timezone', () => {
  assert.equal(casablancaWeekday(new Date('2025-11-09T23:30:00Z')), 1);
  assert.equal(casablancaWeekday(new Date('2025-11-09T21:30:00Z')), 7);
  assert.equal(casablancaWeekday(new Date('2026-11-06T12:00:00Z')), 5);
});
test('clinic links are bound to the seeded ID rather than an editable title', () => {
  assert.equal(topicHref(CLINIC_TOPIC_ID), '/3yada');
  assert.equal(topicHref('a4f621a2-7bf2-4215-8c32-cb2a06cd0010'), '/topic/a4f621a2-7bf2-4215-8c32-cb2a06cd0010');
});
