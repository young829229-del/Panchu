import React, { useState } from 'react';
import { Product } from '../types';
import { X, ShoppingBag, Check, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Touch Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const images = product.additionalImages && product.additionalImages.length > 0 
    ? product.additionalImages 
    : [product.image];

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  // Touch Swipe Handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    onBuyNow(product, selectedSize, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-5xl bg-white border border-stone-200 shadow-2xl my-auto overflow-hidden text-stone-900"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            id="modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Media Gallery with Touch Swipe */}
            <div className="bg-stone-100 p-4 sm:p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-stone-200 select-none">
              <div 
                className="relative aspect-[3/4] sm:aspect-[3/4] md:aspect-[3/4] lg:aspect-[4/5] w-full max-h-[360px] sm:max-h-[400px] md:max-h-[380px] lg:max-h-[400px] overflow-hidden bg-stone-200 touch-pan-y cursor-grab active:cursor-grabbing group flex items-center justify-center mx-auto"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0.6, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
                {product.badge && (
                  <span className="absolute top-4 left-4 bg-black text-white font-mono text-xs tracking-widest px-3 py-1 uppercase z-10">
                    "{product.badge}"
                  </span>
                )}

                {/* Left/Right Navigation Arrows for Images */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black text-white transition-all rounded-full opacity-80 hover:opacity-100 cursor-pointer z-10"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black text-white transition-all rounded-full opacity-80 hover:opacity-100 cursor-pointer z-10"
                      title="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Dots indicator */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          activeImageIndex === idx ? 'w-6 bg-black' : 'w-1.5 bg-black/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple images */}
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1 items-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-20 border-2 overflow-hidden transition-all flex-shrink-0 ${
                        activeImageIndex === idx ? 'border-black' : 'border-stone-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest pl-2 hidden sm:inline">
                    ← SWIPE IMAGES →
                  </span>
                </div>
              )}
            </div>

            {/* Right: Product Details & Purchase Form */}
            <div className="p-8 md:p-10 flex flex-col justify-between space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans text-black uppercase">
                  {product.name}
                </h2>

                <div className="mt-3 text-xl font-mono font-bold text-black flex items-center gap-3">
                  <span>{product.priceDisplay ? `Price ${product.priceDisplay}` : `NPR ${product.price}`}</span>
                  <span className="text-xs font-mono font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    IN STOCK
                  </span>
                </div>

                <p className="mt-4 text-xs md:text-sm font-sans text-stone-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Fabric Composition */}
                {product.composition && (
                  <div className="mt-4 p-3 bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700">
                    <span className="font-bold text-black uppercase">COMPOSITION:</span> {product.composition}
                  </div>
                )}

                {/* Specification Bullets */}
                <ul className="mt-4 space-y-1.5 text-xs font-mono text-stone-600">
                  {product.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-black rounded-full" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Purchase Options */}
              <div className="space-y-5 pt-4 border-t border-stone-200">
                {/* Size Selector */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono tracking-wider text-black uppercase font-bold">
                      SELECT SIZE
                    </span>
                    <span className="text-xs font-mono text-stone-400">FIT: TRUE TO SIZE</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-black text-white border-2 border-black'
                            : 'bg-white text-black border border-stone-300 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono tracking-wider text-black uppercase font-bold">
                    QUANTITY
                  </span>
                  <div className="flex items-center border border-stone-300 bg-stone-50">
                    <button
                      type="button"
                      onClick={() => setQuantity(p => Math.max(p - 1, 1))}
                      className="p-2 text-black hover:bg-stone-200 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-mono font-bold text-black">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(p => Math.min(p + 1, 10))}
                      className="p-2 text-black hover:bg-stone-200 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button
                    onClick={handleAddToCart}
                    className={`w-full flex items-center justify-center gap-2 py-4 px-6 border text-xs font-mono font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-md ${
                      isAdded
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-black text-white hover:bg-neutral-800 border-black'
                    }`}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{isAdded ? 'ADDED TO BAG' : 'ADD TO BAG'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
