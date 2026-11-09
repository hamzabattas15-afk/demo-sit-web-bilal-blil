import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
import { s } from '@/lib/strings';
export const metadata: Metadata = { title: s.auth.login, robots: { index: false, follow: false } };
export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return <main id="main" className="container-page py-14 sm:py-20"><div className="mx-auto max-w-md"><p className="eyebrow mb-6 text-center">{s.auth.eyebrow}</p><AuthForm linkError={Boolean(searchParams.error)} /></div></main>;
}
