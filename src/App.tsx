import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { HeaderNavigation } from './components/HeaderNavigation';
import { ProductPage } from './components/ProductPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Product, CartItem } from './types';
import { HERO_MALE_IMAGE, HERO_FEMALE_IMAGE } from './data/products';

const CART_STORAGE_KEY = 'panchu_cart_items';

export default function App() {
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

  // Sync cart items to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Banner Image according to gender selector
  const heroImage = gender === 'male' ? HERO_MALE_IMAGE : HERO_FEMALE_IMAGE;

  // Scroll into view for catalog
  const handleScrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGoToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
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

    setIsCartOpen(true);
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
          theme={theme}
          gender={gender}
        />
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

