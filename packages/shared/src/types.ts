export interface CustomOptions {
  fragrances?: string[];
  waxTones?: string[];
  sizes?: string[];
  finishes?: string[];
  allowGiftMessage?: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  optionValues: string | Record<string, string>;
  price?: number | null;
  salePrice?: number | null;
  stockQuantity: number;
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  variants?: ProductVariant[];
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

export interface RestockNotification {
  id: string;
  productId: string;
  variantId?: string | null;
  email: string;
  notified: boolean;
  createdAt: string;
}

export interface RestockNotificationInput {
  productId: string;
  variantId?: string | null;
  email: string;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
}

export interface CatalogExportItem {
  id: string;
  sku?: string;
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  inStock: boolean;
  materials?: string;
  dimensions?: string | null;
  scentFamily?: string | null;
  scentNotes?: string | null;
  colorFamily?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  variant?: ProductVariant | null;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  selectedFragrance?: string | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  customNotes?: string | null;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  isGuest?: boolean;
  guestEmail?: string | null;
  guestPhone?: string | null;
  status: string;
  subtotal: number;
  shippingCharges: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string | null;
  paymentStatus: string;
  paymentMethod: string;
  paymentRef?: string | null;
  shippingAddress: string;
  customerNotes?: string | null;
  createdAt: string;
  items: OrderItem[];
}
