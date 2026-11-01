export interface CustomOptions {
  fragrances?: string[];
  waxTones?: string[];
  sizes?: string[];
  finishes?: string[];
  allowGiftMessage?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'candle' | 'ceramic';
  subCategory: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  scentFamily?: 'floral' | 'woody' | 'fresh' | 'spice' | null;
  materials: string[];
  dimensions?: string | null;
  story: string;
  scentNotes?: string[] | null;
  badge?: 'bestseller' | 'new' | 'limited' | null;
  colorFamily: 'clay' | 'mauve' | 'blush' | 'ivory' | 'forest' | 'gold';
  inStock: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  customOptions?: CustomOptions | null;
  averageRating?: number;
  reviewCount?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
  helpfulCount?: number;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  aspectRatings?: Record<string, number> | null;
  userVotedHelpful?: boolean;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  user?: {
    name: string;
    email?: string;
  };
  product?: {
    id?: string;
    name: string;
    slug: string;
    images?: string;
    category?: string;
  };
}

export interface ReviewInput {
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  aspectRatings?: Record<string, number>;
}

export interface AspectScore {
  name: string;
  key: string;
  average: number;
  count: number;
}

export interface RatingDistribution {
  average: number;
  total: number;
  counts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  aspectScores?: AspectScore[];
  photoCount?: number;
}

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  coverImage: string;
  isPublished: boolean;
  publishedAt: string;
  tags?: string[];
  relatedProductSlugs?: string[];
}
