import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { getSessionUser, getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    enquiry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Storefront Customer Contact Enquiry Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST returns 400 when name, email, or message is missing', async () => {
    const req = new Request('http://localhost:3000/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kavita' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST creates customer inquiry with optional authenticated user link', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_logged_in',
      email: 'kavita@example.com',
      name: 'Kavita Roy',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.enquiry.create).mockResolvedValue({
      id: 'enq_1',
      userId: 'usr_logged_in',
      name: 'Kavita Roy',
      email: 'kavita@example.com',
      message: 'Do you offer bulk gifting for festivals?',
      status: 'PENDING',
    } as any);

    const req = new Request('http://localhost:3000/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Roy',
        email: 'kavita@example.com',
        category: 'Gifting',
        message: 'Do you offer bulk gifting for festivals?',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.enquiry.status).toBe('PENDING');
  });

  it('GET returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/enquiries');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
