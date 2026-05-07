import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Saira, Saira_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { KeepAlive } from "@/components/layout/keep-alive";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // extend into safe areas on iOS PWA
};

export const metadata: Metadata = {
  title: "Pokémon Champions Team Builder & VGC Hub | ChampTeams.gg",
  description:
    "Free Pokémon Champions team builder with full Reg M-A roster, Mega Evolution, tier list, meta cores, and Showdown export. Build, share, and discover competitive VGC double battle teams.",
  metadataBase: new URL('https://champteams.gg'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pokémon Champions Team Builder & VGC Hub | ChampTeams.gg',
    description: 'Free Pokémon Champions team builder with Reg M-A roster, Mega Evolution, tier list, and Showdown export.',
    type: 'website',
    siteName: 'ChampTeams.gg',
    url: 'https://champteams.gg',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChampTeams.gg — The All-in-One VGC Team Hub for Champions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ChampTeamsGG',
    title: 'Pokémon Champions Team Builder | ChampTeams.gg',
    description: 'Free VGC team builder for Pokémon Champions Reg M-A. Build, share, and discover competitive teams.',
    images: ['/og-image.png'],
  },
};

// Inline script that applies the theme class to <html> before hydration,
// preventing flash of wrong theme (FOUC). Stored under 'poketeam_theme'.
const themeInitScript = `(function(){try{if(localStorage.getItem('poketeam_theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

// Register service worker for PWA offline support + trigger API prefetch.
// In dev we unregister and purge caches instead — the SW's cache-first rule
// for /_next/* serves stale Turbopack chunks after HMR and makes new code invisible.
const isDev = process.env.NODE_ENV !== 'production';
const swRegisterScript = isDev
  ? `(function(){if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});});}}})();`
  : `(function(){if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').then(function(reg){if(reg.active){reg.active.postMessage('prefetch-api');}reg.addEventListener('updatefound',function(){var w=reg.installing;if(w)w.addEventListener('statechange',function(){if(w.state==='activated')w.postMessage('prefetch-api');});});}).catch(function(){})});}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${saira.variable} ${sairaCondensed.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
        {/* ICO favicon for Google and legacy browsers */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        {/* SVG favicon for modern browsers — renders the hex crest perfectly */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Apple touch icon for iOS home screen + Google fallback */}
        <link rel="apple-touch-icon" href="/logo-192.png" />
      </head>
      <body className="h-full flex flex-col overflow-hidden">
        {/* Safe area top spacer — fills the iOS status bar in standalone PWA mode */}
        <div className="shrink-0 bg-[#1a1a2e]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
        <Suspense><Header /></Suspense>
        <KeepAlive />
        <Toaster position="bottom-center" richColors closeButton duration={2500} />
        {/* main is the sole scroll container — overscroll-none kills iOS bounce */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
