'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tag, Image as ImageIcon, BookOpen, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { TabNav, TabItem } from '@/components/TabNav/TabNav';
import { PromotionsTab } from './components/PromotionsTab';
import { BannersTab } from './components/BannersTab';
import { JournalTab } from './components/JournalTab';
import { FaqsTab } from './components/FaqsTab';
import styles from './marketing.module.css';

function MarketingContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'promotions';

  const tabs: TabItem[] = [
    {
      id: 'promotions',
      label: 'Promotions & Discounts',
      icon: Tag,
    },
    {
      id: 'banners',
      label: 'Hero & Showcase Banners',
      icon: ImageIcon,
    },
    {
      id: 'journal',
      label: 'Studio Journal',
      icon: BookOpen,
    },
    {
      id: 'faqs',
      label: 'Store FAQs',
      icon: HelpCircle,
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="CMS & Promotions"
        title="Marketing & Storefront"
        subtitle="Manage discount coupons, hero banners, studio journal articles, and store FAQs."
      />

      <TabNav tabs={tabs} activeTab={currentTab} />

      <div role="tabpanel" id={`tabpanel-${currentTab}`} aria-labelledby={`tab-${currentTab}`}>
        {currentTab === 'banners' && <BannersTab />}
        {currentTab === 'journal' && <JournalTab />}
        {currentTab === 'faqs' && <FaqsTab />}
        {currentTab !== 'banners' && currentTab !== 'journal' && currentTab !== 'faqs' && (
          <PromotionsTab />
        )}
      </div>
    </div>
  );
}

export default function AdminMarketingPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading marketing hub...</div>}>
      <MarketingContent />
    </Suspense>
  );
}
