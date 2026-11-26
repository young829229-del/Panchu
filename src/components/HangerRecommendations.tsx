import React, { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { PanchuLogo } from './PanchuLogo';
import { getFloatingSpeedScale, subscribeProducts } from '../services/firebaseService';

interface HangerRecommendationsProps {
  currentProduct: Product;
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  theme?: 'light' | 'dark';
  enableShadow?: boolean;
  shadowIntensity?: number;
  enableFloatingAnimation?: boolean;
  animationSpeed?: number;
}

type TransitionPhase = 'idle' | 'entering' | 'fading-logo' | 'exiting';

/**
 * Architectural Vector Coat Hanger SVG:
 * Chrome steel hook engineered to hook directly onto the horizontal metal clothing rail,
 * connected via a brushed collar to sculpted matte shoulders that hold each garment.
 */
const GarmentHangerGraphic: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const uid = useId().replace(/:/g, '');
  const hookGradId = `panchu-hook-${uid}`;
  const bodyGradId = `panchu-body-${uid}`;

  const shoulderFill = isDark ? '#27272a' : '#1c1917';
  const shoulderHighlight = isDark ? '#52525b' : '#44403c';
  const shoulderShadow = isDark ? '#09090b' : '#0c0a09';
  const hookLight = '#f4f4f5';
  const hookMid = '#a1a1aa';
  const hookDark = '#52525b';

  return (
    <svg
      viewBox="0 0 220 74"
      className="w-full h-[64px] sm:h-[70px] md:h-[74px] block overflow-visible pointer-events-none select-none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={hookGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hookLight} />
          <stop offset="45%" stopColor={hookMid} />
          <stop offset="100%" stopColor={hookDark} />
        </linearGradient>
        <linearGradient id={bodyGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={shoulderHighlight} />
          <stop offset="35%" stopColor={shoulderFill} />
          <stop offset="100%" stopColor={shoulderShadow} />
        </linearGradient>
      </defs>

      {/* Curved chrome hook wrapping over the horizontal metal rail (rail sits around y=22..32) */}
      <path
        d="M 110 43 L 110 34 C 110 29, 98 28, 98 19 C 98 10.5, 105.5 6, 113 6 C 120.5 6, 125.5 11.5, 125.5 18.5 C 125.5 22.5, 123 25.5, 120 27"
        fill="none"
        stroke={`url(#${hookGradId})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tiny contact highlight on top arc of hook */}
      <path
        d="M 101.5 14 C 103.5 9, 109.5 7.2, 115.5 8"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.65"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Brushed steel swivel collar */}
      <rect
        x="105.5"
        y="40"
        width="9"
        height="7"
        rx="2"
        fill={`url(#${hookGradId})`}
      />

      {/* Sculpted hanger shoulders */}
      <path
        d="M 110 45 C 101 45, 58 55.5, 16 64.5 C 9.5 66, 7.5 71.5, 13.5 72.5 L 206.5 72.5 C 212.5 71.5, 210.5 66, 204 64.5 C 162 55.5, 119 45, 110 45 Z"
        fill={`url(#${bodyGradId})`}
      />
      {/* Subtle top bevel edge on hanger shoulders */}
      <path
        d="M 17 65.2 C 58 56.2, 100 46.2, 110 46.2 C 120 46.2, 162 56.2, 203 65.2"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const HangerRecommendations: React.FC<HangerRecommendationsProps> = ({
  currentProduct,
  products: propProducts,
  onSelectProduct,
  theme = 'light',
  enableShadow = true,
  shadowIntensity = 50,
  enableFloatingAnimation = false,
  animationSpeed = 50
}) => {
  const isDark = theme === 'dark';
  const floatSpeedScale = getFloatingSpeedScale(animationSpeed);
  const clampedIntensity = Math.max(0, Math.min(100, shadowIntensity)) / 100;
  const computedBoxShadow =
    enableShadow && clampedIntensity > 0
      ? `0 ${Math.round(6 + clampedIntensity * 16)}px ${Math.round(10 + clampedIntensity * 38)}px ${Math.round(
          -4 - clampedIntensity * 8
        )}px rgba(0, 0, 0, ${(isDark ? 0.35 + clampedIntensity * 0.55 : 0.08 + clampedIntensity * 0.24).toFixed(3)})`
      : 'none';

  // Real-time products directly synced with Firestore 'products' collection
  const [liveFirebaseProducts, setLiveFirebaseProducts] = useState<Product[]>([]);
  const [hasFirebaseLoaded, setHasFirebaseLoaded] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeProducts((fetched) => {
      setLiveFirebaseProducts(fetched);
      setHasFirebaseLoaded(true);
    }, false);

    return () => unsubscribe();
  }, []);

  // Build deduplicated, valid, non-empty recommendation list excluding current product
  const recommendedProducts = useMemo(() => {
    const source = hasFirebaseLoaded && liveFirebaseProducts.length > 0
      ? liveFirebaseProducts
      : (propProducts && propProducts.length > 0 ? propProducts : liveFirebaseProducts);

    const currentId = (currentProduct.id || '').trim();
    const currentAltId = (currentProduct.productId || '').trim();
    const seenIds = new Set<string>();
    const filtered: Product[] = [];

    for (const item of source) {
      if (!item) continue;
      if (item.active === false) continue;

      const itemId = (item.id || '').trim();
      const itemAltId = (item.productId || '').trim();

      // Exclude currently opened product
      if (
        (currentId && (itemId === currentId || itemAltId === currentId)) ||
        (currentAltId && (itemId === currentAltId || itemAltId === currentAltId))
      ) {
        continue;
      }

      // Require real product image
      if (!item.image || typeof item.image !== 'string' || item.image.trim().length === 0) {
        continue;
      }

      const canonicalKey = (itemId || itemAltId).toLowerCase();
      if (!canonicalKey || seenIds.has(canonicalKey)) {
        continue;
      }

      seenIds.add(canonicalKey);
      filtered.push(item);
    }

    // Prioritize matching gender / unisex items first on the rail while keeping full catalog accessible
    return filtered.sort((a, b) => {
      const aMatch = a.gender === currentProduct.gender ? 2 : a.gender === 'unisex' ? 1 : 0;
      const bMatch = b.gender === currentProduct.gender ? 2 : b.gender === 'unisex' ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      const aFeat = a.bestSelling || a.featured ? 1 : 0;
      const bFeat = b.bestSelling || b.featured ? 1 : 0;
      return bFeat - aFeat;
    });
  }, [hasFirebaseLoaded, liveFirebaseProducts, propProducts, currentProduct]);

  // Horizontal rail scroll & desktop drag state
  const railScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    movedDistance: 0
  });
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const updateScrollButtons = useCallback(() => {
    const el = railScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const timer = setTimeout(updateScrollButtons, 150);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [recommendedProducts, updateScrollButtons]);

  // Reset rail scroll position when opening a new product
  useEffect(() => {
    if (railScrollRef.current) {
      railScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
      updateScrollButtons();
    }
  }, [currentProduct.id, updateScrollButtons]);

  // Desktop mouse drag handlers (window listeners prevent sticky drag if cursor exits track)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = railScrollRef.current;
      if (!el || !dragStateRef.current.active) return;
      const dx = e.clientX - dragStateRef.current.startX;
      dragStateRef.current.movedDistance = Math.max(dragStateRef.current.movedDistance, Math.abs(dx));
      el.scrollLeft = dragStateRef.current.scrollLeft - dx * 1.15;
    };

    const handleMouseUp = () => {
      dragStateRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleMouseUp);
    };
  }, [isDragging]);

  const handleRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = railScrollRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      movedDistance: 0
    };
    setIsDragging(true);
  };

  const scrollRackBy = (direction: 'left' | 'right') => {
    const el = railScrollRef.current;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth'
    });
  };

  // Full-screen Panchu Logo click transition state
  const [transitionTarget, setTransitionTarget] = useState<Product | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');
  const timersRef = useRef<number[]>([]);

  const clearTransitionTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [clearTransitionTimers]);

  const triggerProductTransition = (targetProduct: Product) => {
    if (transitionPhase !== 'idle') return;

    clearTransitionTimers();
    setTransitionTarget(targetProduct);
    setTransitionPhase('entering');

    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const tNav = window.setTimeout(() => {
        onSelectProduct(targetProduct);
        setTransitionPhase('exiting');
      }, 280);
      const tDone = window.setTimeout(() => {
        setTransitionTarget(null);
        setTransitionPhase('idle');
        if (typeof document !== 'undefined') {
          document.body.style.overflow = '';
        }
      }, 520);
      timersRef.current = [tNav, tDone];
      return;
    }

    // 1. Logo appears smoothly cleanly in center (~0-620ms), holds briefly
    const tFadeLogo = window.setTimeout(() => {
      setTransitionPhase('fading-logo');
    }, 680);

    // 2. Navigate to existing product details page right as logo finishes fading out
    const tNavigate = window.setTimeout(() => {
      onSelectProduct(targetProduct);
      setTransitionPhase('exiting');
    }, 1260);

    // 3. Gently dissolve overlay to reveal the destination ProductDetailPage
    const tFinish = window.setTimeout(() => {
      setTransitionTarget(null);
      setTransitionPhase('idle');
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }, 1580);

    timersRef.current = [tFadeLogo, tNavigate, tFinish];
  };

  const handleHangingItemClick = (e: React.MouseEvent, targetProduct: Product) => {
    e.preventDefault();
    // Ignore click if user was horizontally dragging on desktop
    if (dragStateRef.current.movedDistance > 6) {
      dragStateRef.current.movedDistance = 0;
      return;
    }
    triggerProductTransition(targetProduct);
  };

  if (recommendedProducts.length === 0) {
    return null;
  }

  const transitionOverlay = (
    <AnimatePresence>
      {transitionTarget && transitionPhase !== 'idle' && (
        <motion.div
          key={`panchu-transition-${transitionTarget.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: transitionPhase === 'exiting' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: transitionPhase === 'exiting' ? 0.34 : 0.28,
            ease: [0.16, 1, 0.3, 1]
          }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto ${
            isDark ? 'bg-neutral-950' : 'bg-white'
          }`}
          role="presentation"
          aria-live="polite"
          aria-label={`Opening ${transitionTarget.name}`}
        >
          {/* Subtle ambient radial studio glow centered behind official logo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle at center, rgba(220,38,38,0.08) 0%, transparent 55%)'
                : 'radial-gradient(circle at center, rgba(220,38,38,0.04) 0%, transparent 55%)'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={
              transitionPhase === 'fading-logo' || transitionPhase === 'exiting'
                ? { opacity: 0, scale: 1.03 }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: transitionPhase === 'fading-logo' ? 0.56 : 0.44,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative flex flex-col items-center justify-center px-6"
          >
            <PanchuLogo size="xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="relative w-full group/rack">
        {/* Desktop Left Scroll Control */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollRackBy('left')}
            aria-label="Scroll rack left"
            className={`hidden md:flex items-center justify-center absolute left-2 top-[44%] -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow-md transition-all duration-200 cursor-pointer backdrop-blur-sm opacity-90 hover:opacity-100 hover:scale-105 ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-white hover:text-black'
                : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-black hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Right Scroll Control */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollRackBy('right')}
            aria-label="Scroll rack right"
            className={`hidden md:flex items-center justify-center absolute right-2 top-[44%] -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow-md transition-all duration-200 cursor-pointer backdrop-blur-sm opacity-90 hover:opacity-100 hover:scale-105 ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-white hover:text-black'
                : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-black hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Continuous Horizontal Metal Clothing Rail & Architectural End Brackets */}
        <div
          className="relative w-full"
          aria-label="Swipe or drag horizontally to browse hanging products"
        >
          {/* Left Rail Bracket Finial */}
          <div
            aria-hidden="true"
            className={`absolute left-0 top-[11px] w-2.5 h-[22px] rounded-r-sm z-[6] shadow-xs ${
              isDark
                ? 'bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-800'
                : 'bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600'
            }`}
          />
          {/* Right Rail Bracket Finial */}
          <div
            aria-hidden="true"
            className={`absolute right-0 top-[11px] w-2.5 h-[22px] rounded-l-sm z-[6] shadow-xs ${
              isDark
                ? 'bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-800'
                : 'bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600'
            }`}
          />

          {/* Horizontal Brushed Steel Metal Rod */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[17px] h-[9px] sm:h-[10px] z-[5] pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(180deg, #52525b 0%, #e4e4e7 30%, #ffffff 48%, #a1a1aa 72%, #3f3f46 100%)'
                : 'linear-gradient(180deg, #a1a1aa 0%, #f4f4f5 30%, #ffffff 48%, #d4d4d8 72%, #71717a 100%)',
              boxShadow: isDark
                ? '0 5px 12px rgba(0, 0, 0, 0.55)'
                : '0 4px 10px rgba(0, 0, 0, 0.14)'
            }}
          />

          {/* Horizontally Swipeable (Mobile) & Draggable (Desktop) Garment Hanger Track */}
          <div
            ref={railScrollRef}
            onMouseDown={handleRailMouseDown}
            onScroll={updateScrollButtons}
            onDragStart={(e) => e.preventDefault()}
            className={`relative z-10 flex items-start gap-5 sm:gap-7 md:gap-8 overflow-x-auto pt-[6px] pb-6 px-4 sm:px-8 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {recommendedProducts.map((item, idx) => {
              const productUrl = `/product/${item.id}`;
              const displayType = item.typeLabel || (item.gender === 'female' ? "Women's" : item.gender === 'male' ? "Men's" : 'Unisex');
              const floatDurations = [3.9, 4.4, 4.8, 4.1, 4.6];
              const baseDuration = floatDurations[idx % floatDurations.length];
              const floatStyle = enableFloatingAnimation
                ? ({
                    '--panchu-float-base-duration': `${baseDuration}s`,
                    '--panchu-float-speed-scale': String(floatSpeedScale),
                    animationDelay: `${-((idx * 0.9 * floatSpeedScale) % (baseDuration * floatSpeedScale)).toFixed(2)}s`
                  } as React.CSSProperties)
                : undefined;

              return (
                <a
                  key={`hanger-${item.id}`}
                  href={productUrl}
                  draggable={false}
                  onClick={(e) => handleHangingItemClick(e, item)}
                  className="group relative flex-shrink-0 w-[172px] sm:w-[204px] md:w-[224px] flex flex-col items-stretch text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 cursor-pointer"
                  aria-label={`${item.name} — Rs ${item.price.toLocaleString()}`}
                >
                  <div
                    className={enableFloatingAnimation ? 'panchu-floating-item w-full' : 'w-full'}
                    style={floatStyle}
                  >
                    {/* Suspended Hanger + Garment Assembly with gentle natural rack sway on hover */}
                    <div className="w-full origin-top transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[0.6deg]">
                      {/* Hanger Hook & Contoured Shoulder */}
                      <div className="relative z-10 w-full px-1">
                        <GarmentHangerGraphic isDark={isDark} />
                      </div>

                      {/* Garment Card Hanging Directly Beneath Hanger Shoulders */}
                      <div
                        className={`relative -mt-[5px] w-full aspect-[4/5] overflow-hidden border transition-all duration-200 ${
                          isDark
                            ? 'bg-neutral-950 border-neutral-800 group-hover:border-neutral-600'
                            : 'bg-white border-stone-200 group-hover:border-stone-400'
                        }`}
                        style={{ boxShadow: computedBoxShadow }}
                      >
                        {enableShadow && (
                          <div
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/15 to-transparent z-10 pointer-events-none"
                          />
                        )}

                        <div className="w-full h-full [&_img]:pointer-events-none [&_img]:select-none">
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            priority={idx < 4}
                            className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clean Editorial Product Details Below Hanging Garment */}
                    <div className="pt-3 px-0.5 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-montserrat uppercase tracking-wider">
                        <span className={isDark ? 'text-neutral-400' : 'text-stone-500'}>
                          {displayType}
                        </span>
                        {!item.inStock && (
                          <span className="text-red-600 font-semibold">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-xs sm:text-sm font-montserrat font-semibold uppercase tracking-tight line-clamp-1 transition-colors ${
                          isDark
                            ? 'text-white group-hover:text-stone-300'
                            : 'text-stone-900 group-hover:text-black'
                        }`}
                      >
                        {item.name}
                      </h3>

                      <p
                        className={`text-xs sm:text-sm font-montserrat font-bold tabular-nums ${
                          isDark ? 'text-stone-200' : 'text-stone-900'
                        }`}
                      >
                        Rs {item.price > 0 ? item.price.toLocaleString() : (item.priceDisplay || '1,850')}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-Screen Panchu Logo Transition Overlay */}
      {typeof document !== 'undefined' ? createPortal(transitionOverlay, document.body) : transitionOverlay}
    </>
  );
};
