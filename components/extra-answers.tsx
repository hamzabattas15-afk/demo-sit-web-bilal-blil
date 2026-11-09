import { s } from '@/lib/strings';
import type { FormField } from '@/lib/types';

export function ExtraAnswers({ answers, fields }: { answers: Record<string, string>; fields: FormField[] }) {
  const entries = Object.entries(answers).filter(([, value]) => value);
  if (!entries.length) return null;
  return <div className="mt-4 rounded-xl border border-gold/10 bg-gold/[.025] p-4"><h4 className="mb-4 text-xs font-bold text-gold">{s.dynamicForm.answers}</h4><dl className="space-y-4">{entries.map(([key, value]) => <div key={key}><dt className="text-xs font-semibold text-muted">{fields.find(field => field.key === key)?.label ?? `${s.dynamicForm.deletedField} (${key})`}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-cream">{value}</dd></div>)}</dl></div>;
}
