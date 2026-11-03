import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Hero from './Hero';
import { CategoryStoryBubbles } from './CategoryStoryBubbles';
import { HeroCarousel } from './HeroCarousel';
import { HeroTrustStrip } from './HeroTrustStrip';
import { STORY_BUBBLES, HERO_SLIDES, TRUST_BADGES, type TrustBadge } from '@/data/heroData';

describe('CategoryStoryBubbles Component', () => {
  it('renders all category bubbles with labels and links', () => {
    render(<CategoryStoryBubbles bubbles={STORY_BUBBLES} />);

    STORY_BUBBLES.forEach((bubble) => {
      expect(screen.getByText(bubble.label)).toBeDefined();
    });

    const candlesLink = screen.getByRole('listitem', { name: /browse soy pillars/i });
    expect(candlesLink.getAttribute('href')).toBe('/candles');
  });

  it('renders status tags on categories that specify one', () => {
    render(<CategoryStoryBubbles bubbles={STORY_BUBBLES} />);

    expect(screen.getByText('Bestseller')).toBeDefined();
    expect(screen.getByText('Artisan')).toBeDefined();
    expect(screen.getByText('Festive')).toBeDefined();
  });

  it('renders scroll area container list configured for centered tablet presentation', () => {
    const { container } = render(<CategoryStoryBubbles bubbles={STORY_BUBBLES} />);
    const scrollArea = container.querySelector('[role="list"]');
    expect(scrollArea).not.toBeNull();
    expect(scrollArea?.className).toContain('scrollArea');
  });
});

describe('HeroCarousel Component', () => {
  it('renders the first slide initially', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;
    expect(track.style.transform).toBe('translateX(-100%)');

    expect(screen.getAllByText(HERO_SLIDES[0].badge).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Things made/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(HERO_SLIDES[0].headlineScript).length).toBeGreaterThan(0);
    expect(screen.getAllByText(HERO_SLIDES[0].subtext).length).toBeGreaterThan(0);
    expect(screen.getAllByText(HERO_SLIDES[0].primaryCta.label).length).toBeGreaterThan(0);
  });

  it('automatically advances slides with horizontal right-to-left slide transforms and infinite loop', () => {
    vi.useFakeTimers();
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={5000} />);
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;
    expect(track.style.transform).toBe('translateX(-100%)');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-200%)');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-300%)');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-400%)');

    act(() => {
      fireEvent.transitionEnd(track);
    });
    expect(track.style.transform).toBe('translateX(-100%)');
    expect(track.style.transition).toBe('none');

    vi.useRealTimers();
  });

  it('pauses autoPlay on hover and resumes on mouse leave', () => {
    vi.useFakeTimers();
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={5000} />);
    const carouselSection = container.querySelector('[aria-roledescription="carousel"]') as HTMLElement;
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;

    expect(track.style.transform).toBe('translateX(-100%)');

    fireEvent.mouseEnter(carouselSection);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-100%)');

    fireEvent.mouseLeave(carouselSection);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-200%)');

    vi.useRealTimers();
  });

  it('pauses autoPlay on focus and resumes on blur', () => {
    vi.useFakeTimers();
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={5000} />);
    const carouselSection = container.querySelector('[aria-roledescription="carousel"]') as HTMLElement;
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;

    expect(track.style.transform).toBe('translateX(-100%)');

    fireEvent.focus(carouselSection);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-100%)');

    fireEvent.blur(carouselSection);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-200%)');

    vi.useRealTimers();
  });

  it('does not render manual chevron arrow buttons', () => {
    render(<HeroCarousel slides={HERO_SLIDES} />);
    expect(screen.queryByRole('button', { name: /next slide/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /previous slide/i })).toBeNull();
  });

  it('navigates to a specific slide when dot button is clicked', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;

    const slide3Dot = screen.getByRole('tab', { name: /go to slide 3/i });
    fireEvent.click(slide3Dot);

    expect(track.style.transform).toBe('translateX(-300%)');
  });

  it('toggles aria-selected on dot navigation tabs correctly', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const dot1 = screen.getByRole('tab', { name: /go to slide 1/i });
    const dot2 = screen.getByRole('tab', { name: /go to slide 2/i });
    const dot3 = screen.getByRole('tab', { name: /go to slide 3/i });

    expect(dot1.getAttribute('aria-selected')).toBe('true');
    expect(dot2.getAttribute('aria-selected')).toBe('false');
    expect(dot3.getAttribute('aria-selected')).toBe('false');

    fireEvent.click(dot2);
    expect(dot1.getAttribute('aria-selected')).toBe('false');
    expect(dot2.getAttribute('aria-selected')).toBe('true');
    expect(dot3.getAttribute('aria-selected')).toBe('false');
  });

  it('supports touch swipe gestures to navigate slides', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const carouselSection = container.querySelector('[aria-roledescription="carousel"]');
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;
    expect(carouselSection).not.toBeNull();

    if (carouselSection) {
      fireEvent.touchStart(carouselSection, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(carouselSection, { touches: [{ clientX: 120 }] });
      fireEvent.touchEnd(carouselSection);

      expect(track.style.transform).toBe('translateX(-200%)');

      fireEvent.touchStart(carouselSection, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(carouselSection, { touches: [{ clientX: 180 }] });
      fireEvent.touchEnd(carouselSection);

      expect(track.style.transform).toBe('translateX(-100%)');
    }
  });

  it('ignores touch swipe when swipe distance is less than threshold', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const carouselSection = container.querySelector('[aria-roledescription="carousel"]');
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;
    expect(carouselSection).not.toBeNull();

    if (carouselSection) {
      fireEvent.touchStart(carouselSection, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(carouselSection, { touches: [{ clientX: 180 }] });
      fireEvent.touchEnd(carouselSection);

      expect(track.style.transform).toBe('translateX(-100%)');
    }
  });

  it('handles reverse boundary wrap when moving backwards from first slide', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const carouselSection = container.querySelector('[aria-roledescription="carousel"]') as HTMLElement;
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;

    expect(track.style.transform).toBe('translateX(-100%)');

    fireEvent.keyDown(carouselSection, { key: 'ArrowLeft' });
    expect(track.style.transform).toBe('translateX(-0%)');

    act(() => {
      fireEvent.transitionEnd(track);
    });
    expect(track.style.transform).toBe('translateX(-300%)');
    expect(track.style.transition).toBe('none');
  });

  it('navigates with keyboard arrow keys', () => {
    const { container } = render(<HeroCarousel slides={HERO_SLIDES} autoPlayInterval={10000} />);
    const carouselSection = container.querySelector('[aria-roledescription="carousel"]');
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;
    expect(carouselSection).not.toBeNull();

    if (carouselSection) {
      fireEvent.keyDown(carouselSection, { key: 'ArrowRight' });
      expect(track.style.transform).toBe('translateX(-200%)');

      fireEvent.keyDown(carouselSection, { key: 'ArrowLeft' });
      expect(track.style.transform).toBe('translateX(-100%)');
    }
  });

  it('renders single slide without clones or dots and does not auto advance', () => {
    vi.useFakeTimers();
    const singleSlide = [HERO_SLIDES[0]];
    const { container } = render(<HeroCarousel slides={singleSlide} autoPlayInterval={5000} />);
    const track = container.querySelector('[aria-roledescription="carousel"] > div') as HTMLElement;

    expect(track.style.transform).toBe('translateX(-0%)');
    expect(screen.queryByRole('tablist')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(track.style.transform).toBe('translateX(-0%)');

    vi.useRealTimers();
  });
});

