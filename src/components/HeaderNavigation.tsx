import React from 'react';
import { ShoppingBag, ArrowLeft, Sun, Moon, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { PanchuLogo } from './PanchuLogo';

interface HeaderNavigationProps {
  cartCount: number;
  onOpenCart: () => void;
  onGoToHero: () => void;
  onScrollToCatalog?: () => void;
  theme?: 'light' | 'dark';
  gender?: 'male' | 'female';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onGenderChange?: (gender: 'male' | 'female') => void;
  isHeroVisible?: boolean;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  cartCount,
  onOpenCart,
  onGoToHero,
  onScrollToCatalog,
  theme = 'light',
  gender = 'male',
  onThemeChange,
  onGenderChange,
  isHeroVisible = false
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b px-4 sm:px-6 md:px-12 py-2.5 sm:py-3 transition-all duration-300 ${
      isDark 
        ? 'bg-neutral-950/95 border-neutral-800 text-white' 
        : 'bg-white/95 border-stone-200 text-stone-900'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand / Hero Return */}
        <div className="flex items-center gap-6">
          <button
            onClick={onGoToHero}
            className="group flex items-center gap-1 hover:opacity-85 transition-all cursor-pointer py-0.5"
            id="nav-brand-logo"
          >
            <PanchuLogo size="md" />
          </button>
        </div>

        {/* Center: Editorial Label */}
        <div className={`hidden lg:block text-center font-montserrat font-semibold text-xs tracking-[0.2em] uppercase ${
          isDark ? 'text-neutral-400' : 'text-stone-500'
        }`}>
          PANCHU — ESSENTIALS 2026
        </div>

        {/* Right: Controls & Cart */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Theme Quick Toggle */}
          {onThemeChange && (
            <div className={`hidden sm:flex items-center p-0.5 rounded-full border ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-100 border-stone-300'
            }`}>
              <button
                onClick={() => onThemeChange('light')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-amber-400 text-black shadow-xs' : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Light Theme"
                id="header-theme-light"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Dark Theme"
                id="header-theme-dark"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Gender Quick Toggle */}
          {onGenderChange && (
            <div className={`hidden md:flex items-center p-0.5 rounded-full border ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-100 border-stone-300'
            }`}>
              <button
                onClick={() => onGenderChange('male')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  gender === 'male'
                    ? isDark ? 'bg-white text-black font-bold shadow-xs' : 'bg-black text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Male"
                aria-label="Male"
                id="header-gender-male"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="14" r="5" />
                  <line x1="19" y1="5" x2="13.5" y2="10.5" />
                  <polyline points="14 5 19 5 19 10" />
                </svg>
              </button>
              <button
                onClick={() => onGenderChange('female')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  gender === 'female'
                    ? isDark ? 'bg-white text-black font-bold shadow-xs' : 'bg-black text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Female"
                aria-label="Female"
                id="header-gender-female"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="9" r="5" />
                  <line x1="12" y1="14" x2="12" y2="21" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={onOpenCart}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 border text-xs font-montserrat font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer ${
              cartCount > 0
                ? 'border-red-600 bg-red-600/10 text-red-600 dark:text-red-500 dark:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : isDark
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
            }`}
            id="nav-cart-trigger"
          >
            {cartCount > 0 ? (
              <motion.div
                key={cartCount}
                initial={{ scale: 0.7, rotate: -10 }}
                animate={{ scale: [1.25, 0.9, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.4 }}
                className="relative flex items-center justify-center gap-1"
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-red-600 dark:text-red-500 fill-red-500/30 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" />

                  {/* Animated Fire Flame Effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.35, 0.95, 1.2, 1],
                      y: [-1, -3, 0, -2, -1],
                      rotate: [-8, 8, -4, 4, -8],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.55,
                      ease: 'easeInOut'
                    }}
                    className="absolute -top-2.5 -right-2 flex items-center justify-center"
                  >
                    <Flame className="w-4 h-4 fill-amber-400 text-red-600 drop-shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}

            <span className={`hidden sm:inline ${cartCount > 0 ? 'text-red-600 dark:text-red-500 font-extrabold' : ''}`}>
              BAG
            </span>

            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [1.4, 1] }}
                key={`badge-${cartCount}`}
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.9)]"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

