'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/auth';
import { idSchema, statusSchema, templateSchema, topicSchema } from '@/lib/validation';
import { s } from '@/lib/strings';
import type { ActionResult, ApplicationStatus } from '@/lib/types';

function refresh() { revalidatePath('/'); revalidatePath('/admin'); revalidatePath('/3yada'); revalidatePath('/topic/[id]', 'page'); }

export async function saveTopic(id: string | null, input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: s.errors.invalid, fieldErrors: parsed.error.flatten().fieldErrors };
  if (id && !idSchema.safeParse(id).success) return { ok: false, message: s.errors.invalid };
  const query = id ? supabase.from('topics').update(parsed.data).eq('id', id) : supabase.from('topics').insert(parsed.data);
  const { data, error } = await query.select('id').single();
  if (error || !data) return { ok: false, message: s.errors.generic };
  refresh();
  return { ok: true, message: s.admin.saved };
}
export async function toggleTopic(id: string, active: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success || typeof active !== 'boolean') return { ok: false, message: s.errors.invalid };
  const { data, error } = await supabase.from('topics').update({ is_active: active }).eq('id', id).select('id').single();
  if (error || !data) return { ok: false, message: s.errors.generic };
  refresh();
  return { ok: true, message: s.admin.saved };
}
export async function deleteTopic(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, message: s.errors.invalid };
  const { data, error } = await supabase.from('topics').delete().eq('id', id).select('id').single();
  if (error || !data) return { ok: false, message: s.errors.generic };
  refresh();
  return { ok: true, message: s.admin.deleted };
}
export async function setApplicationStatus(id: string, status: ApplicationStatus): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success || !statusSchema.safeParse(status).success) return { ok: false, message: s.errors.invalid };
  const { data, error } = await supabase.from('applications').update({ status }).eq('id', id).select('id').single();
  if (error || !data) return { ok: false, message: s.errors.generic };
  revalidatePath('/admin');
  return { ok: true, message: s.admin.updated };
}
export async function saveTemplate(value: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = templateSchema.safeParse(value);
  if (!parsed.success) return { ok: false, message: s.errors.template };
  const { error } = await supabase.from('settings').upsert({ key: 'whatsapp_template', value: parsed.data });
  if (error) return { ok: false, message: s.errors.generic };
  revalidatePath('/admin');
  return { ok: true, message: s.admin.templateSaved };
}
export async function claimFirstAdmin(): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc('claim_first_admin');
  if (error) return { ok: false, message: s.errors.database };
  if (!data) return { ok: false, message: s.errors.claimed };
  revalidatePath('/admin', 'layout');
  return { ok: true, message: s.auth.claimSuccess };
}
