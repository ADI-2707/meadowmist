import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

interface RequestItem {
  productId: string;
  variantId?: string;
  qty?: number;
  quantity?: number;
  selectedFragrance?: string;
  selectedColor?: string;
  selectedSize?: string;
  customNotes?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to place an order' }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, paymentMethod = 'COD', promoCode, customerNotes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.postalCode) {
      return NextResponse.json({ error: 'Valid delivery address is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let verifiedSubtotal = 0;
      const orderItemsToCreate: {
        productId: string;
        variantId?: string | null;
        productName: string;
        productImage: string;
        unitPrice: number;
        quantity: number;
        selectedFragrance?: string | null;
        selectedColor?: string | null;
        selectedSize?: string | null;
        customNotes?: string | null;
        lineTotal: number;
      }[] = [];

      for (const reqItem of items as RequestItem[]) {
        const qty = reqItem.quantity || reqItem.qty || 1;
        const product = await tx.product.findUnique({
          where: { id: reqItem.productId },
        });

        if (!product || !product.isActive) {
          throw new Error(`Product ${product?.name || reqItem.productId} is no longer available`);
        }

        let variant: {
          id: string;
          productId: string;
          sku: string;
          name: string;
          price: number | null;
          salePrice: number | null;
          stockQuantity: number;
          inStock: boolean;
        } | null = null;

        if (reqItem.variantId) {
          variant = await tx.productVariant.findUnique({
            where: { id: reqItem.variantId },
          });

          if (!variant || variant.productId !== product.id) {
            throw new Error(`Selected variant is not available for "${product.name}"`);
          }

          const variantUpdate = await tx.productVariant.updateMany({
            where: {
              id: variant.id,
              stockQuantity: { gte: qty },
            },
            data: {
              stockQuantity: { decrement: qty },
            },
          });

          if (variantUpdate.count === 0) {
            throw new Error(
              `Insufficient stock for variant "${variant.name}". Only ${variant.stockQuantity} piece${variant.stockQuantity === 1 ? '' : 's'} remaining.`
            );
          }

          const updatedVariant = await tx.productVariant.findUnique({
            where: { id: variant.id },
            select: { stockQuantity: true },
          });
          const newVariantStock = updatedVariant?.stockQuantity ?? 0;
          if (newVariantStock === 0) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { inStock: false },
            });
          }
        }

        const updateResult = await tx.product.updateMany({
          where: {
            id: product.id,
            isActive: true,
            stockQuantity: { gte: qty },
          },
          data: {
            stockQuantity: { decrement: qty },
          },
        });

        if (updateResult.count === 0) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stockQuantity} piece${product.stockQuantity === 1 ? '' : 's'} remaining.`
          );
        }

        const updatedProduct = await tx.product.findUnique({
          where: { id: product.id },
          select: { stockQuantity: true },
        });
        const newStock = updatedProduct?.stockQuantity ?? 0;

        if (newStock === 0) {
          await tx.product.update({
            where: { id: product.id },
            data: { inStock: false },
          });
        }

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            changeQuantity: -qty,
            newQuantity: newStock,
            reason: 'ORDER_PLACED',
            note: `Order placed by customer ${session.email}${variant ? ` (Variant: ${variant.sku} - ${variant.name})` : ''}`,
          },
        });

        const effectivePrice = variant?.salePrice ?? variant?.price ?? product.salePrice ?? product.price;
        const lineTotal = effectivePrice * qty;
        verifiedSubtotal += lineTotal;

        let primaryImage = '/images/products/sunflower-wax-cluster-yellow.jpg';
        try {
          const imgs = JSON.parse(product.images);
          if (Array.isArray(imgs) && imgs.length > 0) primaryImage = imgs[0];
        } catch {
          primaryImage = product.images;
        }

        orderItemsToCreate.push({
          productId: product.id,
          variantId: variant ? variant.id : null,
          productName: variant ? `${product.name} - ${variant.name}` : product.name,
          productImage: primaryImage,
          unitPrice: effectivePrice,
          quantity: qty,
          selectedFragrance: reqItem.selectedFragrance || null,
          selectedColor: reqItem.selectedColor || null,
          selectedSize: reqItem.selectedSize || null,
          customNotes: reqItem.customNotes || null,
          lineTotal,
        });
      }

      let discount = 0;
      let validPromoCode: string | null = null;

      if (promoCode && typeof promoCode === 'string') {
        const promo = await tx.promotion.findUnique({
          where: { code: promoCode.trim().toUpperCase() },
        });

        if (promo && promo.isActive) {
          const now = new Date();
          const isNotExpired = !promo.expiresAt || now <= promo.expiresAt;
          const meetsMin = verifiedSubtotal >= promo.minOrderValue;
          const underLimit = !promo.usageLimit || promo.timesUsed < promo.usageLimit;

          if (isNotExpired && meetsMin && underLimit) {
            if (promo.discountType === 'PERCENTAGE') {
              discount = (verifiedSubtotal * promo.discountValue) / 100;
              if (promo.maxDiscount && discount > promo.maxDiscount) {
                discount = promo.maxDiscount;
              }
            } else {
              discount = promo.discountValue;
            }
            discount = Math.round(discount);
            validPromoCode = promo.code;

            await tx.promotion.update({
              where: { id: promo.id },
              data: { timesUsed: { increment: 1 } },
            });
          }
        }
      }

      const settings = tx.storeSettings ? await tx.storeSettings.findUnique({ where: { id: 'default' } }) : null;
      const flatRate = settings?.shippingFlatRate ?? 99;
      const freeThreshold = settings?.freeShippingThreshold ?? 1499;
      const shippingCharges = verifiedSubtotal >= freeThreshold ? 0 : flatRate;
      const totalAmount = Math.max(0, verifiedSubtotal + shippingCharges - discount);

      const timestampSuffix = Date.now().toString().slice(-4);
      const randomPart = Math.floor(100 + Math.random() * 900);
      const orderNumber = `MM-${new Date().getFullYear()}-${timestampSuffix}${randomPart}`;

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.userId,
          isGuest: false,
          guestEmail: null,
          guestPhone: null,
          status: 'PENDING',
          subtotal: verifiedSubtotal,
          shippingCharges,
          discountAmount: discount,
          totalAmount,
          promoCode: validPromoCode,
          paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
          paymentMethod: String(paymentMethod),
          paymentRef: paymentMethod === 'ONLINE' ? `PAY-MOCK-${Date.now()}` : null,
          shippingAddress: JSON.stringify(shippingAddress),
          customerNotes: customerNotes ? String(customerNotes).trim() : null,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: { userId: session.userId },
      });

      return createdOrder;
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error: unknown) {
    console.error('Order placement error:', error);
    const message = error instanceof Error ? error.message : 'Failed to place order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
