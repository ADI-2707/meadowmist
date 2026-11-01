import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getAddresses, POST as postAddress } from './route';
import { PUT as putAddress, DELETE as deleteAddress } from './[id]/route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    address: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Storefront Customer Address Book API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    params: Promise.resolve({ id: 'addr_1' }),
  };

  it('GET /api/account/addresses returns 401 when unauthenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await getAddresses();
    expect(res.status).toBe(401);
  });

  it('GET /api/account/addresses returns saved addresses for customer', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.address.findMany).mockResolvedValue([
      {
        id: 'addr_1',
        fullName: 'Tara Sharma',
        phone: '+919876543210',
        streetAddress: '12 Green Glen Layout, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
        isDefault: true,
      } as any,
    ]);

    const res = await getAddresses();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.addresses).toHaveLength(1);
    expect(body.addresses[0].city).toBe('Bengaluru');
  });

  it('POST /api/account/addresses creates default address when it is the first address', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.address.count).mockResolvedValue(0);
    vi.mocked(prisma.address.create).mockResolvedValue({
      id: 'addr_new',
      fullName: 'Tara Sharma',
      phone: '+919876543210',
      streetAddress: '12 Green Glen Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      isDefault: true,
    } as any);

    const req = new Request('http://localhost:3000/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Tara Sharma',
        phone: '+919876543210',
        streetAddress: '12 Green Glen Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
      }),
    });

    const res = await postAddress(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.address.isDefault).toBe(true);
  });

  it('PUT /api/account/addresses/[id] updates address', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.address.findFirst).mockResolvedValue({
      id: 'addr_1',
      userId: 'usr_1',
      fullName: 'Tara Sharma',
    } as any);

    vi.mocked(prisma.address.update).mockResolvedValue({
      id: 'addr_1',
      fullName: 'Tara Sen',
    } as any);

    const req = new Request('http://localhost:3000/api/account/addresses/addr_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Tara Sen' }),
    });

    const res = await putAddress(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.address.fullName).toBe('Tara Sen');
  });

  it('DELETE /api/account/addresses/[id] deletes address', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.address.findFirst).mockResolvedValue({
      id: 'addr_1',
      userId: 'usr_1',
    } as any);

    const req = new Request('http://localhost:3000/api/account/addresses/addr_1', {
      method: 'DELETE',
    });

    const res = await deleteAddress(req, mockContext);
    expect(res.status).toBe(200);
    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: 'addr_1' } });
  });
});
