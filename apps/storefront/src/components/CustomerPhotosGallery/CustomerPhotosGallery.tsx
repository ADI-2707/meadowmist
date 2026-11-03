'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { Review } from '@meadowmist/shared';
import StarRating from '../StarRating/StarRating';
import styles from './CustomerPhotosGallery.module.css';

export interface PhotoItem {
  url: string;
  review?: Review;
}

export interface CustomerPhotosGalleryProps {
  photos?: string[];
  reviews?: Review[];
  onPhotoClick?: (photoUrl: string) => void;
}

export default function CustomerPhotosGallery({
  photos,
  reviews,
  onPhotoClick,
}: CustomerPhotosGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const items: PhotoItem[] = useMemo(() => {
    const list: PhotoItem[] = [];
    const seenUrls = new Set<string>();

    if (reviews && reviews.length > 0) {
      reviews.forEach((review) => {
        if (review.images && Array.isArray(review.images)) {
          review.images.forEach((img) => {
            if (img && typeof img === 'string' && !seenUrls.has(img)) {
              seenUrls.add(img);
              list.push({ url: img, review });
            }
          });
        }
      });
    }

    if (photos && photos.length > 0) {
      photos.forEach((url) => {
        if (url && typeof url === 'string' && !seenUrls.has(url)) {
          seenUrls.add(url);
          list.push({ url });
        }
      });
    }

    return list;
  }, [reviews, photos]);

  const handleOpen = (index: number) => {
    setActiveIndex(index);
    if (items[index] && onPhotoClick) {
      onPhotoClick(items[index].url);
    }
  };

  const handleClose = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return 0;
      return prev > 0 ? prev - 1 : items.length - 1;
    });
  }, [items.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return 0;
      return prev < items.length - 1 ? prev + 1 : 0;
    });
  }, [items.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, handleClose, handlePrev, handleNext]);

  if (items.length === 0) {
    return null;
  }

  const activeItem = activeIndex !== null ? items[activeIndex] : null;
  const reviewerName = activeItem?.review?.user?.name || 'Verified Customer';

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Customer Photos <span className={styles.count}>({items.length})</span>
        </h3>
      </div>

      <div className={styles.ribbon} role="region" aria-label="Customer photo gallery">
        {items.map((item, idx) => (
          <button
            key={item.url + idx}
            type="button"
            className={styles.thumbBtn}
            onClick={() => handleOpen(idx)}
            aria-label={`View photo ${idx + 1} of ${items.length}`}
          >
            <Image
              src={item.url}
              alt={`Customer preview ${idx + 1}`}
              className={styles.thumbImg}
              width={96}
              height={96}
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && activeItem && (
        <div
          className={styles.lightboxOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Customer photo modal"
          onClick={handleClose}
        >
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close photo modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className={styles.imageSection}>
              {items.length > 1 && (
                <button
                  type="button"
                  className={`${styles.navButton} ${styles.prevBtn}`}
                  onClick={handlePrev}
                  aria-label="Previous photo"
                >
                  <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              <Image
                src={activeItem.url}
                alt={`Customer photo ${activeIndex + 1}`}
                className={styles.mainImage}
                width={800}
                height={600}
              />

              {items.length > 1 && (
                <button
                  type="button"
                  className={`${styles.navButton} ${styles.nextBtn}`}
                  onClick={handleNext}
                  aria-label="Next photo"
                >
                  <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.detailsSection}>
              {activeItem.review ? (
                <>
                  <div className={styles.detailsTop}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className={styles.userName}>{reviewerName}</h4>
                        {activeItem.review.isVerifiedPurchase && (
                          <span className={styles.verifiedBadge}>
                            <svg className={styles.verifiedIcon} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.ratingRow}>
                    <StarRating rating={activeItem.review.rating} />
                    <span className={styles.reviewDate}>
                      {new Date(activeItem.review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {activeItem.review.title && (
                    <h5 className={styles.reviewTitle}>{activeItem.review.title}</h5>
                  )}

                  {activeItem.review.comment && (
                    <p className={styles.reviewText}>{activeItem.review.comment}</p>
                  )}
                </>
              ) : (
                <div className={styles.detailsTop}>
                  <h4 className={styles.userName}>Customer Photo</h4>
                </div>
              )}

              <div className={styles.footerRow}>
                <span>
                  Photo {activeIndex + 1} of {items.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
