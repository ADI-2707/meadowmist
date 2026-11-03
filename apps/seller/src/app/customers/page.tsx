'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, MessageSquare, Star, Mail } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { TabNav, TabItem } from '@/components/TabNav/TabNav';
import dynamic from 'next/dynamic';

const ClienteleTab = dynamic(
  () => import('./components/ClienteleTab').then((m) => m.ClienteleTab),
  { ssr: false }
);
const SupportInboxTab = dynamic(
  () => import('./components/SupportInboxTab').then((m) => m.SupportInboxTab),
  { ssr: false }
);
const ReviewsModerationTab = dynamic(
  () => import('./components/ReviewsModerationTab').then((m) => m.ReviewsModerationTab),
  { ssr: false }
);
const NewsletterSubscribersTab = dynamic(
  () => import('./components/NewsletterSubscribersTab').then((m) => m.NewsletterSubscribersTab),
  { ssr: false }
);
import styles from './customers.module.css';

function CustomersContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'directory';
  const [counts, setCounts] = useState<{ pendingEnquiries?: number; pendingReviews?: number }>({});

  useEffect(() => {
    fetch('/api/enquiries?status=PENDING')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.enquiries) {
          setCounts((prev) => ({ ...prev, pendingEnquiries: data.enquiries.length }));
        }
      })
      .catch(() => {});
  }, []);

  const tabs: TabItem[] = [
    {
      id: 'directory',
      label: 'Clientele Directory',
      icon: Users,
    },
    {
      id: 'inbox',
      label: 'Support Inquiries',
      icon: MessageSquare,
      count:
        counts.pendingEnquiries && counts.pendingEnquiries > 0
          ? counts.pendingEnquiries
          : undefined,
    },
    {
      id: 'reviews',
      label: 'Customer Reviews',
      icon: Star,
    },
    {
      id: 'subscribers',
      label: 'Newsletter Subscribers',
      icon: Mail,
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Clientele & Relations"
        title="Customers & Support"
        subtitle="Customer directory, contact inquiries inbox, review moderation, and newsletter audience."
      />

      <TabNav tabs={tabs} activeTab={currentTab} />

      <div role="tabpanel" id={`tabpanel-${currentTab}`} aria-labelledby={`tab-${currentTab}`}>
        {currentTab === 'inbox' && <SupportInboxTab />}
        {currentTab === 'reviews' && <ReviewsModerationTab />}
        {currentTab === 'subscribers' && <NewsletterSubscribersTab />}
        {currentTab !== 'inbox' && currentTab !== 'reviews' && currentTab !== 'subscribers' && <ClienteleTab />}
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading customers hub...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
