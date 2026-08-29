import React, { useState } from 'react';
import { Product } from '../types';
import { ProductGallerySwipe } from './ProductGallerySwipe';
import { ProductImage } from './ProductImage';
import { X, ShoppingBag, Check, Plus, Minus } from 'lucide-react';
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
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  if (!product) return null;

  const images = (product.additionalImages && product.additionalImages.length > 0) 
    ? product.additionalImages 
    : (product.images && product.images.length > 0 ? product.images : [product.image]);

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
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
            {/* Left: Product Media Gallery */}
            <div className="p-4 sm:p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-stone-200 select-none">
              <ProductGallerySwipe
                images={images}
                activeIndex={activeImageIndex}
                onIndexChange={setActiveImageIndex}
                productName={product.name}
                badge={product.badge}
                containerClassName="max-w-[420px]"
                priority={true}
              />

              {/* Thumbnails if multiple images */}
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1 items-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 border-2 overflow-hidden transition-all flex-shrink-0 cursor-pointer ${
                        activeImageIndex === idx ? 'border-black' : 'border-stone-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <ProductImage src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Purchase Form */}
            <div className="p-6 md:p-10 flex flex-col justify-between space-y-6">
              <div>
                <h2 className="text-xl md:text-3xl font-montserrat font-semibold tracking-tight text-black uppercase">
                  {product.name}
                </h2>

                <div className="mt-3 text-2xl font-montserrat font-semibold text-black flex items-center gap-3">
                  <span>Rs {product.price > 0 ? product.price.toLocaleString() : (product.priceDisplay || '1,850')}</span>
                  <span className="text-xs font-montserrat font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    IN STOCK
                  </span>
                </div>

                <p className="mt-4 text-xs md:text-sm font-inter text-stone-900 font-medium leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="space-y-6">
                {/* Size Selection */}
                <div>
                  <div className="flex justify-between text-xs font-montserrat font-semibold tracking-wider text-stone-600 mb-2">
                    <span>SELECT SIZE</span>
                    <span>FIT GUIDE</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-xs font-montserrat font-semibold border transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-black border-stone-300 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-montserrat font-semibold tracking-wider text-stone-600 mb-2">
                    QUANTITY
                  </label>
                  <div className="flex items-center border border-stone-300 w-32 bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-stone-100 transition-colors text-stone-700 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-montserrat font-semibold text-sm text-stone-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-stone-100 transition-colors text-stone-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-4 bg-white text-black border-2 border-black font-montserrat font-semibold text-xs tracking-widest hover:bg-stone-100 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
                    id="modal-add-to-cart-btn"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>ADDED TO BAG</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>ADD TO CART</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onBuyNow(product, selectedSize, quantity);
                      onClose();
                    }}
                    className="flex-1 py-4 bg-black text-white font-montserrat font-semibold text-xs tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center cursor-pointer uppercase shadow-md"
                    id="modal-buy-now-btn"
                  >
                    BUY NOW
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
