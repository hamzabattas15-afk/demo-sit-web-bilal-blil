import { s } from '@/lib/strings';
export default function Loading() {
  return <main id="main" aria-busy="true" aria-label={s.common.loading} className="container-page py-16"><div className="skeleton mb-5 h-5 w-40 rounded-lg" /><div className="skeleton mb-6 h-20 w-3/4 rounded-xl" /><div className="skeleton h-24 max-w-xl rounded-xl" /><div className="mt-16 grid gap-6 md:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="glass h-80 rounded-2xl p-5"><div className="skeleton h-32 rounded-xl" /><div className="skeleton mt-5 h-5 w-2/3 rounded" /><div className="skeleton mt-4 h-12 rounded" /></div>)}</div></main>;
}
