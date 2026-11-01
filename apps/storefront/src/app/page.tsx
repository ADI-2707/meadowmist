import Hero from '@/components/Hero/Hero';
import BrushDivider from '@/components/BrushDivider/BrushDivider';
import FeaturedCategory from '@/components/FeaturedCategory/FeaturedCategory';
import SectionReveal from '@/components/SectionReveal/SectionReveal';
import HeroTrustStrip from '@/components/Hero/HeroTrustStrip';
import BackToTop from '@/components/BackToTop/BackToTop';
import { CollectorReviews } from '@/components/CollectorReviews/CollectorReviews';
import { getFeaturedProducts } from '@/lib/getProducts';
import { getStoreSettings, getTopReviews, getHeroSlides } from '@/lib/cms';
import styles from './page.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meadow Mist — Handcrafted Candles & Ceramic Décor',
  description:
    'Hand-poured soy candles and handmade ceramic home décor, crafted in small batches. Discover our lotus bowls, ribbed pillar candles, trinket boxes, and more.',
};

export default async function HomePage() {
  const [featuredCandles, featuredCeramics, storeSettings, topReviews, heroSlides] = await Promise.all([
    getFeaturedProducts(3, 'candle'),
    getFeaturedProducts(3, 'ceramic'),
    getStoreSettings(),
    getTopReviews(),
    getHeroSlides(),
  ]);

  return (
    <>
      <Hero slides={heroSlides} />

      <BrushDivider />

      <div className="container">
        <FeaturedCategory
          title="Hand-poured Candles"
          eyebrow="Shop Candles"
          description="Soy wax, cotton wicks, and hours of patience — each candle poured and finished by hand in small runs."
          href="/candles"
          products={featuredCandles}
        />
      </div>

      <BrushDivider />

      <section className={styles.storySection}>
        <div className="container">
          <SectionReveal>
            <div className={styles.storyInner}>
              <div className={styles.storyBlob} aria-hidden="true" />
              <div className={styles.storyContent}>
                <p className={styles.storyEyebrow}>About Meadow Mist</p>
                <h2 className={styles.storyTitle}>
                  {storeSettings?.aboutHeadline || 'Every piece starts with a feeling.'}
                </h2>
                <p className={styles.storyBody}>
                  {storeSettings?.aboutStory ||
                    'Meadow Mist began as a small experiment — what if everyday objects could feel as considered as something you would frame and hang on a wall? The candles are poured in batches of 8. The ceramics are thrown, trimmed, and glazed by one pair of hands. Nothing here is the same twice.'}
                </p>
                <a href="/our-story" className={styles.storyLink}>Read the full story →</a>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <BrushDivider />

      <div className="container">
        <FeaturedCategory
          title="Handmade Ceramics"
          eyebrow="Shop Ceramics"
          description="Lotus bowls, trinket boxes, and planters — hand-formed, glazed, and fired. Tactile objects for everyday living."
          href="/ceramics"
          products={featuredCeramics}
        />
      </div>

      <BrushDivider />

      <CollectorReviews reviews={topReviews} />

      <BrushDivider />

      <HeroTrustStrip />

      <BackToTop />
    </>
  );
}
