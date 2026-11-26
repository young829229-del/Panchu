import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { PanchuLogo } from './PanchuLogo';
import { useRecommendedProducts } from '../hooks/useRecommendedProducts';

interface SimpleSliderRecommendationsProps {
  currentProduct: Product;
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  theme?: 'light' | 'dark';
}

type TransitionPhase = 'idle' | 'entering' | 'fading-logo' | 'exiting';

/**
 * Design 3 — Simple Sideways Horizontal Slider
 * Clean, minimal single-row sideways product slider synced with real Firebase products.
 * Supports smooth mobile finger swiping, smooth inertial desktop mouse dragging,
 * left/right scroll buttons, and the full-screen Panchu logo click transition.
 */
export const SimpleSliderRecommendations: React.FC<SimpleSliderRecommendationsProps> = ({
  currentProduct,
  products: propProducts,
  onSelectProduct,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const recommendedProducts = useRecommendedProducts(currentProduct, propProducts);

  const sliderRef = useRef<HTMLDivElement>(null);
  const momentumRafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    velocityPxPerMs: 0,
    scrollLeft: 0,
    movedDistance: 0
  });
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const stopMomentum = useCallback(() => {
    if (momentumRafRef.current !== null) {
      window.cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  }, []);

  const updateScrollButtons = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const timer = window.setTimeout(updateScrollButtons, 150);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [recommendedProducts, updateScrollButtons]);

  useEffect(() => {
    stopMomentum();
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'auto' });
      updateScrollButtons();
    }
  }, [currentProduct.id, stopMomentum, updateScrollButtons]);

  useEffect(() => {
    return () => stopMomentum();
  }, [stopMomentum]);

  // Smooth inertial glide after releasing desktop mouse drag
  const startInertiaScroll = useCallback(
    (initialVelocityPxPerMs: number) => {
      stopMomentum();
      const el = sliderRef.current;
      if (!el) return;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      // Convert cursor velocity (right drag = scroll left) to frame velocity
      let velocityPerFrame = -initialVelocityPxPerMs * 16;
      if (Math.abs(velocityPerFrame) < 0.75) return;

      const step = () => {
        const container = sliderRef.current;
        if (!container || dragStateRef.current.active) {
          momentumRafRef.current = null;
          return;
        }

        container.scrollLeft += velocityPerFrame;
        velocityPerFrame *= 0.93;
        updateScrollButtons();

        const maxScroll = container.scrollWidth - container.clientWidth;
        const hitBoundary =
          (container.scrollLeft <= 0 && velocityPerFrame < 0) ||
          (container.scrollLeft >= maxScroll - 1 && velocityPerFrame > 0);

        if (Math.abs(velocityPerFrame) < 0.35 || hitBoundary) {
          momentumRafRef.current = null;
          return;
        }

        momentumRafRef.current = window.requestAnimationFrame(step);
      };

      momentumRafRef.current = window.requestAnimationFrame(step);
    },
    [stopMomentum, updateScrollButtons]
  );

  // Desktop mouse drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = sliderRef.current;
      const st = dragStateRef.current;
      if (!el || !st.active) return;

      const now = performance.now();
      const dt = Math.max(1, now - st.lastTime);
      const instantVelocity = (e.clientX - st.lastX) / dt;
      // Exponential smoothing for clean inertial release
      st.velocityPxPerMs = st.velocityPxPerMs * 0.45 + instantVelocity * 0.55;
      st.lastX = e.clientX;
      st.lastTime = now;

      const dx = e.clientX - st.startX;
      st.movedDistance = Math.max(st.movedDistance, Math.abs(dx));
      el.scrollLeft = st.scrollLeft - dx;
    };

    const handleMouseUp = () => {
      const st = dragStateRef.current;
      if (!st.active) return;
      st.active = false;
      setIsDragging(false);

      const ageMs = performance.now() - st.lastTime;
      if (ageMs < 90 && st.movedDistance > 6) {
        startInertiaScroll(st.velocityPxPerMs);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleMouseUp);
    };
  }, [isDragging, startInertiaScroll]);

  const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = sliderRef.current;
    if (!el) return;

    stopMomentum();
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocityPxPerMs: 0,
      scrollLeft: el.scrollLeft,
      movedDistance: 0
    };
    setIsDragging(true);
  };

  const scrollSliderBy = (direction: 'left' | 'right') => {
    const el = sliderRef.current;
    if (!el) return;
    stopMomentum();
    const step = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth'
    });
  };

  // Full-screen Panchu Logo click transition
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

    const tFadeLogo = window.setTimeout(() => {
      setTransitionPhase('fading-logo');
    }, 680);

    const tNavigate = window.setTimeout(() => {
      onSelectProduct(targetProduct);
      setTransitionPhase('exiting');
    }, 1260);

    const tFinish = window.setTimeout(() => {
      setTransitionTarget(null);
      setTransitionPhase('idle');
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }, 1580);

    timersRef.current = [tFadeLogo, tNavigate, tFinish];
  };

  const handleCardClick = (e: React.MouseEvent, targetProduct: Product) => {
    e.preventDefault();
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
          key={`panchu-slider-transition-${transitionTarget.id}`}
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
      <div className="relative w-full">
        {canScrollLeft && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              scrollSliderBy('left');
            }}
            aria-label="Slide left"
            className={`hidden md:flex items-center justify-center absolute left-2 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow-md transition-colors duration-200 cursor-pointer backdrop-blur-sm opacity-95 hover:opacity-100 ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-white hover:text-black'
                : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-black hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              scrollSliderBy('right');
            }}
            aria-label="Slide right"
            className={`hidden md:flex items-center justify-center absolute right-2 top-[40%] -translate-y-1/2 z-20 w-10 h-10 rounded-full border shadow-md transition-colors duration-200 cursor-pointer backdrop-blur-sm opacity-95 hover:opacity-100 ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-white hover:text-black'
                : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-black hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={sliderRef}
          onMouseDown={handleSliderMouseDown}
          onScroll={updateScrollButtons}
          onDragStart={(e) => e.preventDefault()}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            touchAction: 'pan-x pan-y'
          }}
          className={`flex flex-row flex-nowrap items-stretch gap-3.5 sm:gap-5 md:gap-6 overflow-x-auto overflow-y-hidden pb-2 px-1 sm:px-2 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          aria-label="Horizontal product slider"
        >
          {recommendedProducts.map((item, idx) => {
            const productUrl = `/product/${item.id}`;
            const displayType =
              item.typeLabel ||
              (item.gender === 'female' ? "Women's" : item.gender === 'male' ? "Men's" : 'Unisex');

            return (
              <a
                key={`slider-${item.id}`}
                href={productUrl}
                draggable={false}
                onClick={(e) => handleCardClick(e, item)}
                className="group relative flex-shrink-0 w-[160px] sm:w-[214px] md:w-[244px] lg:w-[260px] flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 cursor-pointer"
                aria-label={`${item.name} — Rs ${item.price.toLocaleString()}`}
              >
                {/* Clean Flat Product Image Frame */}
                <div
                  className={`relative w-full aspect-square overflow-hidden border transition-colors duration-200 ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-800 group-hover:border-neutral-600'
                      : 'bg-white border-stone-200 group-hover:border-black'
                  }`}
                >
                  <div className="w-full h-full [&_img]:pointer-events-none [&_img]:select-none">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      priority={idx < 4}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>

                {/* Clean Product Info */}
                <div className="pt-2.5 sm:pt-3 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-montserrat uppercase tracking-wider">
                    <span className={isDark ? 'text-neutral-400' : 'text-stone-500'}>
                      {displayType}
                    </span>
                    {!item.inStock && (
                      <span className="text-red-600 font-semibold">Out of Stock</span>
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
                    Rs {item.price > 0 ? item.price.toLocaleString() : item.priceDisplay || '1,850'}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {typeof document !== 'undefined' ? createPortal(transitionOverlay, document.body) : transitionOverlay}
    </>
  );
};
