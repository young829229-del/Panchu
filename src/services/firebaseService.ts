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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { Product, Order, OrderItem, OrderStatus, AdminUser } from '../types';

export const ADMIN_EMAIL_PRIMARY = 'young829229@gmail.com';

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
          orders.push({
            id: docSnap.id,
            orderId: data.orderId || docSnap.id,
            customerName: data.customerName || '',
            customerEmail: data.customerEmail || '',
            phone: data.phone || '',
            address: data.address || '',
            location: data.location || '',
            deliveryOption: data.deliveryOption || '',
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: Number(data.subtotal) || 0,
            deliveryFee: Number(data.deliveryFee) || 0,
            total: Number(data.total) || 0,
            status: (data.status as OrderStatus) || 'Pending',
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
 * Atomic Order Placement & Size-Specific Stock Reduction
 * Decrements the exact size inventory in products collection atomically
 */
export async function createFirestoreOrder(
  orderInput: {
    orderId: string;
    customerName: string;
    customerEmail?: string;
    userId?: string;
    phone: string;
    address: string;
    location: string;
    deliveryOption: string;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
  }
): Promise<{ success: boolean; orderId: string; error?: string }> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Validate and fetch all ordered product documents
      const productDocs: { ref: any; data: any; item: OrderItem }[] = [];

      for (const item of orderInput.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const stock = productData.stock || {};
          const currentSizeStock = typeof stock[item.selectedSize] === 'number' ? stock[item.selectedSize] : 10;

          if (currentSizeStock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.productName}" (Size ${item.selectedSize}). Available: ${currentSizeStock}, Requested: ${item.quantity}`);
          }

          productDocs.push({
            ref: productRef,
            data: productData,
            item
          });
        }
      }

      // 2. Decrement size stock for each product doc
      for (const { ref: pRef, data: pData, item } of productDocs) {
        const stock = { ...(pData.stock || {}) };
        const currentQty = typeof stock[item.selectedSize] === 'number' ? stock[item.selectedSize] : 10;
        const newQty = Math.max(0, currentQty - item.quantity);
        stock[item.selectedSize] = newQty;

        const anyStockLeft = Object.values(stock).some((qty: any) => Number(qty) > 0);

        transaction.update(pRef, {
          stock,
          inStock: anyStockLeft,
          updatedAt: serverTimestamp()
        });
      }

      // 3. Create the order document
      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, {
        orderId: orderInput.orderId,
        customerName: orderInput.customerName.trim(),
        customerEmail: (orderInput as any).customerEmail?.trim() || auth.currentUser?.email || '',
        userId: (orderInput as any).userId || auth.currentUser?.uid || '',
        phone: orderInput.phone.trim(),
        address: orderInput.address.trim(),
        location: orderInput.location.trim(),
        deliveryOption: orderInput.deliveryOption,
        items: orderInput.items,
        subtotal: orderInput.subtotal,
        deliveryFee: orderInput.deliveryFee,
        total: orderInput.total,
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    return { success: true, orderId: orderInput.orderId };
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return {
      success: false,
      orderId: orderInput.orderId,
      error: error?.message || 'Failed to record order in Firebase database.'
    };
  }
}

/**
 * Update Order Status (Admin)
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
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
  const primaryAdmin = ADMIN_EMAIL_PRIMARY.toLowerCase().trim();

  // If primary admin, guarantee admin doc exists in Firestore for rules check
  if (normalizedEmail === primaryAdmin) {
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

    if (uid) {
      const qUid = query(ordersRef, where('userId', '==', uid));
      const snapUid = await getDocs(qUid);
      snapUid.forEach(docSnap => {
        const d = docSnap.data();
        seenIds.add(docSnap.id);
        matchedOrders.push({
          id: docSnap.id,
          orderId: d.orderId || docSnap.id,
          customerName: d.customerName || '',
          customerEmail: d.customerEmail || '',
          userId: d.userId,
          phone: d.phone || '',
          address: d.address || '',
          location: d.location || '',
          deliveryOption: d.deliveryOption || 'standard',
          items: d.items || [],
          subtotal: Number(d.subtotal) || 0,
          deliveryFee: Number(d.deliveryFee) || 0,
          total: Number(d.total) || 0,
          status: d.status || 'Pending',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        });
      });
    }

    if (email) {
      const normalized = email.toLowerCase().trim();
      const qEmail = query(ordersRef, where('customerEmail', '==', normalized));
      const snapEmail = await getDocs(qEmail);
      snapEmail.forEach(docSnap => {
        if (!seenIds.has(docSnap.id)) {
          const d = docSnap.data();
          seenIds.add(docSnap.id);
          matchedOrders.push({
            id: docSnap.id,
            orderId: d.orderId || docSnap.id,
            customerName: d.customerName || '',
            customerEmail: d.customerEmail || '',
            userId: d.userId,
            phone: d.phone || '',
            address: d.address || '',
            location: d.location || '',
            deliveryOption: d.deliveryOption || 'standard',
            items: d.items || [],
            subtotal: Number(d.subtotal) || 0,
            deliveryFee: Number(d.deliveryFee) || 0,
            total: Number(d.total) || 0,
            status: d.status || 'Pending',
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          });
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
