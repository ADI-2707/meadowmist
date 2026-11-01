import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './page.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const articles = await prisma.journalArticle.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    return articles.map((a: { slug: string }) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await prisma.journalArticle.findUnique({
      where: { slug },
    });
    if (!article) return { title: 'Article Not Found' };

    return {
      title: `${article.title} | Meadow Mist Journal`,
      description: article.excerpt,
      openGraph: {
        title: article.title,
        description: article.excerpt,
        type: 'article',
        url: `https://meadowmist.in/journal/${slug}`,
        images: [{ url: article.coverImage, width: 1200, height: 630, alt: article.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${article.title} | Meadow Mist Journal`,
        description: article.excerpt,
        images: [article.coverImage],
      },
      alternates: {
        canonical: `https://meadowmist.in/journal/${slug}`,
      },
    };
  } catch {
    return { title: 'Journal & Care Guides | Meadow Mist' };
  }
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  let article = null;

  try {
    article = await prisma.journalArticle.findUnique({
      where: { slug },
    });
  } catch (err) {
    console.error('Failed to query journal article by slug from DB:', err);
  }

  if (!article || !article.isPublished) {
    notFound();
  }

  let relatedProducts: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    salePrice: number | null;
    images: string;
    category: string;
  }> = [];

  if (article.relatedProductSlugs) {
    try {
      const slugs: string[] = JSON.parse(article.relatedProductSlugs);
      if (Array.isArray(slugs) && slugs.length > 0) {
        relatedProducts = await prisma.product.findMany({
          where: {
            slug: { in: slugs },
            isActive: true,
          },
          select: {
            id: true,
            slug: true,
            name: true,
            price: true,
            salePrice: true,
            images: true,
            category: true,
          },
        });
      }
    } catch {
      relatedProducts = [];
    }
  }

  if (relatedProducts.length === 0) {
    try {
      relatedProducts = await prisma.product.findMany({
        where: { isActive: true },
        take: 2,
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          salePrice: true,
          images: true,
          category: true,
        },
      });
    } catch {
      relatedProducts = [];
    }
  }

  const paragraphs = article.content.split('\n\n');

  return (
    <div className={styles.page}>
      <article className="container">
        <div className={styles.articleContainer}>
          <Link href="/journal" className={styles.breadcrumb}>
            &larr; Back to Journal &amp; Guides
          </Link>

          <header className={styles.header}>
            <div className={styles.metaRow}>
              <span>{article.category}</span>
              <span>·</span>
              <span>{article.readTime}</span>
              <span>·</span>
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.subtitle}>{article.excerpt}</p>
          </header>

          <div className={styles.coverWrapper}>
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              priority
              className={styles.coverImg}
            />
          </div>

          <div className={styles.bodyContent}>
            {paragraphs.map((para, index) => (
              <p key={index} className={styles.paragraph}>
                {para}
              </p>
            ))}
          </div>

          <div className={styles.authorCard}>
            <Image
              src="/images/logo.jpg"
              alt="Meadow Mist Artisan Logo"
              width={64}
              height={64}
              className={styles.authorImg}
            />
            <div>
              <h3 className={styles.authorName}>Written by Meadow Mist Studio</h3>
              <p className={styles.authorNote}>
                Handcrafted small-batch studio rooted in natural soy waxes, organic botanicals, and wheel-thrown stoneware ceramics.
              </p>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <section className={styles.relatedSection} aria-label="Mentioned Handcrafted Pieces">
              <h3 className={styles.relatedTitle}>Featured Handcrafted Pieces</h3>
              <div className={styles.relatedGrid}>
                {relatedProducts.map((p) => {
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
                      className={styles.relatedCard}
                    >
                      <Image
                        src={img}
                        alt={p.name}
                        width={72}
                        height={72}
                        className={styles.relatedThumb}
                      />
                      <div className={styles.relatedDetails}>
                        <h4 className={styles.relatedName}>{p.name}</h4>
                        <span className={styles.relatedPrice}>
                          ₹{(p.salePrice ?? p.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
