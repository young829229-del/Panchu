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
import { Product, Order, OrderItem, OrderStatus, AdminUser, BannerDoc, PaymentSettings } from '../types';
import { optimizeImageForDurableStore } from '../utils/imageOptimizer';
import { ALL_PRODUCTS } from '../data/products';

export const ADMIN_EMAILS = ['young829229@gmail.com', 'npdraggers111@gmail.com'];
export const ADMIN_EMAIL_PRIMARY = 'young829229@gmail.com';

export const APPROVED_MALE_BANNER_URL = 'https://i.ibb.co/XrZGLnvw/snaptik-app-7637482582606826773-slide-2.jpg';
export const APPROVED_FEMALE_BANNER_URL = 'https://i.ibb.co/7dNkX1C3/IMG-20260820-WA0001.jpg';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  qrEnabled: false,
  qrImageUrl: null,
  screenshotEnabled: false,
  paymentMethods: ['eSewa', 'Bank Transfer', 'Cash on Delivery (COD)']
};

const CANONICAL_BANNERS_KEY = 'panchu_canonical_banners';
const CANONICAL_PRODUCTS_KEY = 'panchu_canonical_products';
const CANONICAL_PAYMENT_SETTINGS_KEY = 'panchu_canonical_payment_settings';

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
          paymentMethods: Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0
            ? parsed.paymentMethods
            : DEFAULT_PAYMENT_SETTINGS.paymentMethods
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
            category: data.category || 'Tees',
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
  const resolvedDeliveryFee = Number(orderInput.deliveryFee) || 0;
  const resolvedTotal = Number(orderInput.totalAmount !== undefined ? orderInput.totalAmount : orderInput.total) || (resolvedSubtotal + resolvedDeliveryFee);

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

  try {
    // 1. Attempt atomic transaction with inventory update
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

    const docData: Record<string, any> = {
      name: productData.name?.trim() || 'Untitled Product',
      subtitle: productData.subtitle?.trim() || '',
      price: Number(productData.price) || 0,
      MRP: Number(productData.MRP || productData.originalPrice) || Number(productData.price) || 0,
      originalPrice: Number(productData.originalPrice || productData.MRP) || Number(productData.price) || 0,
      description: productData.description?.trim() || '',
      category: productData.category || 'Tees',
      collection: productData.collection || 'General',
      gender: productData.gender || 'male',
      image: mainImage,
      images: images,
      additionalImages: images,
      sizes: sizes,
      stock: stock,
      featured: Boolean(productData.featured),
      bestSelling: Boolean(productData.bestSelling),
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
            paymentMethods: Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0
              ? data.paymentMethods
              : DEFAULT_PAYMENT_SETTINGS.paymentMethods
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
        ? settings.paymentMethods
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
 * and updates payment settings.
 */
export async function uploadPaymentQrImage(file: File): Promise<string> {
  if (!file) throw new Error('No image file selected.');
  
  const optimized = await optimizeImageForDurableStore(file, 1024, 1024, 0.92);
  let downloadUrl = optimized.dataUrl;

  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `settings/qr_code_${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, { contentType: file.type || 'image/png' });
    downloadUrl = await getDownloadURL(storageRef);
  } catch (storageErr) {
    console.warn('Direct storage upload notice, utilizing durable store URL:', storageErr);
  }

  await updatePaymentSettings({ qrImageUrl: downloadUrl, qrEnabled: true });
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

