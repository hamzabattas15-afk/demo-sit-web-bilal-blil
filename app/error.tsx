'use client';
import Link from 'next/link';
import { MoonStar } from 'lucide-react';
import { s } from '@/lib/strings';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center"><MoonStar size={48} strokeWidth={1} className="text-gold" /><h1 className="mt-7 text-3xl font-bold">{s.common.errorTitle}</h1><p className="mt-4 max-w-md text-sm leading-7 text-muted">{s.common.errorBody}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={reset} className="btn-primary">{s.common.retry}</button><Link href="/" className="btn-secondary">{s.common.backHome}</Link></div></main>;
}
