import { describe, it, expect } from 'vitest';
import {
  cartItemSchema,
  cartSyncSchema,
  wishlistItemSchema,
  orderStatusSchema,
} from './validation';

describe('Shared Zod Schemas Validation', () => {
  describe('cartItemSchema', () => {
    it('accepts valid cart payload', () => {
      const res = cartItemSchema.safeParse({
        productId: 'prod_123',
        quantity: 2,
        selectedFragrance: 'Lavender Bloom',
      });
      expect(res.success).toBe(true);
    });

    it('rejects empty productId', () => {
      const res = cartItemSchema.safeParse({
        productId: '',
        quantity: 1,
      });
      expect(res.success).toBe(false);
    });

    it('rejects negative quantity', () => {
      const res = cartItemSchema.safeParse({
        productId: 'prod_123',
        quantity: -5,
      });
      expect(res.success).toBe(false);
    });

    it('rejects quantity exceeding maximum safety threshold of 100', () => {
      const res = cartItemSchema.safeParse({
        productId: 'prod_123',
        quantity: 101,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('cartSyncSchema', () => {
    it('validates batch array of cart items', () => {
      const res = cartSyncSchema.safeParse({
        items: [
          { productId: 'prod_1', quantity: 1 },
          { productId: 'prod_2', quantity: 3 },
        ],
      });
      expect(res.success).toBe(true);
    });

    it('rejects batch exceeding array limit', () => {
      const excessive = Array.from({ length: 51 }, (_, i) => ({
        productId: `prod_${i}`,
        quantity: 1,
      }));
      const res = cartSyncSchema.safeParse({ items: excessive });
      expect(res.success).toBe(false);
    });
  });

  describe('wishlistItemSchema', () => {
    it('validates required productId', () => {
      expect(wishlistItemSchema.safeParse({ productId: 'prod_xyz' }).success).toBe(true);
      expect(wishlistItemSchema.safeParse({}).success).toBe(false);
      expect(wishlistItemSchema.safeParse({ productId: '' }).success).toBe(false);
    });
  });

  describe('orderStatusSchema', () => {
    it('accepts recognized order status values', () => {
      const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
      for (const status of statuses) {
        expect(orderStatusSchema.safeParse({ status }).success).toBe(true);
      }
    });

    it('rejects unrecognized order status values', () => {
      expect(orderStatusSchema.safeParse({ status: 'UNKNOWN_STATE' }).success).toBe(false);
    });
  });
});

