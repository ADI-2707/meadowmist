import type { Metadata } from 'next';
import { Fraunces, Jost } from 'next/font/google';
import './globals.css';
import { ShellLayout } from '@/components/ShellLayout/ShellLayout';
import { TopLoader } from '@/components/TopLoader/TopLoader';
import { KeepAlive } from '@/components/KeepAlive/KeepAlive';
import { PostHogProvider } from '@/components/PostHogProvider/PostHogProvider';
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
  title: 'Meadow Mist — Seller Portal',
  description: 'Dedicated administrative seller portal for Meadow Mist',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jost.variable}`}>
      <body>
        <PostHogProvider>
          <ToastProvider />
          <TopLoader />
          <KeepAlive />
          <ShellLayout>{children}</ShellLayout>
        </PostHogProvider>
      </body>
    </html>
  );
}
