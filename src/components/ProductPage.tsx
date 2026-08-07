import React, { useState, useMemo } from 'react';
import { PRODUCTS } from '../data/products';
import { Product, CartItem } from '../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { SlidersHorizontal, Grid, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductPageProps {
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, quantity: number) => void;
  theme?: 'light' | 'dark';
  gender?: 'male' | 'female';
}

export const ProductPage: React.FC<ProductPageProps> = ({ onAddToCart, onBuyNow, theme = 'light', gender = 'male' }) => {
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_LOW' | 'PRICE_HIGH'>('FEATURED');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesGender = !product.gender || product.gender === gender || product.gender === 'unisex';

      const matchesCategory =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'TOPS' && (product.id.includes('tshirt') || product.id.includes('tee') || product.id.includes('hoodie') || product.id.includes('top'))) ||
        (selectedCategory === 'BOTTOMS' && product.id.includes('shorts')) ||
        (selectedCategory === 'FOOTWEAR' && product.id.includes('sneakers')) ||
        (selectedCategory === 'ACCESSORIES' && product.id.includes('tote'));

      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.composition.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesGender && matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'PRICE_LOW') return a.price - b.price;
      if (sortBy === 'PRICE_HIGH') return b.price - a.price;
      return 0;
    });
  }, [selectedCategory, searchQuery, sortBy, gender]);

  const categories = ['ALL', 'TOPS', 'BOTTOMS', 'FOOTWEAR', 'ACCESSORIES'];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="product-catalog-section" className={`w-full min-h-screen py-8 md:py-12 px-4 sm:px-6 md:px-12 transition-colors duration-300 ${
      isDark ? 'bg-neutral-950 text-white' : 'bg-white text-stone-900'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Products Grid — Strict 2 per row (box box 2 product in one line) */}
        {filteredProducts.length === 0 ? (
          <div className={`text-center py-20 border border-dashed space-y-3 ${
            isDark ? 'border-neutral-800 text-neutral-400' : 'border-stone-300 text-stone-500'
          }`}>
            <p className="text-sm font-mono uppercase">NO PRODUCTS MATCH YOUR CRITERIA.</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest cursor-pointer ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                onQuickView={setQuickViewProduct}
                theme={theme}
              />
            ))}
          </div>
        )}

        {/* Footer Editorial Branding */}
        <footer className={`mt-20 pt-12 border-t flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono ${
          isDark ? 'border-neutral-800 text-neutral-400' : 'border-stone-200 text-stone-500'
        }`}>
          <div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>PANCHU™</span>
            <span className="ml-2">— ALL RIGHTS RESERVED 2026.</span>
          </div>
        </footer>

      </div>

      {/* Quick View Product Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
      />
    </section>
  );
};
