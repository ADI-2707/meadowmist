import React from 'react';
import { CategoryStoryBubbles } from './CategoryStoryBubbles';
import { HeroCarousel } from './HeroCarousel';
import { getHeroSlides } from '@/lib/cms';
import styles from './Hero.module.css';

export default async function Hero() {
  const slides = await getHeroSlides();

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

