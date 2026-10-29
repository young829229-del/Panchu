import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { Product, Order, OrderItem, OrderStatus, AdminUser, BannerDoc, PaymentSettings, CategoryItem, HomepageSectionPlacement, PromoCode, PromoSettings, NewsletterSubscriber, OneTimePromoCode, OneTimePromoSettings } from '../types';
import { optimizeImageForDurableStore } from '../utils/imageOptimizer';
import { ALL_PRODUCTS } from '../data/products';

export const ADMIN_EMAILS = ['young829229@gmail.com', 'npdraggers111@gmail.com'];
export const ADMIN_EMAIL_PRIMARY = 'young829229@gmail.com';

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'first10',
    code: 'FIRST10',
    discountType: 'percentage',
    discountValue: 10,
    discount: '10% OFF',
    description: 'Applicable on first order across all oversized collections',
    active: true,
    validUntil: '31 Dec 2026'
  },
  {
    id: 'freeship',
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 120,
    discount: 'Rs 120 OFF',
    description: 'Free doorstep delivery in Kathmandu Valley on orders over Rs 3,000',
    active: true,
    validUntil: 'Ongoing'
  },
  {
    id: 'summer20',
    code: 'SUMMER20',
    discountType: 'percentage',
    discountValue: 20,
    discount: '20% OFF',
    description: 'Limited seasonal drop discount on 2+ heavy jersey items',
    active: false,
    validUntil: 'Expired'
  }
];

export const DEFAULT_PROMO_SETTINGS: PromoSettings = {
  cartPromoEnabled: true,
  codes: DEFAULT_PROMO_CODES
};

export const APPROVED_MALE_BANNER_URL = 'https://i.ibb.co/XrZGLnvw/snaptik-app-7637482582606826773-slide-2.jpg';
export const APPROVED_FEMALE_BANNER_URL = 'https://i.ibb.co/7dNkX1C3/IMG-20260820-WA0001.jpg';

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionPlacement[] = [
  {
    id: 'best-sellers',
    title: 'Best Sellers',
    productIds: [
      'bestselling-first-main-product',
      'lilly-tee-male',
      'panchu-hood-1',
      'xoxo-tee-girl'
    ]
  },
  {
    id: 'match-partner',
    title: 'Match With Your Partner',
    productIds: [
      'match-partner-grid-1',
      'match-partner-grid-2',
      'match-partner-grid-3',
      'match-partner-grid-4'
    ]
  },
  {
    id: 'summer',
    title: 'Summer Collection',
    productIds: [
      'lilly-tee-male',
      'flora-tee-product',
      'lilly-tee-girl'
    ]
  },
  {
    id: 'winter',
    title: 'Winter Collection',
    productIds: [
      'panchu-hood-1',
      'panchu-hood-2'
    ]
  }
];

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  qrEnabled: false,
  qrImageUrl: null,
  screenshotEnabled: false,
  paymentMethods: ['eSewa', 'Bank Transfer', 'Cash on Delivery (COD)'],
  esewaQrEnabled: false,
  esewaQrImageUrl: null,
  bankQrEnabled: false,
  bankQrImageUrl: null,
  codQrEnabled: false,
  codQrImageUrl: null
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All', slug: 'all', order: 0, enabled: true },
  { id: 'best-selling', name: 'Best Selling', slug: 'best-selling', order: 1, enabled: true },
  { id: 'summer', name: 'Summer', slug: 'summer', order: 2, enabled: true },
  { id: 'winter', name: 'Winter', slug: 'winter', order: 3, enabled: true },
  { id: 'shirts', name: 'Shirts', slug: 'shirts', order: 4, enabled: true },
  { id: 'oversized', name: 'Oversized', slug: 'oversized', order: 5, enabled: true }
];

export const DEFAULT_SIZES: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const DEFAULT_PRODUCT_TYPES: string[] = [
  'Unisex',
  "Men's",
  "Women's",
  'Oversized',
  'Regular Fit'
];

const CANONICAL_BANNERS_KEY = 'panchu_canonical_banners';
const CANONICAL_PRODUCTS_KEY = 'panchu_canonical_products';
const CANONICAL_PAYMENT_SETTINGS_KEY = 'panchu_canonical_payment_settings';
const CANONICAL_CATEGORIES_KEY = 'panchu_canonical_categories';
const CANONICAL_SIZES_KEY = 'panchu_canonical_sizes';
const CANONICAL_PRODUCT_TYPES_KEY = 'panchu_canonical_product_types';
const CANONICAL_HOMEPAGE_SECTIONS_KEY = 'panchu_canonical_homepage_sections_placement';
const CANONICAL_PROMO_SETTINGS_KEY = 'panchu_canonical_promo_settings';

/**
 * Returns the currently confirmed Homepage Sections placement synchronously from canonical cache.
 */
export function getHomepageSectionsSync(): HomepageSectionPlacement[] {
  if (typeof window === 'undefined') return DEFAULT_HOMEPAGE_SECTIONS;
  try {
    const saved = localStorage.getItem(CANONICAL_HOMEPAGE_SECTIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((sec) => ({
          id: sec.id,
          title: sec.title || '',
          subtitle: sec.subtitle || '',
          productIds: Array.isArray(sec.productIds) ? sec.productIds : []
        }));
      }
    }
  } catch (e) {
    console.debug('Error reading canonical homepage sections:', e);
  }
  return DEFAULT_HOMEPAGE_SECTIONS;
}

export function setHomepageSectionsSync(sections: HomepageSectionPlacement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_HOMEPAGE_SECTIONS_KEY, JSON.stringify(sections));
  } catch (e) {
    console.debug('Error writing canonical homepage sections cache:', e);
  }
}

/**
 * Returns the currently confirmed Category list synchronously from canonical cache.
 */
export function getCanonicalCategoriesSync(): CategoryItem[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const saved = localStorage.getItem(CANONICAL_CATEGORIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c, idx) => ({
          id: c.id || `cat-${idx}`,
          name: c.name || '',
          slug: c.slug || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-') : `cat-${idx}`),
          order: typeof c.order === 'number' ? c.order : idx,
          enabled: c.enabled !== false,
          description: c.description || ''
        }));
      }
    }
  } catch (e) {
    console.debug('Error reading canonical categories:', e);
  }
  return DEFAULT_CATEGORIES;
}

export function setCanonicalCategoriesSync(categories: CategoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.debug('Error writing canonical categories cache:', e);
  }
}

/**
 * Returns currently confirmed Apparel Sizes synchronously from canonical cache.
 */
export function getCanonicalSizesSync(): string[] {
  if (typeof window === 'undefined') return DEFAULT_SIZES;
  try {
    const saved = localStorage.getItem(CANONICAL_SIZES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
      }
    }
  } catch (e) {
    console.debug('Error reading canonical sizes:', e);
  }
  return DEFAULT_SIZES;
}

export function setCanonicalSizesSync(sizes: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_SIZES_KEY, JSON.stringify(sizes));
  } catch (e) {
    console.debug('Error writing canonical sizes cache:', e);
  }
}

/**
 * Returns currently confirmed Product Type labels synchronously from canonical cache.
 */
export function getCanonicalProductTypesSync(): string[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCT_TYPES;
  try {
    const saved = localStorage.getItem(CANONICAL_PRODUCT_TYPES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
      }
    }
  } catch (e) {
    console.debug('Error reading canonical product types:', e);
  }
  return DEFAULT_PRODUCT_TYPES;
}

export function setCanonicalProductTypesSync(types: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_PRODUCT_TYPES_KEY, JSON.stringify(types));
  } catch (e) {
    console.debug('Error writing canonical product types cache:', e);
  }
}

/**
 * Deduplicates and validates payment methods list
 */
function cleanPaymentMethods(methods?: any[]): string[] {
  if (!Array.isArray(methods) || methods.length === 0) {
    return ['eSewa', 'Bank Transfer', 'Cash on Delivery (COD)'];
  }
  const allowed = ['eSewa', 'Bank Transfer', 'Cash on Delivery (COD)'];
  const unique = Array.from(new Set(methods.filter((m) => typeof m === 'string' && allowed.includes(m))));
  return unique.length > 0 ? unique : ['eSewa', 'Bank Transfer', 'Cash on Delivery (COD)'];
}

/**
 * Returns the currently confirmed Payment Settings synchronously from canonical cache.
 */
export function getCanonicalPaymentSettingsSync(): PaymentSettings {
  if (typeof window === 'undefined') return DEFAULT_PAYMENT_SETTINGS;
  try {
    const saved = localStorage.getItem(CANONICAL_PAYMENT_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          qrEnabled: Boolean(parsed.qrEnabled),
          qrImageUrl: parsed.qrImageUrl || null,
          screenshotEnabled: Boolean(parsed.screenshotEnabled),
          paymentMethods: cleanPaymentMethods(parsed.paymentMethods),
          esewaQrEnabled: Boolean(parsed.esewaQrEnabled),
          esewaQrImageUrl: parsed.esewaQrImageUrl || null,
          bankQrEnabled: Boolean(parsed.bankQrEnabled),
          bankQrImageUrl: parsed.bankQrImageUrl || null,
          codQrEnabled: Boolean(parsed.codQrEnabled),
          codQrImageUrl: parsed.codQrImageUrl || null
        };
      }
    }
  } catch (e) {
    console.debug('Error reading canonical payment settings:', e);
  }
  return DEFAULT_PAYMENT_SETTINGS;
}

export function setCanonicalPaymentSettingsSync(settings: PaymentSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_PAYMENT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.debug('Error saving canonical payment settings:', e);
  }
}

/**
 * Returns the currently confirmed Firebase banners synchronously from memory/canonical cache.
 * Eliminates initial render flicker or hardcoded fallback flash during hydration/refresh.
 */
export function getCanonicalBannersSync(): { male: string; female: string } {
  if (typeof window === 'undefined') {
    return { male: APPROVED_MALE_BANNER_URL, female: APPROVED_FEMALE_BANNER_URL };
  }
  try {
    const saved = localStorage.getItem(CANONICAL_BANNERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const male = typeof parsed.male === 'string' && parsed.male.trim().length > 0 ? resolveBannerUrl(parsed.male) : '';
        const female = typeof parsed.female === 'string' && parsed.female.trim().length > 0 ? resolveBannerUrl(parsed.female) : '';
        if (male || female) {
          return {
            male: male || APPROVED_MALE_BANNER_URL,
            female: female || APPROVED_FEMALE_BANNER_URL
          };
        }
      }
    }
  } catch (e) {
    console.debug('Error reading canonical banners cache:', e);
  }
  return {
    male: APPROVED_MALE_BANNER_URL,
    female: APPROVED_FEMALE_BANNER_URL
  };
}

