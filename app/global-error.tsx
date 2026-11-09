'use client';
import { s } from '@/lib/strings';
import './globals.css';
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ary-Latn"><body><main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center"><h1 className="text-3xl font-bold">{s.common.errorTitle}</h1><p className="mt-5 text-sm leading-7 text-muted">{s.common.errorBody}</p><button className="btn-primary mt-7" onClick={reset}>{s.common.retry}</button></main></body></html>;
}
