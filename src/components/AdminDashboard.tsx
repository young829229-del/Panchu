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
import {
  auth,
  googleProvider
} from '../firebase';
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
  ADMIN_EMAIL_PRIMARY
} from '../services/firebaseService';
import {
  connectGmail,
  disconnectGmail,
  getGmailAccessToken,
  getConnectedGmailEmail,
  setGmailAccessToken,
  sendGmailEmail,
  fetchRecentGmailMessages,
  buildOrderEmailHtml,
  GmailMessageSummary
} from '../services/gmailService';
import { Product, Order, OrderStatus, AdminUser } from '../types';
import { ALL_PRODUCTS } from '../data/products';
import { PanchuLogo } from './PanchuLogo';
import { AuthCloudBackground } from './AuthCloudBackground';
import { purgeAdminFromStorage } from '../services/customerStorage';
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
  Mail,
  Lock,
  Eye,
  EyeOff,
  Send,
  Inbox,
  RefreshCw,
  FileText,
  Check,
  MailCheck,
  MessageSquare
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

  const isDark = theme === 'dark';

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'admins' | 'gmail' | 'system'>('orders');

  // Realtime Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);

  // Gmail Integration State
  const [isGmailConnected, setIsGmailConnected] = useState<boolean>(!!getGmailAccessToken());
  const [gmailConnectedEmail, setGmailConnectedEmail] = useState<string>(getConnectedGmailEmail() || '');
  const [isConnectingGmail, setIsConnectingGmail] = useState<boolean>(false);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingGmailMessages, setIsLoadingGmailMessages] = useState<boolean>(false);
  const [gmailQuery, setGmailQuery] = useState<string>('');

  // Email Composer & Confirmation Modal State
  const [emailModalOrder, setEmailModalOrder] = useState<Order | null>(null);
  const [emailModalType, setEmailModalType] = useState<'confirmation' | 'shipped' | 'delivered' | 'cancelled' | 'custom'>('confirmation');
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBodyText, setEmailBodyText] = useState<string>('');
  const [emailBodyHtml, setEmailBodyHtml] = useState<string>('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSendStatus, setEmailSendStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState<boolean>(false);

  // Search & Filters
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState<string>('');

  // Product Edit / Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [productSaveError, setProductSaveError] = useState<string>('');

  // Admin Invite State
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [isAddingAdmin, setIsAddingAdmin] = useState<boolean>(false);

  // System Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Admin Email Login Fallback
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth listener
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

  // Realtime Data Subscriptions (active when authenticated as admin)
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
      const googleCred = GoogleAuthProvider.credentialFromResult(credential);
      if (googleCred?.accessToken) {
        setGmailAccessToken(googleCred.accessToken, credential.user?.email);
        setIsGmailConnected(true);
        setGmailConnectedEmail(credential.user?.email || '');
      }
      if (credential?.user) {
        const adminStatus = await checkIsAdmin(credential.user);
        if (!adminStatus) {
          setAuthError(`Access denied: "${credential.user.email}" is not listed in the authorized admin_users collection.`);
        }
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const code = err?.code;
      const msg = err?.message || 'Failed to sign in with Google';
      if (code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setAuthError('Google Sign-in is disabled in Firebase Console. Go to Build > Authentication > Sign-in method, click Google, and enable it.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setAuthError(`Domain "${window.location.hostname}" is not authorized in Firebase Console > Authentication > Settings > Authorized domains. You can also sign in with email and password below.`);
      } else if (code === 'auth/the-service-is-currently-unavailable' || msg.includes('unavailable')) {
        setAuthError('Authentication service is temporarily unavailable. Please retry in a moment.');
      } else {
        setAuthError(msg);
      }
    }
  };

  // Gmail Handlers
  const handleConnectGmailAction = async () => {
    setIsConnectingGmail(true);
    setAuthError('');
    try {
      const res = await connectGmail();
      setIsGmailConnected(true);
      setGmailConnectedEmail(res.email);
      await handleLoadGmailInbox();
    } catch (err: any) {
      console.error('Gmail connect error:', err);
      setAuthError(err?.message || 'Failed to connect Gmail account.');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmailAction = () => {
    disconnectGmail();
    setIsGmailConnected(false);
    setGmailConnectedEmail('');
    setGmailMessages([]);
  };

  const handleLoadGmailInbox = async () => {
    if (!getGmailAccessToken()) return;
    setIsLoadingGmailMessages(true);
    try {
      const msgs = await fetchRecentGmailMessages(gmailQuery, 10);
      setGmailMessages(msgs);
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
    } finally {
      setIsLoadingGmailMessages(false);
    }
  };

  const handleOpenOrderEmailModal = (order: Order, type: 'confirmation' | 'shipped' | 'delivered' | 'cancelled' = 'confirmation') => {
    setEmailModalOrder(order);
    setEmailModalType(type);
    setEmailRecipient(order.customerEmail || '');
    
    const { subject, html, text } = buildOrderEmailHtml(order, type);
    setEmailSubject(subject);
    setEmailBodyHtml(html);
    setEmailBodyText(text);
    setEmailSendStatus(null);
    setIsEmailModalOpen(true);
  };

  const handleOpenCustomEmailModal = (defaultRecipient = '') => {
    setEmailModalOrder(null);
    setEmailModalType('custom');
    setEmailRecipient(defaultRecipient);
    setEmailSubject('PANCHU — Order & Customer Update');
    setEmailBodyHtml('');
    setEmailBodyText(`Hi ${defaultRecipient ? 'Valued Customer' : 'there'},\n\nThank you for choosing PANCHU.\n\nBest regards,\nPANCHU Support Team`);
    setEmailSendStatus(null);
    setIsEmailModalOpen(true);
  };

  const handleEmailTypeChange = (type: 'confirmation' | 'shipped' | 'delivered' | 'cancelled' | 'custom') => {
    setEmailModalType(type);
    if (emailModalOrder && type !== 'custom') {
      const { subject, html, text } = buildOrderEmailHtml(emailModalOrder, type);
      setEmailSubject(subject);
      setEmailBodyHtml(html);
      setEmailBodyText(text);
    }
  };

  const handleInitiateSendEmail = () => {
    if (!emailRecipient.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }
    if (!emailSubject.trim()) {
      alert('Please enter an email subject.');
      return;
    }
    if (!getGmailAccessToken()) {
      alert('Gmail is not connected. Please connect your Gmail account first.');
      return;
    }
    setShowConfirmSendModal(true);
  };

  const handleConfirmAndSendEmail = async () => {
    setShowConfirmSendModal(false);
    setIsSendingEmail(true);
    setEmailSendStatus(null);

    try {
      await sendGmailEmail({
        to: emailRecipient.trim(),
        subject: emailSubject.trim(),
        bodyText: emailBodyText,
        bodyHtml: emailBodyHtml || undefined
      });
      setEmailSendStatus({ success: true, msg: `Email sent successfully to ${emailRecipient.trim()}` });
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSendStatus(null);
      }, 2000);
    } catch (err: any) {
      console.error('Email send error:', err);
      setEmailSendStatus({ success: false, msg: err?.message || 'Failed to send email via Gmail API' });
    } finally {
      setIsSendingEmail(false);
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
          setAuthError(`Access denied: "${cleanEmail}" is not listed in the authorized admin_users collection.`);
        }
      }
    } catch (err: any) {
      console.error('Firebase Email Login Error:', err);
      const code = err?.code;
      const rawMsg = err?.message || '';

      if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
        setAuthError('Email/Password provider is disabled in Firebase Console. Go to Build > Authentication > Sign-in method, click Email/Password, and enable it.');
      } else if (code === 'auth/invalid-credential') {
        setAuthError('Invalid credentials. The email or password entered does not match Firebase Authentication.');
      } else if (code === 'auth/wrong-password') {
        setAuthError('Incorrect password for this account in Firebase Authentication.');
      } else if (code === 'auth/user-not-found') {
        setAuthError('No user account found with this email in Firebase Authentication.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('The email address format is invalid.');
      } else if (code === 'auth/user-disabled') {
        setAuthError('This user account has been disabled in Firebase Authentication.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Access to this account has been temporarily disabled. Please reset your password or try again later.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Network error connecting to Firebase. Please check your connection.');
      } else if (code === 'auth/the-service-is-currently-unavailable' || rawMsg.includes('unavailable')) {
        setAuthError('Firebase Authentication service is temporarily unavailable. Please retry in a moment.');
      } else {
        setAuthError(rawMsg || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleSendResetEmail = async () => {
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('Please enter an admin email address to send the password reset link.');
      return;
    }
    setIsResettingPassword(true);
    setAuthError('');
    setResetSuccessMsg('');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccessMsg(`Password reset link sent to ${cleanEmail}. Please check your inbox.`);
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      setAuthError(err?.message || 'Failed to send password reset email.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCreateAdminPassword = async () => {
    if (!adminEmail.trim() || !adminPassword || adminPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsEmailSubmitting(true);
    setAuthError('');
    setResetSuccessMsg('');
    try {
      await createUserWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
      setResetSuccessMsg('Admin account registered and signed in successfully.');
    } catch (err: any) {
      console.error('Create Admin Password Error:', err);
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Use Google Sign-in or click "Forgot / Set Password" below.');
      } else {
        setAuthError(err?.message || 'Could not register admin password.');
      }
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      purgeAdminFromStorage();
      await signOut(auth);
      setIsAdmin(false);
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (e: any) {
      alert(`Could not update order status: ${e.message}`);
    }
  };

  const handleOpenProductModal = (product?: Product) => {
    setProductSaveError('');
    setNewImageFiles([]);
    setImagePreviewUrls([]);

    if (product) {
      setEditingProduct({
        ...product,
        images: product.images || (product.image ? [product.image] : []),
        stock: { ...(product.stock || { S: 10, M: 10, L: 10, XL: 10 }) }
      });
    } else {
      setEditingProduct({
        name: '',
        subtitle: '',
        price: 0,
        MRP: 0,
        originalPrice: 0,
        description: '',
        category: 'Tees',
        collection: 'Panchu Essential',
        gender: 'male',
        image: '',
        images: [],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 10, M: 10, L: 10, XL: 10 },
        active: true,
        inStock: true,
        featured: false,
        bestSelling: false,
        badge: '',
        details: ['100% High-Density Cotton', 'Oversized luxury boxy fit', 'Reinforced neckband', 'Panchu custom print'],
        composition: '100% Premium Combed Cotton',
        color: 'Onyx Black'
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

  const handleRemoveExistingImage = (idxToRemove: number) => {
    if (!editingProduct) return;
    const currentImages = editingProduct.images || [];
    const updated = currentImages.filter((_, i) => i !== idxToRemove);
    setEditingProduct({
      ...editingProduct,
      images: updated,
      image: updated[0] || ''
    });
  };

  const handleRemoveNewImage = (idxToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idxToRemove));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

  const handleStockChange = (size: string, value: number) => {
    if (!editingProduct) return;
    const stock = { ...(editingProduct.stock || {}) };
    stock[size] = Math.max(0, value);
    setEditingProduct({
      ...editingProduct,
      stock
    });
  };

  const handleAddSize = () => {
    const sizeName = prompt('Enter size label (e.g. XXL, XS, 28, 30, Free Size):');
    if (sizeName && editingProduct) {
      const cleanSize = sizeName.trim().toUpperCase();
      const sizes = editingProduct.sizes ? [...editingProduct.sizes] : [];
      if (!sizes.includes(cleanSize)) {
        sizes.push(cleanSize);
        const stock = { ...(editingProduct.stock || {}) };
        stock[cleanSize] = 10;
        setEditingProduct({
          ...editingProduct,
          sizes,
          stock
        });
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name?.trim()) {
      setProductSaveError('Product name is required');
      return;
    }

    if (!editingProduct.price || editingProduct.price <= 0) {
      setProductSaveError('Valid price is required');
      return;
    }

    setIsSavingProduct(true);
    setProductSaveError('');

    try {
      await saveProductToFirestore(editingProduct, newImageFiles);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setNewImageFiles([]);
      setImagePreviewUrls([]);
    } catch (err: any) {
      console.error('Save product error:', err);
      setProductSaveError(err.message || 'Failed to save product in Firebase');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from Firebase?`)) {
      try {
        await deleteProductFromFirestore(productId);
      } catch (err: any) {
        alert(`Error deleting product: ${err.message}`);
      }
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsAddingAdmin(true);
    try {
      await addAdminUser(newAdminEmail.trim());
      setNewAdminEmail('');
      await loadAdmins();
      alert(`Admin role granted to ${newAdminEmail}`);
    } catch (e: any) {
      alert(`Could not add admin: ${e.message}`);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleSyncInitialProducts = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const seeded = await seedInitialProductsIfEmpty(ALL_PRODUCTS);
      if (seeded > 0) {
        setSyncMessage(`Successfully seeded ${seeded} Panchu products into Firebase.`);
      } else {
        setSyncMessage(`Database already has ${products.length} products loaded.`);
      }
    } catch (e: any) {
      setSyncMessage(`Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.location?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.address.toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus =
      orderStatusFilter === 'ALL' || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;

  // Render Loading Gate
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950 text-white' : 'bg-stone-50 text-stone-900'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Checking Panchu Admin Authorization...</p>
        </div>
      </div>
    );
  }

  // Render Login Gate
  if (!currentUser || !isAdmin) {
    return (
      <AuthCloudBackground>
        {/* Back Button Top Right */}
        <button
          onClick={handleBack}
          type="button"
          className="fixed top-6 right-6 z-50 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-black border border-stone-200/80 shadow-sm text-xs font-sans font-medium flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md active:scale-95 select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
          <span>Back to Store</span>
        </button>

        {/* Centered Owner Login Card */}
        <div className="relative z-10 w-full max-w-[400px] rounded-[32px] p-7 sm:p-9 bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_24px_60px_rgba(220,38,38,0.08),0_12px_32px_rgba(0,0,0,0.05)] transition-all">
          
          {/* Top Emblem: `→]` */}
          <div className="flex justify-center mb-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-b from-stone-50 to-stone-100 border border-stone-200/80 shadow-inner flex items-center justify-center text-stone-900">
              <svg
                className="w-5 h-5 translate-x-0.5 text-stone-800"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
                <polyline points="10 16 14 12 10 8" />
                <line x1="14" y1="12" x2="4" y2="12" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold font-sans text-stone-900 tracking-tight">
              Sign in as Owner
            </h2>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200/90 text-red-700 text-xs font-sans text-left rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1">
                <span className="leading-snug block">{authError}</span>
              </div>
            </div>
          )}

          {/* Password Reset Success Message */}
          {resetSuccessMsg && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans text-left rounded-2xl flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-snug">{resetSuccessMsg}</span>
            </div>
          )}

          {/* Signed in but not admin notice */}
          {currentUser && !isAdmin && (
            <div className="p-3.5 mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-sans text-center space-y-2 rounded-2xl">
              <p className="font-mono text-[11px] truncate text-stone-700">{currentUser.email}</p>
              <p className="text-xs text-amber-700">This account is not registered as authorized administrator.</p>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {!currentUser ? (
            <div className="space-y-4">
              {/* Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                {/* Admin Email Input - Blank & Editable */}
                <div className="relative flex items-center bg-[#f4f5f7] rounded-2xl px-4 py-3 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                </div>

                {/* Admin Password Input */}
                <div className="relative flex items-center bg-[#f4f5f7] rounded-2xl px-4 py-3 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
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
                    className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5 transition-colors shrink-0"
                    tabIndex={-1}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end items-center px-1 text-xs">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isResettingPassword}
                    className="text-stone-500 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 font-sans text-[11px]"
                  >
                    {isResettingPassword && <Loader2 className="w-3 h-3 animate-spin text-red-500" />}
                    <span>Forgot password?</span>
                  </button>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isEmailSubmitting}
                  className="w-full py-3.5 bg-[#18181b] hover:bg-black text-white text-xs sm:text-sm font-medium transition-all rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] mt-2"
                >
                  {isEmailSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEmailSubmitting ? 'Verifying...' : 'Sign In as Owner'}</span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-stone-200" />
                <span className="flex-shrink mx-3 text-[11px] font-sans font-medium text-stone-400 uppercase tracking-wider">
                  or
                </span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              {/* Google Sign-In Button Below */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 hover:border-stone-300 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] group text-xs sm:text-sm font-medium"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-sans font-medium text-stone-800">
                  Sign in with Google
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </AuthCloudBackground>
    );
  }

  // Render Full Admin Dashboard
  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 text-white' : 'bg-stone-50 text-stone-900'} transition-colors duration-200`}>
      
      {/* Top Navbar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 ${
        isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white/90 border-stone-200'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <PanchuLogo size="sm" />
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 bg-red-600 text-white">
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>ORDERS</span>
            {pendingOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-extrabold rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>PRODUCTS ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`hidden md:flex px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer items-center gap-1.5 ${
              activeTab === 'admins'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ADMINS</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gmail');
              if (getGmailAccessToken() && gmailMessages.length === 0) {
                handleLoadGmailInbox();
              }
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gmail'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>GMAIL</span>
            {isGmailConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Gmail Connected" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`hidden lg:flex px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer items-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SYNC</span>
          </button>
        </div>

        {/* User Info & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] font-mono font-bold truncate max-w-[160px]">{currentUser?.email}</span>
            <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase">FIREBASE LIVE</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-stone-300 dark:border-neutral-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* KPI Top Cards (When Orders or Products active) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className={`p-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">TOTAL ORDERS</span>
            <div className="text-xl sm:text-2xl font-bold font-mono mt-1">{orders.length}</div>
          </div>
          <div className={`p-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">TOTAL REVENUE</span>
            <div className="text-xl sm:text-2xl font-bold font-mono mt-1 text-emerald-600">NPR {totalRevenue.toLocaleString()}</div>
          </div>
          <div className={`p-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">PENDING ORDERS</span>
            <div className="text-xl sm:text-2xl font-bold font-mono mt-1 text-amber-600">{pendingOrdersCount}</div>
          </div>
          <div className={`p-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">ACTIVE PRODUCTS</span>
            <div className="text-xl sm:text-2xl font-bold font-mono mt-1">{products.filter(p => p.active).length}</div>
          </div>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className={`p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'
            }`}>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by Order #, Name, Phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono focus:outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'Pending', 'Confirmed', 'Shipped', 'Delivered'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                      orderStatusFilter === status
                        ? 'bg-red-600 text-white'
                        : 'bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className={`p-12 border text-center font-mono text-xs text-stone-500 uppercase ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'
              }`}>
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const statusColors: Record<OrderStatus, string> = {
                    Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                    Confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                    Shipped: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
                    Delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  };

                  const cleanPhone = order.phone.replace(/[^0-9]/g, '');
                  const waLink = `https://wa.me/${cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`}`;

                  return (
                    <div
                      key={order.id || order.orderId}
                      className={`border p-4 sm:p-5 transition-all ${
                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-3 mb-3 border-stone-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-extrabold text-red-600">
                            {order.orderId}
                          </span>
                          <span className={`px-2.5 py-0.5 border text-[10px] font-mono font-bold uppercase rounded-sm ${statusColors[order.status] || 'text-stone-500'}`}>
                            {order.status}
                          </span>
                          {order.createdAt && (
                            <span className="text-[11px] font-mono text-stone-400">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                            </span>
                          )}
                        </div>

                        {/* Status Update Control */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-stone-500 uppercase">UPDATE STATUS:</span>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id || order.orderId, e.target.value as OrderStatus)}
                            className="px-2.5 py-1 text-xs font-mono font-bold border border-stone-300 dark:border-neutral-700 bg-transparent cursor-pointer focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-4">
                        <div>
                          <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">CUSTOMER INFO</div>
                          <div className="font-bold text-sm">{order.customerName}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-stone-600 dark:text-stone-300">
                            <span>{order.phone}</span>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-0.5 text-[10px]"
                            >
                              <ExternalLink className="w-3 h-3" /> WhatsApp
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenOrderEmailModal(order, 'confirmation')}
                              className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Send Official Panchu Email Update via Gmail"
                            >
                              <Mail className="w-3 h-3" /> Email
                            </button>
                          </div>
                          {order.customerEmail && (
                            <div className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[200px]">
                              {order.customerEmail}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">DELIVERY ADDRESS</div>
                          <div className="font-medium">{order.location}</div>
                          <div className="text-stone-500 text-[11px]">{order.address}</div>
                        </div>

                        <div className="md:text-right">
                          <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">ORDER TOTAL</div>
                          <div className="font-extrabold text-sm text-emerald-600">NPR {order.total}</div>
                          <div className="text-[10px] text-stone-500">
                            Subtotal NPR {order.subtotal} + Delivery NPR {order.deliveryFee}
                          </div>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/50 p-3 space-y-2">
                        <div className="text-[10px] font-mono font-bold text-stone-500 uppercase">ORDERED ITEMS:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-mono border border-stone-200 dark:border-neutral-800 p-2 bg-white dark:bg-neutral-900">
                              {item.image && (
                                <img src={item.image} alt={item.productName} className="w-8 h-10 object-cover shrink-0" referrerPolicy="no-referrer" />
                              )}
                              <div className="truncate">
                                <div className="font-bold truncate">{item.productName}</div>
                                <div className="text-[10px] text-stone-500">
                                  Size: <span className="font-bold text-red-600">{item.selectedSize}</span> | Qty: {item.quantity} | NPR {item.price * item.quantity}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Header / Add Product Button */}
            <div className={`p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'
            }`}>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search products by title..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono focus:outline-none bg-transparent"
                />
              </div>

              <button
                onClick={() => handleOpenProductModal()}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>ADD NEW PRODUCT</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products
                .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                .map((product) => {
                  const totalStock: number = Object.values(product.stock || {}).reduce<number>((a: number, b: unknown) => a + Number(b || 0), 0);

                  return (
                    <div
                      key={product.id}
                      className={`border p-4 flex flex-col justify-between transition-all ${
                        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Image Preview */}
                        <div className="relative aspect-[3/4] bg-stone-100 dark:bg-neutral-800 overflow-hidden border border-stone-200 dark:border-neutral-800">
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

                          {/* Badge tag */}
                          {product.badge && (
                            <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                              {product.badge}
                            </span>
                          )}

                          {/* Active / In Stock Indicator */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                              product.active ? 'bg-emerald-600 text-white' : 'bg-stone-600 text-white'
                            }`}>
                              {product.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                              totalStock > 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {totalStock > 0 ? `${totalStock} IN STOCK` : 'OUT OF STOCK'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Price */}
                        <div>
                          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                            {product.gender || 'UNISEX'} • {product.category || 'TEES'}
                          </span>
                          <h3 className="font-bold text-sm truncate font-sans uppercase mt-0.5">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 font-mono">
                            <span className="font-extrabold text-sm text-red-600">
                              NPR {product.price}
                            </span>
                            {(product.MRP || product.originalPrice) && (product.MRP || product.originalPrice)! > product.price && (
                              <span className="text-xs text-stone-400 line-through">
                                NPR {product.MRP || product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Size Stock Breakdown */}
                        <div className="border-t border-stone-200 dark:border-neutral-800 pt-2 text-[10px] font-mono">
                          <span className="text-stone-400 uppercase block mb-1">STOCK PER SIZE:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(product.stock || {}).map(([sz, qty]) => {
                              const numQty = Number(qty || 0);
                              return (
                                <span
                                  key={sz}
                                  className={`px-1.5 py-0.5 border ${
                                    numQty > 0
                                      ? 'bg-stone-50 dark:bg-neutral-800 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-neutral-700'
                                      : 'bg-red-50 dark:bg-red-950 text-red-600 border-red-200'
                                  }`}
                                >
                                  {sz}: <strong className={numQty === 0 ? 'text-red-600' : ''}>{numQty}</strong>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="border-t border-stone-200 dark:border-neutral-800 pt-3 mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenProductModal(product)}
                          className="flex-1 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-stone-200 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>EDIT</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 border border-stone-300 dark:border-neutral-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 text-stone-500 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN ACCESS */}
        {activeTab === 'admins' && (
          <div className="max-w-2xl space-y-6">
            <div className={`p-6 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
              <h2 className="text-base font-bold font-mono uppercase mb-2">GRANT ADMIN ACCESS</h2>
              <p className="text-xs font-sans text-stone-500 mb-4 leading-relaxed">
                Add an email address to allow management access to the PANCHU Firebase store. Authorized users can log in via Google Sign In.
              </p>

              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="admin-email@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black text-xs font-mono font-bold uppercase transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAddingAdmin ? 'ADDING...' : 'ADD ADMIN'}
                </button>
              </form>
            </div>

            {/* List of Admins */}
            <div className={`p-6 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
              <h3 className="text-xs font-bold font-mono uppercase text-stone-400 mb-3">CURRENT ACTIVE ADMINISTRATORS</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950">
                  <span className="font-bold text-red-600">{ADMIN_EMAIL_PRIMARY} (Primary Super Admin)</span>
                  <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white rounded">ROOT</span>
                </div>
                {adminsList.map((adm) => (
                  <div key={adm.uid} className="flex items-center justify-between p-2.5 border border-stone-200 dark:border-neutral-800">
                    <span>{adm.email}</span>
                    <span className="text-[10px] text-stone-400 uppercase">ADMIN</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GMAIL & CUSTOMER COMMUNICATIONS */}
        {activeTab === 'gmail' && (
          <div className="space-y-6">
            
            {/* Connection Status Card */}
            <div className={`p-6 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-5 h-5 text-red-600" />
                    <h2 className="text-base font-bold font-mono uppercase">GMAIL INTEGRATION & COMMUNICATIONS</h2>
                  </div>
                  <p className="text-xs font-sans text-stone-500 max-w-2xl leading-relaxed">
                    Connect your official Gmail account ({ADMIN_EMAIL_PRIMARY}) to send branded order confirmations, dispatch notices, delivery updates, and customer communications directly from the Panchu dashboard.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isGmailConnected ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-mono font-bold rounded">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>CONNECTED: {gmailConnectedEmail || ADMIN_EMAIL_PRIMARY}</span>
                      </div>
                      <button
                        onClick={handleDisconnectGmailAction}
                        className="px-3 py-1.5 border border-stone-300 dark:border-neutral-700 text-xs font-mono font-bold text-stone-500 hover:text-red-600 hover:border-red-300 cursor-pointer transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectGmailAction}
                      disabled={isConnectingGmail}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isConnectingGmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      <span>CONNECT GMAIL ACCOUNT</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="mt-6 pt-6 border-t border-stone-200 dark:border-neutral-800 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenCustomEmailModal()}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 text-xs font-mono font-bold uppercase flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>COMPOSE NEW EMAIL</span>
                </button>

                <button
                  onClick={handleLoadGmailInbox}
                  disabled={!isGmailConnected || isLoadingGmailMessages}
                  className="px-4 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono font-bold uppercase flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmailMessages ? 'animate-spin' : ''}`} />
                  <span>REFRESH INBOX</span>
                </button>
              </div>
            </div>

            {/* Quick Order Dispatch Section */}
            <div className={`p-6 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    ONE-CLICK ORDER EMAIL DISPATCHER
                  </h3>
                  <p className="text-[11px] font-sans text-stone-500">
                    Select any recorded customer order to generate and send branded HTML receipts & updates.
                  </p>
                </div>
                <span className="text-xs font-mono text-stone-400 font-bold">{orders.length} TOTAL ORDERS</span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-6 text-xs font-mono text-stone-400">
                  No orders recorded yet. Place an order on the storefront to test automated emails.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {orders.slice(0, 6).map((ord) => (
                    <div
                      key={ord.id || ord.orderId}
                      className="p-3 border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/50 text-xs font-mono space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-red-600">{ord.orderId}</span>
                        <span className="text-[10px] text-stone-500 font-bold uppercase">{ord.status}</span>
                      </div>
                      <div>
                        <div className="font-bold truncate">{ord.customerName}</div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {ord.customerEmail || 'No email provided on checkout'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleOpenOrderEmailModal(ord, 'confirmation')}
                          className="flex-1 py-1 px-2 bg-white dark:bg-neutral-900 border border-stone-300 dark:border-neutral-700 text-[10px] font-bold hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer text-center"
                        >
                          Confirmation
                        </button>
                        <button
                          onClick={() => handleOpenOrderEmailModal(ord, 'shipped')}
                          className="flex-1 py-1 px-2 bg-white dark:bg-neutral-900 border border-stone-300 dark:border-neutral-700 text-[10px] font-bold hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer text-center"
                        >
                          Shipped
                        </button>
                        <button
                          onClick={() => handleOpenOrderEmailModal(ord, 'delivered')}
                          className="flex-1 py-1 px-2 bg-white dark:bg-neutral-900 border border-stone-300 dark:border-neutral-700 text-[10px] font-bold hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer text-center"
                        >
                          Delivered
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Gmail Inbox & Messages */}
            <div className={`p-6 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-stone-500" />
                    RECENT GMAIL MESSAGES ({gmailMessages.length})
                  </h3>
                  <p className="text-[11px] font-sans text-stone-500">
                    Live inbox threads from your authorized Google Account.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search Gmail (e.g. is:unread)..."
                    value={gmailQuery}
                    onChange={(e) => setGmailQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadGmailInbox()}
                    className="px-3 py-1.5 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent w-full sm:w-64 focus:outline-none"
                  />
                  <button
                    onClick={handleLoadGmailInbox}
                    disabled={!isGmailConnected || isLoadingGmailMessages}
                    className="p-1.5 border border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-40"
                    title="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!isGmailConnected ? (
                <div className="text-center py-10 border border-dashed border-stone-300 dark:border-neutral-800 font-mono text-xs text-stone-400">
                  Gmail is not connected. Click "Connect Gmail Account" above to view and send emails.
                </div>
              ) : isLoadingGmailMessages ? (
                <div className="text-center py-10 flex items-center justify-center gap-2 font-mono text-xs text-stone-400">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                  <span>Loading recent messages from Gmail API...</span>
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-stone-300 dark:border-neutral-800 font-mono text-xs text-stone-400">
                  No recent messages found matching your query. Click "Refresh Inbox" to reload.
                </div>
              ) : (
                <div className="divide-y divide-stone-200 dark:divide-neutral-800 border border-stone-200 dark:border-neutral-800">
                  {gmailMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 sm:p-4 hover:bg-stone-50/50 dark:hover:bg-neutral-950/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-white truncate max-w-[200px]">
                            {msg.from}
                          </span>
                          <span className="text-[10px] text-stone-400">{msg.date}</span>
                        </div>
                        <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {msg.subject}
                        </div>
                        <p className="text-stone-500 text-[11px] truncate">{msg.snippet}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            // Extract email from "Name <email@domain>" format
                            const match = msg.from.match(/<([^>]+)>/);
                            const replyTo = match ? match[1] : msg.from;
                            handleOpenCustomEmailModal(replyTo);
                          }}
                          className="px-3 py-1.5 border border-stone-300 dark:border-neutral-700 text-[11px] font-mono font-bold uppercase hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-red-600" />
                          <span>REPLY</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: SYSTEM / DATABASE SYNC */}
        {activeTab === 'system' && (
          <div className="max-w-2xl space-y-6">
            <div className={`p-6 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200'}`}>
              <h2 className="text-base font-bold font-mono uppercase mb-2">FIREBASE CATALOG INITIALIZER</h2>
              <p className="text-xs font-sans text-stone-500 mb-4 leading-relaxed">
                Check database connectivity and populate Firestore with initial Panchu products if the products collection is currently empty.
              </p>

              {syncMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono rounded">
                  {syncMessage}
                </div>
              )}

              <button
                onClick={handleSyncInitialProducts}
                disabled={isSyncing}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>SEED INITIAL PRODUCTS IF EMPTY</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* EDIT / CREATE PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-3xl border shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black text-white hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b pb-3 mb-5 border-stone-200 dark:border-neutral-800">
              <span className="text-[10px] font-mono tracking-widest text-red-600 font-bold uppercase">
                {editingProduct.id ? 'EDIT PRODUCT' : 'NEW PRODUCT CREATION'}
              </span>
              <h2 className="text-xl font-bold font-sans uppercase mt-1">
                {editingProduct.name || 'Untitled Product'}
              </h2>
            </div>

            {productSaveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                {productSaveError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5">
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                    placeholder="e.g. OVERSIZED BOX TEE"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1">Subtitle / Edition</label>
                  <input
                    type="text"
                    value={editingProduct.subtitle || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                    placeholder="e.g. ESSENTIALS 2026"
                  />
                </div>
              </div>

              {/* Pricing & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1">Selling Price (NPR) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                    placeholder="1200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1">Original Price / MRP (NPR)</label>
                  <input
                    type="number"
                    value={editingProduct.MRP || editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, MRP: Number(e.target.value), originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                    placeholder="1500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1">Gender Target</label>
                  <select
                    value={editingProduct.gender || 'male'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>

              {/* Size-Specific Stock Section */}
              <div className="p-4 border border-stone-200 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-mono font-bold uppercase block">
                      SIZE-SPECIFIC STOCK INVENTORY
                    </label>
                    <span className="text-[10px] text-stone-500 font-sans">
                      Enter quantity available for each specific size.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-2.5 py-1 bg-black text-white text-[10px] font-mono font-bold uppercase hover:bg-neutral-800 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> ADD SIZE
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(editingProduct.sizes || ['S', 'M', 'L', 'XL']).map((size) => (
                    <div key={size} className="p-2 border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                      <div className="flex justify-between items-center text-xs font-mono font-bold mb-1">
                        <span>SIZE {size}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.stock?.[size] ?? 0}
                        onChange={(e) => handleStockChange(size, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload & Management */}
              <div className="p-4 border border-stone-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold uppercase block">
                    PRODUCT IMAGES (FIREBASE STORAGE)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3" /> UPLOAD IMAGE FILES
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Existing Images */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(editingProduct.images || []).map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative aspect-[3/4] border border-stone-300 dark:border-neutral-700 group overflow-hidden">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* New Upload Previews */}
                  {imagePreviewUrls.map((preview, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-[3/4] border-2 border-dashed border-red-500 group overflow-hidden">
                      <img src={preview} alt="New upload preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-red-600 text-white text-[8px] font-mono px-1">NEW</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-black text-white text-[9px] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Direct Image URL input fallback */}
                <div className="pt-2">
                  <label className="text-[10px] font-mono text-stone-400 uppercase block mb-1">
                    Or Direct Main Image URL:
                  </label>
                  <input
                    type="url"
                    value={editingProduct.image || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        image: val,
                        images: val ? [val, ...(editingProduct.images?.filter(x => x !== val) || [])] : editingProduct.images
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                  placeholder="Detailed description of cut, silhouette, weight..."
                />
              </div>

              {/* Badges & Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                    placeholder="e.g. NEW ARRIVAL, BESTSELLER"
                  />
                </div>

                <div className="flex items-center gap-4 sm:col-span-2 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={editingProduct.active !== false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <span>Active in Store</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.featured)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <span>Featured Hero</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="border-t border-stone-200 dark:border-neutral-800 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 dark:border-neutral-700 text-xs font-mono font-bold uppercase hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSavingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingProduct ? 'SAVING TO FIREBASE...' : 'SAVE PRODUCT'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EMAIL COMPOSER & TEMPLATE SENDER MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-3xl border shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <button
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black text-white hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b pb-3 mb-5 border-stone-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600" />
                <span className="text-[10px] font-mono tracking-widest text-red-600 font-bold uppercase">
                  GMAIL OFFICIAL DISPATCH
                </span>
              </div>
              <h2 className="text-xl font-bold font-sans uppercase mt-1">
                {emailModalOrder ? `Order Notification — #${emailModalOrder.orderId}` : 'Compose Official Email'}
              </h2>
            </div>

            {/* Template Selector if associated with an order */}
            {emailModalOrder && (
              <div className="mb-4">
                <label className="block text-[10px] font-mono font-bold uppercase mb-1.5 text-stone-400">
                  Select Email Template:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['confirmation', 'shipped', 'delivered', 'cancelled'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleEmailTypeChange(t)}
                      className={`px-3 py-2 text-xs font-mono font-bold uppercase border cursor-pointer transition-all ${
                        emailModalType === t
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                          : 'border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">
                  Recipient Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">
                  Email Subject Line <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                  placeholder="Subject"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase mb-1">
                  Email Body (Plain Text & HTML Preview)
                </label>
                <textarea
                  rows={6}
                  value={emailBodyText}
                  onChange={(e) => setEmailBodyText(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono bg-transparent"
                  placeholder="Write message contents..."
                />
              </div>

              {emailBodyHtml && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase mb-1 text-stone-400">
                    Live Branded HTML Preview
                  </label>
                  <div
                    className="p-4 border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 rounded max-h-48 overflow-y-auto text-xs"
                    dangerouslySetInnerHTML={{ __html: emailBodyHtml }}
                  />
                </div>
              )}

              {/* Status Message */}
              {emailSendStatus && (
                <div className={`p-3 text-xs font-mono ${
                  emailSendStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {emailSendStatus.msg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-stone-200 dark:border-neutral-800 pt-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-stone-400">
                  Sender: {gmailConnectedEmail || ADMIN_EMAIL_PRIMARY} (Gmail API)
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono font-bold uppercase hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiateSendEmail}
                    disabled={isSendingEmail}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>SEND VIA GMAIL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT CONFIRMATION MODAL BEFORE SENDING EMAIL */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`relative w-full max-w-md border shadow-2xl p-6 ${
            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider">CONFIRM EMAIL TRANSMISSION</h3>
            </div>

            <p className="text-xs font-sans text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
              You are about to dispatch an official customer email directly through Google Gmail API:
            </p>

            <div className="bg-stone-50 dark:bg-neutral-950 p-3.5 border border-stone-200 dark:border-neutral-800 font-mono text-xs space-y-1.5 mb-5">
              <div>
                <span className="text-stone-400">FROM:</span> <span className="font-bold">{gmailConnectedEmail || ADMIN_EMAIL_PRIMARY}</span>
              </div>
              <div>
                <span className="text-stone-400">TO:</span> <span className="font-bold text-red-600">{emailRecipient}</span>
              </div>
              <div className="truncate">
                <span className="text-stone-400">SUBJECT:</span> <span className="font-semibold">{emailSubject}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSendModal(false)}
                className="px-4 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-mono font-bold uppercase hover:bg-stone-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSendEmail}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>CONFIRM & DISPATCH</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
