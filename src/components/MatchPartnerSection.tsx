import React from 'react';
import { getMatchPartnerItems, PartnerPair } from '../data/products';
import { Product } from '../types';
import { motion } from 'motion/react';
import { ProductImage } from './ProductImage';

interface MatchPartnerSectionProps {
  onSelectProduct?: (product: Product) => void;
  theme?: 'light' | 'dark';
  gender?: 'male' | 'female';
}

export const MatchPartnerSection: React.FC<MatchPartnerSectionProps> = ({
  onSelectProduct,
  theme = 'light',
  gender = 'male'
}) => {
  const isDark = theme === 'dark';
  const activeGender = gender === 'female' ? 'female' : 'male';
  const partnerItems = getMatchPartnerItems(activeGender);

  return (
    <section id="match-partner" className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
      isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Left-Aligned Main Section Heading */}
        <div className="text-left space-y-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bebas uppercase tracking-wider">
            MATCH WITH YOUR PARTNER
          </h2>
          <div className={`w-12 h-0.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
        </div>

        {/* 4-Column Grid on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {partnerItems.map((item: PartnerPair) => {
            const productUrl = `/product/${item.productRef.id}`;

            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (onSelectProduct) {
                onSelectProduct(item.productRef);
              } else {
                window.history.pushState({ productId: item.productRef.id }, '', productUrl);
                window.dispatchEvent(new Event('popstate'));
              }
            };

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className={`group relative border flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl transition-all ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-500 text-white' 
                    : 'bg-white border-stone-200 hover:border-black text-stone-900'
                }`}
              >
                {/* Image Link -> Opens in same tab */}
                <a
                  href={productUrl}
                  onClick={handleClick}
                  className="relative w-full aspect-square overflow-hidden bg-stone-100 block cursor-pointer"
                >
                  <ProductImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Gender / Partner Label Badge */}
                  <div className={`absolute top-3 left-3 text-white font-montserrat font-semibold text-[9px] tracking-widest px-2 py-1 uppercase backdrop-blur-xs flex items-center gap-1.5 z-10 ${
                    item.isCoupleImage ? 'bg-red-600' : 'bg-black/80'
                  }`}>
                    <span>{item.label}</span>
                  </div>
                </a>

                {/* Info Box */}
                <div className="p-4 flex flex-col justify-between flex-grow border-t border-stone-200/50">
                  <div>
                    <a
                      href={productUrl}
                      onClick={handleClick}
                      className="block hover:underline"
                    >
                      <h3 className="text-xs sm:text-sm font-montserrat font-semibold uppercase tracking-tight line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="mt-1.5 text-xs sm:text-sm font-montserrat font-semibold text-red-600">
                        Rs {item.price.toLocaleString()}
                      </div>
                    </a>
                  </div>

                  <a
                    href={productUrl}
                    onClick={handleClick}
                    className="mt-3 text-[10px] font-montserrat font-semibold text-stone-400 uppercase tracking-widest flex items-center gap-1 hover:text-black dark:hover:text-white"
                  >
                    <span>VIEW COLLECTION →</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
