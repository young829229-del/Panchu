import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Hero } from './components/Hero';
import { HeaderNavigation } from './components/HeaderNavigation';
import { ProductPage } from './components/ProductPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { TermsPage } from './components/TermsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerAccountPage } from './components/CustomerAccountPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Product, CartItem } from './types';
import { ALL_PRODUCTS, HERO_MALE_IMAGE, HERO_FEMALE_IMAGE } from './data/products';
import { subscribeProducts, seedInitialProductsIfEmpty } from './services/firebaseService';
import { auth } from './firebase';
import {
  CustomerProfile,
  getActiveCustomer,
  purgeAdminFromStorage
} from './services/customerStorage';

const CART_STORAGE_KEY = 'panchu_cart_items';

// Helper to extract product ID from pathname or hash URL
function getProductIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path.startsWith('/product/')) {
    const id = decodeURIComponent(path.replace('/product/', '').trim());
    if (id) return id;
  }
  const hash = window.location.hash.replace(/\/+$/, '');
  if (hash.startsWith('#/product/')) {
    const id = decodeURIComponent(hash.replace('#/product/', '').trim());
    if (id) return id;
  }
  return null;
}

function isTermsUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  return path === '/terms' || hash === '#terms' || hash.includes('contact') || hash.includes('privacy');
}

function isAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  return path === '/admin' || hash === '#admin' || hash.startsWith('#/admin') || hash.startsWith('#admin');
}

function isAccountUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  return path === '/account' || hash === '#account' || hash.startsWith('#/account') || hash.startsWith('#account');
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(ALL_PRODUCTS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerProfile | null>(() => getActiveCustomer());
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => isAdminUrl());
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(() => isTermsUrl());
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(() => isAccountUrl());

  const [activeProduct, setActiveProduct] = useState<Product | null>(() => {
    const id = getProductIdFromUrl();
    if (!id) return null;
    return ALL_PRODUCTS.find(p => p.id === id || p.id.toLowerCase() === id.toLowerCase()) || null;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const catalogRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // Subscribe to real-time Firebase products collection & auto-seed if empty
  useEffect(() => {
    // Seed initial products to Firestore if empty
    seedInitialProductsIfEmpty(ALL_PRODUCTS).catch(err => {
      console.warn('Initial product check/seed:', err);
    });

    const unsubscribe = subscribeProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update active product reference if products list refreshes
  useEffect(() => {
    if (activeProduct) {
      const updated = products.find(p => p.id === activeProduct.id);
      if (updated) {
        setActiveProduct(updated);
      }
    }
  }, [products]);

  // Global Firebase Auth state listener (strictly for Admin / Owner)
  useEffect(() => {
    purgeAdminFromStorage();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Preload full-resolution product images as soon as a product is viewed (or on load)
  useEffect(() => {
    const imagesToPreload: string[] = [];

    // Prioritize active product main and gallery images
    if (activeProduct) {
      if (activeProduct.image) imagesToPreload.push(activeProduct.image);
      if (activeProduct.additionalImages) {
        activeProduct.additionalImages.forEach(img => {
          if (img) imagesToPreload.push(img);
        });
      }
    }

    // Preload all product images to cache high-res assets in memory
    products.forEach(p => {
      if (p.image) imagesToPreload.push(p.image);
      if (p.additionalImages) {
        p.additionalImages.forEach(img => {
          if (img) imagesToPreload.push(img);
        });
      }
    });

    // Execute preloading using HTMLImageElement
    imagesToPreload.forEach(src => {
      if (src && !preloadedImagesRef.current.has(src)) {
        preloadedImagesRef.current.add(src);
        const img = new Image();
        img.src = src;
      }
    });
  }, [activeProduct, products]);

  // Sync cart items to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const prevActiveProductRef = useRef<Product | null>(activeProduct);

  // Set manual scroll restoration to prevent browser from auto-jumping on popstate
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Synchronous scroll positioning before paint
  useLayoutEffect(() => {
    const isReturningFromProduct = prevActiveProductRef.current !== null && activeProduct === null;
    prevActiveProductRef.current = activeProduct;

    if (activeProduct || isTermsOpen || isAdminOpen || isAccountOpen) {
      // Opening product detail, admin, terms, or account: start at top of page
      window.scrollTo(0, 0);
    } else if (isReturningFromProduct) {
      // Returning from product page to homepage catalog: restore exact saved position
      const savedScroll = sessionStorage.getItem('panchu_homepage_scroll');
      if (savedScroll !== null) {
        const scrollY = parseInt(savedScroll, 10);
        window.scrollTo(0, scrollY);
        sessionStorage.removeItem('panchu_homepage_scroll');
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // Fresh initial page load or page refresh: ALWAYS start at very top (main hero banner)
      sessionStorage.removeItem('panchu_homepage_scroll');
      window.scrollTo(0, 0);
    }
  }, [activeProduct, isTermsOpen, isAdminOpen, isAccountOpen]);

  // Synchronize URL changes on back/forward browser buttons
  useEffect(() => {
    const handleUrlChange = () => {
      if (isAdminUrl()) {
        setIsAdminOpen(true);
        setIsAccountOpen(false);
        setIsTermsOpen(false);
        setActiveProduct(null);
        return;
      }
      setIsAdminOpen(false);

      if (isAccountUrl()) {
        setIsAccountOpen(true);
        setIsAdminOpen(false);
        setIsTermsOpen(false);
        setActiveProduct(null);
        return;
      }
      setIsAccountOpen(false);

      if (isTermsUrl()) {
        setIsTermsOpen(true);
        setActiveProduct(null);
        return;
      }
      setIsTermsOpen(false);

      const id = getProductIdFromUrl();
      if (id) {
        const found = products.find(p => p.id === id || p.id.toLowerCase() === id.toLowerCase());
        if (found) {
          setActiveProduct(found);
        }
      } else {
        setActiveProduct(null);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [products]);

  // Banner Image according to gender selector
  const heroImage = gender === 'male' ? HERO_MALE_IMAGE : HERO_FEMALE_IMAGE;

  // Select product and navigate to /product/:id on same page
  const handleSelectProduct = (product: Product) => {
    // Record current scroll position before leaving homepage
    if (!activeProduct) {
      sessionStorage.setItem('panchu_homepage_scroll', window.scrollY.toString());
    }
    const targetPath = '/product/' + product.id;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ productId: product.id }, '', targetPath);
    }
    setIsTermsOpen(false);
    setIsAdminOpen(false);
    setIsAccountOpen(false);
    setActiveProduct(product);
  };

  // Back to catalog / homepage
  const handleBackToCatalog = () => {
    if (window.location.pathname !== '/' || window.location.hash) {
      window.history.pushState(null, '', '/');
    }
    setIsTermsOpen(false);
    setIsAdminOpen(false);
    setIsAccountOpen(false);
    setActiveProduct(null);
  };

  const handleOpenTerms = (section?: string) => {
    const hash = section ? `#${section}` : '';
    if (window.location.pathname !== '/terms' || window.location.hash !== hash) {
      window.history.pushState(null, '', `/terms${hash}`);
    }
    setActiveProduct(null);
    setIsAdminOpen(false);
    setIsAccountOpen(false);
    setIsTermsOpen(true);
  };

  const handleOpenAdmin = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
    setActiveProduct(null);
    setIsTermsOpen(false);
    setIsAccountOpen(false);
    setIsAdminOpen(true);
  };

  const handleOpenContact = () => {
    handleOpenTerms('contact');
  };

  const handleOpenPrivacy = () => {
    handleOpenTerms('privacy');
  };

  const handleOpenAccount = () => {
    if (window.location.pathname !== '/account') {
      window.history.pushState(null, '', '/account');
    }
    setActiveProduct(null);
    setIsTermsOpen(false);
    setIsAdminOpen(false);
    setIsAccountOpen(true);
  };

  // Scroll into view for catalog or return from product detail
  const handleScrollToCatalog = () => {
    if (activeProduct || isTermsOpen || isAdminOpen || isAccountOpen) {
      handleBackToCatalog();
    } else {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToHero = () => {
    if (activeProduct || isTermsOpen || isAdminOpen || isAccountOpen) {
      handleBackToCatalog();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations - "Add to Cart" adds item silently WITHOUT opening cart/checkout
  const handleAddToCart = (product: Product, size: string, quantity: number) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, size, quantity }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId, size);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setCartItems(prev =>
      prev.filter(item => !(item.product.id === productId && item.size === size))
    );
  };

  const handleBuyNow = (product: Product, size: string, quantity: number) => {
    handleAddToCart(product, size, quantity);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`w-full min-h-screen font-sans selection:bg-black selection:text-white transition-colors duration-300 ${
      theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-white text-stone-900'
    }`}>
      {/* Sticky Header Navigation (hidden on standalone auth/admin pages for immersive full-screen cloud view) */}
      {!isAdminOpen && !isAccountOpen && (
        <HeaderNavigation
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onGoToHero={handleGoToHero}
          onScrollToCatalog={handleScrollToCatalog}
          onOpenAccount={handleOpenAccount}
          currentUser={currentUser}
          activeCustomer={activeCustomer}
          theme={theme}
          gender={gender}
          onThemeChange={setTheme}
          onGenderChange={setGender}
          isHeroVisible={false}
        />
      )}

      {/* Dedicated Admin / Owner Portal View */}
      {isAdminOpen && (
        <AdminDashboard
          onBack={handleBackToCatalog}
          onBackToStore={handleBackToCatalog}
          theme={theme}
        />
      )}

      {/* Dedicated Customer Account Page View (Matching Reference Cloud Design) */}
      {isAccountOpen && (
        <CustomerAccountPage
          onBackToStore={handleBackToCatalog}
          onCustomerSessionChange={setActiveCustomer}
          theme={theme}
        />
      )}

      {/* Dedicated Terms Page View */}
      {!isAdminOpen && !isAccountOpen && isTermsOpen && (
        <TermsPage
          onBack={handleBackToCatalog}
          theme={theme}
        />
      )}

      {/* Dedicated Product Detail View */}
      {!isAdminOpen && !isAccountOpen && !isTermsOpen && activeProduct && (
        <ProductDetailPage
          product={activeProduct}
          products={products}
          onBack={handleBackToCatalog}
          onSelectProduct={handleSelectProduct}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          theme={theme}
          gender={gender}
          onOpenTerms={handleOpenTerms}
          onOpenContact={handleOpenContact}
          onOpenPrivacy={handleOpenPrivacy}
          onOpenAdmin={handleOpenAdmin}
          onOpenAccount={handleOpenAccount}
        />
      )}

      {/* Main Homepage View (preserved in DOM to avoid back button banner flash) */}
      <div className={(activeProduct || isTermsOpen || isAdminOpen || isAccountOpen) ? 'hidden' : 'block'}>
        {/* Hero Section Banner */}
        <div className="relative">
          <Hero
            image={heroImage}
            theme={theme}
            gender={gender}
            onThemeChange={setTheme}
            onGenderChange={setGender}
            onShopNow={handleScrollToCatalog}
          />
        </div>

        {/* Product Catalog Page Section */}
        <div ref={catalogRef}>
          <ProductPage
            products={products}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProduct}
            theme={theme}
            gender={gender}
            onOpenTerms={handleOpenTerms}
            onOpenContact={handleOpenContact}
            onOpenPrivacy={handleOpenPrivacy}
            onOpenAdmin={handleOpenAdmin}
            onOpenAccount={handleOpenAccount}
          />
        </div>
      </div>

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Instant Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
