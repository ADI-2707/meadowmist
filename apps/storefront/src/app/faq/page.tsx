import type { Metadata } from 'next';
import { getFaqs } from '@/lib/cms';
import { FaqAccordion } from '@/components/FaqAccordion/FaqAccordion';
import SectionReveal from '@/components/SectionReveal/SectionReveal';
import BrushDivider from '@/components/BrushDivider/BrushDivider';
import styles from './faq.module.css';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Meadow Mist',
  description:
    'Common questions regarding candle care, handcrafted ceramics, delivery timelines, and custom studio gifting.',
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className={styles.page}>
      <div className="container">
        <SectionReveal>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Studio Help & Guidance</p>
            <h1 className={styles.title}>Frequently Asked Questions</h1>
            <p className={styles.subtitle}>
              Everything you need to know about caring for your pieces, ordering in small
              batches, and custom studio commissions.
            </p>
          </header>
        </SectionReveal>

        <BrushDivider />

        <SectionReveal delay={0.1}>
          {faqs.length > 0 ? (
            <FaqAccordion faqs={faqs} />
          ) : (
            <div className={styles.emptyState}>
              <p>No FAQ articles published currently.</p>
            </div>
          )}
        </SectionReveal>
      </div>
    </div>
  );
}
