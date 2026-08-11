import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { HeaderNavigation } from './components/HeaderNavigation';
import { ProductPage } from './components/ProductPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { TermsPage } from './components/TermsPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Product, CartItem } from './types';
import { ALL_PRODUCTS, HERO_MALE_IMAGE, HERO_FEMALE_IMAGE } from './data/products';

const CART_STORAGE_KEY = 'panchu_cart_items';

// Helper to extract product ID from pathname or hash URL
function getProductIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/product/')) {
    const id = decodeURIComponent(path.replace('/product/', '').trim());
    if (id) return id;
  }
  const hash = window.location.hash;
  if (hash.startsWith('#/product/')) {
    const id = decodeURIComponent(hash.replace('#/product/', '').trim());
    if (id) return id;
  }
  return null;
}

function isTermsUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/terms' || window.location.hash === '#terms';
}

function findProductById(id: string): Product | null {
  return ALL_PRODUCTS.find(p => p.id === id || p.id.toLowerCase() === id.toLowerCase()) || null;
}

export default function App() {
  const [activeProduct, setActiveProduct] = useState<Product | null>(() => {
    const id = getProductIdFromUrl();
    return id ? findProductById(id) : null;
  });

  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(() => isTermsUrl());

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
    ALL_PRODUCTS.forEach(p => {
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
  }, [activeProduct]);

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

    if (activeProduct || isTermsOpen) {
      // Opening product detail or terms: start at top of page
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
  }, [activeProduct, isTermsOpen]);

  // Synchronize URL changes on back/forward browser buttons
  useEffect(() => {
    const handleUrlChange = () => {
      if (isTermsUrl()) {
        setIsTermsOpen(true);
        setActiveProduct(null);
        return;
      }
      setIsTermsOpen(false);

      const id = getProductIdFromUrl();
      if (id) {
        const found = findProductById(id);
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
  }, []);

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
    setActiveProduct(product);
  };

  // Back to catalog
  const handleBackToCatalog = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    setIsTermsOpen(false);
    setActiveProduct(null);
  };

  const handleOpenTerms = () => {
    if (window.location.pathname !== '/terms') {
      window.history.pushState(null, '', '/terms');
    }
    setActiveProduct(null);
    setIsTermsOpen(true);
  };

  // Scroll into view for catalog or return from product detail
  const handleScrollToCatalog = () => {
    if (activeProduct || isTermsOpen) {
      handleBackToCatalog();
    } else {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToHero = () => {
    if (activeProduct || isTermsOpen) {
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
    // Do NOT automatically open cart drawer on "Add to Cart" as requested
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
      {/* Sticky Header Navigation */}
      <HeaderNavigation
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onGoToHero={handleGoToHero}
        onScrollToCatalog={handleScrollToCatalog}
        theme={theme}
        gender={gender}
        onThemeChange={setTheme}
        onGenderChange={setGender}
        isHeroVisible={false}
      />

      {/* Dedicated Terms Page View */}
      {isTermsOpen && (
        <TermsPage
          onBack={handleBackToCatalog}
          theme={theme}
        />
      )}

      {/* Dedicated Product Detail View */}
      {!isTermsOpen && activeProduct && (
        <ProductDetailPage
          product={activeProduct}
          onBack={handleBackToCatalog}
          onSelectProduct={handleSelectProduct}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          theme={theme}
          gender={gender}
        />
      )}

      {/* Main Homepage View (preserved in DOM to avoid back button banner flash) */}
      <div className={(activeProduct || isTermsOpen) ? 'hidden' : 'block'}>
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
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProduct}
            theme={theme}
            gender={gender}
            onOpenTerms={handleOpenTerms}
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
