import React, { useState, useEffect } from 'react';

interface ProgressiveBannerProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  priority?: boolean;
  theme?: 'light' | 'dark';
  gender?: 'male' | 'female';
  onLoaded?: () => void;
}

export const ProgressiveBanner: React.FC<ProgressiveBannerProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  objectPosition = 'object-center',
  priority = true,
  theme = 'light',
  gender = 'male',
  onLoaded
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const isDark = theme === 'dark';

  // Reset loading state when image source URL changes
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);

    if (!src) return;

    // Check if the image is already cached by the browser
    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      onLoaded?.();
    }
  }, [src, onLoaded]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    onLoaded?.();
  };

  const handleImageError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* 1. Low-Quality Base / Placeholder Layer */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-out z-0 ${
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } ${
          isDark ? 'bg-neutral-900' : 'bg-stone-200'
        }`}
      >
        {/* Subtle Ambient Gradient Placeholder reflecting theme & gender */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            gender === 'male'
              ? isDark
                ? 'from-neutral-950 via-neutral-900 to-stone-900'
                : 'from-stone-200 via-stone-300 to-stone-200'
              : isDark
              ? 'from-neutral-950 via-pink-950/30 to-neutral-900'
              : 'from-rose-100 via-stone-200 to-rose-50'
          } animate-pulse`}
        />

        {/* Shimmer Light Sweep Effect during download */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        {/* Micro Low-Quality Blurred Preview of current image */}
        {src && !isError && (
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className={`w-full h-full object-cover ${objectPosition} blur-xl scale-110 opacity-60 filter contrast-75`}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* 2. High-Resolution Banner Image from Firebase Storage */}
      {src && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover ${objectPosition} transition-all duration-700 ease-out z-10 relative ${
            isLoaded
              ? 'opacity-100 scale-100 blur-0'
              : 'opacity-0 scale-105 blur-md'
          } ${imgClassName}`}
          style={{
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            willChange: 'opacity, transform, filter'
          }}
          referrerPolicy="no-referrer"
        />
      )}

      {/* 3. Error Fallback if image fails to load */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/80 text-white p-4 text-center z-20">
          <p className="text-xs font-semibold text-stone-300">Unable to load high-resolution banner</p>
          <button
            onClick={() => {
              setIsError(false);
              setIsLoaded(false);
            }}
            className="mt-2 text-[11px] px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
