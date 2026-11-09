'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarDays, Maximize2, X } from 'lucide-react';
import { ManagedImage } from '@/components/managed-image';
import { casablancaWeekday, topicHref } from '@/lib/format';
import { s } from '@/lib/strings';
import type { ScheduleDay, Topic } from '@/lib/types';

export function WeeklyProgramme({ days, poster, topics, initialDay }: { days: ScheduleDay[]; poster: string; topics: Topic[]; initialDay: number }) {
  const [today, setToday] = useState(initialDay);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const update = () => setToday(casablancaWeekday());
    update(); const timer = window.setInterval(update, 60000);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <section id="programme" className="container-page py-16 sm:py-20"><div className="mb-9"><p className="eyebrow">{s.programme.eyebrow}</p><h2 className="section-title">{s.programme.title}</h2><p className="mt-4 text-sm leading-7 text-muted">{s.programme.description}</p></div><div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]"><div className="grid gap-4 sm:grid-cols-2">{days.length === 0 && <p className="glass col-span-full rounded-2xl p-8 text-muted">{s.programme.empty}</p>}{days.map(day => {
    const name = s.programme.days[day.weekday - 1];
    const linkedTopic = topics.find(topic => topic.weekday === day.weekday);
    const href = day.weekday === 5 ? '/3yada' : linkedTopic ? topicHref(linkedTopic.id) : null;
    return <article key={day.id} aria-current={today === day.weekday ? 'date' : undefined} className={`schedule-card glass relative overflow-hidden rounded-2xl p-5 ${today === day.weekday ? 'is-today' : ''} ${day.weekday === 5 ? 'sm:col-span-2' : ''}`} style={{ '--day-color': day.color } as CSSProperties}><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: day.color }} /><span className="text-xs font-bold">{name.latin}</span><span className="font-arabic text-sm text-muted" lang="ar" dir="rtl">{name.arabic}</span></div>{today === day.weekday && <span className="badge border-white/20 bg-white/10 text-cream"><CalendarDays size={11} />{s.programme.today}</span>}</div><div className="flex items-start gap-4"><span className="text-3xl" aria-hidden="true">{day.emoji}</span><div className="min-w-0 flex-1"><h3 className="text-base font-bold leading-6">{href ? <Link href={href} className="inline-flex items-start gap-2 hover:text-gold">{day.title}<ArrowUpRight className="-scale-x-100 mt-1 shrink-0" size={16} /></Link> : day.title}</h3><p className="mt-2 font-arabic text-base text-muted" lang="ar" dir="rtl">{day.title_ar}</p><p className="mt-3 text-xs leading-6 text-muted">{day.description}</p></div></div></article>;
  })}</div><figure className="mx-auto w-full max-w-sm lg:max-w-none"><button type="button" onClick={() => dialog.current?.showModal()} className="group relative block aspect-[2/3] w-full overflow-hidden rounded-2xl border border-gold/25 shadow-glow" aria-label={s.programme.zoom}><ManagedImage src={poster} alt={s.programme.posterAlt} className="object-contain" sizes="(max-width: 1024px) 380px, 280px" /><span className="absolute bottom-3 end-3 rounded-lg border border-white/20 bg-night/80 p-2 text-gold transition group-hover:bg-purple-700"><Maximize2 size={17} /></span></button><figcaption className="mt-3 text-center text-xs text-muted">{s.programme.posterCaption}</figcaption></figure></div><dialog ref={dialog} aria-label={s.programme.posterCaption} className="m-auto h-[92dvh] w-[95vw] max-w-4xl overflow-hidden rounded-2xl border border-gold/25 bg-night p-0 backdrop:bg-black/90 backdrop:backdrop-blur-md"><div className="relative h-full w-full"><ManagedImage src={poster} alt={s.programme.posterAlt} className="object-contain" sizes="95vw" /><button type="button" autoFocus className="btn-small absolute end-3 top-3 !bg-night" onClick={() => dialog.current?.close()} aria-label={s.common.close}><X size={20} /></button></div></dialog></section>;
}
