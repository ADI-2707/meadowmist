'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import styles from './TabNav.module.css';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  paramName?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function TabNav({
  tabs,
  activeTab,
  paramName = 'tab',
  onChange,
  className = '',
}: TabNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabClick = (tabId: string) => {
    if (onChange) {
      onChange(tabId);
    }
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set(paramName, tabId);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`${styles.tabBar} ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {IconComponent && (
              <span className={styles.tabIcon}>
                <IconComponent size={16} />
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`${styles.countBadge} ${
                  isActive ? styles.countBadgeActive : ''
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

