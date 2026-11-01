import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH } from './route';
import { getAdminSessionUser, getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    enquiry: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Seller Support Enquiries API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST creates an enquiry from customer inquiry form', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    vi.mocked(prisma.enquiry.create).mockResolvedValue({
      id: 'enq_1',
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      message: 'Can I place a custom wedding order for 50 jars?',
      status: 'PENDING',
    } as any);

    const req = new Request('http://localhost:3001/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Verma',
        email: 'rohan@example.com',
        message: 'Can I place a custom wedding order for 50 jars?',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.enquiry.name).toBe('Rohan Verma');
    expect(body.enquiry.status).toBe('PENDING');
  });

  it('GET returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/enquiries');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns customer enquiries for admin review', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.enquiry.findMany).mockResolvedValue([
      {
        id: 'enq_1',
        name: 'Rohan Verma',
        message: 'Custom order enquiry',
        status: 'PENDING',
      } as any,
    ]);

    const req = new Request('http://localhost:3001/api/enquiries');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enquiries).toHaveLength(1);
  });

  it('PATCH updates enquiry status and replies', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.enquiry.update).mockResolvedValue({
      id: 'enq_1',
      status: 'RESOLVED',
      adminReply: 'We would love to craft your custom batch!',
    } as any);

    const req = new Request('http://localhost:3001/api/enquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'enq_1',
        status: 'RESOLVED',
        adminReply: 'We would love to craft your custom batch!',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enquiry.status).toBe('RESOLVED');
  });
});
