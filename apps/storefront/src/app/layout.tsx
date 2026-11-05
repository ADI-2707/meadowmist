import type { Metadata } from 'next';
import React from 'react';
import { Fraunces, Jost } from 'next/font/google';
import './globals.css';
import SiteHeader from '@/components/SiteHeader/SiteHeader';
import Footer from '@/components/Footer/Footer';
import IntroLoader from '@/components/IntroLoader/IntroLoader';
import ScrollProgressBar from '@/components/ScrollProgressBar/ScrollProgressBar';
import CartToast from '@/components/CartToast/CartToast';
import MobileBottomNav from '@/components/MobileBottomNav/MobileBottomNav';
import KeepAlive from '@/components/KeepAlive/KeepAlive';
import PostHogProvider from '@/components/PostHogProvider/PostHogProvider';
import { ToastProvider } from '@meadowmist/shared';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://meadowmist.in'),
  title: {
    default: 'Meadow Mist — Handcrafted Candles & Ceramic Décor',
    template: '%s | Meadow Mist',
  },
  description:
    'Hand-poured soy candles and handmade ceramic home décor, crafted in small batches. Discover lotus bowls, ribbed pillar candles, trinket boxes, and more.',
  keywords: ['handmade candles', 'ceramic decor', 'soy candles', 'lotus bowl', 'artisan candles', 'home decor'],
  icons: {
    icon: '/images/logo.jpg',
    shortcut: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
  openGraph: {
    title: 'Meadow Mist — Handcrafted Candles & Ceramic Décor',
    description: 'Hand-poured soy candles and handmade ceramics, crafted with intention.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Meadow Mist',
    images: [{ url: '/images/logo.jpg', width: 1200, height: 630, alt: 'Meadow Mist Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meadow Mist — Handcrafted Candles & Ceramic Décor',
    description: 'Hand-poured soy candles and handmade ceramics, crafted with intention.',
    images: ['/images/logo.jpg'],
  },
  alternates: {
    canonical: 'https://meadowmist.in',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${jost.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!sessionStorage.getItem('meadow_mist_intro_seen')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('intro-pending');setTimeout(function(){document.documentElement.classList.remove('intro-pending');},3500);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <PostHogProvider>
          <ToastProvider />
          <IntroLoader />
          <ScrollProgressBar />
          <CartToast />
          <SiteHeader />
          <main id="main-content">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <KeepAlive />
        </PostHogProvider>
      </body>
    </html>
  );
}
