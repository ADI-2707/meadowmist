'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import styles from './IntroLoader.module.css';

export default function IntroLoader() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<'appear' | 'zoom' | 'done'>('appear');
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    let hasSeen = false;
    try {
      hasSeen = !!sessionStorage.getItem('meadow_mist_intro_seen');
    } catch {}

    if (hasSeen || prefersReduced) {
      document.documentElement.classList.remove('intro-pending');
      setStage('done');
      return;
    }

    setMounted(true);
    document.body.style.overflow = 'hidden';

    const timer1 = setTimeout(() => {
      setStage('zoom');
      document.documentElement.classList.remove('intro-pending');
    }, 1600);

    const timer2 = setTimeout(() => {
      setStage('done');
      try {
        sessionStorage.setItem('meadow_mist_intro_seen', 'true');
      } catch {}
      document.body.style.overflow = '';
      document.documentElement.classList.remove('intro-pending');
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.body.style.overflow = '';
      document.documentElement.classList.remove('intro-pending');
    };
  }, [prefersReduced]);

  if (stage === 'done') return null;

  if (!mounted) {
    return <div className={styles.staticBackdrop} aria-hidden="true" />;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'zoom' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => {
          setStage('done');
          try {
            sessionStorage.setItem('meadow_mist_intro_seen', 'true');
          } catch {}
          document.body.style.overflow = '';
          document.documentElement.classList.remove('intro-pending');
        }}
      >
        <div className={styles.glow} aria-hidden="true" />

        <motion.div
          className={styles.logoContainer}
          initial={{ scale: 0.7, opacity: 0, y: 12 }}
          animate={
            stage === 'appear'
              ? { scale: 1, opacity: 1, y: 0 }
              : { scale: 22, opacity: 0 }
          }
          transition={
            stage === 'appear'
              ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
              : { duration: 1.1, ease: [0.7, 0, 0.84, 0] }
          }
        >
          <Image
            src="/images/logo.jpg"
            alt="Meadow Mist Emblem"
            width={180}
            height={180}
            priority
            className={styles.logoImg}
          />
        </motion.div>

        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 10 }}
          animate={stage === 'appear' ? { opacity: 0.85, y: 0 } : { opacity: 0, y: -10 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          MEADOW MIST
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
