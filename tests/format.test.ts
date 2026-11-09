import assert from 'node:assert/strict';
import { test } from 'node:test';
import { csvCell, formatMoroccanPhone, renderWhatsappMessage, toCsv, whatsappUrl } from '../lib/format';

test('WhatsApp substitutions preserve user text without recursively interpolating it', () => {
  assert.equal(renderWhatsappMessage('Salam {name}, {topic}. {name}!', 'A {topic}', 'L ghorba'), 'Salam A {topic}, L ghorba. A {topic}!');
  const url = new URL(whatsappUrl('212612345678', 'Salam {name}, {topic}', 'Ali & Sara', 'بلال بالليل'));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/212612345678');
  assert.equal(url.searchParams.get('text'), 'Salam Ali & Sara, بلال بالليل');
});
test('accepted Moroccan applications get a valid wa.me link with substituted text', () => {
  const url = new URL(whatsappUrl('212712345678', 'سلام {name}، تقبلنا ليك فموضوع "{topic}"', 'ياسين', 'المحكمة'));
  assert.equal(url.href.startsWith('https://wa.me/212712345678?text='), true);
  assert.equal(url.searchParams.get('text'), 'سلام ياسين، تقبلنا ليك فموضوع "المحكمة"');
});
test('admin contact number is formatted for reading and copying', () => {
  assert.equal(formatMoroccanPhone('212612345678'), '+212 6 12 34 56 78');
  assert.equal(formatMoroccanPhone('212712345678'), '+212 7 12 34 56 78');
});
test('CSV preserves Arabic, quotes, commas, and multiline stories with a UTF-8 BOM', () => {
  assert.equal(toCsv([['Smiya', 'Message'], ['بلال', 'Hello, "world"\nNext line']]), '\uFEFF"Smiya","Message"\r\n"بلال","Hello, ""world""\nNext line"');
});
test('CSV export neutralizes spreadsheet formula injection', () => {
  for (const input of ['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', '  =HYPERLINK("x")', '\tcmd']) assert.ok(csvCell(input).startsWith('"\''));
  assert.equal(csvCell('212612345678'), '"212612345678"');
});
