import React, { useState, useEffect } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product image',
  className = 'w-full h-full object-cover',
  onClick
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    setHasError(false);
    if (!src || typeof src !== 'string' || src.trim() === '') {
      setCurrentSrc('');
      setHasError(true);
      return;
    }

    const trimmed = src.trim();
    setCurrentSrc(trimmed);
  }, [src]);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || !currentSrc) {
    return (
      <div 
        onClick={onClick}
        className={`w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs tracking-wider uppercase ${className}`}
      >
        <span>{alt || 'PANCHU'}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onClick={onClick}
      loading="eager"
      decoding="async"
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};
