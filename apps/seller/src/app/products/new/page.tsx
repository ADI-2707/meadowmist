'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { toast } from '@meadowmist/shared';
import styles from '../products.module.css';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState<'candle' | 'ceramic'>('candle');
  const [subCategory, setSubCategory] = useState('pillar');
  const [images, setImages] = useState<string[]>([]);
  const [materials, setMaterials] = useState('Soy wax, Cotton wick');
  const [dimensions, setDimensions] = useState('6 cm × 18 cm');
  const [colorFamily, setColorFamily] = useState('ivory');
  const [scentFamily, setScentFamily] = useState('floral');
  const [scentNotes, setScentNotes] = useState('Lavender, Wild herbs, Clean linen');
  const [badge, setBadge] = useState('');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [isFeatured, setIsFeatured] = useState(false);

  const [fragrances, setFragrances] = useState('Original Scent, Lavender, Vanilla Musk');
  const [waxTones, setWaxTones] = useState('Natural Cream, Terracotta, Amber');
  const [sizes, setSizes] = useState('Standard (250g), Petite (120g)');
  const [allowGiftMessage, setAllowGiftMessage] = useState(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid format. Please upload JPG, PNG, WebP, or AVIF.');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.`);
      if (e.target) e.target.value = '';
      return;
    }

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
        toast.error(data.error || 'Failed to upload image');
      }
    } catch {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error('Name and price are required');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one product photo');
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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
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
          isActive: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/products');
      } else {
        toast.error(data.error || 'Failed to save product');
      }
    } catch {
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Product Catalog"
        title="Add New Handcrafted Product"
        subtitle="Publish a new candle or ceramic piece to the store catalog."
        actions={
          <Link href="/products" className={styles.editBtn}>
            <ArrowLeft size={14} />
            <span>Back to Products</span>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>1. Basic Details</h2>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Product Name *</label>
              <input
                required
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lavender Ribbed Pillar Candle"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Custom Slug (Optional)</label>
              <input
                className={styles.input}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="lavender-ribbed-pillar"
              />
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

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Artisan Story / Description</label>
              <textarea
                rows={4}
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how it is poured, the scent notes, wax composition, or the tactile glaze..."
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>2. Pricing & Category</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as 'candle' | 'ceramic')}
              >
                <option value="candle">Candle</option>
                <option value="ceramic">Ceramic Décor</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Subcategory</label>
              <input
                className={styles.input}
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. pillar, wax-art, bowl, trinket-box"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Regular Price (₹) *</label>
              <input
                type="number"
                required
                className={styles.input}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="749"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sale Price (₹, optional)</label>
              <input
                type="number"
                className={styles.input}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Leave empty if regular"
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>3. Product Photography</h2>
          <div className={styles.uploadBox}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              id="upload-input"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <label htmlFor="upload-input" style={{ cursor: 'pointer' }}>
              <Upload size={24} style={{ display: 'block', margin: '0 auto 8px', color: 'var(--color-gold)' }} />
              <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
                {uploading ? 'Uploading image...' : 'Click to Upload Product Image'}
              </span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                Supports JPG, PNG, WebP &bull; Max 5MB per photo
              </span>
            </label>
          </div>

          <div className={styles.imgPreviewGrid}>
            {images.map((imgUrl, i) => (
              <div key={i} className={styles.previewThumb}>
                <Image src={imgUrl} alt={`Upload ${i}`} fill style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>4. Sensory & Artisan Attributes</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Color Family</label>
              <select
                className={styles.select}
                value={colorFamily}
                onChange={(e) => setColorFamily(e.target.value)}
              >
                <option value="ivory">Ivory / Cream</option>
                <option value="clay">Clay / Terracotta</option>
                <option value="mauve">Mauve / Lavender</option>
                <option value="blush">Blush Pink</option>
                <option value="forest">Forest Moss</option>
                <option value="gold">Amber Gold</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Scent Family (Candles)</label>
              <select
                className={styles.select}
                value={scentFamily}
                onChange={(e) => setScentFamily(e.target.value)}
              >
                <option value="floral">Floral</option>
                <option value="woody">Woody & Earthy</option>
                <option value="fresh">Fresh & Herbal</option>
                <option value="spice">Warm Spice & Amber</option>
              </select>
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Scent Notes (comma separated)</label>
              <input
                className={styles.input}
                value={scentNotes}
                onChange={(e) => setScentNotes(e.target.value)}
                placeholder="Lavender, Wild herbs, Clean linen"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Materials (comma separated)</label>
              <input
                className={styles.input}
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Soy wax, Cotton wick"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Dimensions</label>
              <input
                className={styles.input}
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="6 cm diameter × 18 cm height"
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>5. Customisation Options for Customers</h2>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Fragrance Options (comma separated)</label>
              <input
                className={styles.input}
                value={fragrances}
                onChange={(e) => setFragrances(e.target.value)}
                placeholder="Original Scent, Lavender, Vanilla Musk"
              />
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Wax / Glaze Tones (comma separated)</label>
              <input
                className={styles.input}
                value={waxTones}
                onChange={(e) => setWaxTones(e.target.value)}
                placeholder="Natural Cream, Terracotta, Amber Honey"
              />
            </div>

            <div className={`${styles.field} ${styles.formFull}`}>
              <label className={styles.label}>Available Sizes (comma separated)</label>
              <input
                className={styles.input}
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="Standard (250g), Petite (120g)"
              />
            </div>

            <div className={styles.field} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="allowGift"
                checked={allowGiftMessage}
                onChange={(e) => setAllowGiftMessage(e.target.checked)}
              />
              <label htmlFor="allowGift" style={{ cursor: 'pointer' }}>Allow customer gift note requests</label>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>6. Inventory & Stock Controls</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Current In-Stock Units (Candles / Pieces) *</label>
              <input
                type="number"
                required
                className={styles.input}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="20"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Low Stock Alert Threshold</label>
              <input
                type="number"
                className={styles.input}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
              />
            </div>

            <div className={styles.field} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <label htmlFor="isFeatured" style={{ cursor: 'pointer' }}>Feature on Storefront Homepage</label>
            </div>
          </div>
        </div>

        <div className={styles.submitRow}>
          <button type="submit" disabled={loading} className={styles.addBtn}>
            {loading ? 'Publishing Product...' : 'Publish Product to Catalog'}
          </button>
          <Link href="/products" className={styles.cancelLink}>
            Cancel and Return
          </Link>
        </div>
      </form>
    </div>
  );
}