export function setCanonicalBannersSync(banners: { male: string; female: string }): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_BANNERS_KEY, JSON.stringify(banners));
  } catch (e) {
    console.debug('Error writing canonical banners cache:', e);
  }
}

/**
 * Returns the currently confirmed products list synchronously from canonical cache.
 */
export function getCanonicalProductsSync(): Product[] {
  if (typeof window === 'undefined') return ALL_PRODUCTS;
  try {
    const saved = localStorage.getItem(CANONICAL_PRODUCTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.debug('Error reading canonical products cache:', e);
  }
  return ALL_PRODUCTS;
}

export function setCanonicalProductsSync(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.debug('Error writing canonical products cache:', e);
  }
}

/**
 * Intelligent banner URL resolver
 * Automatically transforms known ImgBB landing page links into direct CDN image assets,
 * while leaving direct image URLs, Storage download URLs, and data URLs completely intact.
 */
export function resolveBannerUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (clean.includes('ibb.co/PvZVj2fS') || clean.includes('ibb.co/PvZVj2fs')) {
    return APPROVED_MALE_BANNER_URL;
  }
  if (clean.includes('ibb.co/sdJW2VRT') || clean.includes('ibb.co/sdjw2vrt')) {
    return APPROVED_FEMALE_BANNER_URL;
  }
  return clean;
}

/**
 * Realtime subscription to active products from Firestore
 */
