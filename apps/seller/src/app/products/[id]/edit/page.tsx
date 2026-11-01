'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import styles from '../../products.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

interface VariantFormItem {
  id?: string;
  sku: string;
  name: string;
  price: string;
  salePrice: string;
  stockQuantity: string;
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState<'candle' | 'ceramic'>('candle');
  const [subCategory, setSubCategory] = useState('pillar');
  const [images, setImages] = useState<string[]>([]);
  const [materials, setMaterials] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [colorFamily, setColorFamily] = useState('ivory');
  const [scentFamily, setScentFamily] = useState('floral');
  const [scentNotes, setScentNotes] = useState('');
  const [badge, setBadge] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [fragrances, setFragrances] = useState('');
  const [waxTones, setWaxTones] = useState('');
  const [sizes, setSizes] = useState('');
  const [allowGiftMessage, setAllowGiftMessage] = useState(true);

  const [variants, setVariants] = useState<VariantFormItem[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.product;
          if (p) {
            setName(p.name);
            setSlug(p.slug);
            setDescription(p.description);
            setPrice(String(p.price));
            setSalePrice(p.salePrice ? String(p.salePrice) : '');
            setCategory(p.category);
            setSubCategory(p.subCategory);

            try {
              setImages(JSON.parse(p.images));
            } catch {
              setImages([p.images]);
            }

            try {
              const m = JSON.parse(p.materials);
              setMaterials(Array.isArray(m) ? m.join(', ') : '');
            } catch {
              setMaterials('');
            }

            setDimensions(p.dimensions || '');
            setColorFamily(p.colorFamily || 'ivory');
            setScentFamily(p.scentFamily || 'floral');

            try {
              const s = JSON.parse(p.scentNotes || '[]');
              setScentNotes(Array.isArray(s) ? s.join(', ') : '');
            } catch {
              setScentNotes('');
            }

            setBadge(p.badge || '');
            setStockQuantity(String(p.stockQuantity));
            setLowStockThreshold(String(p.lowStockThreshold));
            setIsFeatured(Boolean(p.isFeatured));
            setIsActive(Boolean(p.isActive));

            try {
              const c = JSON.parse(p.customOptions || '{}');
              setFragrances(Array.isArray(c.fragrances) ? c.fragrances.join(', ') : '');
              setWaxTones(Array.isArray(c.waxTones) ? c.waxTones.join(', ') : '');
              setSizes(Array.isArray(c.sizes) ? c.sizes.join(', ') : '');
              setAllowGiftMessage(Boolean(c.allowGiftMessage));
            } catch {
            }

            if (p.variants && Array.isArray(p.variants)) {
              setVariants(
                p.variants.map((v: any) => ({
                  id: v.id,
                  sku: v.sku,
                  name: v.name,
                  price: v.price ? String(v.price) : '',
                  salePrice: v.salePrice ? String(v.salePrice) : '',
                  stockQuantity: String(v.stockQuantity ?? 0),
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load product for editing:', err);
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImages((prev) => [...prev, data.url]);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    const baseSku = (slug || name || 'item').toUpperCase().replace(/[^A-Z0-9]/g, '-');
    const count = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        sku: `${baseSku}-V${count}`,
        name: `Edition ${count}`,
        price: price || '',
        salePrice: salePrice || '',
        stockQuantity: '5',
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof VariantFormItem, value: string) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveVariant = (index: number) => {
    const target = variants[index];
    if (target?.id) {
      setDeletedVariantIds((prev) => [...prev, target.id!]);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Name and price are required');
      return;
    }

    setLoading(true);

    const materialsArray = materials.split(',').map((m) => m.trim()).filter(Boolean);
    const scentNotesArray = scentNotes.split(',').map((s) => s.trim()).filter(Boolean);

    const customOptions = {
      fragrances: fragrances.split(',').map((f) => f.trim()).filter(Boolean),
      waxTones: waxTones.split(',').map((w) => w.trim()).filter(Boolean),
      sizes: sizes.split(',').map((s) => s.trim()).filter(Boolean),
      allowGiftMessage,
    };

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          price: Number(price),
          salePrice: salePrice ? Number(salePrice) : null,
          category,
          subCategory,
          images,
          materials: materialsArray,
          dimensions,
          colorFamily,
          scentFamily: category === 'candle' ? scentFamily : null,
          scentNotes: category === 'candle' ? scentNotesArray : [],
          badge: badge || null,
          customOptions,
          stockQuantity: Number(stockQuantity) || 0,
          lowStockThreshold: Number(lowStockThreshold) || 5,
          isFeatured,
          isActive,
          variants: variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price ? Number(v.price) : null,
            salePrice: v.salePrice ? Number(v.salePrice) : null,
            stockQuantity: Number(v.stockQuantity) || 0,
          })),
          deletedVariantIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/products');
      } else {
        alert(data.error || 'Failed to update product');
      }
    } catch {
      alert('Error updating product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>Loading artisan piece details...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title={`Edit Piece: ${name}`}
        subtitle="Update photography, studio inventory, SKU variants, and pricing"
        actions={
          <Link href="/products" className={styles.secondaryBtn}>
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>1. Basic Information</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Product Title *</label>
              <input
                required
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>URL Slug *</label>
              <input
                required
                className={styles.input}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Description & Story</label>
              <textarea
                rows={4}
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>2. Pricing & Category</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Base Price (₹) *</label>
              <input
                type="number"
                required
                className={styles.input}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sale Price (₹, optional)</label>
              <input
                type="number"
                className={styles.input}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category *</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as 'candle' | 'ceramic')}
              >
                <option value="candle">Soy Candle</option>
                <option value="ceramic">Ceramic Piece</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sub-category</label>
              <input
                className={styles.input}
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>3. Studio Photography</h2>
          <div className={styles.imageGrid}>
            {images.map((img, i) => (
              <div key={i} className={styles.imageThumb}>
                <Image src={img} alt="" fill sizes="100px" style={{ objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className={styles.removeImageBtn}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ))}

            <label className={styles.uploadBox}>
              <Upload size={24} />
              <span>{uploading ? 'Uploading...' : 'Add Image'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>4. Attributes & Customizations</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Color Family</label>
              <select
                className={styles.select}
                value={colorFamily}
                onChange={(e) => setColorFamily(e.target.value)}
              >
                <option value="clay">Clay</option>
                <option value="mauve">Mauve</option>
                <option value="blush">Blush</option>
                <option value="ivory">Ivory</option>
                <option value="forest">Forest</option>
                <option value="gold">Gold</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Badge</label>
              <select
                className={styles.select}
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              >
                <option value="">None</option>
                <option value="bestseller">Bestseller</option>
                <option value="new">New Release</option>
                <option value="limited">Limited Edition</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Materials (comma separated)</label>
              <input
                className={styles.input}
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Dimensions</label>
              <input
                className={styles.input}
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Scent Notes (comma separated)</label>
              <input
                className={styles.input}
                value={scentNotes}
                onChange={(e) => setScentNotes(e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Fragrance Choices</label>
              <input
                className={styles.input}
                value={fragrances}
                onChange={(e) => setFragrances(e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Wax / Glaze Tones</label>
              <input
                className={styles.input}
                value={waxTones}
                onChange={(e) => setWaxTones(e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Available Sizes</label>
              <input
                className={styles.input}
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
              />
            </div>

            <div className={styles.field} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="allowGiftEdit"
                checked={allowGiftMessage}
                onChange={(e) => setAllowGiftMessage(e.target.checked)}
              />
              <label htmlFor="allowGiftEdit" style={{ cursor: 'pointer' }}>Allow gift note requests</label>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>5. Multi-SKU Variants Manager</h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className={styles.addBtn}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              + Add Variant SKU
            </button>
          </div>

          {variants.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              No variants configured. This piece will sell under base product inventory.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {variants.map((v, idx) => (
                <div
                  key={v.id || `new_${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>SKU</label>
                    <input
                      className={styles.input}
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                      placeholder="e.g. CANDLE-LAV-200"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Variant Name</label>
                    <input
                      className={styles.input}
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                      placeholder="e.g. Lavender 200g"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Price (₹ override)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={v.price}
                      onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                      placeholder="Base price"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Stock Units</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={v.stockQuantity}
                      onChange={(e) => handleUpdateVariant(idx, 'stockQuantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div style={{ paddingTop: '18px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>6. Stock & Publishing</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>In-Stock Units *</label>
              <input
                type="number"
                required
                className={styles.input}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Low Stock Alert Threshold</label>
              <input
                type="number"
                className={styles.input}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </div>

            <div className={styles.field} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isFeaturedEdit"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <label htmlFor="isFeaturedEdit" style={{ cursor: 'pointer' }}>Feature on Homepage</label>
            </div>

            <div className={styles.field} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActiveEdit" style={{ cursor: 'pointer' }}>Product is Active / Published</label>
            </div>
          </div>
        </div>

        <div className={styles.submitRow}>
          <button type="submit" disabled={loading} className={styles.addBtn}>
            {loading ? 'Saving Changes...' : 'Save Product Changes'}
          </button>
          <Link href="/products" className={styles.cancelLink}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
