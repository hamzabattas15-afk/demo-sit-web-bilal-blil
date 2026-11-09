import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowDownRight, ArrowUpRight, AudioLines, Check, MessageCircle, MousePointer2, ShieldCheck, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BANNER_PATH, LOGO_PATH, DEFAULT_PROGRAMME_IMAGE } from '@/lib/config';
import { s } from '@/lib/strings';
import { TopicCard } from '@/components/topic-card';
import { EmptyState, ErrorMessage } from '@/components/ui';
import { SpecialTopics } from '@/components/special-topics';
import { WeeklyProgramme } from '@/components/weekly-programme';
import { casablancaWeekday } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();
  const [topicsResult, scheduleResult, posterResult] = await Promise.all([
    supabase.from('topics').select('*').eq('is_active', true).or(`deadline.is.null,deadline.gt.${new Date().toISOString()}`).order('sort_order').order('created_at', { ascending: false }).order('id'),
    supabase.from('schedule_days').select('*').eq('is_enabled', true).order('weekday'),
    supabase.from('settings').select('value').eq('key', 'programme_image').maybeSingle()
  ]);
  const { data: topics, error } = topicsResult;
  const weeklyTopics = topics?.filter(topic => topic.kind === 'weekly') ?? [];
  const hasBanner = process.env.NEXT_PUBLIC_HAS_BANNER === 'true';
  const stepIcons = [MousePointer2, Check, MessageCircle];
  return <main id="main">
    <section className="night-sky relative overflow-hidden border-b border-white/[.06]">
      {hasBanner && <Image src={BANNER_PATH} alt="" fill priority className="object-cover opacity-25" sizes="100vw" />}
      <div className="starfield" aria-hidden="true" />
      <div className="container-page relative grid gap-3 pb-12 pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pb-16 lg:pt-20">
        <div className="fade-in relative z-10 flex flex-col items-start">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-2 text-[9px] font-semibold tracking-[.16em] text-gold"><Sparkles size={12} />{s.home.eyebrow}</span>
          <p className="mb-4 font-arabic text-3xl text-cream/90 sm:text-4xl" lang="ar" dir="rtl">{s.arabicTitle}</p>
          <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.12] tracking-[-.055em]">{s.home.headline}<br /><span className="bg-gradient-to-l from-gold to-orange bg-clip-text text-transparent">{s.home.headlineAccent}</span></h1>
          <p className="mt-6 max-w-[440px] text-sm leading-7 text-muted sm:text-[15px]">{s.home.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-5"><Link href="#topics" className="btn-primary">{s.home.cta}<ArrowUpRight className="-scale-x-100" size={18} /></Link><Link href="#how" className="flex min-h-12 items-center gap-2 px-2 text-xs font-semibold text-cream hover:text-gold">{s.home.secondary}<ArrowDown size={14} /></Link></div>
          <div className="mt-9 flex items-center gap-3"><div className="flex -space-x-2" aria-hidden="true">{[MousePointer2, MessageCircle, AudioLines].map((Icon, index) => <span key={index} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-night bg-[#382349] text-gold"><Icon size={12} /></span>)}</div><div><p className="text-[10px] font-semibold text-cream">{s.home.community}</p><p className="mt-0.5 text-[9px] text-muted">{s.home.communityNote}</p></div></div>
        </div>
        <div className="relative mx-auto mt-8 flex aspect-square w-full max-w-[390px] items-center justify-center self-center lg:mt-0 lg:max-w-[460px]">
          <div className="hero-orbit absolute inset-5 rounded-full" aria-hidden="true" />
          <div className="absolute inset-[23%] rounded-full bg-purple-500/20 blur-3xl" />
          <Image src={LOGO_PATH} alt={s.logoAlt} width={280} height={315} priority className="relative w-[62%] -rotate-6 drop-shadow-[0_12px_45px_rgba(255,201,74,.13)]" />
          <span aria-hidden="true" className="absolute start-8 top-14 text-3xl text-gold">✦</span><span aria-hidden="true" className="absolute bottom-14 end-8 text-xl text-gold/60">✦</span>
          <div className="glass absolute -end-1 top-12 flex rotate-6 items-center gap-3 rounded-xl px-4 py-3 shadow-xl"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-gold"><AudioLines size={20} /></span><div><p className="text-xs font-bold">{s.home.live}</p><p className="mt-1 text-[9px] text-muted">{s.home.liveNote}</p></div></div>
          <span className="glass absolute bottom-9 start-0 -rotate-6 rounded-xl px-5 py-3 text-xs font-semibold text-gold">{s.home.heroNote}</span>
          <p className="absolute -bottom-1 text-[8px] tracking-[.3em] text-muted/50">{s.home.orbitLabel}</p>
        </div>
      </div>
      <div className="container-page relative flex justify-center pb-7"><ArrowDown size={16} className="text-gold/50" aria-hidden="true" /></div>
    </section>
    <SpecialTopics topics={topics?.filter(topic => topic.kind === 'special') ?? []} />
    {scheduleResult.error || posterResult.error ? <div className="container-page pt-12"><ErrorMessage message={s.errors.topicsLoad} /></div> : <WeeklyProgramme days={scheduleResult.data ?? []} poster={posterResult.data?.value ?? DEFAULT_PROGRAMME_IMAGE} topics={topics ?? []} initialDay={casablancaWeekday()} />}
    <section id="topics" className="container-page py-16 sm:py-20">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{s.home.sectionEyebrow}</p><h2 className="section-title">{s.home.topicsTitle}</h2><p className="mt-4 text-sm leading-6 text-muted">{s.home.topicsDescription}</p></div>{!error && <span className="badge border-gold/20 bg-gold/5 px-3 py-2 text-gold"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{topics?.length ?? 0} {s.home.openTopics}</span>}</div>
      {error ? <ErrorMessage message={s.errors.topicsLoad} /> : weeklyTopics.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{weeklyTopics.map((topic, index) => <TopicCard key={topic.id} topic={topic} index={index} />)}</div> : <EmptyState title={s.home.empty} description={s.home.emptyBody} />}
    </section>
    <section id="how" className="container-page pb-16 sm:pb-20"><div className="rounded-3xl border border-white/10 bg-gradient-to-bl from-purple-700/20 to-white/[.02] p-7 sm:p-10 lg:p-12"><div className="flex items-start justify-between"><div><p className="eyebrow">{s.home.stepsEyebrow}</p><h2 className="section-title max-w-lg">{s.home.stepsTitle}</h2></div><ArrowDownRight className="-scale-x-100 hidden text-gold/50 sm:block" size={40} strokeWidth={1} /></div><div className="mt-10 grid gap-9 md:grid-cols-3">{s.home.steps.map((step, index) => { const Icon = stepIcons[index]; return <div key={step.title} className="relative"><div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold"><Icon size={19} /></span><span className="text-[10px] font-bold tracking-widest text-muted/50">0{index + 1}</span>{index < 2 && <span aria-hidden="true" className="ms-4 hidden h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent md:block" />}</div><h3 className="text-base font-bold">{step.title}</h3><p className="mt-2 max-w-xs text-xs leading-6 text-muted">{step.description}</p></div>; })}</div></div></section>
    <section className="container-page pb-10 text-center"><Sparkles size={23} className="mx-auto text-gold" /><h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">{s.home.closing}</h2><p className="mt-3 text-sm text-muted">{s.home.closingNote}</p><p className="mt-7 inline-flex items-center gap-2 text-[10px] text-muted/80"><ShieldCheck size={14} className="text-gold/70" />{s.home.privacy}</p></section>
  </main>;
}
