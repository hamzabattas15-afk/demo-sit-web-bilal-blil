import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeMoroccanPhone } from '../lib/phone';

test('all requested Moroccan formats normalize to the same private storage format', () => {
  for (const input of ['06 12 34 56 78', '0612345678', '+212612345678', '00212612345678', '212612345678']) {
    assert.equal(normalizeMoroccanPhone(input), '212612345678', input);
  }
});
test('both Moroccan mobile prefixes and whitespace are supported', () => {
  assert.equal(normalizeMoroccanPhone(' 07 12 34 56 78 '), '212712345678');
  assert.equal(normalizeMoroccanPhone('+212 7 12 34 56 78'), '212712345678');
  assert.equal(normalizeMoroccanPhone('00212712345678'), '212712345678');
});
test('reject landlines, other countries, malformed prefixes, letters, and incorrect lengths', () => {
  for (const input of ['', '0512345678', '+33612345678', '612345678', '061234567', '06123456789', 'abc0612345678', '+2120612345678', '+0612345678', '000612345678', '++212612345678', '212812345678', '06/12/34/56/78', '0612345678 ext 5', '0'.repeat(200)]) {
    assert.equal(normalizeMoroccanPhone(input), null, input);
  }
  assert.equal(normalizeMoroccanPhone(null), null);
  assert.equal(normalizeMoroccanPhone(612345678), null);
});
test('normalization is idempotent', () => {
  const phone = normalizeMoroccanPhone('06 12 34 56 78');
  assert.equal(normalizeMoroccanPhone(phone), phone);
});
