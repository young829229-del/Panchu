import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth, googleProvider, db, storage, app } from '../firebase';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  subscribeOrders,
  subscribeProducts,
  updateOrderStatus,
  saveProductToFirestore,
  deleteProductFromFirestore,
  checkIsAdmin,
  addAdminUser,
  fetchAllAdmins,
  seedInitialProductsIfEmpty,
  ADMIN_EMAILS,
  ADMIN_EMAIL_PRIMARY
} from '../services/firebaseService';
import { Product, Order, OrderStatus, AdminUser } from '../types';
import { ALL_PRODUCTS } from '../data/products';
import { PanchuLogo } from './PanchuLogo';
import { AuthCloudBackground } from './AuthCloudBackground';
import { purgeAdminFromStorage } from '../services/customerStorage';

// Admin Components
import { AdminSidebar, AdminTab } from './admin/AdminSidebar';
import { AdminTopHeader } from './admin/AdminTopHeader';
import { OrderHistoryTable, OrderSubTab } from './admin/OrderHistoryTable';
import { OrderSummaryView } from './admin/OrderSummaryView';
import { OrderDetailsDrawer } from './admin/OrderDetailsDrawer';
import { OffersView } from './admin/OffersView';
import { StockView } from './admin/StockView';
import { ProductEditorView } from './admin/ProductEditorView';
import { BannersView } from './admin/BannersView';
import { PaymentsView } from './admin/PaymentsView';
import { optimizeImageForDurableStore } from '../utils/imageOptimizer';

