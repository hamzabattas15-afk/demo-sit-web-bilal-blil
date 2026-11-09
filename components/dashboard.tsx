'use client';
import { useEffect, useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCheck, ChevronLeft, ChevronRight, Clock3, Copy, Download, LayoutGrid, ListFilter, MapPin, MessageCircle, RefreshCw, Search, Undo2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { setApplicationStatus } from '@/app/actions/admin';
import { SignOutButton } from '@/components/admin-access';
import { TopicManager } from '@/components/topic-manager';
import { TemplateEditor } from '@/components/template-editor';
import { ProgrammeManager } from '@/components/programme-manager';
import { ClinicTeamManager } from '@/components/clinic-team-manager';
import { ExtraAnswers } from '@/components/extra-answers';
import { EmptyState, Spinner, StatusBadge } from '@/components/ui';
import { formatDate, formatMoroccanPhone, whatsappUrl } from '@/lib/format';
import { PAGE_SIZE } from '@/lib/config';
import { s } from '@/lib/strings';
import type { Application, ApplicationStatus, ClinicMember, Counts, ScheduleDay, Topic } from '@/lib/types';

type Filters = { topic: string; status: ApplicationStatus | ''; search: string; page: number };
type Props = { email: string; topics: Topic[]; applications: Application[]; counts: Counts; perTopic: Record<string, number>; template: string; filters: Filters; total: number; schedule: ScheduleDay[]; team: ClinicMember[]; programmeImage: string };
type ApplicationWithTopic = Application & { topic: { title: string } | null };

export function Dashboard({ email, topics, applications, counts: initialCounts, perTopic, template, filters, total, schedule, team, programmeImage }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'applications' | 'topics' | 'programme' | 'team' | 'settings'>('applications');
  const [rows, setRows] = useState<ApplicationWithTopic[]>(applications as ApplicationWithTopic[]);
  const [counts, setCounts] = useState(initialCounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState(filters.search);
  const [navigating, startTransition] = useTransition();
  useEffect(() => setRows(applications as ApplicationWithTopic[]), [applications]);
  useEffect(() => setCounts(initialCounts), [initialCounts]);
  useEffect(() => setSearch(filters.search), [filters.search]);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const topicMap = new Map(topics.map(topic => [topic.id, topic]));
  const visibleRows = filters.status ? rows.filter(row => row.status === filters.status) : rows;

  function navigate(changes: Partial<Filters>) {
    const next = { ...filters, search, page: 1, ...changes };
    const params = new URLSearchParams();
    if (next.topic) params.set('topic', next.topic);
    if (next.status) params.set('status', next.status);
    if (next.search.trim()) params.set('q', next.search.trim());
    if (next.page > 1) params.set('page', String(next.page));
    startTransition(() => router.replace(`/admin${params.size ? `?${params}` : ''}`, { scroll: false }));
  }
  function searchSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); navigate({ search }); }
  async function changeStatus(row: Application, status: ApplicationStatus) {
    if (busyId || row.status === status) return;
    const previousRows = rows;
    const previousCounts = counts;
    setBusyId(row.id);
    setRows(current => current.map(item => item.id === row.id ? { ...item, status } : item));
    setCounts(current => ({ ...current, [row.status]: current[row.status] - 1, [status]: current[status] + 1 }));
    try {
      const result = await setApplicationStatus(row.id, status);
      if (!result.ok) { setRows(previousRows); setCounts(previousCounts); toast.error(result.message); return; }
      toast.success(result.message); router.refresh();
    } catch { setRows(previousRows); setCounts(previousCounts); toast.error(s.errors.connection); }
    finally { setBusyId(null); }
  }
  async function exportCsv() {
    if (!filters.topic) { toast.error(s.admin.exportTopic); return; }
    setExporting(true);
    try {
      const response = await fetch(`/admin/export?topic=${encodeURIComponent(filters.topic)}`, { cache: 'no-store' });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/csv')) throw new Error('export_failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `srada-${filters.topic}.csv`; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(s.admin.exported);
    } catch { toast.error(s.errors.connection); }
    finally { setExporting(false); }
  }

  async function copyPhone(phone: string) {
    try { await navigator.clipboard.writeText(formatMoroccanPhone(phone)); toast.success(s.admin.phoneCopied); }
    catch { toast.error(s.errors.generic); }
  }

  const summary = [
    { key: 'total' as const, title: s.admin.total, icon: Users, color: 'text-cream' },
    { key: 'pending' as const, title: s.admin.pending, icon: Clock3, color: 'text-gold' },
    { key: 'accepted' as const, title: s.admin.accepted, icon: CheckCheck, color: 'text-emerald-300' },
    { key: 'rejected' as const, title: s.admin.rejected, icon: X, color: 'text-rose-300' }
  ];
  const tabs = [
    { key: 'applications' as const, title: s.admin.applicationsTab, icon: Users },
    { key: 'topics' as const, title: s.admin.topicsTab, icon: LayoutGrid },
    { key: 'programme' as const, title: s.programme.tab, icon: Clock3 },
    { key: 'team' as const, title: s.clinic.tab, icon: Users },
    { key: 'settings' as const, title: s.admin.settingsTab, icon: MessageCircle }
  ];
  function tabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex(item => item.key === tab);
    let next = current;
    if (event.key === 'ArrowLeft') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowRight') next = (current + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next].key);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
  return <>
    <div className="mb-9 flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow">{s.admin.eyebrow}</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{s.admin.title}</h1><p className="mt-3 text-xs leading-6 text-muted">{s.admin.subtitle}</p></div><div className="flex flex-col items-end gap-3"><SignOutButton /><p dir="ltr" className="max-w-[240px] truncate text-start text-[10px] text-muted">{email}</p></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summary.map(({ key, title, icon: Icon, color }) => <button key={key} onClick={() => { setTab('applications'); navigate({ status: key === 'total' ? '' : key, topic: '', search: '' }); }} className="glass rounded-2xl p-5 text-start transition hover:border-gold/35"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-medium text-muted sm:text-xs">{title}</span><Icon size={18} className={color} /></div><p className={`mt-4 text-3xl font-bold ${color}`}>{counts[key].toLocaleString(s.locale)}</p></button>)}</div>
    {topics.length > 0 && <details className="mt-4 rounded-xl border border-white/10 bg-white/[.02] px-5 py-4"><summary className="text-xs font-medium text-muted">{s.admin.perTopic}</summary><div className="mt-4 flex flex-wrap gap-2">{topics.map(topic => <button key={topic.id} onClick={() => { setTab('applications'); navigate({ topic: topic.id, status: '', search: '' }); }} className="btn-small !justify-between gap-4"><span className="max-w-56 truncate">{topic.title}</span><span className="text-gold">{perTopic[topic.id] ?? 0}</span></button>)}</div></details>}
    <div role="tablist" aria-label={s.admin.dashboard} onKeyDown={tabKeyDown} className="my-8 flex gap-1 overflow-x-auto border-b border-white/10">{tabs.map(({ key, title, icon: Icon }) => <button key={key} role="tab" id={`tab-${key}`} tabIndex={tab === key ? 0 : -1} aria-controls={`panel-${key}`} aria-selected={tab === key} onClick={() => setTab(key)} className={`inline-flex min-h-14 shrink-0 items-center gap-2 border-b-2 px-4 text-xs font-semibold transition sm:px-6 ${tab === key ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-cream'}`}><Icon size={15} />{title}</button>)}</div>
    {tab === 'applications' && <section role="tabpanel" id="panel-applications" aria-labelledby="tab-applications" aria-busy={navigating}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold"><ListFilter size={18} className="text-gold" />{s.admin.applicationsTab}<span className="text-xs font-normal text-muted">({total})</span></h2><div className="flex flex-wrap gap-2"><button onClick={() => startTransition(() => router.refresh())} disabled={navigating} className="btn-small"><RefreshCw size={14} className={navigating ? 'animate-spin' : ''} />{s.admin.refresh}</button><button className="btn-small !border-gold/25 !text-gold" disabled={!filters.topic || exporting} onClick={exportCsv} title={s.admin.exportTopic}>{exporting ? <Spinner /> : <Download size={14} />}{exporting ? s.admin.exporting : s.admin.export}</button></div></div>
      <form onSubmit={searchSubmit} className="glass mb-5 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_1fr_1.2fr]"><div><label htmlFor="filter-topic" className="sr-only">{s.admin.filterTopic}</label><select id="filter-topic" value={filters.topic} disabled={navigating} onChange={event => navigate({ topic: event.target.value })} className="input !text-xs"><option value="">{s.admin.allTopics}</option>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></div><div><label htmlFor="filter-status" className="sr-only">{s.admin.filterStatus}</label><select id="filter-status" value={filters.status} disabled={navigating} onChange={event => navigate({ status: event.target.value as Filters['status'] })} className="input !text-xs"><option value="">{s.admin.allStatuses}</option>{(['pending', 'accepted', 'rejected'] as const).map(status => <option key={status} value={status}>{s.admin[status]}</option>)}</select></div><div className="flex gap-2"><label htmlFor="search-name" className="sr-only">{s.admin.searchLabel}</label><input id="search-name" className="input min-w-0 !text-xs" value={search} onChange={event => setSearch(event.target.value)} placeholder={s.admin.search} maxLength={100} /><button type="submit" disabled={navigating} className="btn-small !min-w-12" aria-label={s.admin.searchLabel}><Search size={17} /></button></div></form>
      {visibleRows.length === 0 ? <EmptyState title={s.admin.noApplications} description={s.admin.noApplicationsBody} /> : <div className={`overflow-hidden rounded-2xl border border-white/10 transition-opacity ${navigating ? 'opacity-50' : ''}`}><div className="hidden grid-cols-[1.1fr_1.3fr_.9fr_1.4fr] gap-5 border-b border-white/10 bg-white/5 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted lg:grid"><span>{s.admin.application}</span><span>{s.admin.contact}</span><span>{s.admin.status}</span><span>{s.admin.actions}</span></div><div className="divide-y divide-white/10">{visibleRows.map(row => {
        const topicTitle = row.topic?.title ?? topicMap.get(row.topic_id)?.title ?? s.admin.unavailable;
        const isBusy = busyId === row.id;
        return <article key={row.id} className="bg-white/[.025] p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-[1.1fr_1.3fr_.9fr_1.4fr]"><div className="min-w-0"><h3 className="break-words text-sm font-bold">{row.full_name}</h3><p className="mt-1.5 flex items-center gap-1 text-xs text-muted"><MapPin size={11} />{row.city}<span className="mx-1">·</span>{row.age} {s.admin.years}</p><p className="mt-2 break-words text-[10px] leading-5 text-gold/90">{topicTitle}</p><p className="mt-1 text-[10px] text-muted/80">{s.admin.submitted} {formatDate(row.created_at)}</p></div><div><div className="flex items-center gap-2"><p className="text-start text-xs font-medium text-cream" dir="ltr">{formatMoroccanPhone(row.whatsapp)}</p><button type="button" className="btn-small !min-h-8 !px-2 !py-1" aria-label={s.admin.copyPhone} title={s.admin.copyPhone} onClick={() => copyPhone(row.whatsapp)}><Copy size={13} /></button></div>{row.instagram && <a href={`https://www.instagram.com/${encodeURIComponent(row.instagram)}/`} target="_blank" rel="noopener noreferrer" dir="ltr" className="mt-2 inline-block text-start text-xs text-muted underline decoration-white/20 underline-offset-4 hover:text-gold">@{row.instagram}</a>}</div><div className="flex items-start gap-2"><StatusBadge status={row.status} />{isBusy && <Spinner />}</div><div className="flex flex-col items-start gap-2"><div className="flex flex-wrap gap-2">{row.status !== 'accepted' && <button className="btn-small !border-emerald-400/20 !text-emerald-300" disabled={busyId !== null} onClick={() => changeStatus(row, 'accepted')}><Check size={13} />{s.admin.accept}</button>}{row.status !== 'rejected' && <button className="btn-small !border-rose-400/20 !text-rose-300" disabled={busyId !== null} onClick={() => changeStatus(row, 'rejected')}><X size={13} />{s.admin.reject}</button>}{row.status !== 'pending' && <button className="btn-small" disabled={busyId !== null} onClick={() => changeStatus(row, 'pending')}><Undo2 size={13} />{s.admin.undo}</button>}</div>{row.status === 'accepted' && !isBusy && <a className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#052e16] transition hover:bg-emerald-400" href={whatsappUrl(row.whatsapp, template, row.full_name, topicTitle)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} />{s.admin.whatsapp}</a>}</div></div><details className="mt-4 border-t border-white/[.07] pt-3"><summary className="min-h-8 text-xs font-medium text-muted hover:text-gold">{s.admin.details}</summary><p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-night/60 p-4 text-xs leading-7 text-cream/90">{row.message}</p><ExtraAnswers answers={row.extra} fields={topicMap.get(row.topic_id)?.form_fields ?? []} /></details></article>;
      })}</div></div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-[11px] text-muted">{total ? (filters.page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(filters.page * PAGE_SIZE, total)} {s.admin.of} {total} {s.admin.results}</p><div className="flex items-center gap-3"><button className="btn-small" disabled={filters.page <= 1 || navigating} onClick={() => navigate({ page: filters.page - 1 })} aria-label={s.admin.previous}><ChevronLeft className="-scale-x-100" size={16} /></button><span className="text-xs text-muted">{s.admin.page} {filters.page} {s.admin.of} {lastPage}</span><button className="btn-small" disabled={filters.page >= lastPage || navigating} onClick={() => navigate({ page: filters.page + 1 })} aria-label={s.admin.next}><ChevronRight className="-scale-x-100" size={16} /></button></div></div>
    </section>}
    {tab === 'topics' && <div role="tabpanel" id="panel-topics" aria-labelledby="tab-topics"><TopicManager topics={topics} /></div>}
    {tab === 'programme' && <div role="tabpanel" id="panel-programme" aria-labelledby="tab-programme"><ProgrammeManager key={programmeImage} days={schedule} initialImage={programmeImage} /></div>}
    {tab === 'team' && <div role="tabpanel" id="panel-team" aria-labelledby="tab-team"><ClinicTeamManager members={team} /></div>}
    {tab === 'settings' && <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings"><TemplateEditor key={template} initialTemplate={template} /></div>}
  </>;
}
