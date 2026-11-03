'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import SearchItemSkeleton from './SearchItemSkeleton';
import styles from './HeaderSearchBar.module.css';

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  category: string;
  images: string;
  inStock: boolean;
}

export default function HeaderSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
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
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`,
        { signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      } else {
        setResults([]);
      }
      setLoading(false);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      setResults([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchResults(query);
      } else {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setResults([]);
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
    };
  }, [query, fetchResults]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) setIsOpen(true);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/product/${results[selectedIndex].slug}`);
        setIsOpen(false);
      } else if (query.trim()) {
        router.push(`/candles?search=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const parseImage = (imagesStr: string) => {
    try {
      const parsed = JSON.parse(imagesStr);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/images/logo.jpg';
    } catch {
      return '/images/logo.jpg';
    }
  };

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <form
        role="search"
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            router.push(`/candles?search=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
          }
        }}
      >
        <span className={styles.searchIcon} aria-hidden="true">
          <Search size={18} />
        </span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search candles, ceramics, scents..."
          className={styles.inputBox}
          autoComplete="off"
          aria-label="Search products"
        />
        <div className={styles.actionsRight}>
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearBtn}
              aria-label="Clear search query"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className={styles.kbdHint}>⌘K</kbd>
          )}
        </div>
      </form>

      {isOpen && query.trim().length > 0 && (
        <div className={styles.dropdown} role="listbox">
          {loading && (
            <div className={styles.dropdownList} aria-busy="true">
              <SearchItemSkeleton />
              <SearchItemSkeleton />
              <SearchItemSkeleton />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className={styles.dropdownEmpty}>
              No handcrafted items found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className={styles.dropdownList}>
                {results.slice(0, 6).map((item, index) => {
                  const thumb = parseImage(item.images);
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ''}`}
                      onClick={() => {
                        router.push(`/product/${item.slug}`);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <Image
                        src={thumb}
                        alt={item.name}
                        width={44}
                        height={44}
                        className={styles.itemThumb}
                      />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemCategory}>{item.category}</span>
                          <span className={styles.itemPrice}>
                            ₹{item.salePrice ?? item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className={styles.dropdownFooter}
                onClick={() => {
                  router.push(`/candles?search=${encodeURIComponent(query.trim())}`);
                  setIsOpen(false);
                }}
              >
                <span>View all results for &ldquo;{query}&rdquo;</span>
                <span className={styles.footerAction}>
                  <ArrowRight size={14} />
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
