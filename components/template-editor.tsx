'use client';
import { useState } from 'react';
import { MessageCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { saveTemplate } from '@/app/actions/admin';
import { templateSchema } from '@/lib/validation';
import { renderWhatsappMessage } from '@/lib/format';
import { s } from '@/lib/strings';
import { Spinner } from '@/components/ui';

export function TemplateEditor({ initialTemplate }: { initialTemplate: string }) {
  const [value, setValue] = useState(initialTemplate);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function save() {
    const parsed = templateSchema.safeParse(value);
    if (!parsed.success) { toast.error(s.errors.template); return; }
    setBusy(true);
    try { const result = await saveTemplate(parsed.data); if (result.ok) { toast.success(result.message); router.refresh(); } else toast.error(result.message); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  return <section className="glass rounded-2xl p-6 sm:p-8"><div className="mb-7 flex items-start gap-4"><span className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><MessageCircle size={24} /></span><div><h2 className="text-xl font-bold">{s.admin.templateTitle}</h2><p className="mt-2 max-w-xl text-xs leading-6 text-muted">{s.admin.templateDescription}</p></div></div><div className="grid gap-8 lg:grid-cols-2"><div><label htmlFor="template" className="field-label">{s.admin.templateLabel}</label><textarea id="template" rows={7} value={value} maxLength={2000} disabled={busy} onChange={event => setValue(event.target.value)} className="input" aria-describedby="template-help" /><p id="template-help" className="mt-3 text-xs text-muted">{s.admin.templateHelp}</p><button className="btn-primary mt-5" disabled={busy} onClick={save}>{busy ? <Spinner /> : <Save size={15} />}{busy ? s.admin.saving : s.admin.save}</button></div><div className="rounded-2xl border border-white/10 bg-night/50 p-5"><p className="mb-5 text-[10px] font-bold uppercase tracking-[.15em] text-muted">{s.admin.preview}</p><div className="rounded-2xl rounded-tr-none border border-emerald-400/15 bg-emerald-400/10 p-5 text-sm leading-7 text-emerald-100"><p className="whitespace-pre-wrap break-words">{renderWhatsappMessage(value, s.admin.previewName, s.admin.previewTopic)}</p></div><p className="mt-5 text-[11px] leading-6 text-muted">{s.admin.manualSend}</p></div></div></section>;
}
