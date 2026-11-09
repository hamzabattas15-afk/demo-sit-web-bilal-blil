import Link from 'next/link';
import { ArrowLeft, Orbit } from 'lucide-react';
import { s } from '@/lib/strings';
export default function NotFound() {
  return <main id="main" className="container-page flex min-h-[65vh] flex-col items-center justify-center py-16 text-center"><Orbit size={90} strokeWidth={.7} className="mb-8 text-gold" /><p className="eyebrow">{s.common.notFoundEyebrow}</p><h1 className="mt-5 text-3xl font-bold sm:text-4xl">{s.common.notFoundTitle}</h1><p className="mt-4 max-w-md text-sm leading-7 text-muted">{s.common.notFoundBody}</p><Link href="/" className="btn-primary mt-8"><ArrowLeft className="-scale-x-100" size={16} />{s.common.backHome}</Link></main>;
}
