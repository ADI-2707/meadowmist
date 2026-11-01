import type { Metadata } from 'next';
import Image from 'next/image';
import SectionReveal from '@/components/SectionReveal/SectionReveal';
import BrushDivider from '@/components/BrushDivider/BrushDivider';
import { getStoreSettings } from '@/lib/cms';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'Meadow Mist began as an experiment — what if everyday objects could feel as considered as something you\'d frame and hang on a wall? Read about how the brand started and how each piece is made.',
};

export default async function OurStoryPage() {
  const settings = await getStoreSettings();

  const storySections = [
    {
      label: 'How it started',
      heading: 'An experiment in attention.',
      body:
        settings?.aboutStory ||
        `Meadow Mist started in a small flat with a kitchen scale, a thermometer, and the question: what if a candle felt as deliberate as a piece of jewellery? Not expensive — deliberate. The kind of thing you pick up, turn over, notice the texture of. The first batch was eight candles. They sold out in a weekend. The second batch was eight candles. We've kept it that way.`,
    },
    {
      label: 'The candles',
      heading: 'Poured in eights.',
      body: `Every candle is hand-poured in runs of eight or fewer — small enough that a single person can watch every pour, adjust the temperature, check the set. The soy wax is clean-burning. The cotton wicks are self-trimming. The botanicals — wax flowers, embedded petals, sculpted reliefs — are made separately and placed by hand while the wax is still warm. Burn time is honest: we test every mould before we sell it.`,
    },
    {
      label: 'The ceramics',
      heading: 'One pair of hands.',
      body: `The ceramics are thrown on a wheel, trimmed, and glazed by one person. The lotus petal rim is hand-crimped before the clay stiffens — that's why every bowl is slightly different. The glaze bleed on the blush bowls is pigment meeting a wet surface: controlled loosely, never exactly. The black lotus holder's gold edging is painted petal by petal with a fine brush. That's not a process you can photograph meaningfully — you feel it when you pick the piece up.`,
    },
  ];

  if (settings?.aboutArtisanNote) {
    storySections.push({
      label: 'Artisan note',
      heading: 'Variations as feature, not flaw.',
      body: settings.aboutArtisanNote,
    });
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <SectionReveal>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>The Story Behind the Name</p>
            <h1 className={styles.title}>
              {settings?.aboutHeadline || 'Things made by hand, grown like something living.'}
            </h1>
          </section>
        </SectionReveal>

        <BrushDivider />

        <SectionReveal>
          <div className={styles.treeSection}>
            <div className={styles.logoShowcase}>
              <Image
                src="/images/logo.jpg"
                alt="Meadow Mist Official Brand Logo"
                width={360}
                height={200}
                className={styles.logoShowcaseImg}
                priority
              />
            </div>
            <blockquote className={styles.pullQuote}>
              <p className={styles.pullQuoteText}>
                &ldquo;The logo is a tree — branches holding a candle flame, a pottery wheel,
                a spinning wheel, and yarn. Literally: things made by hand, grown like something living.
                That&apos;s not a tagline. That&apos;s the brief.&rdquo;
              </p>
            </blockquote>
          </div>
        </SectionReveal>

        <BrushDivider />

        {storySections.map((section, i) => (
          <SectionReveal key={section.label} delay={i * 0.1}>
            <article className={styles.storySection}>
              <p className={styles.sectionEyebrow}>{section.label}</p>
              <h2 className={styles.sectionHeading}>{section.heading}</h2>
              <p className={styles.sectionBody}>{section.body}</p>
            </article>
          </SectionReveal>
        ))}
      </div>
    </div>
  );
}

