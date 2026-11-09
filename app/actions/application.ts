'use server';
import { createClient } from '@/lib/supabase/server';
import { applicationSchema, extraAnswersSchema, extractExtraAnswers } from '@/lib/validation';
import { consumeRateLimit, requestFingerprint } from '@/lib/rate-limit';
import { s } from '@/lib/strings';
import type { ActionResult } from '@/lib/types';

export async function submitApplication(form: FormData): Promise<ActionResult> {
  if (form.get('website')) return { ok: true, message: s.topic.successTitle };
  if (!consumeRateLimit(`apply:${requestFingerprint()}`)) return { ok: false, message: s.errors.rateLimit };
  const parsed = applicationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: s.errors.invalid, fieldErrors: parsed.error.flatten().fieldErrors };
  const { website, ...application } = parsed.data;
  if (website) return { ok: true, message: s.topic.successTitle };
  if (!consumeRateLimit(`phone:${application.whatsapp}`, 3)) return { ok: false, message: s.errors.rateLimit };
  try {
    const supabase = createClient();
    const { data: topic, error: topicError } = await supabase.from('topics').select('id, is_active, deadline, form_fields').eq('id', application.topic_id).maybeSingle();
    if (topicError) {
      console.error('[submitApplication] topic lookup failed', { code: topicError.code, message: topicError.message, hint: topicError.hint });
      return { ok: false, message: s.errors.connection };
    }
    if (!topic?.is_active || (topic.deadline && new Date(topic.deadline).getTime() <= Date.now())) return { ok: false, message: s.errors.closed };
    const extra = extraAnswersSchema(topic.form_fields).safeParse(extractExtraAnswers(form));
    if (!extra.success) return { ok: false, message: s.errors.invalid, fieldErrors: Object.fromEntries(Object.entries(extra.error.flatten().fieldErrors).map(([key, value]) => [`extra.${key}`, value ?? []])) };
    const { error } = await supabase.from('applications').insert({ ...application, extra: extra.data, status: 'pending' });
    if (error) console.error('[submitApplication] application insert failed', { code: error.code, message: error.message, hint: error.hint, topicId: application.topic_id });
    if (error?.code === '23505') return { ok: false, message: s.errors.duplicate };
    if (error?.code === 'P0001') return { ok: false, message: s.errors.rateLimit };
    if (error?.code === '42501') return { ok: false, message: s.errors.submitFailed };
    if (error?.code === '23514') return { ok: false, message: s.dynamicForm.answerError };
    if (error) {
      return { ok: false, message: s.errors.submitFailed };
    }
    return { ok: true, message: s.topic.successTitle };
  } catch (error) {
    console.error('[submitApplication] unexpected failure', error);
    return { ok: false, message: s.errors.submitFailed };
  }
}
