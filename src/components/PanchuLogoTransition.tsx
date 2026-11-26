import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Product } from '../types';
import { PanchuLogo } from './PanchuLogo';

export type PanchuTransitionPhase =
  | 'idle'
  | 'animating'
  | 'fading-logo'
  | 'navigating'
  | 'exiting';

interface UsePanchuLogoTransitionOptions {
  onNavigate: (product: Product) => void;
}

interface PanchuLogoTransitionOverlayProps {
  targetProduct: Product | null;
  phase: PanchuTransitionPhase;
  isDark: boolean;
  prefersReducedMotion: boolean;
  onLogoAnimationComplete: () => void;
  onBackdropAnimationComplete: () => void;
}

/**
 * Full-screen sequential Panchu brand logo transition overlay.
 * Only invoked when navigating from the "You Might Like" section on ProductDetailPage.
 * Sequence:
 * 1. Show full-screen canvas + play subtle premium animation on Panchu logo.
 * 2. Smoothly fade the logo out completely (opacity -> 0).
 * 3. Only after the logo has completely disappeared, trigger destination navigation.
 * 4. Smoothly dissolve the clean backdrop to reveal the loaded product page.
 */
export const PanchuLogoTransitionOverlay: React.FC<PanchuLogoTransitionOverlayProps> = ({
  targetProduct,
  phase,
  isDark,
  prefersReducedMotion,
  onLogoAnimationComplete,
  onBackdropAnimationComplete
}) => {
  if (!targetProduct || phase === 'idle') {
    return null;
  }

  const isLogoHiddenPhase = phase === 'navigating' || phase === 'exiting';
  const isFadingOutLogo = phase === 'fading-logo' || isLogoHiddenPhase;

  const logoAnimate = prefersReducedMotion
    ? isFadingOutLogo
      ? { opacity: 0, scale: 1, y: 0 }
      : { opacity: 1, scale: 1, y: 0 }
    : isFadingOutLogo
      ? { opacity: 0, scale: 1.065, y: -10 }
      : {
          opacity: [0, 1, 1],
          scale: [0.88, 0.99, 1.045],
          y: [16, 0, -5]
        };

  const logoTransition = prefersReducedMotion
    ? {
        duration: phase === 'fading-logo' ? 0.22 : isLogoHiddenPhase ? 0 : 0.22,
        ease: 'easeOut' as const
      }
    : isFadingOutLogo
      ? {
          duration: phase === 'fading-logo' ? 0.42 : 0,
          ease: [0.4, 0, 0.2, 1] as const
        }
      : {
          delay: 0.06,
          duration: 0.88,
          times: [0, 0.5, 1],
          ease: [0.22, 1, 0.36, 1] as const
        };

  const overlayNode = (
    <motion.div
      key={`panchu-ytl-transition-${targetProduct.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
      transition={{
        duration: prefersReducedMotion
          ? phase === 'exiting'
            ? 0.18
            : 0.16
          : phase === 'exiting'
            ? 0.32
            : 0.24,
        ease: [0.22, 1, 0.36, 1]
      }}
      onAnimationComplete={onBackdropAnimationComplete}
      className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto select-none ${
        isDark ? 'bg-neutral-950' : 'bg-white'
      }`}
      role="presentation"
      aria-live="polite"
      aria-label={`Loading ${targetProduct.name}`}
    >
      {/* Subtle ambient radial studio glow behind official logo */}
      <motion.div
        aria-hidden="true"
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none"
        initial={{ opacity: 0, scale: 0.86 }}
        animate={
          phase === 'animating'
            ? { opacity: 1, scale: 1.05 }
            : { opacity: 0, scale: 1.08 }
        }
        transition={{
          duration: phase === 'animating' ? 0.85 : 0.38,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, rgba(220,38,38,0.11) 0%, transparent 65%)'
            : 'radial-gradient(circle at center, rgba(220,38,38,0.055) 0%, transparent 65%)'
        }}
      />

      {/* Animated Panchu Logo */}
      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.88, y: prefersReducedMotion ? 0 : 16 }}
        animate={logoAnimate}
        transition={logoTransition}
        onAnimationComplete={onLogoAnimationComplete}
        style={{ visibility: isLogoHiddenPhase ? 'hidden' : 'visible' }}
        className="relative flex flex-col items-center justify-center px-6 pointer-events-none"
      >
        <PanchuLogo size="xl" />
      </motion.div>
    </motion.div>
  );

  return typeof document !== 'undefined' ? createPortal(overlayNode, document.body) : overlayNode;
};

