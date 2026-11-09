import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react';
import { s } from '@/lib/strings';
import type { ApplicationStatus } from '@/lib/types';

export function Spinner() { return <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />; }
export function ErrorMessage({ message }: { message?: string }) {
  return message ? <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm leading-relaxed text-rose-200"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{message}</p></div> : null;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="glass rounded-2xl px-6 py-16 text-center"><span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5 text-gold"><Sparkles size={25} /></span><h3 className="text-xl font-bold">{title}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{description}</p></div>;
}
export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const colors = { pending: 'border-gold/20 bg-gold/10 text-gold', accepted: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', rejected: 'border-rose-400/20 bg-rose-400/10 text-rose-300' };
  return <span className={`badge ${colors[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{s.admin[status]}</span>;
}
