import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Compass, MessageCircle, Orbit } from 'lucide-react';
import type { Topic } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { s } from '@/lib/strings';
import { ManagedImage } from '@/components/managed-image';

export function TopicCard({ topic, index }: { topic: Topic; index: number }) {
  const Icon = [Compass, Orbit, MessageCircle][index % 3];
  return <article className="topic-card glass flex h-full flex-col overflow-hidden rounded-2xl">
    <div className="topic-art relative flex h-40 items-center justify-center overflow-hidden border-b border-white/5">
      {topic.image_url && <ManagedImage src={topic.image_url} alt={`${s.special.posterAlt}: ${topic.title}`} sizes="(max-width: 768px) 90vw, 380px" />}
      <div className="absolute h-44 w-44 rounded-full border border-white/[.06]" /><div className="absolute h-32 w-32 rounded-full border border-white/10" />
      {!topic.image_url && <Icon size={66} strokeWidth={.9} className="-rotate-12 text-gold/80" />}
      <span className="absolute start-5 top-4 text-[9px] font-bold tracking-[.2em] text-cream/60">{s.home.topicLabel} / {String(index + 1).padStart(2, '0')}</span>
      <span aria-hidden="true" className="absolute end-7 top-9 text-2xl text-gold/70">✦</span><span aria-hidden="true" className="absolute bottom-6 start-12 text-xs text-cream/40">✧</span>
    </div>
    <div className="flex flex-1 flex-col p-6"><p className="mb-4 flex items-center gap-2 text-[10px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{s.home.open}</p><h3 className="text-xl font-bold leading-snug tracking-tight">{topic.title}</h3><p className="line-clamp-3 mb-6 mt-3 text-[13px] leading-6 text-muted">{topic.description}</p><div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4"><p className="flex items-center gap-1.5 text-[10px] text-muted"><CalendarDays size={13} />{topic.deadline ? formatDate(topic.deadline) : s.home.noDeadline}</p><Link href={`/topic/${topic.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold text-gold transition hover:bg-gold/10" aria-label={`${s.home.apply}: ${topic.title}`}>{s.home.apply}<ArrowUpRight className="-scale-x-100" size={16} /></Link></div></div>
  </article>;
}
