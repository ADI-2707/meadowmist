'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types/product';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { formatCurrency } from '@meadowmist/shared';
import PriceTag from '@/components/PriceTag/PriceTag';
import ScentBadge from '@/components/ScentBadge/ScentBadge';
import StarRating from '@/components/StarRating/StarRating';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useRef(false);
  const rafId = useRef<number | null>(null);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.has(product.id));

  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.qty ?? 0;
  const isOutOfStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
  const isLowStock = !isOutOfStock && product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold || 5);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced.current || !innerRef.current || !cardRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (rafId.current !== null) return;
    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = null;
      if (!innerRef.current || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (rect.width / 2);
      const dy = (clientY - cy) / (rect.height / 2);
      const rx = dy * -6;
      const ry = dx * 6;
      innerRef.current.style.setProperty('--card-rx', `${rx}deg`);
      innerRef.current.style.setProperty('--card-ry', `${ry}deg`);
    });
  }, []);

  const resetTilt = useCallback(() => {
    if (rafId.current !== null) {
      window.cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (!innerRef.current) return;
    innerRef.current.style.setProperty('--card-rx', '0deg');
    innerRef.current.style.setProperty('--card-ry', '0deg');
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const isAddingRef = useRef(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAddingRef.current) return;
    isAddingRef.current = true;
    setTimeout(() => {
      isAddingRef.current = false;
    }, 250);

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.salePrice ?? product.price,
      image: product.images[0],
      category: product.category,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      className={styles.card}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div className={styles.inner} ref={innerRef}>
        <div className={styles.sheen} aria-hidden="true" />

        {product.badge && (
          <span className={`${styles.badge} ${styles[`badge-${product.badge}`]}`}>
            {product.badge === 'bestseller' ? 'Bestseller' : product.badge === 'new' ? 'New' : 'Limited'}
          </span>
        )}

        <button
          type="button"
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
          onClick={handleWishlist}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
        >
          <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>

        <Link
          href={`/product/${product.slug}`}
          className={styles.imageLink}
          aria-label={`View ${product.name} — ${formatCurrency(product.salePrice ?? product.price)}`}
        >
          <div className={styles.imageWrapper}>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 30vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              className={styles.image}
            />
          </div>
        </Link>

        <div className={styles.body}>
          <div className={styles.meta}>
            {product.scentFamily && (
              <ScentBadge family={product.scentFamily} colorFamily={product.colorFamily} />
            )}
            {product.subCategory && !product.scentFamily && (
              <ScentBadge family={product.subCategory as 'floral'} colorFamily={product.colorFamily} />
            )}
          </div>

          <h3 className={styles.name}>
            <Link href={`/product/${product.slug}`} className={styles.titleLink}>
              {product.name}
            </Link>
          </h3>
          {product.averageRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
            <div className={styles.ratingRow}>
              <StarRating rating={product.averageRating} />
              <span className={styles.ratingCount}>({product.reviewCount})</span>
            </div>
          )}
          <p className={styles.story}>{product.story.slice(0, 72)}…</p>

          <div className={styles.footer}>
            <div>
              <PriceTag price={product.price} salePrice={product.salePrice} />
              {isOutOfStock ? (
                <div className={`${styles.stockTag} ${styles.stockOut}`}>Out of Stock</div>
              ) : isLowStock ? (
                <div className={`${styles.stockTag} ${styles.stockLow}`}>Only {product.stockQuantity} left</div>
              ) : null}
            </div>
            {isOutOfStock ? (
              <button
                type="button"
                className={`${styles.addBtn} ${styles.addBtnDisabled}`}
                disabled
                aria-disabled="true"
                aria-label={`${product.name} is out of stock`}
              >
                Sold Out
              </button>
            ) : qty > 0 ? (
              <div
                className={styles.qtyControl}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  className={styles.qtyMinusBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQty(product.id, qty - 1);
                  }}
                  aria-label={`Decrease quantity of ${product.name}`}
                >
                  −
                </button>
                <span className={styles.qtyCount}>{qty}</span>
                <button
                  type="button"
                  className={styles.qtyPlusBtn}
                  disabled={product.stockQuantity !== undefined && qty >= product.stockQuantity}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.stockQuantity === undefined || qty < product.stockQuantity) {
                      updateQty(product.id, qty + 1);
                    }
                  }}
                  aria-label={`Increase quantity of ${product.name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to bag`}
              >
                Add to bag
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
