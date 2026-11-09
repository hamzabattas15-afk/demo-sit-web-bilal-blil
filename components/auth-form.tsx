'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MailCheck, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { authSchema } from '@/lib/validation';
import { s } from '@/lib/strings';
import { ErrorMessage, Spinner } from '@/components/ui';

export function AuthForm({ linkError }: { linkError: boolean }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkError ? s.errors.authLink : '');
  const [confirmation, setConfirmation] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setError(''); setConfirmation(false);
    const parsed = authSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const client = createClient();
      if (mode === 'signup') {
        const { data, error: signupError } = await client.auth.signUp({ ...parsed.data, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (signupError) { setError(s.errors.account); return; }
        if (!data.session) { setConfirmation(true); return; }
      } else {
        const { error: loginError } = await client.auth.signInWithPassword(parsed.data);
        if (loginError) { setError(loginError.code === 'email_not_confirmed' ? s.errors.confirmEmail : s.errors.login); return; }
      }
      router.replace('/admin'); router.refresh();
    } catch { setError(s.errors.connection); }
    finally { setBusy(false); }
  }
  return <div className="glass rounded-3xl p-6 sm:p-9"><span className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold"><ShieldCheck size={23} /></span><h1 className="text-3xl font-bold tracking-tight">{s.auth.title}</h1><p className="mt-3 text-sm leading-7 text-muted">{s.auth.description}</p><div className="my-7 grid grid-cols-2 rounded-xl border border-white/10 bg-night/60 p-1">{(['login', 'signup'] as const).map(item => <button key={item} type="button" aria-pressed={mode === item} disabled={busy} onClick={() => { setMode(item); setError(''); setConfirmation(false); }} className={`min-h-11 rounded-lg text-xs font-semibold transition ${mode === item ? 'bg-purple-700 text-cream shadow-lg' : 'text-muted hover:text-cream'}`}>{s.auth[item]}</button>)}</div><form onSubmit={submit} noValidate className="space-y-5"><div><label htmlFor="email" className="field-label">{s.auth.email}</label><input className="input text-start" dir="ltr" type="email" id="email" name="email" autoComplete="email" placeholder={s.auth.emailHint} required maxLength={254} disabled={busy} /></div><div><label htmlFor="password" className="field-label">{s.auth.password}</label><input className="input text-start" dir="ltr" type="password" id="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={72} disabled={busy} aria-describedby="password-help" /><p id="password-help" className="mt-2 text-[11px] text-muted">{s.auth.passwordHelp}</p></div><ErrorMessage message={error} />{confirmation && <div role="status" className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-200"><MailCheck size={22} className="mt-1 shrink-0" /><p>{s.auth.confirmation}</p></div>}<button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : <ArrowRight className="-scale-x-100" size={17} />}{busy ? s.auth.loading : s.auth[mode]}</button></form></div>;
}
