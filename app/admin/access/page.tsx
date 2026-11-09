import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { s } from '@/lib/strings';
import { ClaimButton, SignOutButton } from '@/components/admin-access';
import { ErrorMessage } from '@/components/ui';

export const dynamic = 'force-dynamic';
export default async function AccessPage() {
  const { supabase, user } = await requireUser();
  const { data: admin } = await supabase.rpc('is_admin');
  if (admin) redirect('/admin');
  const { data: available, error } = await supabase.rpc('first_admin_available');
  return <main id="main" className="container-page py-20"><div className="glass mx-auto max-w-lg rounded-3xl p-8 text-center"><ShieldCheck size={40} className="mx-auto mb-6 text-gold" /><h1 className="text-2xl font-bold">{available ? s.auth.claimTitle : s.auth.deniedTitle}</h1><p className="mt-4 text-sm leading-7 text-muted">{available ? s.auth.claimBody : s.auth.deniedBody}</p>{error && <div className="mt-5"><ErrorMessage message={s.errors.database} /></div>}{available && !error && <ClaimButton />}<div className="mt-8 border-t border-white/10 pt-6"><p className="mb-4 break-all text-xs text-muted">{s.auth.signedIn} <span dir="ltr" className="inline-block text-start">{user.email}</span></p><SignOutButton /></div></div></main>;
}
