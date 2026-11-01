import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    storeSettings: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Store Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns configured store settings from database', async () => {
    vi.mocked(prisma.storeSettings.findUnique).mockResolvedValue({
      id: 'default',
      storeName: 'Meadow Mist Custom',
      contactEmail: 'custom@meadowmist.in',
      contactPhone: '+91 99999 88888',
      shippingFlatRate: 150,
      freeShippingThreshold: 2000,
      codEnabled: false,
      codFee: 50,
      aboutHeadline: null,
      aboutStory: null,
      aboutArtisanNote: null,
      updatedAt: new Date(),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.storeName).toBe('Meadow Mist Custom');
    expect(body.settings.shippingFlatRate).toBe(150);
    expect(body.settings.freeShippingThreshold).toBe(2000);
    expect(body.settings.codEnabled).toBe(false);
  });

  it('returns fallback default settings if no settings record exists', async () => {
    vi.mocked(prisma.storeSettings.findUnique).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.storeName).toBe('Meadow Mist');
    expect(body.settings.shippingFlatRate).toBe(99);
    expect(body.settings.freeShippingThreshold).toBe(1499);
  });

  it('returns fallback default settings gracefully if database query throws', async () => {
    vi.mocked(prisma.storeSettings.findUnique).mockRejectedValue(new Error('Connection timeout'));

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.storeName).toBe('Meadow Mist');
    expect(body.settings.shippingFlatRate).toBe(99);
  });
});
