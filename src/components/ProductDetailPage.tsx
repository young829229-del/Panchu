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

        {/* Dynamic Section / Collection Subtitle */}
        {product.subtitle && (
          <div className="text-[10px] font-montserrat tracking-[0.2em] text-red-600 font-bold uppercase mt-3">
            {product.subtitle}
          </div>
        )}
      </div>

      {/* Main Product Details Section */}
      <section className="w-full py-6 sm:py-8 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 items-start">
          
          {/* LEFT: PRODUCT GALLERY */}
          <div className="md:col-span-7 flex flex-col gap-3 select-none">
            
            {/* Main Product Image Container - Fits complete original image with zero gaps or black bars */}
            <div className="relative w-full overflow-hidden">
              <ProductImage
                src={galleryImages[activeImageIndex] || product.image}
                alt={product.name}
                className="w-full h-auto block object-contain"
              />

              {/* Badge if present */}
              {product.badge && (
                <div className="absolute top-3 left-3 bg-red-600 text-white font-montserrat font-bold text-[10px] tracking-widest px-2.5 py-1 uppercase z-10">
                  {product.badge}
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
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* RIGHT: PRODUCT INFO & SELECTION */}
          <div className="md:col-span-5 flex flex-col space-y-6">
            <div>
              {/* Product Title */}
              <h1 className={`text-2xl sm:text-3xl font-montserrat font-bold tracking-tight uppercase leading-snug ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {product.name}
              </h1>

              {/* Price */}
              <div className={`mt-3 text-2xl lg:text-3xl font-montserrat font-semibold ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Rs {product.price > 0 ? product.price.toLocaleString() : (product.priceDisplay || '1,850')}
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
                        : isDark
                          ? 'bg-white text-black hover:bg-neutral-200'
                          : 'bg-black text-white hover:bg-neutral-800'
                    }`}
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
                  >
                    BUY IT NOW
                  </button>
                </div>
              )}
            </div>

            {/* Product Details Description */}
            <div className={`pt-4 border-t space-y-2.5 text-xs font-inter ${
              isDark ? 'border-neutral-800 text-neutral-200' : 'border-stone-200 text-stone-900'
            }`}>
              <p className={`leading-relaxed font-medium text-xs sm:text-sm ${
                isDark ? 'text-stone-100' : 'text-black'
              }`}>
                {product.description}
              </p>
              
              {product.details && product.details.length > 0 && (
                <ul className={`list-disc list-inside space-y-1 pl-1 text-xs font-medium ${
                  isDark ? 'text-neutral-300' : 'text-stone-900'
                }`}>
                  {product.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              )}

              {product.composition && (
                <p className={`font-inter text-xs pt-1 ${
                  isDark ? 'text-neutral-300' : 'text-stone-900'
                }`}>
                  <strong className={`uppercase font-montserrat font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    Composition:
                  </strong> {product.composition}
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
