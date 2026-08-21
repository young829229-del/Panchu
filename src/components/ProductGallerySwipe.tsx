import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductImage } from './ProductImage';

interface ProductGallerySwipeProps {
  images: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
  badge?: string | null;
  onClick?: () => void;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

export const ProductGallerySwipe: React.FC<ProductGallerySwipeProps> = ({
  images,
  activeIndex,
  onIndexChange,
  productName,
  badge,
  onClick,
  className = '',
  containerClassName = 'max-w-[500px]',
  priority = true
}) => {
  const [slideDirection, setSlideDirection] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const totalImages = images.length;

  const goToNext = useCallback(() => {
    if (totalImages <= 1) return;
    setSlideDirection(1);
    onIndexChange((activeIndex + 1) % totalImages);
  }, [activeIndex, totalImages, onIndexChange]);

  const goToPrev = useCallback(() => {
    if (totalImages <= 1) return;
    setSlideDirection(-1);
    onIndexChange((activeIndex - 1 + totalImages) % totalImages);
  }, [activeIndex, totalImages, onIndexChange]);

  // Preload adjacent gallery images for instantaneous swipe response
  useEffect(() => {
    if (totalImages <= 1) return;
    const nextIdx = (activeIndex + 1) % totalImages;
    const prevIdx = (activeIndex - 1 + totalImages) % totalImages;
    [images[nextIdx], images[prevIdx]].forEach(src => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [activeIndex, images, totalImages]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalImages <= 1) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isHorizontalSwipe.current = null;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || totalImages <= 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Detect if movement is primarily horizontal or vertical
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipe.current) {
      // Horizontal swipe in progress -> provide interactive elastic drag feedback
      setDragOffset(diffX * 0.7);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (touchStartX.current === null || isHorizontalSwipe.current !== true || totalImages <= 1) {
      setDragOffset(0);
      touchStartX.current = null;
      touchStartY.current = null;
      isHorizontalSwipe.current = null;
      return;
    }

    const touchEndTime = Date.now();
    const duration = touchEndTime - touchStartTime.current;
    const diffX = dragOffset;
    const minSwipeDistance = 35;
    const isQuickSwipe = duration < 300 && Math.abs(diffX) > 20;

    if (diffX < -minSwipeDistance || (isQuickSwipe && diffX < 0)) {
      goToNext();
    } else if (diffX > minSwipeDistance || (isQuickSwipe && diffX > 0)) {
      goToPrev();
    }

    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  const handleTouchCancel = () => {
    setIsDragging(false);
    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // If the user just performed a swipe, ignore the click
    if (Math.abs(dragOffset) > 10) return;
    if (onClick) onClick();
  };

  const currentImage = images[activeIndex] || images[0] || '';

  // Slide animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : direction < 0 ? '100%' : 0,
      opacity: 0
    })
  };

  return (
    <div
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`relative aspect-square w-full ${containerClassName} mx-auto overflow-hidden bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-sm cursor-pointer group/img select-none touch-pan-y ${className}`}
      title="Swipe left or right to switch images"
      style={{ touchAction: totalImages > 1 ? 'pan-y' : 'auto' }}
    >
      <div 
        className="w-full h-full relative"
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      >
        <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={slideDirection}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 35 },
              opacity: { duration: 0.2 }
            }}
            className="w-full h-full absolute inset-0"
          >
            <ProductImage
              src={currentImage}
              alt={`${productName} - Image ${activeIndex + 1}`}
              priority={priority}
              loading={priority && activeIndex === 0 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500 ease-out pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Product Badge if present */}
      {badge && (
        <div className="absolute top-3 left-3 bg-red-600 text-white font-montserrat font-bold text-[10px] tracking-widest px-2.5 py-1 uppercase z-10 pointer-events-none shadow-sm">
          {badge}
        </div>
      )}

      {/* Subtle indicator dots on mobile (dots only, NO buttons or arrows) */}
      {totalImages > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none sm:hidden">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? 'w-4 bg-white shadow-md'
                  : 'w-1.5 bg-white/50 backdrop-blur-xs'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