describe('HeroTrustStrip Component', () => {
  it('renders inside semantic section with accessible region label', () => {
    render(<HeroTrustStrip />);
    expect(screen.getByRole('region', { name: /meadow mist assurances/i })).toBeDefined();
  });

  it('renders all trust badges with title and description', () => {
    render(<HeroTrustStrip badges={TRUST_BADGES} />);

    TRUST_BADGES.forEach((badge) => {
      expect(screen.getByText(badge.title)).toBeDefined();
      expect(screen.getByText(badge.description)).toBeDefined();
    });
  });

  it('renders icons for truck, leaf, sparkles, and shield types with aria-hidden', () => {
    const varietyBadges: TrustBadge[] = [
      { id: '1', icon: 'truck', title: 'Delivery', description: 'Fast delivery.' },
      { id: '2', icon: 'leaf', title: 'Pure Wax', description: 'Clean burning.' },
      { id: '3', icon: 'sparkles', title: 'Handmade', description: 'Studio crafted.' },
      { id: '4', icon: 'shield', title: 'Protected', description: 'Safe shipping.' },
    ];

    const { container } = render(<HeroTrustStrip badges={varietyBadges} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('renders fallback icon gracefully for custom badge icon type', () => {
    const customBadges: TrustBadge[] = [
      {
        id: 'trust-custom',
        icon: 'unknown' as unknown as TrustBadge['icon'],
        title: 'Custom Assurance',
        description: 'Custom description for test.',
      },
    ];

    render(<HeroTrustStrip badges={customBadges} />);
    expect(screen.getByText('Custom Assurance')).toBeDefined();
    expect(screen.getByText('Custom description for test.')).toBeDefined();
  });
});

describe('Hero Integrated Component', () => {
  it('orchestrates story bubbles and carousel within semantic header', () => {
    render(<Hero />);

    expect(
      screen.getByText('Meadow Mist — Handcrafted Candles & Ceramic Home Décor in Bilaspur')
    ).toBeDefined();

    expect(screen.getByRole('region', { name: /browse artisan collections/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /meadow mist collections/i })).toBeDefined();
  });
});
