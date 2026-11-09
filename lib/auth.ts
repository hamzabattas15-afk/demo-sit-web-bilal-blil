import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/admin/login');
  return { supabase, user };
}
export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.rpc('is_admin');
  if (error || !data) redirect('/admin/access');
  return { supabase, user };
}
