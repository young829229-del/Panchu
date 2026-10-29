export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  order: number;
  enabled: boolean;
  description?: string;
}

export interface HomepageSectionPlacement {
  id: string; // 'best-sellers' | 'match-partner' | 'summer' | 'winter'
  title: string;
  subtitle?: string;
  productIds: string[];
}

export interface StoreProductSettings {
  productTypes: string[];
  defaultType: string;
  sizes: string[];
}

export interface Product {
  id: string;
  productId?: string;
  name: string;
  subtitle?: string;
  price: number;
  MRP?: number;
  originalPrice?: number;
  priceDisplay?: string;
  description: string;
  category?: string;
  categories?: string[]; // Multi-category assignment
  collection?: string;
  gender?: 'male' | 'female' | 'unisex';
  typeLabel?: string; // Product type/tag display label e.g. "Unisex", "Men's", "Women's", "Oversized", "Regular Fit", or custom
  image: string;
  images?: string[];
  additionalImages?: string[];
  sizes: string[];
  stock?: Record<string, number>; // Size-specific stock e.g. { S: 5, M: 8, L: 4, XL: 2 }
  featured?: boolean;
  bestSelling?: boolean;
  badge?: string;
  active?: boolean;
  inStock: boolean;
  details?: string[];
  composition?: string;
  color?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  name?: string;
  image: string;
  productImage?: string;
  size: string;
  selectedSize?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Collected' | 'Cancelled';

export interface Order {
  id?: string;
  orderId: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string;
  phone: string;
  shippingAddress: string;
  address?: string;
  location?: string;
  deliveryOption?: string;
  items: OrderItem[];
  subtotal?: number;
  promoCode?: string | null;
  discountAmount?: number;
  deliveryFee?: number;
  totalAmount: number;
  total?: number;
  paymentMethod: string;
  paymentScreenshotUrl?: string | null;
  orderStatus: OrderStatus;
  status: OrderStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discount: string;
  description: string;
  active: boolean;
  validUntil: string;
  minOrderAmount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface PromoSettings {
  cartPromoEnabled: boolean;
  codes: PromoCode[];
  updatedAt?: any;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: any;
  status: 'active' | 'unsubscribed';
  welcomePromoCode: string;
  welcomePromoCodeStatus?: 'unused' | 'redeemed' | 'expired' | 'disabled';
  welcomePromoCodeRedeemedAt?: any;
  welcomePromoCodeRedeemedOrderId?: string | null;
  emailConsent: boolean;
  consentSource: string;
  consentTimestamp: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface OneTimePromoCode {
  id: string;
  code: string;
  subscriberId?: string;
  customerEmail: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discount: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  description?: string;
  status: 'unused' | 'redeemed' | 'expired' | 'disabled';
  createdAt: any;
  expiresAt?: string | null;
  redeemedAt?: any;
  redeemedOrderId?: string | null;
  disabledAt?: any;
  createdBy: 'newsletter_welcome' | 'admin';
  updatedAt?: any;
}

export interface OneTimePromoSettings {
  enabled: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  expiresInDays?: number | null;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  role?: 'customer' | 'admin';
  createdAt?: any;
  updatedAt?: any;
}

export interface BannerDoc {
  id: string; // 'male' | 'female'
  gender: 'male' | 'female';
  imageUrl: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  originalUrl?: string;
  title?: string;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  createdAt?: any;
}

export interface PaymentSettings {
  qrEnabled: boolean;
  qrImageUrl?: string | null;
  screenshotEnabled: boolean;
  paymentMethods: string[];
  esewaQrEnabled?: boolean;
  esewaQrImageUrl?: string | null;
  bankQrEnabled?: boolean;
  bankQrImageUrl?: string | null;
  codQrEnabled?: boolean;
  codQrImageUrl?: string | null;
}

export interface ContactSettings {
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
}

export interface SocialLinksSettings {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
}

export interface SocialsAndContactSettings {
  contact: ContactSettings;
  socials: SocialLinksSettings;
  whatsappOrderRedirect: boolean;
  updatedAt?: any;
}
