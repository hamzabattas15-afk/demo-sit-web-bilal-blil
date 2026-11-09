import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

type Bucket = { count: number; expires: number };
const buckets = new Map<string, Bucket>();
const WINDOW = 15 * 60 * 1000;

export function consumeRateLimit(key: string, maximum = 5): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
    if (buckets.size > 10000) return false;
  }
  const current = buckets.get(key);
  if (!current || current.expires <= now) {
    buckets.set(key, { count: 1, expires: now + WINDOW });
    return true;
  }
  if (current.count >= maximum) return false;
  current.count += 1;
  return true;
}
export function requestFingerprint() {
  const requestHeaders = headers();
  const ip = requestHeaders.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    || requestHeaders.get('x-real-ip') || 'local';
  return createHash('sha256').update(ip.slice(0, 256)).digest('hex');
}
