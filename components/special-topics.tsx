import Link from 'next/link';
import { ArrowUpRight, HeartPulse, Scale } from 'lucide-react';
import { ManagedImage } from '@/components/managed-image';
import { CLINIC_TOPIC_ID } from '@/lib/config';
import { topicHref } from '@/lib/format';
import { s } from '@/lib/strings';
import type { Topic } from '@/lib/types';

export function SpecialTopics({ topics }: { topics: Topic[] }) {
  if (!topics.length) return null;
  return <section id="special" className="container-page pt-12"><p className="eyebrow mb-5">{s.special.eyebrow}</p><div className="space-y-6">{topics.map(topic => {
    const clinic = topic.id === CLINIC_TOPIC_ID;
    const Icon = clinic ? HeartPulse : Scale;
    return <article key={topic.id} className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-bl from-[#291637] to-night shadow-glow"><div className={`grid ${topic.image_url ? 'md:grid-cols-[.7fr_1fr]' : ''}`}>
      {topic.image_url && <Link href={topicHref(topic.id)} className="relative block aspect-[3/4] overflow-hidden border-b border-gold/20 md:aspect-[3/4] md:border-b-0 md:border-e"><ManagedImage src={topic.image_url} alt={`${s.special.posterAlt}: ${topic.title}`} sizes="(max-width: 768px) 90vw, 430px" priority /></Link>}
      <div className="flex flex-col items-start justify-center p-7 sm:p-10 lg:p-14"><div className="mb-6 flex flex-wrap items-center gap-3"><span className="eyebrow">{s.special.heading}</span>{topic.badge && <span className="badge border-gold/40 bg-gold/10 text-gold"><span className="h-1.5 w-1.5 rounded-full bg-current" />{topic.badge}</span>}</div><Icon size={38} strokeWidth={1.4} className="mb-5" style={{ color: topic.accent_color ?? '#ffc94a' }} /><h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{topic.title}</h2><p className="mt-5 max-w-xl whitespace-pre-wrap text-sm leading-8 text-muted">{topic.description}</p><Link href={topicHref(topic.id)} className="btn-primary mt-8">{clinic ? s.clinic.apply : s.home.apply}<ArrowUpRight className="-scale-x-100" size={18} /></Link></div></div></article>;
  })}</div></section>;
}
