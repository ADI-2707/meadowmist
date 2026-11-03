'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Search, Trash2, Edit, Download, Upload } from 'lucide-react';
import { StockBadge, BadgeStatus } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import { TableRowSkeleton } from '@/components/TableRowSkeleton/TableRowSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@meadowmist/shared';
import styles from '../products.module.css';

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  salePrice?: number | null;
  images: string;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  isActive: boolean;
  badge?: string | null;
}

export function CatalogTab() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchProducts = async (currentPage = page, currentLimit = limit) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      params.set('page', String(currentPage));
      params.set('limit', String(currentLimit));

      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
      setLoading(false);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      console.error('Products load error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page === 1) {
      fetchProducts(1, limit);
    } else {
      setPage(1);
    }
  }, [categoryFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchProducts(page, limit);
  }, [page, limit]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete or deactivate "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts(page, limit);
      } else {
        toast.error('Failed to delete product');
      }
    } catch {
      toast.error('Error deleting product');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/products/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meadow-mist-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export catalog CSV');
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to import CSV');
      } else {
        toast.success(
          `Import complete! Created: ${data.created}, Updated: ${data.updated}, Skipped: ${data.errors?.length || 0}`
        );
        fetchProducts(page, limit);
      }
    } catch (err) {
      toast.error('Error uploading CSV file');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const getStockStatus = (
    quantity: number,
    lowThreshold: number,
    inStock: boolean
  ): BadgeStatus => {
    if (!inStock || quantity <= 0) return 'out-of-stock';
    if (quantity <= lowThreshold) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div className={styles.container}>
      <div className={styles.actionsBar}>
        <div className={styles.leftActions}>
          <Link href="/products/new" className={styles.addBtn}>
            <PlusCircle size={16} />
            <span>Add New Piece</span>
          </Link>
          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.secondaryBtn}
            title="Download complete catalog as CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <label
            className={styles.secondaryBtn}
            style={{ cursor: importing ? 'wait' : 'pointer', opacity: importing ? 0.6 : 1 }}
            title="Upload CSV to bulk update or add items"
          >
            <Upload size={15} />
            <span>{importing ? 'Importing…' : 'Import CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
              disabled={importing}
            />
          </label>
        </div>
      </div>

      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, category, scent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </form>

        <div className={styles.filterControls}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by Category"
          >
            <option value="ALL">All Categories</option>
            <option value="candle">Candles</option>
            <option value="ceramic">Ceramics</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active in Store</option>
            <option value="INACTIVE">Draft / Inactive</option>
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Badge</th>
                <th>Store Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton columns={7} rows={limit > 10 ? 8 : limit} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      No products match the selected criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  let parsedImages: string[] = [];
                  try {
                    parsedImages = JSON.parse(p.images);
                  } catch {
                    parsedImages = [p.images];
                  }
                  const thumb = parsedImages[0] || '/candle.jpg';

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.productCell}>
                          <div
                            className={styles.productThumb}
                            style={{
                              position: 'relative',
                              width: '44px',
                              height: '44px',
                              minWidth: '44px',
                              minHeight: '44px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              backgroundColor: 'var(--color-canvas)',
                              flexShrink: 0,
                              border: '1px solid var(--color-gold-soft)',
                            }}
                          >
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              sizes="44px"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <p className={styles.productName}>{p.name}</p>
                            <p className={styles.productSlug}>/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryPill}>
                          {p.category.toUpperCase()} · {p.subCategory}
                        </span>
                      </td>
                      <td>
                        {p.salePrice ? (
                          <div>
                            <span className={styles.salePrice}>
                              ₹{p.salePrice.toLocaleString('en-IN')}
                            </span>
                            <span className={styles.origPrice}>
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <span className={styles.regularPrice}>
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td>
                        <StockBadge
                          status={getStockStatus(
                            p.stockQuantity,
                            p.lowStockThreshold,
                            p.inStock
                          )}
                        />
                      </td>
                      <td>
                        {p.badge ? (
                          <span className={styles.badgeText}>{p.badge}</span>
                        ) : (
                          <span style={{ color: '#aaa' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusDot} ${
                            p.isActive ? styles.statusActive : styles.statusInactive
                          }`}
                        />
                        <span style={{ fontSize: '0.8rem' }}>
                          {p.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <Link
                            href={`/products/${p.id}/edit`}
                            className={styles.editBtn}
                            title="Edit Piece"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className={styles.deleteBtn}
                            title="Delete Piece"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
