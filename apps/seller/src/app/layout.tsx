import type { Metadata } from 'next';
import './globals.css';
import { ShellLayout } from '@/components/ShellLayout/ShellLayout';
import { TopLoader } from '@/components/TopLoader/TopLoader';
import { KeepAlive } from '@/components/KeepAlive/KeepAlive';
import { PostHogProvider } from '@/components/PostHogProvider/PostHogProvider';

export const metadata: Metadata = {
  title: 'Meadow Mist — Seller Portal',
  description: 'Dedicated administrative seller portal for Meadow Mist',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <TopLoader />
          <KeepAlive />
          <ShellLayout>{children}</ShellLayout>
        </PostHogProvider>
      </body>
    </html>
  );
}
