'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Search, Trash2, Edit, Download, Upload } from 'lucide-react';
import { StockBadge, BadgeStatus } from '@/components/StockBadge/StockBadge';
import { Pagination } from '@/components/Pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
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

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchProducts = async (currentPage = page, currentLimit = limit) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      params.set('page', String(currentPage));
      params.set('limit', String(currentLimit));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.pagination) {
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Products load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1, limit);
  }, [categoryFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchProducts(page, limit);
  }, [page, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete or deactivate "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch {
      alert('Error deleting product');
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(
          `Import successful! Processed ${data.totalProcessed} products (${data.createdCount} added, ${data.updatedCount} updated).`
        );
        fetchProducts();
      } else {
        alert(data.error || 'Failed to import CSV');
      }
    } catch {
      alert('Error uploading and parsing CSV file');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const getStockStatus = (qty: number, threshold: number, inStock: boolean): BadgeStatus => {
    if (!inStock || qty <= 0) return 'out-of-stock';
    if (qty <= threshold) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <a
          href="/api/products/export"
          download="meadow-mist-catalog-export.csv"
          className={styles.secondaryBtn}
        >
          <Download size={16} />
          <span>Export CSV</span>
        </a>
        <label className={styles.secondaryBtn}>
          <Upload size={16} />
          <span>{importing ? 'Importing...' : 'Import CSV'}</span>
          <input
            type="file"
            accept=".csv"
            disabled={importing}
            onChange={handleImportCSV}
            style={{ display: 'none' }}
          />
        </label>
        <Link href="/products/new" className={styles.addBtn}>
          <PlusCircle size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      <div className={styles.filterBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search piece by name or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            <Search size={16} />
          </button>
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
        {loading ? (
          <div className={styles.emptyState}>Loading artisan catalog...</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            No products match the selected criteria.
          </div>
        ) : (
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
                {products.map((p) => {
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
                          <div className={styles.productThumb}>
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
                })}
              </tbody>
            </table>
          </div>
        )}

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
