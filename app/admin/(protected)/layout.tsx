import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { s } from '@/lib/strings';
export const metadata: Metadata = { title: s.admin.dashboard, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: React.ReactNode }) { await requireAdmin(); return children; }