/**
 * Coordinates the strict sequential Panchu logo navigation transition and prevents
 * overlapping / accidental double-triggers.
 */
export function usePanchuLogoTransition({ onNavigate }: UsePanchuLogoTransitionOptions) {
  const [transitionTarget, setTransitionTarget] = useState<Product | null>(null);
  const [phase, setPhase] = useState<PanchuTransitionPhase>('idle');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const phaseRef = useRef<PanchuTransitionPhase>('idle');
  const lockedRef = useRef<boolean>(false);
  const targetRef = useRef<Product | null>(null);
  const reducedMotionRef = useRef<boolean>(false);
  const timersRef = useRef<number[]>([]);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const updatePhase = useCallback((next: PanchuTransitionPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const finishTransition = useCallback(() => {
    if (phaseRef.current === 'idle') return;
    clearTimers();
    targetRef.current = null;
    setTransitionTarget(null);
    updatePhase('idle');
    lockedRef.current = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, [clearTimers, updatePhase]);

  const startOverlayExit = useCallback(() => {
    if (phaseRef.current !== 'navigating') return;
    clearTimers();
    updatePhase('exiting');

    const fallbackDelay = reducedMotionRef.current ? 320 : 480;
    const tFallback = window.setTimeout(() => {
      finishTransition();
    }, fallbackDelay);
    timersRef.current.push(tFallback);
  }, [clearTimers, updatePhase, finishTransition]);

  const completeLogoFadeOutAndNavigate = useCallback(() => {
    if (phaseRef.current !== 'fading-logo') return;
    clearTimers();
    updatePhase('navigating');

    // Brief 55ms settle after logo reaches opacity 0 before loading destination product
    const tNav = window.setTimeout(() => {
      const productToOpen = targetRef.current;
      if (productToOpen) {
        onNavigateRef.current(productToOpen);
      }

      // Allow ProductDetailPage + scroll-to-top to settle behind blank canvas before fading curtain out
      const tExit = window.setTimeout(() => {
        startOverlayExit();
      }, 120);
      timersRef.current.push(tExit);
    }, 55);

    timersRef.current.push(tNav);
  }, [clearTimers, updatePhase, startOverlayExit]);

  const startLogoFadeOut = useCallback(() => {
    if (phaseRef.current !== 'animating') return;
    clearTimers();
    updatePhase('fading-logo');

    const fallbackDelay = reducedMotionRef.current ? 360 : 600;
    const tFallback = window.setTimeout(() => {
      completeLogoFadeOutAndNavigate();
    }, fallbackDelay);
    timersRef.current.push(tFallback);
  }, [clearTimers, updatePhase, completeLogoFadeOutAndNavigate]);

  const triggerTransition = useCallback(
    (targetProduct: Product) => {
      if (lockedRef.current || phaseRef.current !== 'idle') return;
      lockedRef.current = true;
      clearTimers();

      if (typeof document !== 'undefined') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        document.body.style.overflow = 'hidden';
      }

      const isReduced =
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      reducedMotionRef.current = isReduced;
      setPrefersReducedMotion(isReduced);

      targetRef.current = targetProduct;
      setTransitionTarget(targetProduct);
      updatePhase('animating');

      // Safety fallback in case animation completion callback is throttled
      const animateFallbackMs = isReduced ? 450 : 1120;
      const tFallback = window.setTimeout(() => {
        startLogoFadeOut();
      }, animateFallbackMs);
      timersRef.current.push(tFallback);
    },
    [clearTimers, updatePhase, startLogoFadeOut]
  );

  const handleLogoAnimationComplete = useCallback(() => {
    if (phaseRef.current === 'animating') {
      // Wait an extra ~90ms hold at peak poise only on reduced motion so user sees logo cleanly
      if (reducedMotionRef.current) {
        const tHold = window.setTimeout(() => {
          startLogoFadeOut();
        }, 160);
        timersRef.current.push(tHold);
      } else {
        startLogoFadeOut();
      }
    } else if (phaseRef.current === 'fading-logo') {
      completeLogoFadeOutAndNavigate();
    }
  }, [startLogoFadeOut, completeLogoFadeOutAndNavigate]);

  const handleBackdropAnimationComplete = useCallback(() => {
    if (phaseRef.current === 'exiting') {
      finishTransition();
    }
  }, [finishTransition]);

  useEffect(() => {
    return () => {
      clearTimers();
      lockedRef.current = false;
      phaseRef.current = 'idle';
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [clearTimers]);

  return {
    transitionTarget,
    phase,
    prefersReducedMotion,
    triggerTransition,
    handleLogoAnimationComplete,
    handleBackdropAnimationComplete
  };
}
