import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      upsert: vi.fn(),
    },
  },
}));

describe('Newsletter API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes a valid email address successfully', async () => {
    vi.mocked(prisma.newsletterSubscriber.upsert).mockResolvedValue({
      id: 'sub-1',
      email: 'collector@example.com',
      isActive: true,
      createdAt: new Date(),
    });

    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'collector@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Thank you for subscribing.');
    expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
      where: { email: 'collector@example.com' },
      update: { isActive: true },
      create: { email: 'collector@example.com', isActive: true },
    });
  });

  it('rejects an invalid email format with 400', async () => {
    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(prisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it('rejects an empty request body with 400', async () => {
    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('handles database errors gracefully with 500', async () => {
    vi.mocked(prisma.newsletterSubscriber.upsert).mockRejectedValue(new Error('DB connection lost'));

    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'error@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to subscribe');
  });
});
