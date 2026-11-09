'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { claimFirstAdmin } from '@/app/actions/admin';
import { s } from '@/lib/strings';
import { Spinner } from '@/components/ui';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try { const { error } = await createClient().auth.signOut({ scope: 'local' }); if (error) { toast.error(s.errors.generic); return; } router.replace('/admin/login'); router.refresh(); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  return <button type="button" onClick={logout} disabled={busy} className="btn-small">{busy ? <Spinner /> : <LogOut size={14} />}{s.auth.logout}</button>;
}
export function ClaimButton() {
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const router = useRouter();
  async function claim() {
    setBusy(true);
    try { const result = await claimFirstAdmin(); if (!result.ok) { toast.error(result.message); setClaimed(true); router.refresh(); return; } toast.success(result.message); router.replace('/admin'); router.refresh(); }
    catch { toast.error(s.errors.connection); }
    finally { setBusy(false); }
  }
  return claimed ? null : <button onClick={claim} disabled={busy} className="btn-primary mt-7">{busy ? <Spinner /> : <KeyRound size={17} />}{s.auth.claim}</button>;
}
