'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, LockKeyhole, Send } from 'lucide-react';
import { submitApplication } from '@/app/actions/application';
import { applicationSchema, extraAnswersSchema, extractExtraAnswers } from '@/lib/validation';
import type { FormField } from '@/lib/types';
import { s } from '@/lib/strings';
import { ErrorMessage, Spinner } from '@/components/ui';

export function ApplicationForm({ topicId, formFields = [], title = s.topic.formTitle }: { topicId: string; formFields?: FormField[]; title?: string }) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [length, setLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const messageLabel = formFields.find(field => field.key === 'message')?.label ?? s.topic.message;

  function fieldError(name: string) { return fields[name]?.[0] ? <p className="field-error" id={`${name}-error`}>{fields[name][0]}</p> : null; }
  function accessibility(name: string, help?: string) { return { 'aria-invalid': Boolean(fields[name]), 'aria-describedby': [help, fields[name] ? `${name}-error` : undefined].filter(Boolean).join(' ') || undefined }; }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(''); setFields({});
    const form = new FormData(event.currentTarget);
    const parsed = applicationSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFields(errors); setError(s.errors.invalid);
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    const extra = extraAnswersSchema(formFields).safeParse(extractExtraAnswers(form));
    if (!extra.success) {
      const errors = Object.fromEntries(Object.entries(extra.error.flatten().fieldErrors).map(([key, value]) => [`extra.${key}`, value ?? []]));
      setFields(errors); setError(s.errors.invalid);
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const result = await submitApplication(form);
      if (result.ok) {
        setSuccess(true);
        requestAnimationFrame(() => { successRef.current?.focus(); successRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
      } else { setError(result.message); setFields(result.fieldErrors ?? {}); }
    } catch { setError(s.errors.connection); }
    finally { setBusy(false); }
  }
  if (success) return <div ref={successRef} tabIndex={-1} role="status" className="glass rounded-3xl px-6 py-14 text-center outline-none sm:px-10"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold"><Check size={38} /></span><p className="eyebrow mt-7">{s.topic.successTag}</p><h2 className="mt-4 text-3xl font-bold">{s.topic.successTitle}</h2><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">{s.topic.successBody}</p><Link href="/#topics" className="btn-primary mt-8">{s.topic.more}<ArrowRight className="-scale-x-100" size={16} /></Link></div>;
  return <form ref={formRef} onSubmit={submit} noValidate className="glass rounded-3xl p-6 sm:p-9">
    <h2 className="text-xl font-bold sm:text-2xl">{title}</h2><p className="mb-8 mt-2 text-xs text-muted">{s.topic.requiredNote}</p>
    <input type="hidden" name="topic_id" value={topicId} />
    <div aria-hidden="true" className="absolute -start-[10000px] top-auto h-px w-px overflow-hidden"><label htmlFor="website">{s.topic.website}</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <fieldset disabled={busy} className="space-y-6">
      <div><label htmlFor="full_name" className="field-label">{s.topic.name} <span className="text-gold">*</span></label><input id="full_name" name="full_name" required maxLength={100} autoComplete="name" placeholder={s.topic.nameHint} className="input" {...accessibility('full_name')} />{fieldError('full_name')}</div>
      <div className="grid grid-cols-[100px_1fr] gap-4 sm:grid-cols-[140px_1fr]"><div><label htmlFor="age" className="field-label">{s.topic.age} <span className="text-gold">*</span></label><input id="age" name="age" type="number" dir="ltr" min={15} max={99} required inputMode="numeric" className="input" {...accessibility('age')} />{fieldError('age')}</div><div><label htmlFor="city" className="field-label">{s.topic.city} <span className="text-gold">*</span></label><input id="city" name="city" required maxLength={80} autoComplete="address-level2" placeholder={s.topic.cityHint} className="input" {...accessibility('city')} />{fieldError('city')}</div></div>
      <div><label htmlFor="whatsapp" className="field-label">{s.topic.whatsapp} <span className="text-gold">*</span></label><input id="whatsapp" name="whatsapp" type="tel" dir="ltr" required maxLength={40} autoComplete="tel" inputMode="tel" placeholder={s.topic.phoneHint} className="input" {...accessibility('whatsapp', 'phone-help')} /><p id="phone-help" className="mt-2 text-[11px] text-muted">{s.topic.phoneHelp}</p>{fieldError('whatsapp')}</div>
      <div><label htmlFor="message" className="field-label">{messageLabel} <span className="text-gold">*</span></label><textarea id="message" name="message" required minLength={20} maxLength={5000} rows={6} placeholder={s.topic.messageHint} onChange={event => setLength(event.target.value.length)} className="input" {...accessibility('message', 'message-help')} /><div className="mt-2 flex justify-between gap-3 text-[11px] text-muted"><p id="message-help">{s.topic.messageHelp}</p><span>{length}/5000</span></div>{fieldError('message')}</div>
      {formFields.filter(field => field.key !== 'message').map(field => {
        const name = `extra.${field.key}`;
        const props = { id: name, name, required: field.required, className: 'input', ...accessibility(name) };
        return <div key={field.key}><label htmlFor={name} className="field-label">{field.label} {field.required ? <span className="text-gold">*</span> : <span className="text-xs font-normal text-muted">{s.topic.optional}</span>}</label>{field.type === 'select' ? <select {...props} defaultValue=""><option value="">{s.dynamicForm.choose}</option>{field.options?.map(option => <option value={option} key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea {...props} rows={4} minLength={field.required ? 20 : undefined} maxLength={5000} /> : <input {...props} type="text" maxLength={500} />}{fieldError(name)}</div>;
      })}
      <div><label htmlFor="instagram" className="field-label">{s.topic.instagram} <span className="ms-1 text-xs font-normal text-muted">{s.topic.optional}</span></label><input id="instagram" name="instagram" dir="ltr" className="input text-start" maxLength={31} autoCapitalize="none" autoComplete="off" placeholder={s.topic.instagramHint} {...accessibility('instagram')} />{fieldError('instagram')}</div>
      <ErrorMessage message={error} />
      <div className="border-t border-white/10 pt-6"><p className="mb-5 text-[11px] leading-6 text-muted">{s.topic.consent}</p><button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <Spinner /> : <Send size={17} />}{busy ? s.topic.sending : s.topic.send}</button><p className="mt-4 flex items-start justify-center gap-2 text-center text-[10px] leading-5 text-muted"><LockKeyhole size={13} className="mt-1 shrink-0 text-gold/80" />{s.topic.privacy}</p></div>
    </fieldset>
  </form>;
}
