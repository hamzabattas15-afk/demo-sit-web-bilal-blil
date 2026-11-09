import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, HeartPulse, Plus, Stethoscope } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CLINIC_TOPIC_ID } from '@/lib/config';
import { s } from '@/lib/strings';
import { ApplicationForm } from '@/components/application-form';
import { ManagedImage } from '@/components/managed-image';
import { ErrorMessage } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: s.clinic.title, description: s.clinic.intro };
export default async function ClinicPage() {
  const supabase = createClient();
  const [topicResult, teamResult] = await Promise.all([
    supabase.from('topics').select('*').eq('id', CLINIC_TOPIC_ID).maybeSingle(),
    supabase.from('clinic_team').select('*').eq('is_active', true).order('sort_order').order('id')
  ]);
  const topic = topicResult.data;
  const open = topic?.is_active && (!topic.deadline || Date.parse(topic.deadline) > Date.now());
  return <main id="main" className="container-page py-10 sm:py-14"><Link href="/" className="mb-8 inline-flex min-h-10 items-center gap-2 text-xs text-muted hover:text-gold"><ArrowLeft className="-scale-x-100" size={14} />{s.common.backHome}</Link>
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200/40 bg-[#effcf5] p-7 text-[#113d31] shadow-[0_0_70px_#22c55e12] sm:p-12"><div className="absolute -end-12 -top-12 h-64 w-64 rounded-full bg-emerald-100/70" aria-hidden="true" /><div className="relative grid items-center gap-8 md:grid-cols-[1fr_240px]"><div><p className="text-[10px] font-bold tracking-[.18em] text-emerald-800">{s.clinic.eyebrow}</p><div className="mt-5 flex items-center gap-3"><Plus size={36} strokeWidth={5} className="shrink-0 text-emerald-600" /><h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{s.clinic.title}</h1></div><p className="mt-5 text-lg font-semibold text-emerald-900">{s.clinic.intro}</p><p className="mt-4 max-w-xl text-sm leading-7 text-emerald-950/75">{s.clinic.description}</p><Link href="#clinic-apply" className="btn-primary mt-7 !bg-emerald-700 !text-white hover:!bg-emerald-800">{s.clinic.apply}<ArrowDown size={16} /></Link></div><div className="flex flex-col items-center gap-5"><div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm"><HeartPulse size={83} strokeWidth={1.4} className="text-emerald-600" /><Stethoscope size={50} strokeWidth={1.7} className="absolute -bottom-2 end-1 rounded-xl bg-[#effcf5] p-1 text-emerald-900" /></div><div className="-rotate-3 rounded-xl border-2 border-emerald-700/25 bg-white px-5 py-3 text-center shadow-sm"><p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">{s.clinic.reception}</p><p className="mt-1 text-sm font-bold">{s.clinic.sign}</p></div></div></div><svg aria-hidden="true" className="mt-10 h-12 w-full text-emerald-600/60" viewBox="0 0 900 70" fill="none"><path className="heartbeat-line" d="M0 40H220L240 40L252 25L265 55L283 6L302 65L320 30L335 40H565L582 40L596 25L610 55L628 6L646 65L664 30L680 40H900" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><p className="mt-5 text-[11px] text-emerald-950/70">{s.clinic.note}</p></section>
    {topic?.image_url && <div className="relative mt-8 aspect-[3/2] overflow-hidden rounded-2xl border border-emerald-400/30"><ManagedImage src={topic.image_url} alt={`${s.special.posterAlt}: ${topic.title}`} sizes="90vw" /></div>}
    <section className="py-14"><p className="eyebrow !text-emerald-300">{s.clinic.teamDescription}</p><h2 className="section-title">{s.clinic.teamTitle}</h2>{teamResult.error ? <div className="mt-6"><ErrorMessage message={s.errors.connection} /></div> : <div className="mt-8 grid gap-5 md:grid-cols-3">{teamResult.data.length ? teamResult.data.map(member => <article key={member.id} className="rounded-2xl border border-emerald-200/30 bg-[#f2fcf7] p-6 text-emerald-950"><div className="mb-5 flex items-center gap-4"><div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-100 text-xl font-bold text-emerald-800">{member.photo_url ? <ManagedImage src={member.photo_url} alt={`${s.images.photo} ${member.name}`} sizes="64px" /> : <span aria-hidden="true">{member.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>}</div><Plus size={20} className="ms-auto text-emerald-600/50" /></div><h3 className="text-xl font-bold">{member.name}</h3><p className="mt-2 text-xs font-semibold text-emerald-700">{member.role}</p><p className="mt-4 whitespace-pre-wrap text-xs leading-7 text-emerald-950/75">{member.bio}</p></article>) : <p className="text-sm text-muted">{s.clinic.teamEmpty}</p>}</div>}</section>
    <section id="clinic-apply" className="mx-auto max-w-2xl"><p className="eyebrow mb-5 text-center !text-emerald-300">{s.clinic.open}</p>{topicResult.error ? <ErrorMessage message={s.errors.connection} /> : topic && open ? <div className="clinic-form"><ApplicationForm topicId={topic.id} formFields={topic.form_fields} title={s.clinic.apply} /></div> : <div className="glass rounded-2xl p-8 text-center text-sm leading-7 text-muted">{s.clinic.closed}</div>}</section>
  </main>;
}
