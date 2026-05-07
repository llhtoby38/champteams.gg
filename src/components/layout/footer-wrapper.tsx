'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

export function FooterWrapper() {
  const pathname = usePathname();
  // Footer only on the landing page
  if (pathname !== '/') return null;
  return <Footer />;
}
