import { MAX_IMAGE_BYTES } from './config';

export function isImageLocation(value: string): boolean {
  if (/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_. -]+\.(jpe?g|png|webp)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

export function imageExtension(type: string, size: number, bytes: Uint8Array): string | null {
  if (size <= 0 || size > MAX_IMAGE_BYTES || bytes.length < 12) return null;
  if (type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (type === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return 'png';
  if (type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'webp';
  return null;
}