export function subscribeProducts(
  callback: (products: Product[]) => void,
  includeInactive: boolean = false
): () => void {
  const path = 'products';
  try {
    const productsRef = collection(db, path);
    // Listen to products collection and filter on client side
    const q = query(productsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const isActive = data.active !== false;

          if (!includeInactive && !isActive) {
            return;
          }

          // Ensure size-specific stock object exists
          const sizes = Array.isArray(data.sizes) ? data.sizes : ['S', 'M', 'L', 'XL'];
          const stock: Record<string, number> = {};
          if (data.stock && typeof data.stock === 'object') {
            sizes.forEach((s) => {
              stock[s] = typeof data.stock[s] === 'number' ? data.stock[s] : 0;
            });
          } else {
            sizes.forEach((s) => {
              stock[s] = 10;
            });
          }

          const hasAnyStock = Object.values(stock).some((qty) => Number(qty) > 0);

          const rawCategories = Array.isArray(data.categories)
            ? data.categories.map((c: any) => String(c).trim()).filter(Boolean)
            : (data.category ? [String(data.category).trim()] : []);
          const typeLabel = typeof data.typeLabel === 'string' && data.typeLabel.trim().length > 0
            ? data.typeLabel.trim()
            : 'Unisex';

          products.push({
            id: docSnap.id,
            productId: docSnap.id,
            name: data.name || '',
            subtitle: data.subtitle || '',
            price: Number(data.price) || 0,
            MRP: Number(data.MRP || data.originalPrice) || Number(data.price) || 0,
            originalPrice: Number(data.originalPrice || data.MRP) || Number(data.price) || 0,
            priceDisplay: data.priceDisplay || undefined,
            description: data.description || '',
            details: Array.isArray(data.details) ? data.details : [],
            composition: data.composition || '',
            color: data.color || '',
            category: data.category || rawCategories[0] || 'Tees',
            categories: rawCategories,
            typeLabel,
            collection: data.collection || 'General',
            gender: data.gender || 'unisex',
            image: data.image || (Array.isArray(data.images) && data.images[0]) || '',
            images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
            additionalImages: Array.isArray(data.additionalImages) 
              ? data.additionalImages 
              : (Array.isArray(data.images) ? data.images : (data.image ? [data.image] : [])),
            sizes,
            stock,
            featured: Boolean(data.featured),
            bestSelling: Boolean(data.bestSelling),
            badge: data.badge || undefined,
            active: isActive,
            inStock: data.inStock !== false && hasAnyStock,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });
        if (products.length > 0) {
          setCanonicalProductsSync(products);
        }
        callback(products);
      },
      (error) => {
        console.warn('Firestore products listener notification:', error?.message || error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Firestore products setup error:', error);
    return () => {};
  }
}

/**
 * Realtime subscription to orders (Admin only)
 */
export function subscribeOrders(
  callback: (orders: Order[]) => void
): () => void {
  const path = 'orders';
  try {
    const ordersRef = collection(db, path);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawItems = Array.isArray(data.items) ? data.items : [];
          const normalizedItems: OrderItem[] = rawItems.map((item: any) => ({
            productId: item.productId || item.id || '',
            productName: item.productName || item.name || '',
            name: item.productName || item.name || '',
            image: item.image || item.productImage || '',
            productImage: item.image || item.productImage || '',
            size: item.size || item.selectedSize || 'M',
            selectedSize: item.size || item.selectedSize || 'M',
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            subtotal: Number(item.subtotal || (Number(item.price) * Number(item.quantity))) || 0
          }));

          const resolvedTotal = Number(data.totalAmount !== undefined ? data.totalAmount : data.total) || 0;
          const resolvedStatus = (data.orderStatus || data.status || 'Pending') as OrderStatus;
          const resolvedAddress = data.shippingAddress || data.address || '';

          orders.push({
            id: docSnap.id,
            orderId: data.orderId || docSnap.id,
            userId: data.userId || null,
            customerName: data.customerName || '',
            phone: data.phone || '',
            shippingAddress: resolvedAddress,
            address: resolvedAddress,
            location: data.location || '',
            deliveryOption: data.deliveryOption || '',
            items: normalizedItems,
            subtotal: Number(data.subtotal) || 0,
            deliveryFee: Number(data.deliveryFee) || 0,
            totalAmount: resolvedTotal,
            total: resolvedTotal,
            paymentMethod: data.paymentMethod || 'Cash on Delivery (COD)',
            paymentScreenshotUrl: data.paymentScreenshotUrl || null,
            orderStatus: resolvedStatus,
            status: resolvedStatus,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });
        callback(orders);
      },
      (error) => {
        console.warn('Firestore orders listener notification:', error?.message || error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Firestore orders setup error:', error);
    return () => {};
  }
}

/**
 * Atomic Order Placement & Size-Specific Stock Reduction in Firestore
 * Persists complete order document to Firestore 'orders' collection.
 * Important: Customer email is strictly NOT stored.
 */
export async function createFirestoreOrder(
  orderInput: {
    orderId?: string;
    customerName: string;
    userId?: string | null;
    phone: string;
    shippingAddress?: string;
    address?: string;
    location?: string;
    deliveryOption?: string;
    items: OrderItem[];
    subtotal?: number;
    promoCode?: string | null;
    discountAmount?: number;
    deliveryFee?: number;
    totalAmount?: number;
    total?: number;
    paymentMethod?: string;
    paymentScreenshotUrl?: string | null;
    orderStatus?: OrderStatus;
  }
): Promise<{ success: boolean; orderId: string; docId?: string; error?: string }> {
  // Ensure unique orderId
  const timestamp = Date.now();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const generatedOrderId = orderInput.orderId || `#${randomSuffix}`;

  // Use standard Firestore auto-id document reference for clean indexing
  const newOrderRef = doc(collection(db, 'orders'));

  const resolvedAddress = (orderInput.shippingAddress || orderInput.address || '').trim();
  const resolvedSubtotal = Number(orderInput.subtotal) || 0;
  const resolvedDiscount = Number(orderInput.discountAmount) || 0;
  const resolvedDeliveryFee = Number(orderInput.deliveryFee) || 0;
  const resolvedTotal = Number(orderInput.totalAmount !== undefined ? orderInput.totalAmount : orderInput.total) || (Math.max(0, resolvedSubtotal - resolvedDiscount) + resolvedDeliveryFee);

  // Normalize each ordered item
  const cleanItems = (orderInput.items || []).map((item) => {
    const itemQty = Number(item.quantity) || 1;
    const itemPrice = Number(item.price) || 0;
    const itemSubtotal = Number(item.subtotal || (itemPrice * itemQty)) || 0;
    const itemSize = (item.size || item.selectedSize || 'M').trim();
    const itemImg = item.image || item.productImage || '';
    const itemName = item.productName || item.name || '';
    const itemId = item.productId || (item as any).id || '';

    return {
      productId: itemId,
      productName: itemName,
      image: itemImg,
      size: itemSize,
      quantity: itemQty,
      price: itemPrice,
      subtotal: itemSubtotal
    };
  });

  // Build the complete Firestore order payload
  // Notice: Email is deliberately excluded as per specification
  const orderPayload: Record<string, any> = {
    orderId: generatedOrderId,
    userId: orderInput.userId || auth.currentUser?.uid || null,
    customerName: (orderInput.customerName || '').trim(),
    phone: (orderInput.phone || '').trim(),
    items: cleanItems,
    totalAmount: resolvedTotal,
    total: resolvedTotal, // compatibility
    subtotal: resolvedSubtotal,
    promoCode: orderInput.promoCode ? String(orderInput.promoCode).trim() : null,
    discountAmount: resolvedDiscount,
    deliveryFee: resolvedDeliveryFee,
    paymentMethod: (orderInput.paymentMethod || 'Cash on Delivery (COD)').trim(),
    paymentScreenshotUrl: orderInput.paymentScreenshotUrl || null,
    shippingAddress: resolvedAddress,
    address: resolvedAddress, // compatibility
    location: (orderInput.location || '').trim(),
    deliveryOption: orderInput.deliveryOption || 'inside_door',
    orderStatus: (orderInput.orderStatus || 'Pending') as OrderStatus,
    status: (orderInput.orderStatus || 'Pending') as OrderStatus, // compatibility
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const appliedCodeStr = orderInput.promoCode ? String(orderInput.promoCode).trim().toUpperCase() : null;

  try {
    // 1. Attempt atomic transaction with inventory update & one-time promo code redemption
    await runTransaction(db, async (transaction) => {
      const productDocs: { ref: any; data: any; item: typeof cleanItems[0] }[] = [];

      for (const item of cleanItems) {
        if (!item.productId) continue;
        try {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await transaction.get(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data();
            productDocs.push({
              ref: productRef,
              data: productData,
              item
            });
          }
        } catch {
          // If individual product doc read fails, continue without blocking order
        }
      }

      // Check if one-time promo code applies and is unused
      let oneTimePromoRef: any = null;
      let oneTimeSubscriberRef: any = null;
      if (appliedCodeStr) {
        try {
          const otRef = doc(db, 'oneTimePromoCodes', appliedCodeStr);
          const otSnap = await transaction.get(otRef);
          if (otSnap.exists()) {
            const otData = otSnap.data();
            if (otData.status === 'unused') {
              oneTimePromoRef = otRef;
              if (otData.subscriberId) {
                oneTimeSubscriberRef = doc(db, 'newsletterSubscribers', otData.subscriberId);
              }
            }
          }
        } catch {
          // Non-fatal if code is not a one-time code or read is restricted
        }
      }

      // Decrement size stock for existing product docs
      for (const { ref: pRef, data: pData, item } of productDocs) {
        const stock = { ...(pData.stock || {}) };
        const currentQty = typeof stock[item.size] === 'number' ? stock[item.size] : 10;
        const newQty = Math.max(0, currentQty - item.quantity);
        stock[item.size] = newQty;

        const anyStockLeft = Object.values(stock).some((qty: any) => Number(qty) > 0);

        transaction.update(pRef, {
          stock,
          inStock: anyStockLeft,
          updatedAt: serverTimestamp()
        });
      }

      // Redeem one-time promo code atomically if matched
      if (oneTimePromoRef) {
        transaction.update(oneTimePromoRef, {
          status: 'redeemed',
          redeemedOrderId: generatedOrderId,
          redeemedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        if (oneTimeSubscriberRef) {
          transaction.update(oneTimeSubscriberRef, {
            welcomePromoCodeStatus: 'redeemed',
            welcomePromoCodeRedeemedOrderId: generatedOrderId,
            welcomePromoCodeRedeemedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      // Set the order in Firestore 'orders' collection
      transaction.set(newOrderRef, orderPayload);
    });

    return {
      success: true,
      orderId: generatedOrderId,
      docId: newOrderRef.id
    };
  } catch (txError: any) {
    console.warn('Transaction with stock update notice, falling back to direct write:', txError?.message || txError);

    // 2. Direct fallback write to orders collection
    try {
      await setDoc(newOrderRef, orderPayload);
      if (appliedCodeStr) {
        markOneTimePromoCodeRedeemed(appliedCodeStr, generatedOrderId).catch((err) => {
          console.debug('Fallback one-time promo redemption notice:', err);
        });
      }
      return {
        success: true,
        orderId: generatedOrderId,
        docId: newOrderRef.id
      };
    } catch (writeError: any) {
      console.error('Direct Firestore order creation failed:', writeError);
      return {
        success: false,
        orderId: generatedOrderId,
        error: writeError?.message || 'Failed to submit order to database.'
      };
    }
  }
}

/**
 * Update Order Status (Admin) in Firestore 'orders' document
 */
export async function updateOrderStatus(orderDocId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderDocId}`;
  try {
    const orderRef = doc(db, 'orders', orderDocId);
    await updateDoc(orderRef, {
      orderStatus: status,
      status: status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Upload multiple product images to Firebase Storage
 */
export async function uploadProductImages(
  productId: string,
  files: File[]
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `products/${productId}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    uploadedUrls.push(downloadUrl);
  }

  return uploadedUrls;
}

/**
 * Save / Update Product in Firestore
 */
export async function saveProductToFirestore(
  productData: Partial<Product>,
  newImageFiles?: File[]
): Promise<string> {
  const productId = productData.id || productData.productId || doc(collection(db, 'products')).id;
  const path = `products/${productId}`;

  try {
    let images = Array.isArray(productData.images) ? [...productData.images] : [];

    // Upload new image files if provided
    if (newImageFiles && newImageFiles.length > 0) {
      const newUrls = await uploadProductImages(productId, newImageFiles);
      images = [...images, ...newUrls];
    }

    const mainImage = images[0] || productData.image || '';

    // Standardize sizes and stock
    const sizes = Array.isArray(productData.sizes) && productData.sizes.length > 0 
      ? productData.sizes 
      : ['S', 'M', 'L', 'XL'];

    const stock: Record<string, number> = {};
    sizes.forEach(s => {
      stock[s] = (productData.stock && typeof productData.stock[s] === 'number') 
        ? productData.stock[s] 
        : 10;
    });

    const anyStock = Object.values(stock).some(q => q > 0);

    const categoriesList = Array.isArray(productData.categories)
      ? Array.from(new Set(productData.categories.map((c) => String(c).trim()).filter(Boolean)))
      : (productData.category ? [String(productData.category).trim()] : []);

    const primaryCategory = categoriesList[0] || productData.category || 'Tees';
    const typeLabel = productData.typeLabel?.trim() || 'Unisex';

    const docData: Record<string, any> = {
      name: productData.name?.trim() || 'Untitled Product',
      subtitle: productData.subtitle?.trim() || '',
      price: Number(productData.price) || 0,
      MRP: Number(productData.MRP || productData.originalPrice) || Number(productData.price) || 0,
      originalPrice: Number(productData.originalPrice || productData.MRP) || Number(productData.price) || 0,
      description: productData.description?.trim() || '',
      category: primaryCategory,
      categories: categoriesList,
      typeLabel: typeLabel,
      collection: productData.collection || 'General',
      gender: productData.gender || 'unisex',
      image: mainImage,
      images: images,
      additionalImages: images,
      sizes: sizes,
      stock: stock,
      featured: Boolean(productData.featured),
      bestSelling: categoriesList.some(c => c.toLowerCase() === 'best selling') || (Array.isArray(productData.categories) ? false : Boolean(productData.bestSelling)),
      badge: productData.badge?.trim() || '',
      active: productData.active !== false,
      inStock: productData.inStock !== false && anyStock,
      details: Array.isArray(productData.details) ? productData.details : [],
      composition: productData.composition || '',
      color: productData.color || '',
      updatedAt: serverTimestamp()
    };

    const docRef = doc(db, 'products', productId);
    const existingSnap = await getDoc(docRef);

    if (!existingSnap.exists()) {
      docData.createdAt = serverTimestamp();
    }

    await setDoc(docRef, docData, { merge: true });
    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Delete / Deactivate Product
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Check if the user is an admin
 */
export async function checkIsAdmin(user: { uid: string; email?: string | null } | null): Promise<boolean> {
  if (!user || !user.email) return false;

  const normalizedEmail = user.email.toLowerCase().trim();
  const normalizedAdminEmails = ADMIN_EMAILS.map(e => e.toLowerCase().trim());

  // If primary/designated super admin, guarantee admin doc exists in Firestore for rules check
  if (normalizedAdminEmails.includes(normalizedEmail)) {
    try {
      const adminUserDocRef = doc(db, 'admin_users', user.uid);
      await setDoc(adminUserDocRef, {
        uid: user.uid,
        email: normalizedEmail,
        role: 'admin',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not auto-write primary admin_users doc:', e);
    }
    return true;
  }

  // Check if UID or email exists in admin_users or admins collection
  try {
    const adminUserDocRef = doc(db, 'admin_users', user.uid);
    const adminUserSnap = await getDoc(adminUserDocRef);
    if (adminUserSnap.exists() && adminUserSnap.data()?.role === 'admin') {
      return true;
    }

    // Check by email in admin_users
    const adminUsersByEmail = await getDocs(query(collection(db, 'admin_users'), where('email', '==', normalizedEmail)));
    if (!adminUsersByEmail.empty) {
      return true;
    }

    // Fallback check in legacy admins collection
    const adminDocRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists() && adminSnap.data()?.role === 'admin') {
      return true;
    }

    const adminsByEmail = await getDocs(query(collection(db, 'admins'), where('email', '==', normalizedEmail)));
    return !adminsByEmail.empty;
  } catch (e) {
    console.error('Error checking admin status:', e);
    return false;
  }
}

/**
 * Add a new admin email
 */
export async function addAdminUser(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const path = 'admin_users';
  try {
    const cleanId = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const adminRef = doc(db, 'admin_users', cleanId);
    await setDoc(adminRef, {
      uid: cleanId,
      email: normalizedEmail,
      role: 'admin',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Get all configured admins
 */
export async function fetchAllAdmins(): Promise<AdminUser[]> {
  const path = 'admin_users';
  try {
    const snapshot = await getDocs(collection(db, path));
    const admins: AdminUser[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      admins.push({
        uid: d.id,
        email: data.email || '',
        role: 'admin',
        createdAt: data.createdAt
      });
    });
    return admins;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Seed initial Panchu catalog into Firestore if collection is empty (Admin only)
 */
export async function seedInitialProductsIfEmpty(initialProducts: Product[]): Promise<number> {
  try {
    if (!auth.currentUser) {
      return 0;
    }

    const isAdmin = await checkIsAdmin(auth.currentUser);
    if (!isAdmin) {
      return 0;
    }

    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.size > 0) {
      return 0; // Already has products
    }

    let seededCount = 0;
    for (const prod of initialProducts) {
      const sizes = prod.sizes || ['S', 'M', 'L', 'XL'];
      const stock: Record<string, number> = {};
      sizes.forEach((s) => {
        stock[s] = 10;
      });

      const images = prod.additionalImages && prod.additionalImages.length > 0 
        ? prod.additionalImages 
        : [prod.image];

      await setDoc(doc(db, 'products', prod.id), {
        name: prod.name,
        subtitle: prod.subtitle || '',
        price: prod.price,
        MRP: prod.originalPrice || prod.price,
        originalPrice: prod.originalPrice || prod.price,
        description: prod.description,
        category: 'Tees',
        collection: prod.subtitle || 'General',
        gender: prod.gender || 'male',
        image: prod.image,
        images: images,
        additionalImages: images,
        sizes: sizes,
        stock: stock,
        featured: Boolean(prod.badge || prod.id.includes('bestselling')),
        bestSelling: Boolean(prod.badge?.includes('BEST') || prod.id.includes('bestselling')),
        badge: prod.badge || '',
        active: true,
        inStock: true,
        details: prod.details || [],
        composition: prod.composition || '',
        color: prod.color || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      seededCount++;
    }

    return seededCount;
  } catch (e) {
    console.warn('Initial product catalog sync notice:', e);
    return 0;
  }
}

/**
 * Save / sync customer profile to Firestore
 */
export async function syncCustomerProfile(
  user: { uid: string; email?: string | null; displayName?: string | null },
  extra?: { phone?: string; address?: string }
): Promise<void> {
  if (!user || !user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    const isAdmin = await checkIsAdmin(user);

    const data: Record<string, any> = {
      uid: user.uid,
      email: user.email?.toLowerCase().trim() || '',
      displayName: user.displayName || existing.data()?.displayName || '',
      role: isAdmin ? 'admin' : 'customer',
      updatedAt: serverTimestamp()
    };

    if (extra?.phone) data.phone = extra.phone;
    if (extra?.address) data.address = extra.address;

    if (!existing.exists()) {
      data.createdAt = serverTimestamp();
    }

    await setDoc(userRef, data, { merge: true });
  } catch (err) {
    console.warn('Customer profile sync notice:', err);
  }
}

/**
 * Fetch customer orders from Firestore (by user UID or email)
 */
export async function fetchCustomerOrders(uid?: string, email?: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const matchedOrders: Order[] = [];
    const seenIds = new Set<string>();

    const normalizeDoc = (docSnap: any): Order => {
      const d = docSnap.data();
      const rawItems = Array.isArray(d.items) ? d.items : [];
      const normalizedItems: OrderItem[] = rawItems.map((item: any) => ({
        productId: item.productId || item.id || '',
        productName: item.productName || item.name || '',
        name: item.productName || item.name || '',
        image: item.image || item.productImage || '',
        productImage: item.image || item.productImage || '',
        size: item.size || item.selectedSize || 'M',
        selectedSize: item.size || item.selectedSize || 'M',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        subtotal: Number(item.subtotal || (Number(item.price) * Number(item.quantity))) || 0
      }));

      const resolvedTotal = Number(d.totalAmount !== undefined ? d.totalAmount : d.total) || 0;
      const resolvedStatus = (d.orderStatus || d.status || 'Pending') as OrderStatus;
      const resolvedAddress = d.shippingAddress || d.address || '';

      return {
        id: docSnap.id,
        orderId: d.orderId || docSnap.id,
        userId: d.userId || null,
        customerName: d.customerName || '',
        phone: d.phone || '',
        shippingAddress: resolvedAddress,
        address: resolvedAddress,
        location: d.location || '',
        deliveryOption: d.deliveryOption || 'inside_door',
        items: normalizedItems,
        subtotal: Number(d.subtotal) || 0,
        deliveryFee: Number(d.deliveryFee) || 0,
        totalAmount: resolvedTotal,
        total: resolvedTotal,
        paymentMethod: d.paymentMethod || 'Cash on Delivery (COD)',
        paymentScreenshotUrl: d.paymentScreenshotUrl || null,
        orderStatus: resolvedStatus,
        status: resolvedStatus,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      };
    };

    if (uid) {
      const qUid = query(ordersRef, where('userId', '==', uid));
      const snapUid = await getDocs(qUid);
      snapUid.forEach(docSnap => {
        seenIds.add(docSnap.id);
        matchedOrders.push(normalizeDoc(docSnap));
      });
    }

    if (email) {
      const normalized = email.toLowerCase().trim();
      const qEmail = query(ordersRef, where('customerEmail', '==', normalized));
      const snapEmail = await getDocs(qEmail);
      snapEmail.forEach(docSnap => {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          matchedOrders.push(normalizeDoc(docSnap));
        }
      });
    }

    // Sort newest first
    return matchedOrders.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.warn('Fetch customer orders notice:', err);
    return [];
  }
}

/**
 * Delete a banner image file from Firebase Storage
 */
export async function deleteBannerImageFromStorage(storagePath: string | undefined | null): Promise<void> {
  if (!storagePath || typeof storagePath !== 'string') return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err: any) {
    // Ignore if file doesn't exist or already deleted
    console.debug('Old banner storage cleanup notice:', err?.message || err);
  }
}

/**
 * Real-time subscription to active Male and Female campaign banners in Firestore
 */
export function subscribeBanners(
  callback: (banners: {
    male: string;
    female: string;
    maleDoc?: BannerDoc;
    femaleDoc?: BannerDoc;
    isLoaded: boolean;
  }) => void
): () => void {
  const path = 'banners';
  try {
    const bannersRef = collection(db, path);
    const unsubscribe = onSnapshot(
      bannersRef,
      (snapshot) => {
        let maleUrl: string = '';
        let femaleUrl: string = '';
        let maleDoc: BannerDoc | undefined;
        let femaleDoc: BannerDoc | undefined;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id.toLowerCase();
          const gender = (data.gender || docId).toLowerCase();

          if (gender === 'male' || docId === 'male') {
            const rawUrl = data.imageUrl || data.url || data.image;
            if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
              maleUrl = resolveBannerUrl(rawUrl);
            }
            maleDoc = {
              id: docSnap.id,
              gender: 'male',
              imageUrl: maleUrl || APPROVED_MALE_BANNER_URL,
              storagePath: data.storagePath,
              fileName: data.fileName,
              fileSize: data.fileSize,
              originalUrl: data.originalUrl || data.imageUrl,
              title: data.title || 'Male Hero Campaign Banner',
              active: data.active !== false,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            };
          } else if (gender === 'female' || docId === 'female') {
            const rawUrl = data.imageUrl || data.url || data.image;
            if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
              femaleUrl = resolveBannerUrl(rawUrl);
            }
            femaleDoc = {
              id: docSnap.id,
              gender: 'female',
              imageUrl: femaleUrl || APPROVED_FEMALE_BANNER_URL,
              storagePath: data.storagePath,
              fileName: data.fileName,
              fileSize: data.fileSize,
              originalUrl: data.originalUrl || data.imageUrl,
              title: data.title || 'Female Hero Campaign Banner',
              active: data.active !== false,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            };
          }
        });

        const finalMale = maleUrl || APPROVED_MALE_BANNER_URL;
        const finalFemale = femaleUrl || APPROVED_FEMALE_BANNER_URL;

        setCanonicalBannersSync({
          male: finalMale,
          female: finalFemale
        });

        callback({
          male: finalMale,
          female: finalFemale,
          maleDoc,
          femaleDoc,
          isLoaded: true
        });
      },
      (error) => {
        console.warn('Firestore banners listener notice:', error?.message || error);
        const canonical = getCanonicalBannersSync();
        callback({
          male: canonical.male,
          female: canonical.female,
          isLoaded: true
        });
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach banners listener:', err);
    const canonical = getCanonicalBannersSync();
    callback({
      male: canonical.male,
      female: canonical.female,
      isLoaded: true
    });
    return () => {};
  }
}

/**
 * Fetch current banners once from Firestore
 */
export async function fetchBanners(): Promise<{ male: string; female: string; maleDoc?: BannerDoc; femaleDoc?: BannerDoc }> {
  try {
    const bannersRef = collection(db, 'banners');
    const snapshot = await getDocs(bannersRef);
    let maleUrl: string = '';
    let femaleUrl: string = '';
    let maleDoc: BannerDoc | undefined;
    let femaleDoc: BannerDoc | undefined;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id.toLowerCase();
      const gender = (data.gender || docId).toLowerCase();

      if (gender === 'male' || docId === 'male') {
        const rawUrl = data.imageUrl || data.url || data.image;
        if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
          maleUrl = resolveBannerUrl(rawUrl);
        }
        maleDoc = {
          id: docSnap.id,
          gender: 'male',
          imageUrl: maleUrl || APPROVED_MALE_BANNER_URL,
          storagePath: data.storagePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          originalUrl: data.originalUrl || data.imageUrl,
          title: data.title || 'Male Hero Campaign Banner',
          active: data.active !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      } else if (gender === 'female' || docId === 'female') {
        const rawUrl = data.imageUrl || data.url || data.image;
        if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
          femaleUrl = resolveBannerUrl(rawUrl);
        }
        femaleDoc = {
          id: docSnap.id,
          gender: 'female',
          imageUrl: femaleUrl || APPROVED_FEMALE_BANNER_URL,
          storagePath: data.storagePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          originalUrl: data.originalUrl || data.imageUrl,
          title: data.title || 'Female Hero Campaign Banner',
          active: data.active !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
    });

    return {
      male: maleUrl || APPROVED_MALE_BANNER_URL,
      female: femaleUrl || APPROVED_FEMALE_BANNER_URL,
      maleDoc,
      femaleDoc
    };
  } catch (err) {
    console.warn('Fetch banners notice:', err);
    return { male: APPROVED_MALE_BANNER_URL, female: APPROVED_FEMALE_BANNER_URL };
  }
}

/**
 * Save / Update a banner document in Firestore
 */
export async function saveBannerToFirestore(
  gender: 'male' | 'female',
  imageUrl: string,
  fileName?: string,
  storagePath?: string,
  fileSize?: number,
  title?: string
): Promise<void> {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    throw new Error('Image URL is required to save banner.');
  }

  const path = `banners/${gender}`;
  try {
    const cleanImageUrl = resolveBannerUrl(imageUrl);
    const docRef = doc(db, 'banners', gender);
    const existingSnap = await getDoc(docRef);

    const bannerData: Record<string, any> = {
      id: gender,
      gender: gender,
      imageUrl: cleanImageUrl,
      originalUrl: cleanImageUrl,
      title: title || `${gender === 'male' ? 'Male' : 'Female'} Hero Campaign Banner`,
      active: true,
      updatedAt: serverTimestamp()
    };

    if (storagePath) bannerData.storagePath = storagePath;
    if (fileName) bannerData.fileName = fileName;
    if (fileSize) bannerData.fileSize = fileSize;

    if (!existingSnap.exists()) {
      bannerData.createdAt = serverTimestamp();
    }

    await setDoc(docRef, bannerData, { merge: true });

    // Instantly sync canonical cache
    const currentCanonical = getCanonicalBannersSync();
    if (gender === 'male') {
      currentCanonical.male = cleanImageUrl;
    } else {
      currentCanonical.female = cleanImageUrl;
    }
    setCanonicalBannersSync(currentCanonical);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface BannerUploadProgress {
  stage: 'checking' | 'uploading' | 'getting-url' | 'saving-firestore' | 'cleaning-old' | 'done';
  percent: number;
  message: string;
  bytesTransferred?: number;
  totalBytes?: number;
}

export type BannerUploadProgressCallback = (progress: BannerUploadProgress) => void;

/**
 * Upload the original banner image file to Firebase Storage under the 'banners/' folder.
 * Preserves full original resolution and quality.
 * Uses direct uploadBytes to prevent silent resumable CORS/session hangs and ensure immediate transfer.
 * Automatically verifies download URL and updates Firestore live document.
 */
export async function uploadBannerImageToStorage(
  file: File,
  gender: 'male' | 'female',
  onProgress?: BannerUploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('No image file selected.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `banners/${gender}_hero_${timestamp}_${cleanName}`;
  const bucketName = storage.app.options.storageBucket || 'gen-lang-client-0600433059.firebasestorage.app';
  const projectId = storage.app.options.projectId || 'gen-lang-client-0600433059';

  console.log('[Firebase Storage Upload Audit]', {
    stage: 'audit-environment',
    projectId,
    storageBucket: bucketName,
    fileName: file.name,
    fileSize: file.size,
    fileSizeMB: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    fileType: file.type,
    gender,
    storagePath,
    authUid: auth.currentUser?.uid || 'anonymous',
    authEmail: auth.currentUser?.email || 'unauthenticated',
    isEmailVerified: auth.currentUser?.emailVerified ?? false
  });

  // 1. Fetch current document to check if there is an existing storage file to delete
  onProgress?.({
    stage: 'checking',
    percent: 10,
    message: 'Verifying active Firebase session and previous banner...',
    bytesTransferred: 0,
    totalBytes: file.size
  });

  let oldStoragePath: string | undefined;
  try {
    const currentDocSnap = await getDoc(doc(db, 'banners', gender));
    if (currentDocSnap.exists()) {
      const currentData = currentDocSnap.data();
      oldStoragePath = currentData?.storagePath;
      console.log('[Firebase Storage Previous Banner]', { oldStoragePath });
    }
  } catch (checkErr) {
    console.debug('[Firebase Storage] Previous banner check notice:', checkErr);
  }

  // 2. Direct binary upload via uploadBytes
  onProgress?.({
    stage: 'uploading',
    percent: 30,
    message: `Sending ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB) to Firebase Storage...`,
    bytesTransferred: 0,
    totalBytes: file.size
  });

  const metadata = {
    contentType: file.type || 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
    customMetadata: {
      gender,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      uploaderUid: auth.currentUser?.uid || 'admin',
      uploaderEmail: auth.currentUser?.email || 'admin'
    }
  };

  let downloadUrl = '';
  let finalStorageRef = ref(storage, storagePath);
  let storageSucceeded = false;

  try {
    console.log('[Firebase Storage Executing Direct uploadBytes]', {
      bucket: bucketName,
      storagePath,
      fileSize: file.size
    });

    onProgress?.({
      stage: 'uploading',
      percent: 50,
      message: `Uploading binary stream (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`,
      bytesTransferred: file.size,
      totalBytes: file.size
    });

    const uploadResult = await uploadBytes(finalStorageRef, file, metadata);
    console.log('[Firebase Storage uploadBytes Succeeded]', uploadResult.metadata);

    // 3. Obtain secure download URL from Firebase Storage
    onProgress?.({
      stage: 'getting-url',
      percent: 80,
      message: 'Generating Firebase Storage download URL...',
      bytesTransferred: file.size,
      totalBytes: file.size
    });

    downloadUrl = await getDownloadURL(uploadResult.ref);
    if (!downloadUrl) {
      throw new Error('Firebase Storage upload succeeded but returned an empty download URL.');
    }

    storageSucceeded = true;
    console.log('[Firebase Storage Download URL Generated]', {
      gender,
      downloadUrl,
      storagePath
    });
  } catch (primaryError: any) {
    console.warn('[Firebase Storage Notice] Storage upload returned notice, activating high-definition Firestore direct encoding:', {
      code: primaryError?.code,
      message: primaryError?.message,
      bucket: bucketName,
      path: storagePath
    });

    onProgress?.({
      stage: 'uploading',
      percent: 70,
      message: 'Optimizing high-definition banner for Cloud Firestore persistence...',
      bytesTransferred: file.size,
      totalBytes: file.size
    });

    try {
      const optimized = await optimizeImageForDurableStore(file, 1920, 1080, 0.88);
      downloadUrl = optimized.dataUrl;
      console.log('[Firestore Direct Banner Persistence Prepared]', {
        sizeBytes: optimized.sizeBytes,
        dimensions: `${optimized.width}x${optimized.height}`
      });
    } catch (optErr) {
      console.error('[Banner Optimization Error]', optErr);
      throw primaryError;
    }
  }

  // 4. Update the Firestore banner document immediately
  onProgress?.({
    stage: 'saving-firestore',
    percent: 92,
    message: 'Saving banner document to Cloud Firestore...',
    bytesTransferred: file.size,
    totalBytes: file.size
  });

  await saveBannerToFirestore(
    gender,
    downloadUrl,
    file.name,
    storageSucceeded ? storagePath : 'firestore-durable-store',
    file.size,
    `${gender === 'male' ? 'Male' : 'Female'} Hero Campaign Banner`
  );

  console.log('[Firestore Banner Document Updated]', { gender, storageSucceeded });

  // 5. Clean up old Storage file if it exists, is distinct, and storage succeeded
  if (storageSucceeded && oldStoragePath && oldStoragePath !== storagePath && oldStoragePath !== 'firestore-durable-store') {
    onProgress?.({
      stage: 'cleaning-old',
      percent: 97,
      message: 'Cleaning up previous banner from Firebase Storage...',
      bytesTransferred: file.size,
      totalBytes: file.size
    });
    deleteBannerImageFromStorage(oldStoragePath).catch((err) => {
      console.debug('[Firebase Storage] Old storage cleanup non-fatal notice:', err);
    });
  }

  onProgress?.({
    stage: 'done',
    percent: 100,
    message: storageSucceeded
      ? 'Banner uploaded to Firebase Storage and synchronized successfully!'
      : 'Banner synchronized live to Cloud Firestore! (Storage bucket unprovisioned)',
    bytesTransferred: file.size,
    totalBytes: file.size
  });

  return downloadUrl;
}

/**
 * Auto-seeds initial Male and Female banner docs to Firestore if empty or missing
 */
export async function seedInitialBannersIfEmpty(): Promise<void> {
  try {
    const maleRef = doc(db, 'banners', 'male');
    const femaleRef = doc(db, 'banners', 'female');

    const [maleSnap, femaleSnap] = await Promise.all([
      getDoc(maleRef),
      getDoc(femaleRef)
    ]);

    if (!maleSnap.exists()) {
      await setDoc(maleRef, {
        id: 'male',
        gender: 'male',
        imageUrl: APPROVED_MALE_BANNER_URL,
        originalUrl: 'https://ibb.co/PvZVj2fS',
        title: 'Male Hero Campaign Banner',
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    if (!femaleSnap.exists()) {
      await setDoc(femaleRef, {
        id: 'female',
        gender: 'female',
        imageUrl: APPROVED_FEMALE_BANNER_URL,
        originalUrl: 'https://ibb.co/sdJW2VRT',
        title: 'Female Hero Campaign Banner',
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('Initial banners check/seed notice:', e);
  }
}

/**
 * Real-time subscription to payment settings in Firestore.
 */
export function subscribePaymentSettings(
  callback: (settings: PaymentSettings) => void
): () => void {
  const path = 'settings/payment';
  try {
    const docRef = doc(db, 'settings', 'payment');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const cleanSettings: PaymentSettings = {
            qrEnabled: Boolean(data.qrEnabled),
            qrImageUrl: data.qrImageUrl || null,
            screenshotEnabled: Boolean(data.screenshotEnabled),
            paymentMethods: cleanPaymentMethods(data.paymentMethods),
            esewaQrEnabled: Boolean(data.esewaQrEnabled),
            esewaQrImageUrl: data.esewaQrImageUrl || null,
            bankQrEnabled: Boolean(data.bankQrEnabled),
            bankQrImageUrl: data.bankQrImageUrl || null,
            codQrEnabled: Boolean(data.codQrEnabled),
            codQrImageUrl: data.codQrImageUrl || null
          };
          setCanonicalPaymentSettingsSync(cleanSettings);
          callback(cleanSettings);
        } else {
          const canonical = getCanonicalPaymentSettingsSync();
          callback(canonical);
        }
      },
      (error) => {
        console.warn('Firestore payment settings listener notice:', error?.message || error);
        callback(getCanonicalPaymentSettingsSync());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach payment settings listener:', err);
    callback(getCanonicalPaymentSettingsSync());
    return () => {};
  }
}

/**
 * Updates payment settings in Firestore and canonical cache.
 */
export async function updatePaymentSettings(
  settings: Partial<PaymentSettings>
): Promise<void> {
  const path = 'settings/payment';
  try {
    const docRef = doc(db, 'settings', 'payment');
    const existing = getCanonicalPaymentSettingsSync();
    const updated: PaymentSettings = {
      ...existing,
      ...settings,
      paymentMethods: settings.paymentMethods && settings.paymentMethods.length > 0
        ? cleanPaymentMethods(settings.paymentMethods)
        : existing.paymentMethods
    };

    setCanonicalPaymentSettingsSync(updated);

    await setDoc(docRef, {
      ...updated,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Uploads a QR code image to Firebase Storage (with fallback to durable WebP data URL)
 * and updates specific payment method QR or global settings.
 */
export async function uploadPaymentQrImage(file: File, methodId?: string): Promise<string> {
  if (!file) throw new Error('No image file selected.');
  
  const optimized = await optimizeImageForDurableStore(file, 1024, 1024, 0.92);
  let downloadUrl = optimized.dataUrl;

  try {
    const cleanMethod = methodId ? methodId.replace(/[^a-zA-Z0-9]/g, '_') : 'store';
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `settings/qr_${cleanMethod}_${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, { contentType: file.type || 'image/png' });
    downloadUrl = await getDownloadURL(storageRef);
  } catch (storageErr) {
    console.warn('Direct storage upload notice, utilizing durable store URL:', storageErr);
  }

  const patch: Partial<PaymentSettings> = {};
  if (methodId === 'eSewa') {
    patch.esewaQrImageUrl = downloadUrl;
    patch.esewaQrEnabled = true;
  } else if (methodId === 'Bank Transfer') {
    patch.bankQrImageUrl = downloadUrl;
    patch.bankQrEnabled = true;
  } else if (methodId === 'Cash on Delivery (COD)' || methodId === 'COD') {
    patch.codQrImageUrl = downloadUrl;
    patch.codQrEnabled = true;
  } else {
    patch.qrImageUrl = downloadUrl;
    patch.qrEnabled = true;
  }

  await updatePaymentSettings(patch);
  return downloadUrl;
}

/**
 * Uploads a customer's payment confirmation screenshot for an order.
 * Optimizes image and uploads to Firebase Storage (with durable fallback).
 */
export async function uploadPaymentScreenshot(file: File, orderId?: string): Promise<string> {
  if (!file) throw new Error('No screenshot file selected.');

  const optimized = await optimizeImageForDurableStore(file, 1280, 1280, 0.85);
  let downloadUrl = optimized.dataUrl;

  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `payment_screenshots/order_${orderId || Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
    downloadUrl = await getDownloadURL(storageRef);
  } catch (storageErr) {
    console.warn('Screenshot upload notice, using durable store URL:', storageErr);
  }

  return downloadUrl;
}

/**
 * Realtime subscription to store categories
 */
export function subscribeCategories(
  callback: (categories: CategoryItem[]) => void
): () => void {
  const path = 'settings/categories';
  try {
    const docRef = doc(db, 'settings', 'categories');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.categories) && data.categories.length > 0) {
            const categories: CategoryItem[] = data.categories.map((c: any, idx: number) => ({
              id: c.id || `cat-${idx}`,
              name: c.name || '',
              slug: c.slug || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-') : `cat-${idx}`),
              order: typeof c.order === 'number' ? c.order : idx,
              enabled: c.enabled !== false,
              description: c.description || ''
            }));
            categories.sort((a, b) => a.order - b.order);
            setCanonicalCategoriesSync(categories);
            callback(categories);
            return;
          }
        }
        const cached = getCanonicalCategoriesSync();
        callback(cached);
      },
      (error) => {
        console.warn('Firestore categories listener notification:', error?.message || error);
        callback(getCanonicalCategoriesSync());
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Firestore categories setup error:', error);
    callback(getCanonicalCategoriesSync());
    return () => {};
  }
}

/**
 * Saves categories list to Firestore & canonical cache
 */
export async function saveCategoriesToFirestore(categories: CategoryItem[]): Promise<void> {
  const path = 'settings/categories';
  try {
    const cleanCategories = categories.map((c, idx) => ({
      id: c.id?.trim() || `cat-${idx}-${Date.now()}`,
      name: c.name?.trim() || `Category ${idx + 1}`,
      slug: c.slug?.trim() || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${idx}`,
      order: typeof c.order === 'number' ? c.order : idx,
      enabled: c.enabled !== false,
      description: c.description?.trim() || ''
    }));
    cleanCategories.sort((a, b) => a.order - b.order);

    const docRef = doc(db, 'settings', 'categories');
    await setDoc(docRef, {
      categories: cleanCategories,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setCanonicalCategoriesSync(cleanCategories);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Seeds initial default categories if not already present in Firestore
 */
export async function seedInitialCategoriesIfEmpty(): Promise<void> {
  const path = 'settings/categories';
  try {
    const docRef = doc(db, 'settings', 'categories');
    const snap = await getDoc(docRef);
    if (!snap.exists() || !Array.isArray(snap.data()?.categories) || snap.data()?.categories.length === 0) {
      await setDoc(docRef, {
        categories: DEFAULT_CATEGORIES,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setCanonicalCategoriesSync(DEFAULT_CATEGORIES);
    }
  } catch (error) {
    console.debug('Categories seed check note:', error);
  }
}

/**
 * Realtime subscription to store apparel sizes
 */
export function subscribeSizes(
  callback: (sizes: string[]) => void
): () => void {
  const path = 'settings/sizes';
  try {
    const docRef = doc(db, 'settings', 'sizes');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.sizes) && data.sizes.length > 0) {
            const sizes = data.sizes.filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0);
            setCanonicalSizesSync(sizes);
            callback(sizes);
            return;
          }
        }
        callback(getCanonicalSizesSync());
      },
      (error) => {
        console.warn('Firestore sizes listener notification:', error?.message || error);
        callback(getCanonicalSizesSync());
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Firestore sizes setup error:', error);
    callback(getCanonicalSizesSync());
    return () => {};
  }
}

/**
 * Saves apparel sizes list to Firestore & canonical cache
 */
export async function saveSizesToFirestore(sizes: string[]): Promise<void> {
  const path = 'settings/sizes';
  try {
    const cleanSizes = Array.from(new Set(sizes.map(s => String(s).trim()).filter(Boolean)));
    const docRef = doc(db, 'settings', 'sizes');
    await setDoc(docRef, {
      sizes: cleanSizes,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setCanonicalSizesSync(cleanSizes);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Realtime subscription to product type / tag labels
 */
export function subscribeProductTypes(
  callback: (types: string[]) => void
): () => void {
  const path = 'settings/product_types';
  try {
    const docRef = doc(db, 'settings', 'product_types');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.productTypes) && data.productTypes.length > 0) {
            const types = data.productTypes.filter((t: any): t is string => typeof t === 'string' && t.trim().length > 0);
            setCanonicalProductTypesSync(types);
            callback(types);
            return;
          }
        }
        callback(getCanonicalProductTypesSync());
      },
      (error) => {
        console.warn('Firestore product types listener notification:', error?.message || error);
        callback(getCanonicalProductTypesSync());
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Firestore product types setup error:', error);
    callback(getCanonicalProductTypesSync());
    return () => {};
  }
}

/**
 * Saves product type labels to Firestore & canonical cache
 */
export async function saveProductTypesToFirestore(types: string[]): Promise<void> {
  const path = 'settings/product_types';
  try {
    const cleanTypes = Array.from(new Set(types.map(t => String(t).trim()).filter(Boolean)));
    const docRef = doc(db, 'settings', 'product_types');
    await setDoc(docRef, {
      productTypes: cleanTypes,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setCanonicalProductTypesSync(cleanTypes);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Realtime subscription to Homepage Sections placement
 */
export function subscribeHomepageSections(
  callback: (sections: HomepageSectionPlacement[]) => void
): () => void {
  const path = 'settings/homepage_sections';
  try {
    const docRef = doc(db, 'settings', 'homepage_sections');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.sections) && data.sections.length > 0) {
            const sections: HomepageSectionPlacement[] = data.sections.map((s: any) => ({
              id: String(s.id),
              title: String(s.title || ''),
              subtitle: s.subtitle ? String(s.subtitle) : '',
              productIds: Array.isArray(s.productIds) ? s.productIds.map(String) : []
            }));
            setHomepageSectionsSync(sections);
            callback(sections);
            return;
          }
        }
        callback(getHomepageSectionsSync());
      },
      (error) => {
        console.warn('Firestore homepage sections listener notification:', error?.message || error);
        callback(getHomepageSectionsSync());
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Firestore homepage sections setup error:', error);
    callback(getHomepageSectionsSync());
    return () => {};
  }
}

/**
 * Saves Homepage Sections placement to Firestore and canonical cache
 */
export async function saveHomepageSectionsToFirestore(
  sections: HomepageSectionPlacement[]
): Promise<void> {
  const path = 'settings/homepage_sections';
  try {
    const cleanSections = sections.map((s) => ({
      id: s.id.trim(),
      title: s.title.trim(),
      subtitle: s.subtitle?.trim() || '',
      productIds: Array.isArray(s.productIds) ? s.productIds.filter(Boolean) : []
    }));

    const docRef = doc(db, 'settings', 'homepage_sections');
    await setDoc(docRef, {
      sections: cleanSections,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setHomepageSectionsSync(cleanSections);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Seeds initial default homepage sections if not already present in Firestore
 */
export async function seedInitialHomepageSectionsIfEmpty(): Promise<void> {
  const path = 'settings/homepage_sections';
  try {
    const docRef = doc(db, 'settings', 'homepage_sections');
    const snap = await getDoc(docRef);
    if (!snap.exists() || !Array.isArray(snap.data()?.sections) || snap.data()?.sections.length === 0) {
      await setDoc(docRef, {
        sections: DEFAULT_HOMEPAGE_SECTIONS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setHomepageSectionsSync(DEFAULT_HOMEPAGE_SECTIONS);
    }
  } catch (error) {
    console.debug('Homepage sections seed check note:', error);
  }
}

/**
 * Returns the currently confirmed Promo Settings synchronously from canonical cache.
 */
export function getCanonicalPromoSettingsSync(): PromoSettings {
  if (typeof window === 'undefined') return DEFAULT_PROMO_SETTINGS;
  try {
    const saved = localStorage.getItem(CANONICAL_PROMO_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          cartPromoEnabled: parsed.cartPromoEnabled !== false,
          codes: Array.isArray(parsed.codes) ? parsed.codes : DEFAULT_PROMO_CODES
        };
      }
    }
  } catch (e) {
    console.debug('Error reading canonical promo settings:', e);
  }
  return DEFAULT_PROMO_SETTINGS;
}

export function setCanonicalPromoSettingsSync(settings: PromoSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANONICAL_PROMO_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.debug('Error writing canonical promo settings cache:', e);
  }
}

/**
 * Subscribes to real-time Promo Settings & Codes in Firestore settings/promo_codes
 */
export function subscribePromoSettings(
  callback: (settings: PromoSettings) => void
): () => void {
  const path = 'settings/promo_codes';
  try {
    const docRef = doc(db, 'settings', 'promo_codes');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const cleanCodes: PromoCode[] = Array.isArray(data?.codes)
            ? data.codes.map((c: any) => ({
                id: String(c.id || Date.now()),
                code: String(c.code || '').trim().toUpperCase(),
                discountType: c.discountType === 'fixed' ? 'fixed' : 'percentage',
                discountValue: Number(c.discountValue) || 0,
                discount: String(c.discount || (c.discountType === 'fixed' ? `Rs ${c.discountValue} OFF` : `${c.discountValue}% OFF`)),
                description: String(c.description || ''),
                active: c.active !== false,
                validUntil: String(c.validUntil || 'Ongoing'),
                minOrderAmount: typeof c.minOrderAmount === 'number' ? c.minOrderAmount : 0
              }))
            : DEFAULT_PROMO_CODES;

          const promoSettings: PromoSettings = {
            cartPromoEnabled: data?.cartPromoEnabled !== false,
            codes: cleanCodes
          };

          setCanonicalPromoSettingsSync(promoSettings);
          callback(promoSettings);
          return;
        }

        // Document not yet seeded in Firestore: auto-seed and call callback
        seedInitialPromoSettingsIfEmpty().catch(() => {});
        callback(getCanonicalPromoSettingsSync());
      },
      (error) => {
        console.warn('Firestore promo settings listener notification:', error?.message || error);
        callback(getCanonicalPromoSettingsSync());
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Firestore promo settings setup error:', error);
    callback(getCanonicalPromoSettingsSync());
    return () => {};
  }
}

/**
 * Saves complete Promo Settings to Firestore and canonical cache
 */
export async function savePromoSettingsToFirestore(
  settings: PromoSettings
): Promise<void> {
  const path = 'settings/promo_codes';
  try {
    const cleanCodes: PromoCode[] = (settings.codes || []).map((c) => ({
      id: String(c.id).trim(),
      code: String(c.code).trim().toUpperCase(),
      discountType: c.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(c.discountValue) || 0,
      discount: String(c.discount).trim(),
      description: String(c.description || '').trim(),
      active: c.active !== false,
      validUntil: String(c.validUntil || 'Ongoing').trim(),
      minOrderAmount: Number(c.minOrderAmount) || 0
    }));

    const docRef = doc(db, 'settings', 'promo_codes');
    await setDoc(docRef, {
      cartPromoEnabled: settings.cartPromoEnabled !== false,
      codes: cleanCodes,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setCanonicalPromoSettingsSync({
      cartPromoEnabled: settings.cartPromoEnabled !== false,
      codes: cleanCodes
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Toggles the Cart Promo Code visibility in Firestore
 */
export async function toggleCartPromoEnabledInFirestore(enabled: boolean): Promise<void> {
  const path = 'settings/promo_codes';
  try {
    const docRef = doc(db, 'settings', 'promo_codes');
    await setDoc(docRef, {
      cartPromoEnabled: Boolean(enabled),
      updatedAt: serverTimestamp()
    }, { merge: true });

    const current = getCanonicalPromoSettingsSync();
    setCanonicalPromoSettingsSync({
      ...current,
      cartPromoEnabled: Boolean(enabled)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Adds or updates a single promo code in Firestore
 */
export async function savePromoCodeToFirestore(promo: PromoCode): Promise<void> {
  const current = getCanonicalPromoSettingsSync();
  const existingIdx = current.codes.findIndex((c) => c.id === promo.id || c.code.trim().toUpperCase() === promo.code.trim().toUpperCase());
  
  let newCodes: PromoCode[];
  if (existingIdx >= 0) {
    newCodes = [...current.codes];
    newCodes[existingIdx] = promo;
  } else {
    newCodes = [promo, ...current.codes];
  }

  await savePromoSettingsToFirestore({
    ...current,
    codes: newCodes
  });
}

/**
 * Deletes a single promo code from Firestore
 */
export async function deletePromoCodeFromFirestore(promoId: string): Promise<void> {
  const current = getCanonicalPromoSettingsSync();
  const newCodes = current.codes.filter((c) => c.id !== promoId);
  await savePromoSettingsToFirestore({
    ...current,
    codes: newCodes
  });
}

/**
 * Seeds initial promo codes if Firestore doc is empty or missing
 */
export async function seedInitialPromoSettingsIfEmpty(): Promise<void> {
  const path = 'settings/promo_codes';
  try {
    const docRef = doc(db, 'settings', 'promo_codes');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        cartPromoEnabled: true,
        codes: DEFAULT_PROMO_CODES,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setCanonicalPromoSettingsSync(DEFAULT_PROMO_SETTINGS);
    }
  } catch (error) {
    console.debug('Promo settings seed check note:', error);
  }
}

/**
 * Validates a promo code fresh against Firestore and calculates eligible discount in NPR
 */
export async function validatePromoCodeAgainstFirestore(
  codeStr: string,
  subtotal: number
): Promise<{
  valid: boolean;
  discountAmount: number;
  error?: string;
  promoCode?: PromoCode;
}> {
  const cleanCode = (codeStr || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discountAmount: 0, error: 'Please enter a promo code.' };
  }

  try {
    const docRef = doc(db, 'settings', 'promo_codes');
    const snap = await getDoc(docRef);

    let settings: PromoSettings = getCanonicalPromoSettingsSync();
    if (snap.exists()) {
      const data = snap.data();
      settings = {
        cartPromoEnabled: data.cartPromoEnabled !== false,
        codes: Array.isArray(data.codes) ? data.codes : []
      };
      setCanonicalPromoSettingsSync(settings);
    }

    // Check if admin has disabled promo codes in cart
    if (!settings.cartPromoEnabled) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'Promo code entry is currently disabled.'
      };
    }

    let matched = settings.codes.find(
      (c) => c.code.trim().toUpperCase() === cleanCode
    );

    // If not found in general promo codes, check the one-time promo codes collection
    if (!matched) {
      try {
        const oneTimeDocRef = doc(db, 'oneTimePromoCodes', cleanCode);
        const oneTimeSnap = await getDoc(oneTimeDocRef);
        if (oneTimeSnap.exists()) {
          const otData = oneTimeSnap.data();

          if (otData.status === 'redeemed') {
            return {
              valid: false,
              discountAmount: 0,
              error: `This one-time promo code has already been redeemed${otData.redeemedOrderId ? ` with order ${otData.redeemedOrderId}` : ''}.`
            };
          }

          if (otData.status === 'disabled' || otData.disabledAt) {
            return {
              valid: false,
              discountAmount: 0,
              error: `Promo code "${cleanCode}" has been disabled.`
            };
          }

          if (otData.status === 'expired') {
            return {
              valid: false,
              discountAmount: 0,
              error: `Promo code "${cleanCode}" has expired.`
            };
          }

          if (otData.expiresAt) {
            const expDate = new Date(otData.expiresAt);
            if (!isNaN(expDate.getTime())) {
              expDate.setHours(23, 59, 59, 999);
              if (Date.now() > expDate.getTime()) {
                return {
                  valid: false,
                  discountAmount: 0,
                  error: `Promo code "${cleanCode}" expired on ${otData.expiresAt}.`
                };
              }
            }
          }

          if (otData.minOrderAmount && otData.minOrderAmount > 0 && subtotal < otData.minOrderAmount) {
            return {
              valid: false,
              discountAmount: 0,
              error: `Minimum order of NPR ${otData.minOrderAmount.toLocaleString()} required for this code.`
            };
          }

          let rawDiscount = 0;
          if (otData.discountType === 'percentage') {
            const pct = Math.max(0, Math.min(100, Number(otData.discountValue) || 5));
            rawDiscount = Math.round((subtotal * pct) / 100);
            if (otData.maxDiscountAmount && otData.maxDiscountAmount > 0) {
              rawDiscount = Math.min(rawDiscount, otData.maxDiscountAmount);
            }
          } else {
            rawDiscount = Math.max(0, Number(otData.discountValue) || 0);
          }

          const finalDiscount = Math.min(subtotal, Math.max(0, rawDiscount));
          return {
            valid: true,
            discountAmount: finalDiscount,
            promoCode: {
              id: cleanCode,
              code: cleanCode,
              discountType: otData.discountType || 'percentage',
              discountValue: otData.discountValue || 5,
              discount: otData.discount || (otData.discountType === 'fixed' ? `Rs ${otData.discountValue} OFF` : `${otData.discountValue}% OFF`),
              description: otData.description || 'Welcome Subscriber 5% Discount',
              active: true,
              validUntil: otData.expiresAt || 'One-time use',
              minOrderAmount: otData.minOrderAmount || 0
            }
          };
        }
      } catch (otErr) {
        console.warn('One-time code lookup check notice:', otErr);
      }

      return {
        valid: false,
        discountAmount: 0,
        error: `Promo code "${cleanCode}" is invalid.`
      };
    }

    if (!matched.active) {
      return {
        valid: false,
        discountAmount: 0,
        error: `Promo code "${cleanCode}" is currently inactive.`
      };
    }

    // Check expiry
    if (
      matched.validUntil &&
      matched.validUntil.trim().toLowerCase() === 'expired'
    ) {
      return {
        valid: false,
        discountAmount: 0,
        error: `Promo code "${cleanCode}" has expired.`
      };
    }

    if (matched.validUntil && matched.validUntil.toLowerCase() !== 'ongoing') {
      const parsedDate = new Date(matched.validUntil);
      if (!isNaN(parsedDate.getTime())) {
        parsedDate.setHours(23, 59, 59, 999);
        if (Date.now() > parsedDate.getTime()) {
          return {
            valid: false,
            discountAmount: 0,
            error: `Promo code "${cleanCode}" expired on ${matched.validUntil}.`
          };
        }
      }
    }

    // Check minimum order amount if specified
    if (matched.minOrderAmount && matched.minOrderAmount > 0 && subtotal < matched.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        error: `Minimum order of NPR ${matched.minOrderAmount.toLocaleString()} required for this code.`
      };
    }

    // Compute discount amount
    let rawDiscount = 0;
    if (matched.discountType === 'percentage') {
      const pct = Math.max(0, Math.min(100, Number(matched.discountValue) || 0));
      rawDiscount = Math.round((subtotal * pct) / 100);
    } else {
      rawDiscount = Math.max(0, Number(matched.discountValue) || 0);
    }

    const finalDiscount = Math.min(subtotal, Math.max(0, rawDiscount));

    return {
      valid: true,
      discountAmount: finalDiscount,
      promoCode: matched
    };
  } catch (error: any) {
    console.warn('Promo code validation notice:', error);
    return {
      valid: false,
      discountAmount: 0,
      error: 'Unable to validate promo code. Please try again.'
    };
  }
}

/**
 * Generates an unpredictable uppercase one-time code with prefix "PNXM"
 * Suffix avoids visually ambiguous characters (0, O, 1, I, L)
 */
export function generateSecurePnxmCode(length: number = 4): string {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let suffix = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      suffix += alphabet.charAt(bytes[i] % alphabet.length);
    }
  } else {
    for (let i = 0; i < length; i++) {
      suffix += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
  }
  return `PNXM${suffix}`;
}

export const DEFAULT_ONE_TIME_PROMO_SETTINGS: OneTimePromoSettings = {
  enabled: true,
  discountType: 'percentage',
  discountValue: 5,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  expiresInDays: null
};

/**
 * Realtime subscription to One-Time Promo Code Settings in Firestore settings/one_time_promo_settings
 */
export function subscribeOneTimePromoSettings(
  callback: (settings: OneTimePromoSettings) => void
): () => void {
  const path = 'settings/one_time_promo_settings';
  try {
    const docRef = doc(db, 'settings', 'one_time_promo_settings');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          callback({
            enabled: d.enabled !== false,
            discountType: d.discountType === 'fixed' ? 'fixed' : 'percentage',
            discountValue: Number(d.discountValue) > 0 ? Number(d.discountValue) : 5,
            minOrderAmount: Number(d.minOrderAmount) >= 0 ? Number(d.minOrderAmount) : 0,
            maxDiscountAmount: typeof d.maxDiscountAmount === 'number' && d.maxDiscountAmount > 0 ? d.maxDiscountAmount : null,
            expiresInDays: typeof d.expiresInDays === 'number' && d.expiresInDays > 0 ? d.expiresInDays : null,
            updatedAt: d.updatedAt
          });
        } else {
          callback(DEFAULT_ONE_TIME_PROMO_SETTINGS);
        }
      },
      (error) => {
        console.warn('One-time promo settings listener notice:', error?.message || error);
        callback(DEFAULT_ONE_TIME_PROMO_SETTINGS);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('One-time promo settings attach error:', err);
    callback(DEFAULT_ONE_TIME_PROMO_SETTINGS);
    return () => {};
  }
}

/**
 * Saves One-Time Promo Code Settings to Firestore
 */
export async function saveOneTimePromoSettings(
  settings: Partial<OneTimePromoSettings>
): Promise<void> {
  const path = 'settings/one_time_promo_settings';
  try {
    const docRef = doc(db, 'settings', 'one_time_promo_settings');
    await setDoc(docRef, {
      enabled: settings.enabled !== false,
      discountType: settings.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Math.max(1, Math.min(100, Number(settings.discountValue) || 5)),
      minOrderAmount: Math.max(0, Number(settings.minOrderAmount) || 0),
      maxDiscountAmount: settings.maxDiscountAmount ? Math.max(1, Number(settings.maxDiscountAmount)) : null,
      expiresInDays: settings.expiresInDays ? Math.max(1, Number(settings.expiresInDays)) : null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Subscribes a user to the newsletter with persistent Firestore storage & idempotent welcome promo code generation.
 * Prevents duplicates; if email already subscribed, returns existing code without generating duplicate records.
 */
export async function subscribeToNewsletter(email: string): Promise<{
  success: boolean;
  isExisting: boolean;
  promoCode: string;
  error?: string;
}> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return {
      success: false,
      isExisting: false,
      promoCode: '',
      error: 'Please enter a valid email address.'
    };
  }

  // Deterministic identifier preventing duplicate records
  const subscriberId = `sub_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const subRef = doc(db, 'newsletterSubscribers', subscriberId);
      const subSnap = await transaction.get(subRef);

      // Idempotency: Return existing welcome code if already subscribed
      if (subSnap.exists()) {
        const existingData = subSnap.data();
        return {
          success: true,
          isExisting: true,
          promoCode: existingData.welcomePromoCode || '',
          error: undefined
        };
      }

      // Fetch active one-time promo settings
      let discountType: 'percentage' | 'fixed' = 'percentage';
      let discountValue = 5;
      let minOrderAmount = 0;
      let maxDiscountAmount: number | null = null;
      let expiresInDays: number | null = null;

      try {
        const settingsRef = doc(db, 'settings', 'one_time_promo_settings');
        const settingsSnap = await transaction.get(settingsRef);
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          if (s.enabled !== false) {
            discountType = s.discountType === 'fixed' ? 'fixed' : 'percentage';
            discountValue = Number(s.discountValue) > 0 ? Number(s.discountValue) : 5;
            minOrderAmount = Number(s.minOrderAmount) >= 0 ? Number(s.minOrderAmount) : 0;
            maxDiscountAmount = typeof s.maxDiscountAmount === 'number' && s.maxDiscountAmount > 0 ? s.maxDiscountAmount : null;
            expiresInDays = typeof s.expiresInDays === 'number' && s.expiresInDays > 0 ? s.expiresInDays : null;
          }
        }
      } catch {
        // Fall back to defaults
      }

      // Generate unique code with collision checking
      let generatedCode = '';
      let codeExists = true;
      let attempts = 0;

      while (codeExists && attempts < 5) {
        generatedCode = generateSecurePnxmCode(4);
        const codeRef = doc(db, 'oneTimePromoCodes', generatedCode);
        const codeSnap = await transaction.get(codeRef);
        if (!codeSnap.exists()) {
          codeExists = false;
        }
        attempts++;
      }

      if (codeExists || !generatedCode) {
        generatedCode = `PNXM${Date.now().toString(36).slice(-4).toUpperCase()}`;
      }

      let expiresAt: string | null = null;
      if (expiresInDays && expiresInDays > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + expiresInDays);
        expiresAt = expDate.toISOString().split('T')[0];
      }

      const displayDiscount = discountType === 'percentage'
        ? `${discountValue}% OFF`
        : `Rs ${discountValue} OFF`;

      const codeDocRef = doc(db, 'oneTimePromoCodes', generatedCode);
      transaction.set(codeDocRef, {
        id: generatedCode,
        code: generatedCode,
        subscriberId: subscriberId,
        customerEmail: normalizedEmail,
        discountType,
        discountValue,
        discount: displayDiscount,
        minOrderAmount,
        maxDiscountAmount,
        description: 'Welcome 5% off first order',
        status: 'unused',
        createdAt: serverTimestamp(),
        expiresAt,
        redeemedAt: null,
        redeemedOrderId: null,
        disabledAt: null,
        createdBy: 'newsletter_welcome',
        updatedAt: serverTimestamp()
      });

      transaction.set(subRef, {
        id: subscriberId,
        email: normalizedEmail,
        subscribedAt: serverTimestamp(),
        status: 'active',
        welcomePromoCode: generatedCode,
        welcomePromoCodeStatus: 'unused',
        emailConsent: true,
        consentSource: 'website_footer_newsletter',
        consentTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        isExisting: false,
        promoCode: generatedCode
      };
    });

    return result;
  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    return {
      success: false,
      isExisting: false,
      promoCode: '',
      error: error?.message || 'Unable to complete subscription. Please try again.'
    };
  }
}

/**
 * Real-time subscription to Newsletter Subscribers (Admin only)
 */
export function subscribeNewsletterSubscribers(
  callback: (subscribers: NewsletterSubscriber[]) => void
): () => void {
  const path = 'newsletterSubscribers';
  try {
    const refCol = collection(db, path);
    const q = query(refCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NewsletterSubscriber[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            email: d.email || '',
            subscribedAt: d.subscribedAt,
            status: (d.status === 'unsubscribed' ? 'unsubscribed' : 'active') as 'active' | 'unsubscribed',
            welcomePromoCode: d.welcomePromoCode || '',
            welcomePromoCodeStatus: d.welcomePromoCodeStatus || 'unused',
            welcomePromoCodeRedeemedAt: d.welcomePromoCodeRedeemedAt,
            welcomePromoCodeRedeemedOrderId: d.welcomePromoCodeRedeemedOrderId || null,
            emailConsent: d.emailConsent !== false,
            consentSource: d.consentSource || 'website_footer_newsletter',
            consentTimestamp: d.consentTimestamp,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          });
        });

        // Sort newest first
        list.sort((a, b) => {
          const tA = a.subscribedAt?.seconds ? a.subscribedAt.seconds * 1000 : (a.subscribedAt ? new Date(a.subscribedAt).getTime() : 0);
          const tB = b.subscribedAt?.seconds ? b.subscribedAt.seconds * 1000 : (b.subscribedAt ? new Date(b.subscribedAt).getTime() : 0);
          return tB - tA;
        });

        callback(list);
      },
      (error) => {
        console.warn('Newsletter subscribers listener notice:', error?.message || error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Newsletter subscribers attach notice:', err);
    return () => {};
  }
}

/**
 * Updates a subscriber's active/unsubscribed status
 */
export async function updateSubscriberStatus(
  subscriberId: string,
  status: 'active' | 'unsubscribed'
): Promise<void> {
  const path = `newsletterSubscribers/${subscriberId}`;
  try {
    const docRef = doc(db, 'newsletterSubscribers', subscriberId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Real-time subscription to One-Time Promo Codes (Admin only)
 */
export function subscribeOneTimePromoCodes(
  callback: (codes: OneTimePromoCode[]) => void
): () => void {
  const path = 'oneTimePromoCodes';
  try {
    const refCol = collection(db, path);
    const q = query(refCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: OneTimePromoCode[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            code: d.code || docSnap.id,
            subscriberId: d.subscriberId,
            customerEmail: d.customerEmail || '',
            discountType: d.discountType === 'fixed' ? 'fixed' : 'percentage',
            discountValue: Number(d.discountValue) || 5,
            discount: d.discount || (d.discountType === 'fixed' ? `Rs ${d.discountValue} OFF` : `${d.discountValue}% OFF`),
            minOrderAmount: Number(d.minOrderAmount) || 0,
            maxDiscountAmount: typeof d.maxDiscountAmount === 'number' ? d.maxDiscountAmount : null,
            description: d.description || '',
            status: d.status || 'unused',
            createdAt: d.createdAt,
            expiresAt: d.expiresAt || null,
            redeemedAt: d.redeemedAt,
            redeemedOrderId: d.redeemedOrderId || null,
            disabledAt: d.disabledAt,
            createdBy: d.createdBy || 'newsletter_welcome',
            updatedAt: d.updatedAt
          });
        });

        // Sort newest first
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tB - tA;
        });

        callback(list);
      },
      (error) => {
        console.warn('One-time promo codes listener notice:', error?.message || error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('One-time promo codes attach notice:', err);
    return () => {};
  }
}

/**
 * Disables a one-time promo code
 */
export async function disableOneTimePromoCode(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const path = `oneTimePromoCodes/${cleanCode}`;
  try {
    const codeRef = doc(db, 'oneTimePromoCodes', cleanCode);
    const snap = await getDoc(codeRef);
    if (!snap.exists()) throw new Error(`Code ${cleanCode} does not exist.`);

    const data = snap.data();
    await updateDoc(codeRef, {
      status: 'disabled',
      disabledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (data.subscriberId) {
      const subRef = doc(db, 'newsletterSubscribers', data.subscriberId);
      await updateDoc(subRef, {
        welcomePromoCodeStatus: 'disabled',
        updatedAt: serverTimestamp()
      }).catch((e) => console.debug('Sub sync disable notice:', e));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Marks a one-time promo code as redeemed with associated order ID
 */
export async function markOneTimePromoCodeRedeemed(code: string, orderId: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  try {
    const codeRef = doc(db, 'oneTimePromoCodes', cleanCode);
    const snap = await getDoc(codeRef);
    if (!snap.exists()) return;

    const data = snap.data();
    await updateDoc(codeRef, {
      status: 'redeemed',
      redeemedOrderId: orderId,
      redeemedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (data.subscriberId) {
      const subRef = doc(db, 'newsletterSubscribers', data.subscriberId);
      await updateDoc(subRef, {
        welcomePromoCodeStatus: 'redeemed',
        welcomePromoCodeRedeemedOrderId: orderId,
        welcomePromoCodeRedeemedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch((e) => console.debug('Sub sync redeem notice:', e));
    }
  } catch (err) {
    console.warn('markOneTimePromoCodeRedeemed notice:', err);
  }
}

/**
 * Allows an admin to manually issue a custom one-time code
 */
export async function createManualOneTimePromoCode(params: {
  customerEmail: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  expiresInDays?: number | null;
}): Promise<OneTimePromoCode> {
  const normalizedEmail = (params.customerEmail || '').trim().toLowerCase();
  const code = generateSecurePnxmCode(4);
  const path = `oneTimePromoCodes/${code}`;

  let expiresAt: string | null = null;
  if (params.expiresInDays && params.expiresInDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + params.expiresInDays);
    expiresAt = d.toISOString().split('T')[0];
  }

  const displayDiscount = params.discountType === 'percentage'
    ? `${params.discountValue}% OFF`
    : `Rs ${params.discountValue} OFF`;

  const newCode: OneTimePromoCode = {
    id: code,
    code,
    customerEmail: normalizedEmail,
    discountType: params.discountType,
    discountValue: params.discountValue,
    discount: displayDiscount,
    minOrderAmount: params.minOrderAmount || 0,
    maxDiscountAmount: params.maxDiscountAmount || null,
    description: `Admin generated for ${normalizedEmail || 'customer'}`,
    status: 'unused',
    createdAt: new Date().toISOString(),
    expiresAt,
    redeemedAt: null,
    redeemedOrderId: null,
    disabledAt: null,
    createdBy: 'admin'
  };

  try {
    const docRef = doc(db, 'oneTimePromoCodes', code);
    await setDoc(docRef, {
      ...newCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

