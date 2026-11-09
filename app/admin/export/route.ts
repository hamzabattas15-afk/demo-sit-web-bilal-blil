import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { idSchema } from '@/lib/validation';
import { toCsv } from '@/lib/format';
import { s } from '@/lib/strings';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const { supabase } = await requireAdmin();
  const topicId = request.nextUrl.searchParams.get('topic');
  if (!idSchema.safeParse(topicId).success) return NextResponse.json({ error: s.admin.exportTopic }, { status: 400 });
  const { data: topic, error: topicError } = await supabase.from('topics').select('title, form_fields').eq('id', topicId!).maybeSingle();
  if (topicError || !topic) return NextResponse.json({ error: s.errors.generic }, { status: 404 });
  const fields = topic.form_fields.filter(field => field.key !== 'message');
  const rows: unknown[][] = [[...s.admin.csvHeaders, s.dynamicForm.csv, ...fields.map(field => field.label)]];
  const snapshot = new Date().toISOString();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('applications').select('*').eq('topic_id', topicId!).lte('created_at', snapshot).order('created_at', { ascending: false }).order('id').range(offset, offset + 999);
    if (error) return NextResponse.json({ error: s.errors.generic }, { status: 500 });
    for (const row of data) rows.push([row.id, topic.title, row.full_name, row.age, row.city, row.whatsapp, row.message, row.instagram, s.admin[row.status], row.created_at, JSON.stringify(row.extra), ...fields.map(field => row.extra[field.key] ?? '')]);
    if (data.length < 1000) break;
  }
  return new Response(toCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="srada-${topicId}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
