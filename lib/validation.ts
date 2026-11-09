import { z } from 'zod';
import { normalizeMoroccanPhone } from './phone';
import { s } from './strings';
import { isImageLocation } from './images';
import type { FormField } from './types';

export const imageLocationSchema = z.string().trim().max(2048, s.images.invalidUrl).refine(value => !value || isImageLocation(value), s.images.invalidUrl).transform(value => value || null);
export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, s.errors.invalid);
const reservedKeys = new Set(['full_name', 'age', 'city', 'whatsapp', 'instagram', 'topic_id', 'website', 'status', 'extra', 'constructor', 'prototype']);
export const formFieldsSchema = z.array(z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/, s.dynamicForm.invalid).refine(key => !reservedKeys.has(key), s.dynamicForm.invalid),
  label: z.string().trim().min(2, s.dynamicForm.invalid).max(160, s.dynamicForm.invalid),
  type: z.enum(['text', 'textarea', 'select'], { errorMap: () => ({ message: s.dynamicForm.invalid }) }),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1, s.dynamicForm.invalid).max(100, s.dynamicForm.invalid)).max(12, s.dynamicForm.invalid).optional()
})).max(12, s.dynamicForm.invalid).superRefine((fields, ctx) => {
  const keys = new Set<string>();
  for (const field of fields) {
    if (keys.has(field.key) || (field.key === 'message' && (field.type !== 'textarea' || !field.required)) ||
      (field.type === 'select' && (!field.options || field.options.length < 2 || new Set(field.options).size !== field.options.length))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: s.dynamicForm.invalid });
    }
    keys.add(field.key);
  }
});

export function extraAnswersSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodType<string, z.ZodTypeDef, unknown>> = {};
  for (const field of fields) {
    if (field.key === 'message') continue;
    const limit = field.type === 'textarea' ? 5000 : 500;
    const minimum = field.type === 'textarea' ? 20 : 1;
    const message = field.type === 'textarea' ? s.dynamicForm.longAnswer : s.dynamicForm.shortAnswer;
    shape[field.key] = z.string().trim().max(limit, message).refine(value => (!value && !field.required) || value.length >= minimum, message)
      .refine(value => !value || field.type !== 'select' || Boolean(field.options?.includes(value)), s.dynamicForm.answerError).default('');
  }
  return z.object(shape).strict(s.dynamicForm.answerError);
}

export function extractExtraAnswers(form: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries([...form.entries()].filter(([key]) => key.startsWith('extra.')).map(([key, value]) => [key.slice(6), value]));
}

export const applicationSchema = z.object({
  topic_id: z.string().uuid(s.errors.closed),
  full_name: z.string().trim().min(2, s.errors.name).max(100, s.errors.name),
  age: z.coerce.number({ invalid_type_error: s.errors.age }).int(s.errors.age).min(15, s.errors.age).max(99, s.errors.age),
  city: z.string().trim().min(2, s.errors.city).max(80, s.errors.city),
  whatsapp: z.string().transform((value, ctx) => {
    const phone = normalizeMoroccanPhone(value);
    if (!phone) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: s.errors.phone }); return z.NEVER; }
    return phone;
  }),
  message: z.string().trim().min(20, s.errors.message).max(5000, s.errors.message),
  instagram: z.string().trim().transform(v => v.replace(/^@/, '')).refine(v => !v || /^[a-zA-Z0-9._]{1,30}$/.test(v), s.errors.instagram).transform(v => v || null),
  website: z.string().max(200).optional().default('')
});

export const topicSchema = z.object({
  title: z.string().trim().min(3, s.errors.title).max(160, s.errors.title),
  description: z.string().trim().min(20, s.errors.description).max(5000, s.errors.description),
  deadline: z.string().datetime({ offset: true, message: s.errors.deadline }).nullable(),
  is_active: z.boolean(),
  kind: z.enum(['weekly', 'special'], { errorMap: () => ({ message: s.errors.invalid }) }).default('weekly'),
  weekday: z.number({ invalid_type_error: s.errors.invalid }).int(s.errors.invalid).min(1, s.errors.invalid).max(5, s.errors.invalid).nullable().default(null),
  image_url: imageLocationSchema.nullable().default(null),
  badge: z.string().trim().max(30, s.errors.invalid).transform(value => value || null).nullable().default(null),
  accent_color: colorSchema.nullable().default(null),
  sort_order: z.number({ invalid_type_error: s.errors.invalid }).int(s.errors.invalid).min(-1000000, s.errors.invalid).max(1000000, s.errors.invalid).default(0),
  form_fields: formFieldsSchema.default([])
});
export const scheduleDaySchema = z.object({
  weekday: z.number().int().min(1).max(5), title: z.string().trim().min(3).max(160),
  title_ar: z.string().trim().min(2).max(160), description: z.string().trim().min(10).max(500),
  emoji: z.string().trim().min(1).max(20), color: colorSchema, is_enabled: z.boolean()
});
export const clinicMemberSchema = z.object({
  name: z.string().trim().min(2).max(100), role: z.string().trim().min(2).max(160), bio: z.string().trim().min(10).max(1000),
  photo_url: imageLocationSchema.nullable(), sort_order: z.number().int().min(-1000000).max(1000000), is_active: z.boolean()
});
export const statusSchema = z.enum(['pending', 'accepted', 'rejected']);
export const idSchema = z.string().uuid();
export const authSchema = z.object({
  email: z.string().trim().email(s.errors.email).max(254, s.errors.email),
  password: z.string().min(8, s.errors.password).max(72, s.errors.password)
});
export const templateSchema = z.string().trim().min(10, s.errors.template).max(2000, s.errors.template)
  .refine(value => value.includes('{name}') && value.includes('{topic}'), s.errors.template);
