'use client';
import { useId, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/app/actions/content';
import { MAX_IMAGE_BYTES } from '@/lib/config';
import { s } from '@/lib/strings';
import { isImageLocation } from '@/lib/images';
import { ManagedImage } from '@/components/managed-image';
import { Spinner } from '@/components/ui';

export function ImageInput({ value, onChange, onBusyChange, disabled = false }: { value: string; onChange: (value: string) => void; onBusyChange: (value: boolean) => void; disabled?: boolean }) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > MAX_IMAGE_BYTES) { toast.error(s.images.invalid); return; }
    setBusy(true); onBusyChange(true);
    try {
      const form = new FormData(); form.set('file', file);
      const result = await uploadImage(form);
      if (result.ok && result.url) { onChange(result.url); toast.success(result.message); }
      else toast.error(result.message);
    } catch { toast.error(s.images.failure); }
    finally { setBusy(false); onBusyChange(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  return <div className="space-y-3"><label htmlFor={`${id}-url`} className="field-label">{s.images.url}</label><input id={`${id}-url`} value={value} onChange={event => onChange(event.target.value)} disabled={busy || disabled} className="input text-start" dir="ltr" maxLength={2048} aria-describedby={`${id}-help`} /><p id={`${id}-help`} className="text-[11px] leading-5 text-muted">{s.images.urlHelp}</p><div className="flex flex-wrap items-center gap-3"><label className={`btn-small cursor-pointer ${busy || disabled ? 'pointer-events-none opacity-50' : ''}`} htmlFor={`${id}-file`}>{busy ? <Spinner /> : <Upload size={14} />}{busy ? s.images.uploading : s.images.upload}</label><input ref={fileInput} id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || disabled} onChange={event => upload(event.target.files?.[0])} /><span className="text-[10px] text-muted">{s.images.help}</span>{value && <button type="button" className="btn-small" disabled={busy || disabled} onClick={() => onChange('')} aria-label={s.images.remove}><X size={13} /></button>}</div>{value && isImageLocation(value) && <div className="relative h-44 overflow-hidden rounded-xl border border-gold/20"><ManagedImage src={value} alt={s.images.preview} className="object-contain" sizes="400px" /></div>}</div>;
}