import {
  Shield,
  ShoppingBag,
  Package,
  Users,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  CheckCircle2,
  ExternalLink,
  Search,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  Database,
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  Check,
  Menu
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToStore?: () => void;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore,
  onBack,
  theme = 'light'
}) => {
  const handleBack = () => {
    if (onBackToStore) {
      onBackToStore();
    } else if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');

  // Active Tab & Subtab
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTab>('all');

  // Realtime Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Top Controls & Toggles
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [productSaveError, setProductSaveError] = useState<string>('');

  // Admin Invite & Sync State
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [isAddingAdmin, setIsAddingAdmin] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Admin Login Inputs
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Listener
  useEffect(() => {
    purgeAdminFromStorage();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthLoading(true);
        const adminStatus = await checkIsAdmin(user);
        setIsAdmin(adminStatus);
        purgeAdminFromStorage();
        setAuthLoading(false);
      } else {
        setIsAdmin(false);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Realtime Subscriptions (when authenticated)
  useEffect(() => {
    if (!isAdmin) return;

    const unsubOrders = subscribeOrders((data) => {
      setOrders(data);
    });

    const unsubProducts = subscribeProducts((data) => {
      setProducts(data);
      if (data.length === 0) {
        seedInitialProductsIfEmpty(ALL_PRODUCTS).catch(console.warn);
      }
    }, true);

    loadAdmins();

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, [isAdmin]);

  const loadAdmins = async () => {
    const list = await fetchAllAdmins();
    setAdminsList(list);
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      if (credential?.user) {
        const adminStatus = await checkIsAdmin(credential.user);
        if (!adminStatus) {
          setAuthError(`Access denied: "${credential.user.email}" is not authorized as an admin.`);
        }
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetSuccessMsg('');
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail || !adminPassword) {
      setAuthError('Please enter both admin email and password.');
      return;
    }
    setIsEmailSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, adminPassword);
      if (credential?.user) {
        const adminStatus = await checkIsAdmin(credential.user);
        if (!adminStatus) {
          setAuthError(`Access denied: "${cleanEmail}" is not in admin_users.`);
        }
      }
    } catch (err: any) {
      console.error('Firebase Email Login Error:', err);
      setAuthError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleSendResetEmail = async () => {
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('Please enter admin email address.');
      return;
    }
    setIsResettingPassword(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccessMsg(`Password reset link sent to ${cleanEmail}.`);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send reset email.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Product Edit Handlers
  const handleOpenProductModal = (product?: Product) => {
    setProductSaveError('');
    setNewImageFiles([]);
    setImagePreviewUrls([]);
    if (product) {
      setEditingProduct({ ...product });
    } else {
      setEditingProduct({
        name: '',
        subtitle: 'PANCHU SIGNATURE DROP 2026',
        price: 1500,
        MRP: 1800,
        originalPrice: 1800,
        description: 'Heavyweight premium custom combed cotton oversize streetwear silhouette.',
        category: 'TEES',
        collection: 'ESSENTIALS',
        gender: 'unisex',
        image: 'https://i.ibb.co/pvDTJ7j4/snaptik-app-7647506153697447189-slide-1.jpg',
        images: ['https://i.ibb.co/pvDTJ7j4/snaptik-app-7647506153697447189-slide-1.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 10, M: 15, L: 15, XL: 8 },
        active: true,
        inStock: true
      });
    }
    setIsProductModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewImageFiles((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file as Blob));
      setImagePreviewUrls((prev) => [...prev, ...previews]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name?.trim()) {
      setProductSaveError('Product title is required');
      return;
    }
    setIsSavingProduct(true);
    try {
      await saveProductToFirestore(editingProduct, newImageFiles);
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      setProductSaveError(err.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (window.confirm(`Permanently delete "${name}" from Firebase?`)) {
      try {
        await deleteProductFromFirestore(productId);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;
    setIsAddingAdmin(true);
    try {
      await addAdminUser(newAdminEmail.trim());
      setNewAdminEmail('');
      await loadAdmins();
      alert(`Admin role granted to ${newAdminEmail}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleSyncInitialProducts = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const count = await seedInitialProductsIfEmpty(ALL_PRODUCTS);
      setSyncMessage(count > 0 ? `Seeded ${count} items into Firebase.` : `Database already has ${products.length} products.`);
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Diagnostic Utility: Logs full Firebase App & Storage configuration
   * Identifies mismatches, missing properties, auth state, or bucket misconfigurations.
   */
  const logFirebaseAppDiagnostics = (context: string = 'general') => {
    const appOptions = app?.options || {};
    const storageOptions = storage?.app?.options || {};
    const authUser = auth?.currentUser;

    const diagnostics = {
      context,
      timestamp: new Date().toISOString(),
      firebaseApp: {
        name: app?.name || '[DEFAULT]',
        projectId: appOptions.projectId || 'NOT_SET',
        storageBucket: appOptions.storageBucket || 'NOT_SET',
        authDomain: appOptions.authDomain || 'NOT_SET',
        appId: appOptions.appId || 'NOT_SET',
        databaseURL: appOptions.databaseURL || 'NOT_SET',
        apiKeyPresent: Boolean(appOptions.apiKey)
      },
      storageInstance: {
        bucketFromApp: storageOptions.storageBucket || 'NOT_SET',
        maxUploadRetryTime: storage?.maxUploadRetryTime ?? 'default',
        maxOperationRetryTime: storage?.maxOperationRetryTime ?? 'default'
      },
      authContext: {
        isSignedIn: Boolean(authUser),
        uid: authUser?.uid || 'anonymous',
        email: authUser?.email || 'unauthenticated',
        isEmailVerified: authUser?.emailVerified ?? false,
        isAdminUser: isAdmin ?? false
      },
      configurationChecks: {
        hasProjectId: Boolean(appOptions.projectId),
        hasStorageBucket: Boolean(appOptions.storageBucket),
        bucketFormatValid: Boolean(
          appOptions.storageBucket &&
          (appOptions.storageBucket.endsWith('.firebasestorage.app') ||
           appOptions.storageBucket.endsWith('.appspot.com') ||
           appOptions.storageBucket.startsWith('gs://'))
        ),
        projectIdMatchesBucketPrefix: Boolean(
          appOptions.projectId &&
          appOptions.storageBucket &&
          appOptions.storageBucket.includes(appOptions.projectId)
        )
      }
    };

    console.group(`[Firebase Diagnostic Audit: ${context.toUpperCase()}]`);
    console.log('Firebase Configuration & Storage Health Check:', diagnostics);
    if (!diagnostics.configurationChecks.hasStorageBucket) {
      console.error('[Firebase Diagnostic Warning] storageBucket is missing from app.options!');
    }
    if (!diagnostics.configurationChecks.bucketFormatValid) {
      console.warn('[Firebase Diagnostic Warning] storageBucket format may be unexpected:', appOptions.storageBucket);
    }
    if (!diagnostics.authContext.isSignedIn) {
      console.warn('[Firebase Diagnostic Warning] No active Firebase authenticated user detected.');
    }
    console.groupEnd();

    return diagnostics;
  };

  // Run initial diagnostic check when admin state mounts
  useEffect(() => {
    logFirebaseAppDiagnostics('Admin Dashboard Mount');
  }, []);

  /**
   * Diagnostic Banner Upload Pipeline with Explicit Stage Logging & Error Diagnostics
   * Covers all stages: File Selection, Storage Path Prep, uploadBytesResumable, Error Catching,
   * Download URL Retrieval, and Firestore Update.
   */
  const handleBannerUploadWithDiagnostics = async (
    file: File,
    gender: 'male' | 'female',
    onProgress?: (progress: {
      stage: 'checking' | 'uploading' | 'getting-url' | 'saving-firestore' | 'cleaning-old' | 'done';
      percent: number;
      message: string;
      bytesTransferred?: number;
      totalBytes?: number;
    }) => void
  ): Promise<string> => {
    // Audit full Firebase App & Storage config before executing upload
    logFirebaseAppDiagnostics(`Banner Upload: ${gender}`);
    // STAGE 1: File Selection with dimensions inspection
    let imageDimensions: { width: number; height: number } | null = null;
    try {
      imageDimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        const testImg = new Image();
        const objUrl = URL.createObjectURL(file);
        testImg.onload = () => {
          const dims = { width: testImg.naturalWidth, height: testImg.naturalHeight };
          URL.revokeObjectURL(objUrl);
          resolve(dims);
        };
        testImg.onerror = () => {
          URL.revokeObjectURL(objUrl);
          resolve({ width: 0, height: 0 });
        };
        testImg.src = objUrl;
      });
    } catch {}

    console.log('[Banner Upload Stage 1: File Selection]', {
      gender,
      fileName: file?.name,
      fileSize: file?.size,
      fileSizeFormatted: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
      fileType: file?.type,
      dimensions: imageDimensions ? `${imageDimensions.width}x${imageDimensions.height}` : 'unknown',
      lastModified: file?.lastModified,
      lastModifiedISO: file ? new Date(file.lastModified).toISOString() : null,
      timestamp: new Date().toISOString()
    });

    if (!file) {
      const err = new Error('Stage 1 Error: No file was selected for upload.');
      console.error('[Banner Upload Stage 1: File Selection Failed]', err);
      throw err;
    }

    if (!file.type.startsWith('image/')) {
      const err = new Error(`Stage 1 Error: Selected file type "${file.type}" is not a recognized image format.`);
      console.error('[Banner Upload Stage 1: Invalid File Type]', err);
      throw err;
    }

    onProgress?.({
      stage: 'checking',
      percent: 5,
      message: `Selected ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB). Preparing Storage...`,
      bytesTransferred: 0,
      totalBytes: file.size
    });

    // STAGE 2: Storage Path Preparation
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `banners/${gender}_hero_${timestamp}_${cleanName}`;
    const storageBucket = storage.app.options.storageBucket || 'gen-lang-client-0600433059.firebasestorage.app';
    const projectId = storage.app.options.projectId || 'ai-studio-offwhiteparadise-e79d13d5-a99b-4d72-81cd-5942898df393';

    console.log('[Banner Upload Stage 2: Storage Path Preparation]', {
      gender,
      cleanFileName: cleanName,
      storagePath,
      storageBucket,
      projectId,
      currentUserUid: auth.currentUser?.uid || 'anonymous',
      currentUserEmail: auth.currentUser?.email || 'unauthenticated',
      timestamp
    });

    // Check existing banner to cleanup after successful replacement
    let oldStoragePath: string | undefined;
    try {
      const currentDocSnap = await getDoc(doc(db, 'banners', gender));
      if (currentDocSnap.exists()) {
        const currentData = currentDocSnap.data();
        oldStoragePath = currentData?.storagePath;
        console.log('[Banner Upload Stage 2: Previous Banner Path Located]', {
          oldStoragePath,
          gender
        });
      }
    } catch (checkErr) {
      console.warn('[Banner Upload Stage 2: Previous Banner Check Non-fatal]', checkErr);
    }

    onProgress?.({
      stage: 'uploading',
      percent: 10,
      message: 'Connecting to Firebase Storage...',
      bytesTransferred: 0,
      totalBytes: file.size
    });

    // STAGE 3: Direct Upload Execution with Immediate Error Detection & Dual Cloud Sync
    console.log('[Banner Upload Stage 3: Direct Upload Execution]', {
      targetPath: storagePath,
      bucket: storageBucket,
      contentType: file.type || 'image/jpeg',
      fileSize: file.size,
      fileSizeMB: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });

    onProgress?.({
      stage: 'uploading',
      percent: 25,
      message: `Uploading to Firebase Storage (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`,
      bytesTransferred: 0,
      totalBytes: file.size
    });

    const storageRef = ref(storage, storagePath);
    let downloadUrl = '';

    const metadata = {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
      customMetadata: {
        gender,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploaderUid: auth.currentUser?.uid || 'admin',
        uploaderEmail: auth.currentUser?.email || 'young829229@gmail.com'
      }
    };

    let storageSucceeded = false;

    try {
      // Direct binary transfer via uploadBytes
      const uploadResult = await uploadBytes(storageRef, file, metadata);
      console.log('[Banner Upload Stage 3: Firebase Storage Direct Transfer Succeeded]', uploadResult.metadata);
      
      onProgress?.({
        stage: 'getting-url',
        percent: 80,
        message: 'Retrieving permanent Firebase Storage download URL...',
        bytesTransferred: file.size,
        totalBytes: file.size
      });

      downloadUrl = await getDownloadURL(uploadResult.ref);
      storageSucceeded = true;
      console.log('[Banner Upload Stage 5: Download URL Retrieved]', { downloadUrl });
    } catch (storageError: any) {
      console.warn('[Banner Upload Storage Notice] Direct Firebase Storage upload notice:', {
        errorCode: storageError?.code,
        errorMessage: storageError?.message,
        bucket: storageBucket,
        path: storagePath
      });

      // If bucket is not provisioned (404/bucket-not-found) or network timeout, provide high-fidelity Firestore storage
      onProgress?.({
        stage: 'uploading',
        percent: 65,
        message: 'Encoding high-definition banner for Cloud Firestore persistence...',
        bytesTransferred: file.size,
        totalBytes: file.size
      });

      try {
        const optimized = await optimizeImageForDurableStore(file, 1920, 1080, 0.88);
        downloadUrl = optimized.dataUrl;
        console.log('[Banner Upload Optimized for Firestore Direct Persistence]', {
          originalSizeBytes: file.size,
          optimizedSizeBytes: optimized.sizeBytes,
          dimensions: `${optimized.width}x${optimized.height}`
        });
      } catch (optErr) {
        console.error('[Banner Upload Optimization Error]', optErr);
        throw storageError;
      }
    }

    try {
      // STAGE 6: Firestore Document Update
      console.log('[Banner Upload Stage 6: Firestore Document Update] Committing banner record to Firestore...', {
        collection: 'banners',
        documentId: gender,
        storagePath: storageSucceeded ? storagePath : 'firestore-durable-store'
      });

      onProgress?.({
        stage: 'saving-firestore',
        percent: 90,
        message: 'Updating Cloud Firestore document and syncing live storefront...',
        bytesTransferred: file.size,
        totalBytes: file.size
      });

      const bannerDocRef = doc(db, 'banners', gender);
      const bannerPayload = {
        id: gender,
        gender,
        imageUrl: downloadUrl,
        storagePath: storageSucceeded ? storagePath : 'firestore-durable-store',
        originalFileName: file.name,
        fileSizeBytes: file.size,
        title: `${gender === 'male' ? 'Male' : 'Female'} Hero Campaign Banner`,
        active: true,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin'
      };

      await setDoc(bannerDocRef, bannerPayload, { merge: true });

      console.log('[Banner Upload Stage 6: Firestore Document Update] Firestore document successfully updated and verified!', {
        documentId: gender
      });

      // Clean up previous storage file if different and storage succeeded
      if (storageSucceeded && oldStoragePath && oldStoragePath !== storagePath && oldStoragePath !== 'firestore-durable-store') {
        deleteObject(ref(storage, oldStoragePath)).catch((cleanupErr) => {
          console.warn('[Banner Upload Storage Cleanup Non-fatal]', cleanupErr);
        });
      }

      onProgress?.({
        stage: 'done',
        percent: 100,
        message: storageSucceeded
          ? 'Banner uploaded to Firebase Storage and synchronized live!'
          : 'Banner synchronized live to Cloud Firestore! (Storage bucket unprovisioned)',
        bytesTransferred: file.size,
        totalBytes: file.size
      });

      return downloadUrl;
    } catch (pipelineError: any) {
      // STAGE 4: Error Catching (Full pipeline catch block)
      console.error('[Banner Upload Stage 4: Error Catch Block] Full Firebase Error Object Caught in Pipeline:', {
        errorName: pipelineError?.name,
        errorMessage: pipelineError?.message,
        errorCode: pipelineError?.code || pipelineError?.firebaseCode,
        serverResponse: pipelineError?.serverResponse || pipelineError?.rawFirebaseError?.serverResponse,
        customData: pipelineError?.customData,
        stack: pipelineError?.stack,
        fullErrorObject: pipelineError?.rawFirebaseError || pipelineError,
        targetBucket: storageBucket,
        targetPath: storagePath
      });

      let descriptiveMessage = pipelineError?.message || 'Storage upload failed.';
      if (pipelineError?.code === 'storage/unauthorized') {
        descriptiveMessage = `Firebase Permission Denied: Storage security rules rejected write to bucket "${storageBucket}". Ensure admin authentication or storage write rules allow "banners/".`;
      } else if (pipelineError?.code === 'storage/bucket-not-found' || pipelineError?.code === 'storage/project-not-found') {
        descriptiveMessage = `Firebase Storage Bucket Not Found: Bucket "${storageBucket}" does not exist or is disabled in Firebase Console.`;
      } else if (pipelineError?.code === 'storage/canceled') {
        descriptiveMessage = 'Firebase Storage upload was canceled.';
      } else if (pipelineError?.code === 'storage/quota-exceeded') {
        descriptiveMessage = 'Firebase Storage quota exceeded for this project.';
      } else if (pipelineError?.code === 'storage/retry-limit-exceeded') {
        descriptiveMessage = 'Firebase Storage upload failed due to network retry limit exceeded. Please check your internet connection.';
      }

      const structuredErr = new Error(`Firebase Storage Error [${pipelineError?.code || 'UNKNOWN'}]: ${descriptiveMessage}`);
      (structuredErr as any).rawFirebaseError = pipelineError;
      (structuredErr as any).firebaseCode = pipelineError?.code;
      throw structuredErr;
    }
  };

  // Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f3f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl shadow-md">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff4d4f]" />
          <p className="text-xs font-sans text-stone-500 font-medium">Verifying Admin Permissions...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Gate
  if (!currentUser || !isAdmin) {
    return (
      <AuthCloudBackground>
        <button
          onClick={handleBack}
          type="button"
          className="fixed top-6 right-6 z-50 px-4 py-2 rounded-full bg-white text-stone-700 border border-stone-200 shadow-sm text-xs font-sans font-medium flex items-center gap-2 transition-all cursor-pointer hover:bg-stone-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store</span>
        </button>

        <div className="relative z-10 w-full max-w-[400px] rounded-[32px] p-7 sm:p-9 bg-white/95 backdrop-blur-2xl border border-stone-200/80 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold font-sans text-stone-900">Admin Sign In</h1>
            <p className="text-xs text-stone-500 font-sans mt-1">Authorized Owner Access Only</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-700 text-xs font-sans">
              {authError}
            </div>
          )}

          {resetSuccessMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-sans">
              {resetSuccessMsg}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="flex items-center bg-[#f4f5f7] rounded-2xl px-4 py-3 border border-transparent focus-within:border-red-400 focus-within:bg-white">
              <Mail className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-transparent text-xs sm:text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center bg-[#f4f5f7] rounded-2xl px-4 py-3 border border-transparent focus-within:border-red-400 focus-within:bg-white">
              <Lock className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
              <input
                type={showAdminPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-transparent text-xs sm:text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none pr-2"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="text-stone-400 hover:text-stone-600"
              >
                {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isResettingPassword}
                className="text-[11px] text-stone-500 hover:text-[#ff4d4f]"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isEmailSubmitting}
              className="w-full py-3.5 bg-[#18181b] hover:bg-black text-white text-xs sm:text-sm font-medium rounded-2xl cursor-pointer transition-all shadow-sm"
            >
              {isEmailSubmitting ? 'Verifying...' : 'Sign In as Owner'}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-sans uppercase">or</span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer text-xs sm:text-sm font-medium"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </AuthCloudBackground>
    );
  }

  // Full-Screen Dedicated Product Editor Page
  if (editingProduct) {
    return (
      <ProductEditorView
        product={editingProduct}
        isNew={!editingProduct.id}
        onSave={async (updatedProductData, newFiles) => {
          setIsSavingProduct(true);
          setProductSaveError('');
          try {
            await saveProductToFirestore(updatedProductData, newFiles);
            setEditingProduct(null);
          } catch (err: any) {
            setProductSaveError(err.message || 'Failed to save product');
            throw err;
          } finally {
            setIsSavingProduct(false);
          }
        }}
        onDelete={handleDeleteProduct}
        onBack={() => {
          setEditingProduct(null);
          setProductSaveError('');
        }}
        isSaving={isSavingProduct}
        errorMessage={productSaveError}
      />
    );
  }

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans antialiased text-stone-900 overflow-x-hidden">
      
      {/* Mobile Header Bar with Panchu Logo and Store link */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white sticky top-0 z-30">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <PanchuLogo size="sm" />
          <span className="text-[10px] font-montserrat font-bold text-stone-400 uppercase tracking-widest">
            Admin
          </span>
        </div>
        <button
          onClick={handleBack}
          className="text-xs text-red-600 font-semibold px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
        >
          Store →
        </button>
      </div>

      {/* Full-height Sidebar with Panchu Logo */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-0 z-40 inset-y-0 left-0 bg-white shadow-xl md:shadow-none h-screen`}>
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'orders' || tab === 'order_history') {
              setOrderSubTab('all');
            }
          }}
          pendingCount={pendingCount}
          productsCount={products.length}
          onBackToStore={handleBack}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Full-Width Content Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-white md:bg-[#fafafa] min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
          
          {/* Top Search & Controls Bar */}
          <AdminTopHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            adminName={currentUser?.displayName || 'Admin'}
            adminEmail={currentUser?.email || ADMIN_EMAIL_PRIMARY}
            onSignOut={handleLogout}
            recentOrders={orders}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
          />

          {/* Dynamic Content Views */}
          <div className="mt-6 flex-1">
            
            {/* VIEW 1: ORDERS (Primary View) */}
            {(activeTab === 'orders' || activeTab === 'order_history') && (
              <>
                {orderSubTab === 'summary' ? (
                  <OrderSummaryView
                    orders={orders}
                    onBackToAll={() => setOrderSubTab('all')}
                  />
                ) : (
                  <OrderHistoryTable
                    orders={orders}
                    searchQuery={searchQuery}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onSelectOrder={(ord) => setSelectedOrder(ord)}
                    currentSubTab={orderSubTab}
                    onChangeSubTab={setOrderSubTab}
                  />
                )}
              </>
            )}

            {/* VIEW 2: OFFERS */}
            {activeTab === 'offers' && <OffersView />}

            {/* VIEW 4: PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
                      Product Catalog ({products.length})
                    </h1>
                    <p className="text-xs text-stone-500 font-sans mt-0.5">
                      Manage collections, price overrides, product descriptions, and image galleries in Firestore.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenProductModal()}
                    className="px-4 py-2.5 rounded-2xl bg-[#ff4d4f] hover:bg-[#e04345] text-white text-xs font-semibold font-sans flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product) => {
                      const totalStock = Object.values(product.stock || {}).reduce<number>((a, b) => a + Number(b || 0), 0);

                      return (
                        <div
                          key={product.id}
                          className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="relative aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <ImageIcon className="w-8 h-8" />
                                </div>
                              )}
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 text-[9px] font-mono font-bold text-stone-800 shadow-2xs">
                                {totalStock} in Stock
                              </span>
                            </div>

                            <div>
                              <h3 className="text-xs font-bold text-stone-900 font-sans uppercase truncate">
                                {product.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-[#ff4d4f] font-mono">
                                  Rs {product.price}
                                </span>
                                {(product.MRP || product.originalPrice) && (
                                  <span className="text-xs text-stone-400 line-through font-mono">
                                    Rs {product.MRP || product.originalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleOpenProductModal(product)}
                              className="flex-1 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-1.5 rounded-xl border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* VIEW 5: BANNERS & HERO */}
            {activeTab === 'banners' && (
              <BannersView uploadBannerHandler={handleBannerUploadWithDiagnostics} />
            )}

            {/* VIEW 6: STOCK */}
            {activeTab === 'stock' && (
              <StockView
                products={products}
                onOpenProductModal={(p) => handleOpenProductModal(p)}
              />
            )}

            {/* VIEW 7: PAYMENT SETTINGS */}
            {activeTab === 'payments' && <PaymentsView />}

            {/* VIEW 8: SETTINGS & ADMINS */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-6 pt-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
                    Store Settings & Admin Access
                  </h1>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">
                    Configure authorized administrators and synchronize Firestore catalog items.
                  </p>
                </div>

                {/* Grant Admin */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase text-stone-900">Grant Admin Role</h3>
                  <form onSubmit={handleAddAdmin} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="admin-email@gmail.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-sans focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isAddingAdmin}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-medium"
                    >
                      {isAddingAdmin ? 'Adding...' : 'Add Admin'}
                    </button>
                  </form>
                </div>

                {/* Active Admins List */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase text-stone-900">Active Super Admins</h3>
                  <div className="space-y-2 text-xs font-sans">
                    {ADMIN_EMAILS.map((admEmail) => (
                      <div key={admEmail} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 text-red-700 font-medium">
                        <span>{admEmail}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">SUPER ADMIN</span>
                      </div>
                    ))}
                    {adminsList
                      .filter((adm) => !ADMIN_EMAILS.some((e) => e.toLowerCase() === (adm.email || '').toLowerCase()))
                      .map((adm) => (
                        <div key={adm.uid} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-stone-800">
                          <span>{adm.email}</span>
                          <span className="text-[10px] text-stone-500 font-medium">ADMIN</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sync Products */}
                <div className="p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase text-stone-900">Firebase Data Sync</h3>
                  {syncMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono">
                      {syncMessage}
                    </div>
                  )}
                  <button
                    onClick={handleSyncInitialProducts}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Seed Initial Products If Empty</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* MODAL 1: ORDER DETAILS DRAWER */}
      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
      />

    </div>
  );
};
