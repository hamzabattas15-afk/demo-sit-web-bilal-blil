'use client';
import { Toaster } from 'sonner';
import { s } from '@/lib/strings';

export function Providers() {
  return <Toaster dir="rtl" theme="dark" position="bottom-left" closeButton containerAriaLabel={s.common.notification} toastOptions={{ closeButtonAriaLabel: s.common.close, style: { background: '#251035', borderColor: '#ffffff22', color: '#fff6df' } }} />;
}
