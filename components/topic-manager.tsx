'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, CalendarDays, Pencil, Plus, Power, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { deleteTopic, saveTopic, toggleTopic } from '@/app/actions/admin';
import { reorderTopic } from '@/app/actions/content';
import { TopicDetailsEditor, topicDetails } from '@/components/topic-details-editor';
import { topicSchema } from '@/lib/validation';
import type { Topic } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { s } from '@/lib/strings';
import { EmptyState, ErrorMessage, Spinner } from '@/components/ui';

function localDatetime(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function TopicManager({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const editor = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState<Topic | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [details, setDetails] = useState(topicDetails());
  const [uploadBusy, setUploadBusy] = useState(false);

  function openEditor(topic: Topic | null) {
    setEditing(topic); setDetails(topicDetails(topic)); setError(''); setFormKey(key => key + 1); editor.current?.showModal();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || uploadBusy) return;
    setError('');
    const form = new FormData(event.currentTarget);
    const deadline = String(form.get('deadline') || '');
    const date = deadline ? new Date(deadline) : null;
    if (date && Number.isNaN(date.getTime())) { setError(s.errors.deadline); return; }
    const parsed = topicSchema.safeParse({ ...details, title: form.get('title'), description: form.get('description'), deadline: date?.toISOString() ?? null, is_active: form.get('is_active') === 'on' });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setBusy(true);
    try { const result = await saveTopic(editing?.id ?? null, parsed.data); if (!result.ok) { setError(result.message); return; } toast.success(result.message); editor.current?.close(); router.refresh(); }
    catch { setError(s.errors.connection); }
    finally { setBusy(false); }
  }
  async function toggle(topic: Topic) {
    setBusyId(topic.id);
    try { const result = await toggleTopic(topic.id, !topic.is_active); if (result.ok) { toast.success(result.message); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusyId(null); }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try { const result = await deleteTopic(deleting.id); if (result.ok) { toast.success(result.message); confirmation.current?.close(); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  async function move(id: string, direction: number) {
    if (busyId) return;
    setBusyId(id);
    try { const result = await reorderTopic(id, direction); if (result.ok) { toast.success(result.message); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusyId(null); }
  }
  return <section><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-bold">{s.admin.topicsTab} <span className="ms-2 text-sm font-normal text-muted">({topics.length})</span></h2><button className="btn-primary" onClick={() => openEditor(null)}><Plus size={17} />{s.admin.addTopic}</button></div>{topics.length ? <div className="grid gap-4 md:grid-cols-2">{topics.map((topic, index) => <article key={topic.id} className="glass flex flex-col rounded-2xl p-6"><div className="mb-4 flex items-center justify-between gap-3"><span className={`badge ${topic.is_active ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-white/15 bg-white/5 text-muted'}`}>{topic.is_active ? s.admin.active : s.admin.inactive}</span><span className="flex items-center gap-1.5 text-[10px] text-muted"><CalendarDays size={12} />{topic.deadline ? formatDate(topic.deadline) : s.home.noDeadline}</span></div><h3 className="text-lg font-bold">{topic.title}</h3><p className="line-clamp-3 mb-5 mt-3 text-xs leading-6 text-muted">{topic.description}</p><div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4"><button className="btn-small" onClick={() => openEditor(topic)}><Pencil size={13} />{s.admin.edit}</button><button type="button" className="btn-small" disabled={busyId !== null || index === 0} aria-label={s.special.moveUp} onClick={() => move(topic.id, -1)}><ArrowUp size={14} /></button><button type="button" className="btn-small" disabled={busyId !== null || index === topics.length - 1} aria-label={s.special.moveDown} onClick={() => move(topic.id, 1)}><ArrowDown size={14} /></button><button className="btn-small" disabled={busyId !== null} onClick={() => toggle(topic)}>{busyId === topic.id ? <Spinner /> : <Power size={13} />}{topic.is_active ? s.admin.deactivate : s.admin.activate}</button><button className="btn-small !border-rose-400/20 !text-rose-300" onClick={() => { setDeleting(topic); confirmation.current?.showModal(); }}><Trash2 size={13} />{s.admin.delete}</button></div></article>)}</div> : <EmptyState title={s.home.empty} description={s.admin.noTopics} />}
    <dialog ref={editor} onCancel={event => { if (busy || uploadBusy) event.preventDefault(); }} aria-labelledby="topic-dialog-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-white/15 bg-[#21112e] p-0 text-cream shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"><div className="p-6 sm:p-8"><div className="mb-6 flex items-center justify-between"><h2 id="topic-dialog-title" className="text-xl font-bold">{editing ? s.admin.editTopic : s.admin.newTopic}</h2><button className="btn-small" disabled={busy || uploadBusy} aria-label={s.common.close} onClick={() => editor.current?.close()}><X size={16} /></button></div><form key={formKey} onSubmit={submit} noValidate className="space-y-5"><fieldset disabled={busy || uploadBusy} className="space-y-5"><div><label htmlFor="topic-title" className="field-label">{s.admin.topicTitle}</label><input className="input" id="topic-title" name="title" autoFocus required maxLength={160} defaultValue={editing?.title} /></div><div><label htmlFor="topic-description" className="field-label">{s.admin.topicDescription}</label><textarea className="input" id="topic-description" name="description" rows={6} required maxLength={5000} defaultValue={editing?.description} /></div><div><label htmlFor="topic-deadline" className="field-label">{s.admin.topicDeadline}</label><input className="input" id="topic-deadline" name="deadline" type="datetime-local" defaultValue={localDatetime(editing?.deadline ?? null)} aria-describedby="deadline-help" /><p id="deadline-help" className="mt-2 text-xs text-muted">{s.admin.deadlineHelp}</p></div><TopicDetailsEditor value={details} onChange={setDetails} onUploadBusy={setUploadBusy} /><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} className="h-5 w-5 accent-[#ffc94a]" />{s.admin.active}</label><ErrorMessage message={error} /><div className="flex gap-3"><button type="submit" disabled={busy || uploadBusy} className="btn-primary flex-1">{busy && <Spinner />}{busy ? s.admin.saving : s.admin.save}</button><button type="button" className="btn-secondary" disabled={busy || uploadBusy} onClick={() => editor.current?.close()}>{s.admin.cancel}</button></div></fieldset></form></div></dialog>
    <dialog ref={confirmation} onCancel={event => { if (busy || uploadBusy) event.preventDefault(); }} aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/15 bg-[#21112e] p-7 text-cream shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"><Trash2 size={28} className="mb-5 text-rose-300" /><h2 id="delete-dialog-title" className="text-xl font-bold">{s.admin.deleteTitle}</h2><p className="mt-3 break-words font-semibold text-gold">{deleting?.title}</p><p id="delete-dialog-description" className="mt-3 text-sm leading-7 text-muted">{s.admin.deleteBody}</p><div className="mt-7 flex flex-wrap gap-3"><button className="btn-primary !bg-rose-300" disabled={busy || uploadBusy} onClick={remove}>{busy && <Spinner />}{s.admin.confirmDelete}</button><button className="btn-secondary" disabled={busy || uploadBusy} onClick={() => confirmation.current?.close()}>{s.admin.cancel}</button></div></dialog>
  </section>;
}
