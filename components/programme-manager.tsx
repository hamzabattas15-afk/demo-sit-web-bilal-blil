'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveProgrammeImage, saveScheduleDay } from '@/app/actions/content';
import { ImageInput } from '@/components/image-input';
import { Spinner } from '@/components/ui';
import { scheduleDaySchema } from '@/lib/validation';
import { s } from '@/lib/strings';
import type { ScheduleDay } from '@/lib/types';

function DayEditor({ day }: { day: ScheduleDay }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const name = s.programme.days[day.weekday - 1];
  const prefix = `day-${day.weekday}`;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const parsed = scheduleDaySchema.safeParse({ weekday: day.weekday, title: form.get('title'), title_ar: form.get('title_ar'), description: form.get('description'), color: form.get('color'), emoji: form.get('emoji'), is_enabled: form.get('is_enabled') === 'on' });
    if (!parsed.success) { toast.error(s.errors.invalid); return; }
    setBusy(true);
    try { const result = await saveScheduleDay(parsed.data); if (result.ok) { toast.success(result.message); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  return <details className="glass rounded-2xl p-5"><summary className="text-sm font-bold"><span className="ms-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: day.color }} /><span className="ms-3">{name.latin} / <span lang="ar" dir="rtl" className="font-arabic">{name.arabic}</span></span><span className="ms-3 text-lg" aria-hidden="true">{day.emoji}</span></summary><form onSubmit={save} noValidate className="mt-6"><fieldset disabled={busy} className="space-y-4"><div><label htmlFor={`${prefix}-title`} className="field-label">{s.programme.dayTitle}</label><input id={`${prefix}-title`} className="input" name="title" defaultValue={day.title} maxLength={160} required /></div><div><label htmlFor={`${prefix}-ar`} className="field-label">{s.programme.arabicTitle}</label><input id={`${prefix}-ar`} className="input font-arabic" lang="ar" dir="rtl" name="title_ar" defaultValue={day.title_ar} maxLength={160} required /></div><div><label htmlFor={`${prefix}-description`} className="field-label">{s.programme.descriptionLabel}</label><textarea id={`${prefix}-description`} className="input" rows={3} name="description" defaultValue={day.description} minLength={10} maxLength={500} required /></div><div className="grid grid-cols-2 gap-4"><div><label htmlFor={`${prefix}-emoji`} className="field-label">{s.programme.emoji}</label><input id={`${prefix}-emoji`} className="input" name="emoji" defaultValue={day.emoji} maxLength={20} required /></div><div><label htmlFor={`${prefix}-color`} className="field-label">{s.programme.color}</label><input id={`${prefix}-color`} className="input !p-2" type="color" name="color" defaultValue={day.color} /></div></div><label className="flex min-h-11 items-center gap-3 text-xs"><input type="checkbox" name="is_enabled" defaultChecked={day.is_enabled} className="h-5 w-5 accent-[#ffc94a]" />{s.programme.enabled}</label><button type="submit" className="btn-primary" disabled={busy}>{busy ? <Spinner /> : <Save size={15} />}{s.admin.save}</button></fieldset></form></details>;
}
export function ProgrammeManager({ days, initialImage }: { days: ScheduleDay[]; initialImage: string }) {
  const router = useRouter();
  const [image, setImage] = useState(initialImage);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  async function saveImage() {
    if (busy || uploadBusy) return;
    setBusy(true);
    try { const result = await saveProgrammeImage(image); if (result.ok) { toast.success(result.message); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  return <section><h2 className="mb-6 text-xl font-bold">{s.programme.title}</h2><div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]"><div className="space-y-4">{days.map(day => <DayEditor key={day.id} day={day} />)}</div><div className="glass rounded-2xl p-6"><h3 className="mb-5 font-bold">{s.programme.poster}</h3><ImageInput value={image} onChange={setImage} onBusyChange={setUploadBusy} disabled={busy} /><button className="btn-primary mt-5 w-full" disabled={busy || uploadBusy} onClick={saveImage}>{busy ? <Spinner /> : <Save size={15} />}{s.admin.save}</button></div></div></section>;
}
