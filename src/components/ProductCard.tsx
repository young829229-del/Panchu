import React, { useState } from 'react';
import { Product } from '../types';
import { Eye, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, quantity: number) => void;
  onQuickView: (product: Product) => void;
  theme?: 'light' | 'dark';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [, setIsHovered] = useState<boolean>(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`group relative border flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl ${
        isDark 
          ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-500 text-white' 
          : 'bg-white border-stone-200 hover:border-black text-stone-900'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`product-card-${product.id}`}
    >
      {/* Badge Overlay */}
      {product.badge && (
        <div className={`absolute top-4 left-4 z-10 text-[10px] font-mono tracking-widest px-2.5 py-1 uppercase ${
          isDark ? 'bg-white text-black' : 'bg-black text-white'
        }`}>
          "{product.badge}"
        </div>
      )}

      {/* Quick View Button on Hover */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => onQuickView(product)}
          className={`p-2 rounded-none border transition-colors cursor-pointer shadow-md ${
            isDark 
              ? 'bg-neutral-800 text-white border-neutral-600 hover:bg-white hover:text-black' 
              : 'bg-white text-black border-black hover:bg-black hover:text-white'
          }`}
          title="Quick View"
          id={`quick-view-btn-${product.id}`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Product Image Section */}
      <div
        className={`relative w-full aspect-[3/4] sm:aspect-[3/4] md:aspect-[4/5] lg:aspect-[1/1] max-h-[300px] sm:max-h-[340px] md:max-h-[290px] lg:max-h-[240px] xl:max-h-[260px] overflow-hidden cursor-pointer flex items-center justify-center ${
          isDark ? 'bg-neutral-800' : 'bg-stone-50'
        }`}
        onClick={() => onQuickView(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Content & Details */}
      <div className={`p-6 flex flex-col flex-grow justify-between border-t ${
        isDark ? 'border-neutral-800' : 'border-stone-100'
      }`}>
        <div>
          {/* Subtitle / Category */}
          {product.subtitle && (
            <div className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${
              isDark ? 'text-neutral-400' : 'text-stone-500'
            }`}>
              {product.subtitle}
            </div>
          )}

          {/* Product Name */}
          <h3
            onClick={() => onQuickView(product)}
            className={`text-sm md:text-base font-bold font-sans tracking-tight cursor-pointer hover:underline uppercase leading-snug line-clamp-2 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className={`mt-2 text-base md:text-lg font-mono font-semibold ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {product.priceDisplay ? `Price ${product.priceDisplay}` : `NPR ${product.price}`}
          </div>

          {/* Material / Composition Snippet */}
          {product.composition && (
            <p className={`mt-2 text-xs font-mono line-clamp-2 ${
              isDark ? 'text-neutral-400' : 'text-stone-500'
            }`}>
              {product.composition}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
