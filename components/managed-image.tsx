'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { s } from '@/lib/strings';
import { isImageLocation } from '@/lib/images';

export function ManagedImage({ src, alt, className = 'object-cover', sizes = '100vw', priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src || !isImageLocation(src)) return <div role="img" aria-label={alt} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-purple-700/20 p-4 text-center text-xs text-muted"><ImageOff size={24} /><span>{s.images.missing}</span></div>;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={src.startsWith('https://')} className={className} onError={() => setFailed(src)} />;
}
