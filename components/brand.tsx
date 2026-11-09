import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { LOGO_PATH } from '@/lib/config';
import { s } from '@/lib/strings';

export function Navbar() {
  return <header className="relative z-20 border-b border-white/[.07] bg-night/80 backdrop-blur-xl">
    <div className="container-page flex min-h-24 items-center justify-between gap-4">
      <Link href="/" aria-label={s.nav.home} className="flex shrink-0 items-center gap-4">
        <span className="flex flex-col items-center py-2"><Image src={LOGO_PATH} alt={s.logoAlt} width={47} height={53} priority /><span className="mt-0.5 text-[8px] font-semibold tracking-wide text-gold">{s.motto}</span></span>
        <span className="border-s border-white/10 ps-4 font-arabic text-2xl text-cream sm:text-3xl" lang="ar" dir="rtl">{s.arabicTitle}</span>
      </Link>
      <nav aria-label={s.nav.menu} className="flex items-center gap-7 text-xs font-medium lg:gap-10">
        <Link href="/#topics" className="hidden text-muted transition hover:text-gold md:block">{s.nav.topics}</Link>
        <Link href="/#how" className="hidden text-muted transition hover:text-gold md:block">{s.nav.how}</Link>
        <Link href="/3yada" className="hidden text-muted transition hover:text-emerald-300 md:block">{s.clinic.nav}</Link>
        <Link href="/#topics" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/35 bg-gold/[.06] px-4 text-gold transition hover:bg-gold/15 sm:px-5">{s.nav.participate}<ArrowUpRight className="-scale-x-100" size={15} /></Link>
      </nav>
    </div>
  </header>;
}
export function Watermark() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-end overflow-hidden"><Image src={LOGO_PATH} alt="" width={780} height={878} className="w-[680px] max-w-none translate-x-1/4 opacity-[.09] blur-[2px]" /></div>;
}
export function Footer() {
  return <footer className="relative mt-12 border-t border-white/[.07] bg-night/50">
    <div className="container-page flex flex-col gap-6 py-9 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><Image src={LOGO_PATH} alt={s.logoAlt} width={38} height={43} /><div><p className="text-xs font-semibold text-gold">{s.motto}</p><p className="mt-1 text-[11px] text-muted">{s.home.footer}</p></div></div>
      <div className="flex flex-col gap-3 sm:items-end"><Link href="/admin/login" className="inline-flex min-h-8 items-center gap-2 text-xs text-muted hover:text-gold"><LockKeyhole size={12} />{s.nav.admin}<ArrowUpRight className="-scale-x-100" size={12} /></Link><p className="text-[10px] text-muted/75">© {new Date().getFullYear()} {s.brand}. {s.home.rights}</p></div>
    </div>
  </footer>;
}
