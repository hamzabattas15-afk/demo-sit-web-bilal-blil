'use server';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { clinicMemberSchema, idSchema, imageLocationSchema, scheduleDaySchema } from '@/lib/validation';
import { imageExtension } from '@/lib/images';
import { IMAGE_BUCKET, MAX_IMAGE_BYTES } from '@/lib/config';
import { s } from '@/lib/strings';
import type { ActionResult } from '@/lib/types';

function refresh() { revalidatePath('/'); revalidatePath('/3yada'); revalidatePath('/admin'); }
export async function uploadImage(form: FormData): Promise<ActionResult & { url?: string }> {
  const { supabase, user } = await requireAdmin();
  const file = form.get('file');
  if (!(file instanceof File) || file.size > MAX_IMAGE_BYTES) return { ok: false, message: s.images.invalid };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(file.type, file.size, bytes);
  if (!extension) return { ok: false, message: s.images.invalid };
  const filePath = `${user.id}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) return { ok: false, message: s.images.failure };
  return { ok: true, message: s.images.success, url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath).data.publicUrl };
}
export async function saveScheduleDay(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = scheduleDaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: s.errors.invalid };
  const { error } = await supabase.from('schedule_days').upsert(parsed.data, { onConflict: 'weekday' });
  if (error) return { ok: false, message: s.errors.generic };
  refresh(); return { ok: true, message: s.admin.saved };
}
export async function saveProgrammeImage(value: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = imageLocationSchema.safeParse(value);
  if (!parsed.success || !parsed.data) return { ok: false, message: s.images.invalidUrl };
  const { error } = await supabase.from('settings').upsert({ key: 'programme_image', value: parsed.data });
  if (error) return { ok: false, message: s.errors.generic };
  refresh(); return { ok: true, message: s.admin.saved };
}
export async function saveClinicMember(id: string | null, input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = clinicMemberSchema.safeParse(input);
  if (!parsed.success || (id && !idSchema.safeParse(id).success)) return { ok: false, message: s.clinic.invalid };
  const query = id ? supabase.from('clinic_team').update(parsed.data).eq('id', id) : supabase.from('clinic_team').insert(parsed.data);
  const { error } = await query.select('id').single();
  if (error) return { ok: false, message: s.errors.generic };
  refresh(); return { ok: true, message: s.admin.saved };
}
export async function deleteClinicMember(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, message: s.errors.invalid };
  const { error } = await supabase.from('clinic_team').delete().eq('id', id).select('id').single();
  if (error) return { ok: false, message: s.errors.generic };
  refresh(); return { ok: true, message: s.admin.saved };
}
export async function reorderTopic(id: string, direction: number): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!idSchema.safeParse(id).success || ![-1, 1].includes(direction)) return { ok: false, message: s.errors.invalid };
  const { error, data } = await supabase.rpc('reorder_topic', { p_topic_id: id, p_direction: direction });
  if (error || !data) return { ok: false, message: s.errors.generic };
  refresh(); return { ok: true, message: s.admin.saved };
}
