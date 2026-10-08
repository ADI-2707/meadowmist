import React from 'react';
import { CategoryStoryBubbles } from './CategoryStoryBubbles';
import { HeroCarousel } from './HeroCarousel';
import type { HeroSlide } from '@/data/heroData';
import styles from './Hero.module.css';

interface HeroProps {
  slides?: HeroSlide[];
}

export default function Hero({ slides }: HeroProps) {
  return (
    <header className={styles.hero} aria-label="Meadow Mist Collections and Highlights">
      <h1 className={styles.srOnly}>
        Meadow Mist — Handcrafted Candles & Ceramic Home Décor in Bilaspur
      </h1>
      <CategoryStoryBubbles />
      <HeroCarousel slides={slides} />
    </header>
  );
}
