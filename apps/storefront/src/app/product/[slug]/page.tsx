import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug, getRelatedProducts, getAllSlugs } from '@/lib/getProducts';
import { getStoreSettings } from '@/lib/cms';
import PriceTag from '@/components/PriceTag/PriceTag';
import ScentBadge from '@/components/ScentBadge/ScentBadge';
import FeaturedCategory from '@/components/FeaturedCategory/FeaturedCategory';
import BrushDivider from '@/components/BrushDivider/BrushDivider';
import StarRating from '@/components/StarRating/StarRating';
import AddToCartButton from './AddToCartButton';
import ProductReviewsSection from './ProductReviewsSection';
import styles from './page.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  const description = product.story ? product.story.slice(0, 155) : 'Small-batch artisanal piece by Meadow Mist.';
  const primaryImage = product.images[0] || '/images/logo.jpg';

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Meadow Mist`,
      description,
      type: 'website',
      url: `https://meadowmist.in/product/${slug}`,
      images: [{ url: primaryImage, width: 800, height: 600, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Meadow Mist`,
      description,
      images: [primaryImage],
    },
    alternates: {
      canonical: `https://meadowmist.in/product/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.slug, product.category, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.story,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Meadow Mist',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.salePrice ?? product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://meadowmist.in/product/${product.slug}`,
    },
    ...(product.averageRating && product.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://meadowmist.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category === 'candle' ? 'Candles' : 'Ceramics',
        item: `https://meadowmist.in/${product.category === 'candle' ? 'candles' : 'ceramics'}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://meadowmist.in/product/${product.slug}`,
      },
    ],
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="container">
        <div className={styles.productGrid}>
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                className={styles.img}
              />
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.badgeRow}>
              {product.badge && (
                <span className={`${styles.badge} ${styles[`badge-${product.badge}`]}`}>
                  {product.badge === 'bestseller' ? 'Bestseller' : product.badge === 'new' ? 'New' : 'Limited'}
                </span>
              )}
              <ScentBadge
                family={product.scentFamily ?? product.subCategory}
                colorFamily={product.colorFamily}
              />
            </div>

            <h1 className={styles.name}>{product.name}</h1>

            {product.averageRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
              <a href="#customer-reviews" className={styles.ratingHeaderRow}>
                <StarRating rating={product.averageRating} />
                <span className={styles.ratingHeaderText}>
                  {product.averageRating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </a>
            )}

            <PriceTag price={product.price} salePrice={product.salePrice} />

            <p className={styles.story}>{product.story}</p>

            {product.scentNotes && product.scentNotes.length > 0 && (
              <div className={styles.scentNotes}>
                <p className={styles.detailLabel}>Scent Notes</p>
                <p className={styles.scentList}>{product.scentNotes.join(' · ')}</p>
              </div>
            )}

            <div className={styles.materials}>
              <p className={styles.detailLabel}>Materials</p>
              <ul className={styles.materialList}>
                {product.materials.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>

            <div className={styles.dimensions}>
              <p className={styles.detailLabel}>Dimensions</p>
              <p>{product.dimensions || 'Handcrafted dimensions vary slightly per piece.'}</p>
            </div>

            <div className={styles.makingOf}>
              <p className={styles.makingOfLabel}>The making of</p>
              <p className={styles.makingOfText}>
                {settings?.aboutArtisanNote ||
                  'Each piece is made in small batches — the variations in texture, glaze, and finish are a feature, not a flaw. Your piece will be similar to the photographs, and deliberately not identical.'}
              </p>
            </div>

            <div className={styles.ctaRow}>
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>

        <div id="customer-reviews" style={{ scrollMarginTop: "100px" }}>
          <ProductReviewsSection productId={product.id} productSlug={product.slug} category={product.category} />
        </div>

        {related.length > 0 && (
          <>
            <BrushDivider />
            <FeaturedCategory
              title="You might also like"
              href={product.category === 'candle' ? '/candles' : '/ceramics'}
              products={related}
            />
          </>
        )}
      </div>
    </div>
  );
}
