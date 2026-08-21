import React, { useState, useEffect, useRef } from 'react';

// Global memory cache to track already loaded and decoded image URLs
const loadedImageSrcSet = new Set<string>();

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  onLoad?: () => void;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product image',
  className = 'w-full h-full object-cover',
  priority = false,
  loading,
  onClick,
  onLoad
}) => {
  const trimmedSrc = (src && typeof src === 'string') ? src.trim() : '';
  const isInitiallyCached = trimmedSrc ? loadedImageSrcSet.has(trimmedSrc) : false;

  const [isLoaded, setIsLoaded] = useState<boolean>(isInitiallyCached);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    if (!trimmedSrc) {
      setIsLoaded(false);
      setHasError(true);
      return;
    }

    if (loadedImageSrcSet.has(trimmedSrc)) {
      setIsLoaded(true);
      return;
    }

    // Check if the image element is already complete (from browser cache)
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      loadedImageSrcSet.add(trimmedSrc);
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [trimmedSrc]);

  const handleImageLoad = () => {
    if (trimmedSrc) {
      loadedImageSrcSet.add(trimmedSrc);
    }
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (hasError || !trimmedSrc) {
    return (
      <div 
        onClick={onClick}
        className={`w-full h-full bg-stone-100 dark:bg-neutral-900 flex items-center justify-center text-stone-400 dark:text-neutral-500 text-xs tracking-wider uppercase select-none ${className}`}
      >
        <span>{alt || 'PANCHU'}</span>
      </div>
    );
  }

  const determinedLoading = loading || (priority ? 'eager' : 'lazy');
  const fetchPriorityValue = priority ? 'high' : 'auto';

  return (
    <div className="relative w-full h-full overflow-hidden" onClick={onClick}>
      {/* Subtle non-intrusive loading placeholder - fades out when image finishes loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-200/70 dark:bg-neutral-800/70 animate-pulse transition-opacity duration-300 pointer-events-none" />
      )}

      <img
        ref={imgRef}
        src={trimmedSrc}
        alt={alt}
        loading={determinedLoading}
        decoding="async"
        fetchPriority={fetchPriorityValue as any}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          imageRendering: '-webkit-optimize-contrast',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
