import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { PanchuLogo } from './PanchuLogo';
import { useRecommendedProducts } from '../hooks/useRecommendedProducts';
import { getFloatingSpeedScale } from '../services/firebaseService';

interface ThreeDRotatingCarouselProps {
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

function getWrappedOffset(index: number, virtualPos: number, count: number): number {
  if (count <= 0) return 0;
  if (count < 3) return index - virtualPos;
  const half = count / 2;
  let diff = (index - virtualPos) % count;
  if (diff < -half) diff += count;
  if (diff >= half) diff -= count;
  if (diff <= -half) diff += count;
  return diff;
}

function normalizePositiveIndex(pos: number, count: number): number {
  if (count <= 0) return 0;
  return ((Math.round(pos) % count) + count) % count;
}

/**
 * Design 2 — 3D Rotating Floating Product Carousel
 * Displays a prominent floating center garment flanked by smaller angled side garments
 * in true CSS 3D perspective space. Supports continuous touch swipe & desktop mouse drag,
 * live Firebase product data, original uncropped-tone photography, and the full-screen
 * Panchu logo transition before navigating to the selected product details page.
 */
export const ThreeDRotatingCarousel: React.FC<ThreeDRotatingCarouselProps> = ({
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
  const centerBoxShadow =
    enableShadow && clampedIntensity > 0
      ? `0 ${Math.round(8 + clampedIntensity * 20)}px ${Math.round(14 + clampedIntensity * 44)}px ${Math.round(
          -6 - clampedIntensity * 10
        )}px rgba(0, 0, 0, ${(isDark ? 0.4 + clampedIntensity * 0.55 : 0.1 + clampedIntensity * 0.26).toFixed(3)})`
      : 'none';
  const sideBoxShadow =
    enableShadow && clampedIntensity > 0
      ? `0 ${Math.round(6 + clampedIntensity * 12)}px ${Math.round(10 + clampedIntensity * 26)}px ${Math.round(
          -4 - clampedIntensity * 8
        )}px rgba(0, 0, 0, ${(isDark ? 0.3 + clampedIntensity * 0.45 : 0.06 + clampedIntensity * 0.16).toFixed(3)})`
      : 'none';
  const recommendedProducts = useRecommendedProducts(currentProduct, propProducts);
  const count = recommendedProducts.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const shadowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Responsive spacing state (mobile / tablet / desktop)
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 640) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const updateMode = () => {
      if (window.innerWidth < 640) setViewportMode('mobile');
      else if (window.innerWidth < 1024) setViewportMode('tablet');
      else setViewportMode('desktop');
    };
    updateMode();
    window.addEventListener('resize', updateMode);
    return () => window.removeEventListener('resize', updateMode);
  }, []);

  // Continuous physics position (virtual float; integer snaps represent centered item)
  const currentPosRef = useRef<number>(0);
  const targetPosRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const [activeCenteredIndex, setActiveCenteredIndex] = useState<number>(0);

  // Drag / Swipe state
  const [isDraggingUI, setIsDraggingUI] = useState<boolean>(false);
  const dragRef = useRef<{
    active: boolean;
    pointerType: 'mouse' | 'touch' | null;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocityPxPerMs: number;
    baseTargetPos: number;
    movedPx: number;
    axisLock: 'horizontal' | 'vertical' | null;
  }>({
    active: false,
    pointerType: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocityPxPerMs: 0,
    baseTargetPos: 0,
    movedPx: 0,
    axisLock: null
  });

  // Reset carousel to index 0 when switching to a different currentProduct
  useEffect(() => {
    currentPosRef.current = 0;
    targetPosRef.current = 0;
    setActiveCenteredIndex(0);
  }, [currentProduct.id]);

  // Apply 3D transforms directly at 60-120fps without triggering React re-renders
  const applyCarouselTransforms = useCallback(() => {
    if (count === 0) return;

    const spacingX =
      viewportMode === 'mobile' ? 148 : viewportMode === 'tablet' ? 208 : 254;
    const dragReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pos = currentPosRef.current;

    recommendedProducts.forEach((item, idx) => {
      const cardEl = cardRefs.current.get(item.id);
      if (!cardEl) return;

      const d = getWrappedOffset(idx, pos, count);
      const absD = Math.abs(d);

      // Perspective arc X translation (slightly tucked on outer edges for orbital feel)
      const curveCompression = 1 - Math.min(absD, 2.2) * 0.085;
      const translateX = d * spacingX * curveCompression;

      // Floating vertical & Z depth arc (center rises and floats forward; sides angle back)
      const centerLift = Math.max(0, 1 - Math.min(absD, 1)) * 10;
      const sideDrop = Math.min(absD, 2) * 12;
      const translateY = sideDrop - centerLift;
      const translateZ = 75 - Math.min(absD, 2.4) * 135;

      // 3D Y-axis rotation wrapping outward around a cylindrical drum
      const rawRotateY = dragReducedMotion ? 0 : Math.max(-42, Math.min(42, d * 26));

      // Scale prominence
      const scale = Math.max(0.56, 1 - Math.min(absD, 2.2) * 0.21);

      // Opacity & visibility culling for distant items behind the arc
      const visibleCutoff = count >= 5 ? 2.15 : 1.75;
      let opacity = 1;
      if (absD <= 1) {
        opacity = 1 - absD * 0.14;
      } else {
        const t = Math.min(1, (absD - 1) / (visibleCutoff - 1));
        opacity = Math.max(0, 0.86 * (1 - t));
      }

      const zIndex = Math.round(60 - absD * 18);
      const isHidden = absD > visibleCutoff + 0.05;

      cardEl.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, ${translateZ.toFixed(2)}px) rotateY(${rawRotateY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      cardEl.style.opacity = opacity.toFixed(3);
      cardEl.style.zIndex = String(zIndex);
      cardEl.style.visibility = isHidden ? 'hidden' : 'visible';
      cardEl.style.pointerEvents = absD < 1.35 && !isHidden ? 'auto' : 'none';

      // Ambient floating floor shadow underneath each card (strongest under center floating product)
      const shadowEl = shadowRefs.current.get(item.id);
      if (shadowEl) {
        if (!enableShadow || clampedIntensity <= 0) {
          shadowEl.style.opacity = '0';
        } else {
          const shadowOpacity = Math.max(0, 1 - Math.min(absD, 1.5) * 0.65);
          const intensityScale = 0.25 + clampedIntensity * 1.15;
          shadowEl.style.opacity = Math.min(
            0.9,
            shadowOpacity * (isDark ? 0.55 : 0.3) * intensityScale
          ).toFixed(3);
        }
      }
    });
  }, [count, recommendedProducts, viewportMode, isDark, enableShadow, clampedIntensity]);

  // Continuous critically-damped animation loop
  const ensureAnimationLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;

    const tick = () => {
      const current = currentPosRef.current;
      const target = targetPosRef.current;
      const diff = target - current;

      // Responsive spring interpolation: crisp track when dragging, silky settle on release
      const lerpFactor = dragRef.current.active && dragRef.current.axisLock === 'horizontal' ? 0.38 : 0.16;

      if (Math.abs(diff) < 0.0008 && !dragRef.current.active) {
        currentPosRef.current = target;
        applyCarouselTransforms();
        rafIdRef.current = null;

        // Keep numbers bounded silently once settled cleanly
        if (count >= 3 && Math.abs(targetPosRef.current) > count * 8) {
          const wrapped = normalizePositiveIndex(targetPosRef.current, count);
          currentPosRef.current = wrapped;
          targetPosRef.current = wrapped;
        }
        return;
      }

      currentPosRef.current = current + diff * lerpFactor;
      applyCarouselTransforms();

      // Update active index badge when nearest integer changes
      if (count > 0) {
        const nearest = normalizePositiveIndex(currentPosRef.current, count);
        setActiveCenteredIndex((prev) => (prev === nearest ? prev : nearest));
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
  }, [applyCarouselTransforms, count]);

  // Initial layout & cleanup
  useEffect(() => {
    applyCarouselTransforms();
    ensureAnimationLoop();
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [applyCarouselTransforms, ensureAnimationLoop]);

  const dragStepPx = viewportMode === 'mobile' ? 155 : viewportMode === 'tablet' ? 210 : 250;

  const rotateToOffset = useCallback(
    (deltaSteps: number) => {
      if (count <= 1) return;
      const next = targetPosRef.current + deltaSteps;
      if (count < 3) {
        targetPosRef.current = Math.max(0, Math.min(count - 1, Math.round(next)));
      } else {
        targetPosRef.current = Math.round(next);
      }
      setActiveCenteredIndex(normalizePositiveIndex(targetPosRef.current, count));
      ensureAnimationLoop();
    },
    [count, ensureAnimationLoop]
  );

  const rotateToSpecificIndex = useCallback(
    (targetIdx: number) => {
      if (count <= 1) return;
      if (count < 3) {
        targetPosRef.current = Math.max(0, Math.min(count - 1, targetIdx));
      } else {
        const diff = getWrappedOffset(targetIdx, Math.round(targetPosRef.current), count);
        targetPosRef.current = Math.round(targetPosRef.current) + diff;
      }
      setActiveCenteredIndex(normalizePositiveIndex(targetPosRef.current, count));
      ensureAnimationLoop();
    },
    [count, ensureAnimationLoop]
  );

  // Desktop mouse drag handlers
  useEffect(() => {
    if (!isDraggingUI) return;

    const handleMouseMove = (e: MouseEvent) => {
      const st = dragRef.current;
      if (!st.active || st.pointerType !== 'mouse') return;

      const dx = e.clientX - st.startX;
      st.movedPx = Math.max(st.movedPx, Math.abs(dx));

      if (st.movedPx > 4) {
        st.axisLock = 'horizontal';
      }

      const now = performance.now();
      const dt = Math.max(1, now - st.lastTime);
      st.velocityPxPerMs = (e.clientX - st.lastX) / dt;
      st.lastX = e.clientX;
      st.lastTime = now;

      let nextPos = st.baseTargetPos - dx / dragStepPx;
      if (count < 3) {
        // Gentle elastic bounds when fewer than 3 items
        if (nextPos < 0) nextPos *= 0.35;
        if (nextPos > count - 1) nextPos = count - 1 + (nextPos - (count - 1)) * 0.35;
      }
      targetPosRef.current = nextPos;
      ensureAnimationLoop();
    };

    const handleMouseUp = () => {
      const st = dragRef.current;
      if (!st.active || st.pointerType !== 'mouse') return;

      st.active = false;
      setIsDraggingUI(false);

      const deltaSlots = targetPosRef.current - st.baseTargetPos;
      const momentumSlots = -st.velocityPxPerMs * 110 / dragStepPx;
      let snapped: number;

      if (Math.abs(deltaSlots) > 0.18 || Math.abs(momentumSlots) > 0.25) {
        const dir = deltaSlots + momentumSlots >= 0 ? 1 : -1;
        snapped = Math.abs(deltaSlots) >= 0.85
          ? Math.round(targetPosRef.current)
          : Math.round(st.baseTargetPos) + dir;
      } else {
        snapped = Math.round(st.baseTargetPos);
      }

      if (count < 3) {
        snapped = Math.max(0, Math.min(count - 1, snapped));
      }

      targetPosRef.current = snapped;
      setActiveCenteredIndex(normalizePositiveIndex(snapped, count));
      ensureAnimationLoop();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleMouseUp);
    };
  }, [isDraggingUI, count, dragStepPx, ensureAnimationLoop]);

  const handleStageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || count <= 1) return;
    dragRef.current = {
      active: true,
      pointerType: 'mouse',
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocityPxPerMs: 0,
      baseTargetPos: Math.round(currentPosRef.current),
      movedPx: 0,
      axisLock: null
    };
    setIsDraggingUI(true);
  };

  // Mobile touch gesture handlers
  const handleStageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (count <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragRef.current = {
      active: true,
      pointerType: 'touch',
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastTime: performance.now(),
      velocityPxPerMs: 0,
      baseTargetPos: Math.round(currentPosRef.current),
      movedPx: 0,
      axisLock: null
    };
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st.active || st.pointerType !== 'touch' || e.touches.length !== 1) return;
    const touch = e.touches[0];

    const dx = touch.clientX - st.startX;
    const dy = touch.clientY - st.startY;
    st.movedPx = Math.max(st.movedPx, Math.abs(dx));

    if (st.axisLock === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      st.axisLock = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    if (st.axisLock !== 'horizontal') return;

    const now = performance.now();
    const dt = Math.max(1, now - st.lastTime);
    st.velocityPxPerMs = (touch.clientX - st.lastX) / dt;
    st.lastX = touch.clientX;
    st.lastTime = now;

    let nextPos = st.baseTargetPos - dx / dragStepPx;
    if (count < 3) {
      if (nextPos < 0) nextPos *= 0.35;
      if (nextPos > count - 1) nextPos = count - 1 + (nextPos - (count - 1)) * 0.35;
    }
    targetPosRef.current = nextPos;
    ensureAnimationLoop();
  };

  const handleStageTouchEnd = () => {
    const st = dragRef.current;
    if (!st.active || st.pointerType !== 'touch') return;

    st.active = false;
    if (st.axisLock !== 'horizontal') return;

    const deltaSlots = targetPosRef.current - st.baseTargetPos;
    const momentumSlots = -st.velocityPxPerMs * 110 / dragStepPx;
    let snapped: number;

    if (Math.abs(deltaSlots) > 0.16 || Math.abs(momentumSlots) > 0.22) {
      const dir = deltaSlots + momentumSlots >= 0 ? 1 : -1;
      snapped = Math.abs(deltaSlots) >= 0.85
        ? Math.round(targetPosRef.current)
        : Math.round(st.baseTargetPos) + dir;
    } else {
      snapped = Math.round(st.baseTargetPos);
    }

    if (count < 3) {
      snapped = Math.max(0, Math.min(count - 1, snapped));
    }

    targetPosRef.current = snapped;
    setActiveCenteredIndex(normalizePositiveIndex(snapped, count));
    ensureAnimationLoop();
  };

  // Full-screen Panchu Logo click transition state (matches Design 1 & Design 3 exactly)
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
    // Swallow accidental navigation click after swipe/drag
    if (dragRef.current.movedPx > 8) {
      dragRef.current.movedPx = 0;
      return;
    }
    triggerProductTransition(targetProduct);
  };

  if (count === 0) {
    return null;
  }

  const transitionOverlay = (
    <AnimatePresence>
      {transitionTarget && transitionPhase !== 'idle' && (
        <motion.div
          key={`panchu-3d-transition-${transitionTarget.id}`}
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

  const focusedProduct = recommendedProducts[activeCenteredIndex] || recommendedProducts[0];

  return (
    <>
      <div className="relative -mx-4 sm:mx-0 select-none">
        {/* 3D Perspective Stage */}
        <div
          ref={stageRef}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageTouchStart}
          onTouchMove={handleStageTouchMove}
          onTouchEnd={handleStageTouchEnd}
          onTouchCancel={handleStageTouchEnd}
          onDragStart={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              rotateToOffset(-1);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              rotateToOffset(1);
            }
          }}
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label="3D rotating product showcase"
          className={`relative w-full h-[330px] sm:h-[385px] lg:h-[420px] overflow-hidden focus:outline-none ${
            isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            perspective: '1150px',
            perspectiveOrigin: '50% 45%',
            transformStyle: 'preserve-3d',
            touchAction: 'pan-y'
          }}
        >
          {/* Centered 3D Origin Track */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {recommendedProducts.map((item, idx) => {
              const productUrl = `/product/${item.id}`;
              const displayType =
                item.typeLabel ||
                (item.gender === 'female' ? "Women's" : item.gender === 'male' ? "Men's" : 'Unisex');
              const isCentered = idx === activeCenteredIndex;
              const floatDurations = [3.8, 4.3, 4.7, 4.1, 4.9];
              const baseDuration = floatDurations[idx % floatDurations.length];
              const floatStyle = enableFloatingAnimation
                ? ({
                    '--panchu-float-base-duration': `${baseDuration}s`,
                    '--panchu-float-speed-scale': String(floatSpeedScale),
                    animationDelay: `${-((idx * 0.85 * floatSpeedScale) % (baseDuration * floatSpeedScale)).toFixed(2)}s`
                  } as React.CSSProperties)
                : undefined;

              return (
                <a
                  key={`3d-card-${item.id}`}
                  ref={(el) => {
                    if (el) cardRefs.current.set(item.id, el);
                    else cardRefs.current.delete(item.id);
                  }}
                  href={productUrl}
                  draggable={false}
                  onClick={(e) => handleCardClick(e, item)}
                  aria-label={`${item.name} — Rs ${item.price.toLocaleString()}`}
                  className="group absolute w-[198px] sm:w-[236px] lg:w-[268px] flex flex-col items-stretch text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 will-change-transform cursor-pointer"
                  style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  {/* Independent Subtle Vertical Float Wrapper (isolated from 3D carousel transform) */}
                  <div
                    className={enableFloatingAnimation ? 'panchu-floating-item w-full' : 'w-full'}
                    style={floatStyle}
                  >
                    {/* Floating Card Surface Preserving Original Product Photography */}
                    <div
                      className={`relative w-full aspect-square overflow-hidden border transition-all duration-200 ${
                        isDark
                          ? isCentered
                            ? 'bg-neutral-950 border-neutral-600'
                            : 'bg-neutral-950 border-neutral-800'
                          : isCentered
                            ? 'bg-white border-stone-300'
                            : 'bg-white border-stone-200'
                      }`}
                      style={{ boxShadow: isCentered ? centerBoxShadow : sideBoxShadow }}
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

                    {/* Clean Editorial Metadata Beneath Card */}
                    <div
                      className={`pt-3 px-0.5 space-y-0.5 transition-opacity duration-200 ${
                        isCentered ? 'opacity-100' : 'opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-montserrat uppercase tracking-wider">
                        <span className={isDark ? 'text-neutral-400' : 'text-stone-500'}>
                          {displayType}
                        </span>
                        {!item.inStock && (
                          <span className="text-red-600 font-semibold">Out of Stock</span>
                        )}
                      </div>

                      <h3
                        className={`text-xs sm:text-sm font-montserrat font-semibold uppercase tracking-tight line-clamp-1 ${
                          isDark ? 'text-white' : 'text-stone-900'
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
                  </div>

                  {/* Soft Floating Elliptical Floor Shadow (only rendered when Enable Shadow is on) */}
                  {enableShadow && clampedIntensity > 0 && (
                    <div
                      ref={(el) => {
                        if (el) shadowRefs.current.set(item.id, el);
                        else shadowRefs.current.delete(item.id);
                      }}
                      aria-hidden="true"
                      className="mx-auto mt-2.5 w-4/5 h-3 rounded-full pointer-events-none"
                      style={{
                        filter: `blur(${Math.round(6 + clampedIntensity * 14)}px)`,
                        background: isDark
                          ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, transparent 72%)'
                          : 'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, transparent 72%)'
                      }}
                    />
                  )}
                </a>
              );
            })}
          </div>

          {/* Left & Right Stage Navigation Buttons */}
          {count > 1 && (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  rotateToOffset(-1);
                }}
                aria-label="Previous product"
                className={`hidden sm:flex items-center justify-center absolute left-2 md:left-4 top-[42%] -translate-y-1/2 z-[75] w-10 h-10 rounded-full border shadow-md transition-all duration-200 cursor-pointer backdrop-blur-sm hover:scale-105 ${
                  isDark
                    ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-white hover:text-black'
                    : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-black hover:text-white'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  rotateToOffset(1);
                }}
                aria-label="Next product"
                className={`hidden sm:flex items-center justify-center absolute right-2 md:right-4 top-[42%] -translate-y-1/2 z-[75] w-10 h-10 rounded-full border shadow-md transition-all duration-200 cursor-pointer backdrop-blur-sm hover:scale-105 ${
                  isDark
                    ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-white hover:text-black'
                    : 'bg-white/95 border-stone-200 text-stone-900 hover:bg-black hover:text-white'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Carousel Indicator Controls */}
        {count > 1 && (
          <div className="mt-2 flex items-center justify-center gap-3 px-4">
            <button
              type="button"
              onClick={() => rotateToOffset(-1)}
              aria-label="Rotate carousel left"
              className={`sm:hidden p-2 rounded-full border transition-colors cursor-pointer ${
                isDark
                  ? 'border-neutral-700 text-neutral-300 hover:text-white'
                  : 'border-stone-300 text-stone-600 hover:text-black'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Select featured item">
              {recommendedProducts.length <= 12 ? (
                recommendedProducts.map((p, idx) => {
                  const isActive = idx === activeCenteredIndex;
                  return (
                    <button
                      key={`dot-${p.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Show ${p.name}`}
                      onClick={() => rotateToSpecificIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'w-6 bg-white'
                            : 'w-6 bg-black'
                          : isDark
                            ? 'w-1.5 bg-neutral-700 hover:bg-neutral-500'
                            : 'w-1.5 bg-stone-300 hover:bg-stone-500'
                      }`}
                    />
                  );
                })
              ) : (
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isDark ? 'text-neutral-400' : 'text-stone-600'
                  }`}
                >
                  {String(activeCenteredIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')} · {focusedProduct?.name}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => rotateToOffset(1)}
              aria-label="Rotate carousel right"
              className={`sm:hidden p-2 rounded-full border transition-colors cursor-pointer ${
                isDark
                  ? 'border-neutral-700 text-neutral-300 hover:text-white'
                  : 'border-stone-300 text-stone-600 hover:text-black'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {typeof document !== 'undefined' ? createPortal(transitionOverlay, document.body) : transitionOverlay}
    </>
  );
};
