import type { Metadata, Viewport } from 'next';
import { Cairo, Reem_Kufi } from 'next/font/google';
import { Footer, Navbar, Watermark } from '@/components/brand';
import { Providers } from '@/components/providers';
import { LOGO_PATH } from '@/lib/config';
import { s } from '@/lib/strings';
import './globals.css';

const body = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-body', display: 'swap' });
const arabic = Reem_Kufi({ subsets: ['arabic', 'latin'], variable: '--font-arabic', display: 'swap' });

export const metadata: Metadata = { title: { default: s.brand, template: `%s | ${s.brand}` }, description: s.metaDescription, icons: { icon: LOGO_PATH } };
export const viewport: Viewport = { themeColor: '#12061f' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl" className={`${body.variable} ${arabic.variable}`}><body className="relative isolate min-h-screen font-sans"><a href="#main" className="sr-only z-50 rounded-lg bg-gold p-3 text-night focus:not-sr-only focus:absolute focus:start-4 focus:top-4">{s.nav.skip}</a><Watermark /><Navbar />{children}<Footer /><Providers /></body></html>;
}
