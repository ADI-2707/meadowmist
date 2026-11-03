import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  quantity: z.number().int().min(0).max(100),
  selectedFragrance: z.string().max(100).optional().nullable(),
  selectedColor: z.string().max(100).optional().nullable(),
  selectedSize: z.string().max(100).optional().nullable(),
  customNotes: z.string().max(500).optional().nullable(),
});

export const cartSyncSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, 'productId is required'),
      quantity: z.number().int().min(1).max(100),
      selectedFragrance: z.string().max(100).optional().nullable(),
      selectedColor: z.string().max(100).optional().nullable(),
      selectedSize: z.string().max(100).optional().nullable(),
      customNotes: z.string().max(500).optional().nullable(),
    })
  ).max(50),
});

export const wishlistItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
});

export const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingNumber: z.string().max(100).optional().nullable(),
  courierPartner: z.string().max(100).optional().nullable(),
  courierStatus: z.string().max(100).optional().nullable(),
});
