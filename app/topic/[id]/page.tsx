import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Quote, Sparkles } from 'lucide-react';
import { ApplicationForm } from '@/components/application-form';
import { ManagedImage } from '@/components/managed-image';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { s } from '@/lib/strings';

export const dynamic = 'force-dynamic';

export default async function TopicPage({ params }: { params: { id: string } }) {
  const { data: topic, error } = await createClient().from('topics').select('*').eq('id', params.id).eq('is_active', true).maybeSingle();
  if (error || !topic) notFound();
  const open = !topic.deadline || new Date(topic.deadline).getTime() > Date.now();
  return <main id="main" className="container-page pb-8 pt-9 sm:pt-12"><Link href="/#topics" className="mb-10 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-muted hover:text-gold"><ArrowLeft className="-scale-x-100" size={15} />{s.topic.back}</Link><div className="grid items-start gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16"><div className="min-w-0"><p className="eyebrow">{topic.kind === 'special' ? s.special.heading : s.topic.eyebrow}</p>{topic.image_url && <div className="relative mt-5 aspect-[3/4] overflow-hidden rounded-2xl border border-gold/40 shadow-glow"><ManagedImage src={topic.image_url} alt={`${s.special.posterAlt}: ${topic.title}`} sizes="(max-width: 1024px) 90vw, 440px" priority /></div>}<h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{topic.title}</h1><p className="mt-6 whitespace-pre-wrap text-sm leading-8 text-muted">{topic.description}</p><p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/15 bg-gold/5 px-4 py-2 text-xs text-gold"><CalendarDays size={14} />{topic.deadline ? `${s.home.deadline}: ${formatDate(topic.deadline)}` : s.home.noDeadline}</p><div className="mt-10 rounded-2xl border border-white/10 bg-purple-700/10 p-6"><Quote size={23} className="mb-4 text-gold/70" /><h2 className="font-bold">{s.topic.noteTitle}</h2><p className="mt-2 text-xs leading-7 text-muted">{s.topic.noteBody}</p><p className="mt-5 flex items-center gap-2 text-[10px] text-gold"><Sparkles size={12} />{s.motto}</p></div></div>{open ? <ApplicationForm topicId={topic.id} formFields={topic.form_fields} /> : <div className="glass rounded-2xl p-8"><h2 className="text-2xl font-bold">{s.topic.closed}</h2><p className="mt-4 text-sm leading-7 text-muted">{s.topic.closedBody}</p><Link href="/#topics" className="btn-primary mt-6">{s.topic.more}</Link></div>}</div></main>;
}
