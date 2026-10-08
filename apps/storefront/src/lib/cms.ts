import { prisma } from '@/lib/prisma';
import { HERO_SLIDES, type HeroSlide } from '@/data/heroData';

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (!banners || banners.length === 0) {
      return HERO_SLIDES;
    }

    return banners.map((b) => ({
      id: b.id,
      badge: b.badgeText || 'Bilaspur Studio · Artisanal Batch',
      headlinePre: b.title,
      headlineScript: '',
      headlinePost: '',
      subtext: b.subtitle || 'Handcrafted botanical candles and ceramics made with intention.',
      image: b.imageUrl,
      alt: b.title,
      primaryCta: {
        label: 'Explore Collection',
        href: b.linkUrl || '/candles',
      },
      secondaryCta: {
        label: 'View Ceramics',
        href: '/ceramics',
      },
    }));
  } catch {
    return HERO_SLIDES;
  }
}

export async function getStoreSettings() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });
    return settings;
  } catch {
    return null;
  }
}

export async function getFaqs() {
  try {
    return await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  } catch {
    return [];
  }
}

