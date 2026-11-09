'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { deleteClinicMember, saveClinicMember } from '@/app/actions/content';
import { ImageInput } from '@/components/image-input';
import { ManagedImage } from '@/components/managed-image';
import { EmptyState, ErrorMessage, Spinner } from '@/components/ui';
import { clinicMemberSchema } from '@/lib/validation';
import { s } from '@/lib/strings';
import type { ClinicMember } from '@/lib/types';

export function ClinicTeamManager({ members }: { members: ClinicMember[] }) {
  const router = useRouter();
  const editor = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<ClinicMember | null>(null);
  const [deleting, setDeleting] = useState<ClinicMember | null>(null);
  const [photo, setPhoto] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState('');
  function open(member: ClinicMember | null) {
    setEditing(member); setPhoto(member?.photo_url ?? ''); setError(''); setFormKey(value => value + 1); editor.current?.showModal();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || uploadBusy) return;
    const form = new FormData(event.currentTarget);
    const parsed = clinicMemberSchema.safeParse({ name: form.get('name'), role: form.get('role'), bio: form.get('bio'), photo_url: photo, sort_order: Number(form.get('sort_order')), is_active: form.get('is_active') === 'on' });
    if (!parsed.success) { setError(s.clinic.invalid); return; }
    setBusy(true); setError('');
    try { const result = await saveClinicMember(editing?.id ?? null, parsed.data); if (result.ok) { toast.success(result.message); editor.current?.close(); router.refresh(); } else setError(result.message); }
    catch { setError(s.errors.connection); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try { const result = await deleteClinicMember(deleting.id); if (result.ok) { toast.success(result.message); confirmation.current?.close(); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  return <section><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-bold">{s.clinic.teamTitle}</h2><button className="btn-primary" onClick={() => open(null)}><Plus size={16} />{s.clinic.add}</button></div>{members.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{members.map(member => <article key={member.id} className="glass flex flex-col rounded-2xl p-6"><div className="mb-4 flex items-center justify-between gap-3"><div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-emerald-400/10 text-emerald-300">{member.photo_url ? <ManagedImage src={member.photo_url} alt={`${s.images.photo} ${member.name}`} sizes="56px" /> : <Plus size={25} />}</div><span className={`badge ${member.is_active ? 'border-emerald-300/20 text-emerald-300' : 'border-white/15 text-muted'}`}>{member.is_active ? s.admin.active : s.admin.inactive}</span></div><h3 className="text-lg font-bold">{member.name}</h3><p className="mt-2 text-xs text-gold">{member.role}</p><p className="mb-5 mt-3 text-xs leading-6 text-muted">{member.bio}</p><div className="mt-auto flex gap-2"><button className="btn-small" onClick={() => open(member)}><Pencil size={13} />{s.admin.edit}</button><button className="btn-small !text-rose-300" onClick={() => { setDeleting(member); confirmation.current?.showModal(); }}><Trash2 size={13} />{s.admin.delete}</button></div></article>)}</div> : <EmptyState title={s.clinic.teamTitle} description={s.clinic.emptyAdmin} />}
    <dialog ref={editor} aria-labelledby="member-dialog-title" onCancel={event => { if (busy || uploadBusy) event.preventDefault(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-white/15 bg-[#21112e] p-6 text-cream backdrop:bg-black/75 backdrop:backdrop-blur-sm"><div className="mb-6 flex items-center justify-between gap-4"><h2 id="member-dialog-title" className="text-xl font-bold">{editing ? s.clinic.edit : s.clinic.add}</h2><button type="button" className="btn-small" aria-label={s.common.close} disabled={busy || uploadBusy} onClick={() => editor.current?.close()}><X size={16} /></button></div><form key={formKey} onSubmit={save} noValidate><fieldset disabled={busy || uploadBusy} className="space-y-5"><div><label htmlFor="member-name" className="field-label">{s.clinic.name}</label><input id="member-name" name="name" className="input" defaultValue={editing?.name} maxLength={100} autoFocus required /></div><div><label htmlFor="member-role" className="field-label">{s.clinic.role}</label><input id="member-role" name="role" className="input" defaultValue={editing?.role} maxLength={160} required /></div><div><label htmlFor="member-bio" className="field-label">{s.clinic.bio}</label><textarea id="member-bio" name="bio" className="input" rows={4} defaultValue={editing?.bio} minLength={10} maxLength={1000} required /></div><ImageInput value={photo} onChange={setPhoto} onBusyChange={setUploadBusy} /><div><label htmlFor="member-order" className="field-label">{s.special.order}</label><input id="member-order" type="number" name="sort_order" className="input" defaultValue={editing?.sort_order ?? members.length + 1} min={-1000000} max={1000000} /></div><label className="flex items-center gap-3 text-xs"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} className="h-5 w-5 accent-[#ffc94a]" />{s.clinic.active}</label><ErrorMessage message={error} /><div className="flex gap-3"><button type="submit" className="btn-primary flex-1">{busy && <Spinner />}{s.admin.save}</button><button type="button" className="btn-secondary" onClick={() => editor.current?.close()}>{s.admin.cancel}</button></div></fieldset></form></dialog>
    <dialog ref={confirmation} aria-labelledby="member-delete-title" onCancel={event => { if (busy) event.preventDefault(); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/15 bg-[#21112e] p-7 text-cream backdrop:bg-black/75"><h2 id="member-delete-title" className="text-xl font-bold">{s.clinic.deleteTitle}</h2><p className="mt-4 font-semibold text-gold">{deleting?.name}</p><p className="mt-4 text-sm leading-7 text-muted">{s.clinic.deleteBody}</p><div className="mt-6 flex gap-3"><button className="btn-primary !bg-rose-300" disabled={busy} onClick={remove}>{busy && <Spinner />}{s.admin.confirmDelete}</button><button className="btn-secondary" disabled={busy} onClick={() => confirmation.current?.close()}>{s.admin.cancel}</button></div></dialog>
  </section>;
}
