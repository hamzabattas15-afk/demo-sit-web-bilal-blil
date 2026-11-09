import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { idSchema, statusSchema } from '@/lib/validation';
import { DEFAULT_PROGRAMME_IMAGE, PAGE_SIZE } from '@/lib/config';
import { s } from '@/lib/strings';
import { Dashboard } from '@/components/dashboard';
import { ErrorMessage } from '@/components/ui';
import { SignOutButton } from '@/components/admin-access';

type SearchParams = { topic?: string; status?: string; q?: string; page?: string };
export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, user } = await requireAdmin();
  const topic = idSchema.safeParse(searchParams.topic).success ? searchParams.topic! : '';
  const statusResult = statusSchema.safeParse(searchParams.status);
  const status = statusResult.success ? statusResult.data : '';
  const search = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 100) : '';
  const requestedPage = Number(searchParams.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000000) : 1;
  let query = supabase.from('applications').select('id,topic_id,full_name,age,city,whatsapp,message,instagram,status,created_at,extra,topic:topics!applications_topic_id_fkey(title)', { count: 'exact' });
  if (topic) query = query.eq('topic_id', topic);
  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('full_name', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
  const [topicsResult, applicationsResult, countsResult, settingsResult, scheduleResult, teamResult] = await Promise.all([
    supabase.from('topics').select('*').order('sort_order').order('created_at', { ascending: false }).order('id'),
    query.order('created_at', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.rpc('admin_application_counts'),
    supabase.from('settings').select('key, value').in('key', ['whatsapp_template', 'programme_image']),
    supabase.from('schedule_days').select('*').order('weekday'),
    supabase.from('clinic_team').select('*').order('sort_order').order('id')
  ]);
  if (topicsResult.error || applicationsResult.error || countsResult.error || settingsResult.error || scheduleResult.error || teamResult.error) return <main id="main" className="container-page min-h-[60vh] py-14"><ErrorMessage message={s.errors.database} /><div className="mt-6"><SignOutButton /></div></main>;
  const total = applicationsResult.count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > lastPage) {
    const params = new URLSearchParams();
    if (topic) params.set('topic', topic);
    if (status) params.set('status', status);
    if (search) params.set('q', search);
    params.set('page', String(lastPage));
    redirect(`/admin?${params}`);
  }
  const countRows = countsResult.data ?? [];
  const zero = { total: 0, pending: 0, accepted: 0, rejected: 0 };
  const counts = countRows.find(row => row.topic_id === null) ?? zero;
  const perTopic = Object.fromEntries(countRows.filter(row => row.topic_id).map(row => [row.topic_id!, Number(row.total)]));
  return <main id="main" className="container-page py-10"><Dashboard email={user.email ?? ''} topics={topicsResult.data ?? []} applications={applicationsResult.data ?? []} counts={{ total: Number(counts.total), pending: Number(counts.pending), accepted: Number(counts.accepted), rejected: Number(counts.rejected) }} perTopic={perTopic} template={settingsResult.data?.find(setting => setting.key === 'whatsapp_template')?.value ?? s.defaultWhatsappTemplate} programmeImage={settingsResult.data?.find(setting => setting.key === 'programme_image')?.value ?? DEFAULT_PROGRAMME_IMAGE} schedule={scheduleResult.data ?? []} team={teamResult.data ?? []} filters={{ topic, status, search, page }} total={total} /></main>;
}
