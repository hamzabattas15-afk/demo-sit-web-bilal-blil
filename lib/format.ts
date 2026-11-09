import { s } from './strings';
import { CLINIC_TOPIC_ID } from './config';

export function topicHref(id: string) { return id === CLINIC_TOPIC_ID ? '/3yada' : `/topic/${id}`; }
export function casablancaWeekday(date = new Date()): number {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Casablanca', weekday: 'long' }).format(date);
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day) + 1;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(s.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Casablanca' }).format(new Date(value));
}
export function renderWhatsappMessage(template: string, name: string, topic: string) {
  return template.replace(/\{(name|topic)\}/g, (_, key: string) => key === 'name' ? name : topic);
}
export function whatsappUrl(phone: string, template: string, name: string, topic: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(renderWhatsappMessage(template, name, topic))}`;
}
export function formatMoroccanPhone(phone: string) {
  const match = /^212([67])([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})$/.exec(phone);
  return match ? `+212 ${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}` : `+${phone}`;
}
/** Quote every cell, preserve newlines, and neutralize spreadsheet formulas. */
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@\t\r\n]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function toCsv(rows: unknown[][]): string {
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
