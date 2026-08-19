import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ALL_PRODUCTS,
  MALE_PRODUCTS,
  FEMALE_PRODUCTS,
  getBestSellingProducts,
  getSummerCollection,
  getWinterCollection
} from '../data/products';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { MatchPartnerSection } from './MatchPartnerSection';
import { GetDiscountSection } from './GetDiscountSection';
import { FooterSection } from './FooterSection';
import { Check, Plus, Minus, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductPageProps {
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, quantity: number) => void;
  onSelectProduct?: (product: Product) => void;
  theme?: 'light' | 'dark';
  gender?: 'male' | 'female';
  products?: Product[];
  onOpenTerms?: (section?: string) => void;
  onOpenContact?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAdmin?: () => void;
  onOpenAccount?: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  theme = 'light',
  gender = 'male',
  products,
  onOpenTerms,
  onOpenContact,
  onOpenPrivacy,
  onOpenAdmin,
  onOpenAccount
}) => {
  const isDark = theme === 'dark';
  const activeGender = gender === 'female' ? 'female' : 'male';

  const currentAllProducts = useMemo(() => {
    return products && products.length > 0 ? products : ALL_PRODUCTS;
  }, [products]);

  const currentMaleProducts = useMemo(() => {
    const list = currentAllProducts.filter(p => p.gender === 'male' || p.gender === 'unisex');
    return list.length > 0 ? list : MALE_PRODUCTS;
  }, [currentAllProducts]);

  const currentFemaleProducts = useMemo(() => {
    const list = currentAllProducts.filter(p => p.gender === 'female' || p.gender === 'unisex');
    return list.length > 0 ? list : FEMALE_PRODUCTS;
  }, [currentAllProducts]);

  // Active top featured product
  const [selectedProduct, setSelectedProduct] = useState<Product>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      let urlId = '';
      if (path.startsWith('/product/')) {
        urlId = decodeURIComponent(path.replace('/product/', '').trim());
      } else {
        const params = new URLSearchParams(window.location.search);
        urlId = params.get('product') || params.get('id') || '';
      }
      if (urlId) {
        const match = currentAllProducts.find(
          p => p.id === urlId || p.id.toLowerCase() === urlId.toLowerCase()
        );
        if (match) return match;
      }
    }
    return gender === 'female' ? currentFemaleProducts[0] : currentMaleProducts[0];
  });

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Touch Swipe Gesture Refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Automatically update featured main product when gender changes or products load
  useEffect(() => {
    const hasUrlProduct = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/product/') || 
      new URLSearchParams(window.location.search).has('product')
    );
    if (!hasUrlProduct) {
      const defaultProduct = gender === 'female' ? currentFemaleProducts[0] : currentMaleProducts[0];
      if (defaultProduct) {
        setSelectedProduct(defaultProduct);
        setActiveImageIndex(0);
        setSelectedSize(defaultProduct.sizes?.[0] || 'M');
        setQuantity(1);
        setIsAdded(false);
      }
    }
  }, [gender, currentFemaleProducts, currentMaleProducts]);

  // Gallery Images array
  const galleryImages = useMemo(() => {
    const baseImages = (selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0)
      ? selectedProduct.additionalImages
      : (selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image]);

    const valid = baseImages.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
    return valid.length > 0 ? valid : [selectedProduct.image];
  }, [selectedProduct]);

  // Dynamic collections filtered by gender
  const bestSellingProducts = useMemo(() => {
    if (products && products.length > 0) {
      const list = products.filter(p => (p.gender === activeGender || p.gender === 'unisex') && (p.bestSelling || p.badge?.toLowerCase().includes('best') || p.id.includes('bestselling')));
      return list.length > 0 ? list.slice(0, 4) : products.filter(p => p.gender === activeGender || p.gender === 'unisex').slice(0, 4);
    }
    return getBestSellingProducts(activeGender);
  }, [products, activeGender]);

  const summerCollection = useMemo(() => {
    if (products && products.length > 0) {
      const list = products.filter(p => (p.gender === activeGender || p.gender === 'unisex') && (p.collection?.toLowerCase().includes('summer') || p.id.includes('summer')));
      return list.length > 0 ? list.slice(0, 4) : products.filter(p => p.gender === activeGender || p.gender === 'unisex').slice(0, 4);
    }
    return getSummerCollection(activeGender);
  }, [products, activeGender]);

  const winterCollection = useMemo(() => {
    if (products && products.length > 0) {
      const list = products.filter(p => (p.gender === activeGender || p.gender === 'unisex') && (p.collection?.toLowerCase().includes('winter') || p.id.includes('winter')));
      return list.length > 0 ? list.slice(0, 4) : products.filter(p => p.gender === activeGender || p.gender === 'unisex').slice(0, 4);
    }
    return getWinterCollection(activeGender);
  }, [products, activeGender]);

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 35;
    if (diffX > minSwipeDistance) {
      handleNextImage();
    } else if (diffX < -minSwipeDistance) {
      handlePrevImage();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAddToCart = () => {
    if (!selectedProduct.inStock) return;
    onAddToCart(selectedProduct, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNowClick = () => {
    if (!selectedProduct.inStock) return;
    onBuyNow(selectedProduct, selectedSize, quantity);
  };

  // Scroll smoothly down to price and size options
  const handleImageClick = () => {
    const optionsEl = document.getElementById('home-product-options');
    if (optionsEl) {
      optionsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollBy({ top: 280, behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full transition-colors duration-300 ${
      isDark ? 'bg-neutral-950 text-white' : 'bg-white text-stone-900'
    }`}>
      
      {/* 1. TOP SECTION — MAIN PRODUCT DETAILS */}
      <section id="main-product-details" className="w-full py-6 sm:py-10 md:py-12 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* LEFT: PRODUCT GALLERY */}
          <div className="md:col-span-7 flex flex-col gap-3 select-none">
            
            {/* Main Product Image Container - Clean Image with Click-to-Scroll */}
            <div 
              onClick={handleImageClick}
              className="relative aspect-square w-full max-w-[500px] mx-auto overflow-hidden bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-sm cursor-pointer group/img"
              title="Click image to view price & size selection"
            >
              <ProductImage
                src={galleryImages[activeImageIndex] || selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Badge if present */}
              {selectedProduct.badge && (
                <div className="absolute top-3 left-3 bg-red-600 text-white font-montserrat font-bold text-[10px] tracking-widest px-2.5 py-1 uppercase z-10">
                  {selectedProduct.badge}
                </div>
              )}
            </div>

            {/* Thumbnails list - Only displayed if there are multiple gallery images */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto w-full pt-1">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = activeImageIndex === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 border overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                        isActive 
                          ? 'border-black dark:border-white ring-1 ring-black dark:ring-white' 
                          : 'border-stone-200 dark:border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${selectedProduct.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* RIGHT: PRODUCT INFO & SELECTION */}
          <div id="home-product-options" className="md:col-span-5 flex flex-col space-y-5 pt-1">
            <div>
              {/* Product Subtitle */}
              {selectedProduct.subtitle && (
                <div className="text-lg sm:text-xl md:text-2xl font-montserrat tracking-[0.2em] text-red-600 font-bold uppercase mb-2">
                  {selectedProduct.subtitle}
                </div>
              )}

              {/* Product Title */}
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-montserrat font-semibold tracking-tight uppercase leading-snug ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {selectedProduct.name}
              </h1>

              {/* Price */}
              <div className={`mt-3 text-2xl lg:text-3xl font-montserrat font-semibold ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Rs {selectedProduct.price > 0 ? selectedProduct.price.toLocaleString() : (selectedProduct.priceDisplay || '1,850')}
              </div>
            </div>

            {/* Choose Size */}
            <div className={`space-y-2 pt-2 border-t ${
              isDark ? 'border-neutral-800' : 'border-stone-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-xs font-montserrat font-semibold uppercase tracking-wider ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  Choose Size
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.sizes.map(size => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3.5 text-xs font-montserrat font-bold transition-all border cursor-pointer flex items-center justify-center rounded-none ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : isDark
                            ? 'bg-neutral-900 text-stone-200 border-neutral-700 hover:border-emerald-500'
                            : 'bg-white text-black border-stone-300 hover:border-emerald-600'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <div className={`text-xs font-montserrat font-semibold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                QUANTITY
              </div>
              <div className={`inline-flex items-center border ${
                isDark ? 'border-neutral-700 bg-neutral-900' : 'border-stone-300 bg-stone-50'
              }`}>
                <button
                  type="button"
                  onClick={() => setQuantity(p => Math.max(1, p - 1))}
                  className={`p-2.5 transition-colors cursor-pointer font-bold ${
                    isDark ? 'text-neutral-300 hover:text-white' : 'text-stone-900 hover:text-black'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className={`px-5 text-xs font-montserrat font-bold ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(p => Math.min(10, p + 1))}
                  className={`p-2.5 transition-colors cursor-pointer font-bold ${
                    isDark ? 'text-neutral-300 hover:text-white' : 'text-stone-900 hover:text-black'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons: Add To Bag & Buy Now */}
            <div className="space-y-2.5 pt-2">
              {!selectedProduct.inStock ? (
                <button
                  disabled
                  className="w-full py-4 bg-stone-200 dark:bg-neutral-800 text-stone-500 dark:text-neutral-500 text-xs font-montserrat font-bold tracking-widest uppercase cursor-not-allowed rounded-none"
                >
                  OUT OF STOCK
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`w-full py-4 px-6 text-xs font-montserrat font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 rounded-none ${
                      isAdded
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isDark
                          ? 'bg-white text-black hover:bg-neutral-200'
                          : 'bg-black text-white hover:bg-neutral-800'
                    }`}
                    id="add-to-cart-top-btn"
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{isAdded ? 'ADDED TO BAG' : 'ADD TO BAG'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    className={`w-full py-3.5 px-6 text-xs font-montserrat font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer border rounded-none ${
                      isDark
                        ? 'border-white text-white hover:bg-white hover:text-black'
                        : 'border-black text-black hover:bg-black hover:text-white'
                    }`}
                    id="buy-now-top-btn"
                  >
                    BUY IT NOW
                  </button>
                </div>
              )}
            </div>

            {/* Product Details Description */}
            <div className={`pt-4 border-t space-y-3 font-inter font-medium ${
              isDark ? 'border-neutral-800 text-neutral-200' : 'border-stone-200 text-stone-900'
            }`}>
              <p className={`leading-relaxed text-sm sm:text-base md:text-lg ${
                isDark ? 'text-stone-100' : 'text-black'
              }`}>{selectedProduct.description}</p>
              
              {selectedProduct.details && selectedProduct.details.length > 0 && (
                <ul className={`list-disc list-inside space-y-1.5 pl-1 text-sm sm:text-base ${
                  isDark ? 'text-neutral-300' : 'text-stone-900'
                }`}>
                  {selectedProduct.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              )}

              {selectedProduct.composition && (
                <p className={`font-inter text-sm sm:text-base pt-1 ${
                  isDark ? 'text-neutral-300' : 'text-stone-900'
                }`}>
                  <strong className={`uppercase font-montserrat font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>Composition:</strong> {selectedProduct.composition}
                </p>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 1. MATCH WITH YOUR PARTNER SECTION */}
      <MatchPartnerSection
        onSelectProduct={onSelectProduct}
        theme={theme}
        gender={gender}
      />

      {/* 2. BEST SELLING PRODUCTS SECTION */}
      <section id="best-selling" className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-left space-y-2">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bebas uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              BEST SELLING PRODUCTS
            </h2>
            <div className={`w-12 h-0.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {bestSellingProducts.map((product) => (
              <ProductCard
                key={`bestseller-${product.id}`}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. SUMMER COLLECTION SECTION */}
      <section id="summer-collection" className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-left space-y-2">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bebas uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              SUMMER COLLECTION
            </h2>
            <div className={`w-12 h-0.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {summerCollection.map((product) => (
              <ProductCard
                key={`summer-${product.id}`}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. WINTER COLLECTION SECTION */}
      <section id="winter-collection" className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-left space-y-2">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bebas uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              WINTER COLLECTION
            </h2>
            <div className={`w-12 h-0.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {winterCollection.map((product) => (
              <ProductCard
                key={`winter-${product.id}`}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. GET DISCOUNT & FOOTER */}
      <GetDiscountSection theme={theme} />
      <FooterSection
        theme={theme}
        onOpenTerms={onOpenTerms}
        onOpenContact={onOpenContact}
        onOpenPrivacy={onOpenPrivacy}
        onOpenAdmin={onOpenAdmin}
        onOpenAccount={onOpenAccount}
      />
    </div>
  );
};
