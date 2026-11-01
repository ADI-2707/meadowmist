'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FaqAccordion.module.css';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const grouped = faqs.reduce<Record<string, FaqItem[]>>((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className={styles.categoryGroup}>
          <h3 className={styles.categoryTitle}>{category}</h3>
          {items.map((faq) => {
            const isOpen = Boolean(openIds[faq.id]);
            return (
              <div
                key={faq.id}
                className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              >
                <button
                  type="button"
                  className={styles.trigger}
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.icon} ${isOpen ? styles.iconRotated : ''}`}
                  />
                </button>
                {isOpen && <div className={styles.content}>{faq.answer}</div>}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
