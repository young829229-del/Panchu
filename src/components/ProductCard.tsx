import React from 'react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, size: string, quantity: number) => void;
  onBuyNow?: (product: Product, size: string, quantity: number) => void;
  theme?: 'light' | 'dark';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const productUrl = `/product/${product.id}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      window.history.pushState({ productId: product.id }, '', productUrl);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col justify-between transition-all duration-300"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Frame */}
      <div className={`relative w-full aspect-square overflow-hidden border transition-all duration-300 ${
        isDark 
          ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-600' 
          : 'bg-stone-100 border-stone-200 hover:border-black'
      }`}>
        {/* Quick View Button -> Opens Product Detail Page on Website (Same Tab) */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a
            href={productUrl}
            onClick={handleClick}
            className={`p-2 rounded-none border transition-colors cursor-pointer shadow-md inline-flex items-center justify-center ${
              isDark 
                ? 'bg-neutral-800 text-white border-neutral-600 hover:bg-white hover:text-black' 
                : 'bg-white text-black border-black hover:bg-black hover:text-white'
            }`}
            title="View Product Details"
            id={`quick-view-btn-${product.id}`}
          >
            <Eye className="w-4 h-4" />
          </a>
        </div>

        {/* Product Image Link -> Opens Page on Website (Same Tab) */}
        <a
          href={productUrl}
          onClick={handleClick}
          className="w-full h-full block cursor-pointer"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </a>
      </div>

      {/* Content & Details - Outside Product Image Frame */}
      <div className="mt-2.5 sm:mt-3 flex flex-col">
        {/* Product Name Link -> Opens Page on Website (Same Tab) */}
        <a
          href={productUrl}
          onClick={handleClick}
          className={`block text-xs sm:text-sm font-montserrat font-semibold tracking-tight hover:underline uppercase leading-snug line-clamp-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          {product.name}
        </a>

        {/* Price */}
        <div className={`mt-1 text-sm sm:text-base font-montserrat font-semibold ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          Rs {product.price > 0 ? product.price.toLocaleString() : (product.priceDisplay || '1,850')}
        </div>
      </div>
    </motion.div>
  );
};
