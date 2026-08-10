import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../types';
import { ALL_PRODUCTS } from '../data/products';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { FooterSection } from './FooterSection';
import { GetDiscountSection } from './GetDiscountSection';
import { ArrowLeft, Check, Plus, Minus, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, quantity: number) => void;
  theme?: 'light' | 'dark';
  gender?: 'male' | 'female';
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Touch Swipe Gesture Refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Reset state when active product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(product.sizes[0] || 'M');
    setQuantity(1);
    setIsAdded(false);
    window.scrollTo(0, 0);
  }, [product]);

  // Gallery Images array
  const galleryImages = useMemo(() => {
    const baseImages = (product.additionalImages && product.additionalImages.length > 0)
      ? product.additionalImages
      : [product.image];

    const valid = baseImages.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
    return valid.length > 0 ? valid : [product.image];
  }, [product]);

  // Recommended Products (same category or general collection excluding current product)
  const relatedProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(p => p.id !== product.id && p.gender === product.gender).slice(0, 4);
  }, [product]);

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
    const minSwipeDistance = 35; // 35px threshold for horizontal swipe
    if (diffX > minSwipeDistance) {
      handleNextImage(); // Swiped Left -> Next
    } else if (diffX < -minSwipeDistance) {
      handlePrevImage(); // Swiped Right -> Previous
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAddToCartClick = () => {
    if (!product.inStock) return;
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNowClick = () => {
    if (!product.inStock) return;
    onBuyNow(product, selectedSize, quantity);
  };

  return (
    <div className={`w-full min-h-screen pt-4 transition-colors duration-300 ${
      isDark ? 'bg-neutral-950 text-white' : 'bg-white text-stone-900'
    }`}>
      
      {/* Back Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-4">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-2 text-xs font-montserrat font-bold tracking-widest uppercase py-2 px-4 border transition-all cursor-pointer ${
            isDark 
              ? 'border-neutral-800 text-neutral-300 hover:bg-white hover:text-black hover:border-white' 
              : 'border-stone-300 text-stone-700 hover:bg-black hover:text-white hover:border-black'
          }`}
          id="back-to-catalog-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO COLLECTION</span>
        </button>
      </div>

      {/* Main Product Details Section */}
      <section className="w-full py-6 sm:py-8 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 items-start">
          
          {/* LEFT: PRODUCT GALLERY */}
          <div className="md:col-span-7 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 select-none">
            
            {/* Thumbnails list */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto w-full sm:w-20 flex-shrink-0 pb-2 sm:pb-0">
              {galleryImages.map((imgUrl, idx) => {
                const isActive = activeImageIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer rounded-sm bg-stone-100 dark:bg-neutral-900 ${
                      isActive 
                        ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20' 
                        : 'border-stone-200 dark:border-neutral-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ProductImage
                      src={imgUrl}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain object-center p-1"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Product Image Container with Touch Swipe Support */}
            <div 
              className="relative flex-grow aspect-square w-full bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 overflow-hidden group flex items-center justify-center rounded-sm touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <ProductImage
                src={galleryImages[activeImageIndex] || product.image}
                alt={product.name}
                className="w-full h-full object-contain object-center p-2 transition-transform duration-500 group-hover:scale-102"
              />

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-black/80 text-black dark:text-white rounded-full shadow-md opacity-80 hover:opacity-100 transition-all cursor-pointer z-10"
                title="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-black/80 text-black dark:text-white rounded-full shadow-md opacity-80 hover:opacity-100 transition-all cursor-pointer z-10"
                title="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Badge if present */}
              {product.badge && (
                <div className="absolute top-3 left-3 bg-red-600 text-white font-montserrat font-bold text-[10px] tracking-widest px-2.5 py-1 uppercase z-10">
                  {product.badge}
                </div>
              )}

              {/* Mobile Swipe Pagination Dots Indicator */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10 sm:hidden">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-1.5 transition-all rounded-full cursor-pointer ${
                        idx === activeImageIndex
                          ? 'w-6 bg-black dark:bg-white'
                          : 'w-1.5 bg-stone-400/80 dark:bg-neutral-600'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: PRODUCT INFO & SELECTION */}
          <div className="md:col-span-5 flex flex-col space-y-6">
            <div>
              {/* Product Subtitle */}
              {product.subtitle && (
                <div className="text-[10px] font-montserrat tracking-[0.2em] text-red-600 font-bold uppercase mb-1">
                  {product.subtitle}
                </div>
              )}

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-montserrat font-bold tracking-tight text-black dark:text-white uppercase leading-snug">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-3 text-2xl lg:text-3xl font-montserrat font-semibold text-black dark:text-white">
                Rs {product.price > 0 ? product.price.toLocaleString() : (product.priceDisplay || '1,850')}
              </div>
            </div>

            {/* Choose Size */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="text-xs font-montserrat font-semibold text-black dark:text-white uppercase tracking-wider">
                  Choose Size
                </div>
                <span className="text-[10px] font-montserrat font-semibold text-stone-400 uppercase tracking-widest">
                  SIZE GUIDE
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3.5 text-xs font-montserrat font-bold transition-all border cursor-pointer flex items-center justify-center rounded-none ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-stone-800 dark:bg-neutral-900 dark:text-stone-200 border-stone-300 dark:border-neutral-700 hover:border-emerald-600 dark:hover:border-emerald-500'
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
              <div className="text-xs font-montserrat font-semibold text-black dark:text-white uppercase tracking-wider">
                QUANTITY
              </div>
              <div className="inline-flex items-center border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setQuantity(p => Math.max(1, p - 1))}
                  className="p-2.5 text-stone-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-5 text-xs font-montserrat font-semibold text-black dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(p => Math.min(10, p + 1))}
                  className="p-2.5 text-stone-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons: Add To Bag & Buy Now */}
            <div className="space-y-2.5 pt-2">
              {!product.inStock ? (
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
                    onClick={handleAddToCartClick}
                    className={`w-full py-4 px-6 text-xs font-montserrat font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 rounded-none ${
                      isAdded
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200'
                    }`}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{isAdded ? 'ADDED TO BAG' : 'ADD TO BAG'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    className="w-full py-3.5 px-6 text-xs font-montserrat font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none"
                  >
                    BUY IT NOW
                  </button>
                </div>
              )}
            </div>

            {/* Product Details Description */}
            <div className="pt-4 border-t border-stone-200 dark:border-neutral-800 space-y-2 text-xs font-inter text-stone-600 dark:text-neutral-300">
              <p className="leading-relaxed">{product.description}</p>
              
              {product.details && product.details.length > 0 && (
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-stone-500 dark:text-neutral-400">
                  {product.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              )}

              {product.composition && (
                <p className="font-inter text-[11px] text-stone-500 dark:text-neutral-400 pt-1">
                  <strong className="text-black dark:text-white uppercase font-montserrat font-semibold">Composition:</strong> {product.composition}
                </p>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* Recommended Products Section */}
      {relatedProducts.length > 0 && (
        <section className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-50 border-stone-200'
        }`}>
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className={`text-3xl sm:text-4xl font-bebas uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                YOU MAY ALSO LIKE
              </h2>
              <div className={`w-12 h-0.5 mx-auto ${isDark ? 'bg-white' : 'bg-black'}`} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={`related-${p.id}`}
                  product={p}
                  onSelectProduct={onSelectProduct}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Get Discount & Footer */}
      <GetDiscountSection theme={theme} />
      <FooterSection theme={theme} />
    </div>
  );
};
