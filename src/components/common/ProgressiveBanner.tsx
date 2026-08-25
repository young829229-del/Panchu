import React, { useState } from 'react';

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
  onLoaded
}) => {
  const [isError, setIsError] = useState<boolean>(false);
  const isDark = theme === 'dark';

  const handleImageLoad = () => {
    setIsError(false);
    onLoaded?.();
  };

  const handleImageError = () => {
    setIsError(true);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {src && !isError ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover ${objectPosition} z-10 relative ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      ) : isError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-white p-4 text-center z-20 space-y-2">
          <p className="text-xs font-semibold text-stone-200">Unable to load banner image</p>
          <button
            onClick={() => setIsError(false)}
            className="text-[11px] px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors cursor-pointer"
          >
            Retry Load
          </button>
        </div>
      ) : (
        <div className={`w-full h-full ${isDark ? 'bg-neutral-900' : 'bg-stone-200'}`} />
      )}
    </div>
  );
};
