'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ModalResultSkeleton from './ModalResultSkeleton';
import styles from './ProductSearchModal.module.css';

interface ProductSearchResult {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  category: string;
  subCategory: string;
  images: string;
  scentFamily: string | null;
  averageRating?: number;
  reviewCount?: number;
  inStock: boolean;
}

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductSearchModal({ isOpen, onClose }: ProductSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
    return () => {
      document.body.style.overflow = '';
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          const btn = document.getElementById('search-trigger-btn');
          btn?.click();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!query.trim()) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setResults([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query.trim())}&limit=8`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        }
        setLoading(false);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        setResults([]);
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search candles, ceramics, notes (e.g. lavender, lotus, amber)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search catalog"
          />

          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              aria-label="Clear query"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close search"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.resultsBody}>
          {loading ? (
            <div aria-busy="true">
              <ModalResultSkeleton />
              <ModalResultSkeleton />
              <ModalResultSkeleton />
              <ModalResultSkeleton />
            </div>
          ) : query.trim().length > 0 && results.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No handcrafted pieces found for &ldquo;{query}&rdquo;</p>
              <p className={styles.emptyHint}>Try searching for popular artisan creations:</p>
              <div className={styles.suggestions}>
                {['Sunflower', 'Lotus', 'Ribbed', 'Daisy', 'Lavender'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.suggestionPill}
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((p) => {
              let img = '/images/products/sunflower-wax-cluster-yellow.jpg';
              try {
                const parsed = JSON.parse(p.images);
                if (Array.isArray(parsed) && parsed[0]) img = parsed[0];
              } catch {
                if (p.images) img = p.images;
              }

              return (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className={styles.resultItem}
                  onClick={handleClose}
                >
                  <Image
                    src={img}
                    alt={p.name}
                    width={54}
                    height={54}
                    className={styles.resultThumb}
                  />
                  <div className={styles.resultDetails}>
                    <span className={styles.resultName}>{p.name}</span>
                    <div className={styles.resultMeta}>
                      <span className={styles.resultCategory}>{p.category}</span>
                      {p.scentFamily && <span>· {p.scentFamily}</span>}
                      {p.averageRating !== undefined && p.reviewCount !== undefined && p.reviewCount > 0 && (
                        <span>· ★ {p.averageRating.toFixed(1)} ({p.reviewCount})</span>
                      )}
                    </div>
                  </div>
                  <span className={styles.resultPrice}>
                    ₹{(p.salePrice ?? p.price).toLocaleString('en-IN')}
                  </span>
                </Link>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Discover Handcrafted Pieces</p>
              <p className={styles.emptyHint}>Search by candle fragrance, ceramic style, or material</p>
              <div className={styles.suggestions}>
                {['Soy Candle', 'Lotus Bowl', 'Trinket Dish', 'Amber Scent'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.suggestionPill}
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
