'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

const NAV_SECTIONS = [
  {
    title: 'Shop',
    links: [
      { href: '/candles', label: 'All Candles' },
      { href: '/ceramics', label: 'All Ceramics' },
      { href: '/candles?badge=bestseller', label: 'Bestsellers' },
      { href: '/candles?badge=new', label: 'New Arrivals' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/our-story', label: 'Our Story' },
      { href: '/journal', label: 'Journal' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/faq', label: 'Frequently Asked Questions' },
      { href: '/journal', label: 'Candle Care Guide' },
      { href: '/contact', label: 'Returns & Exchanges' },
    ],
  },
];

export default function Footer() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful, isSubmitting },
    reset,
  } = useForm<NewsletterForm>({ resolver: zodResolver(newsletterSchema) });

  const onSubmit = async (data: NewsletterForm) => {
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
      }
    } catch {
    }
  };

  return (
    <footer className={styles.footer}>
      
      <div className={styles.topBorder} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        
        <div className={styles.brand}>
          <Link href="/" className={styles.footerLogoLink}>
            <Image
              src="/images/logo.jpg"
              alt="Meadow Mist Logo"
              width={140}
              height={75}
              className={styles.footerLogoImg}
            />
          </Link>
          <p className={styles.tagline}>
            Hand-poured candles &amp; handmade ceramics,<br />
            crafted in small batches with intention.
          </p>

          
          <div className={styles.newsletter}>
            <p className={styles.newsletterLabel}>Stay in the loop</p>
            {isSubmitSuccessful ? (
              <p className={styles.successMsg}>✓ You&apos;re on the list. Thank you!</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
                <div className={styles.inputRow}>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    placeholder="your@email.com"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    aria-label="Email address for newsletter"
                    aria-describedby={errors.email ? 'footer-email-error' : undefined}
                    {...register('email')}
                  />
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? '…' : 'Subscribe'}
                  </button>
                </div>
                {errors.email && (
                  <p id="footer-email-error" className={styles.errorMsg} role="alert">
                    {errors.email.message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        
        <div className={styles.navCols}>
          {NAV_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <p className={styles.navTitle}>{section.title}</p>
              <ul className={styles.navList}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.navLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      
      <div className={styles.bottomBar}>
        <div className="container">
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Meadow Mist. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
