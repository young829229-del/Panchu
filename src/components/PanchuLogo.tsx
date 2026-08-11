import React, { useState } from 'react';

interface PanchuLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PanchuLogo: React.FC<PanchuLogoProps> = ({
  className = '',
  size = 'md'
}) => {
  const [imageError, setImageError] = useState(false);

  // Height map for the logo container
  const heightClasses = {
    sm: 'h-9 sm:h-11',
    md: 'h-13 sm:h-16 md:h-18',
    lg: 'h-16 sm:h-22',
    xl: 'h-22 sm:h-30'
  }[size];

  const mainTextSizes = {
    sm: 'text-2xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-5xl sm:text-6xl',
    xl: 'text-6xl sm:text-7xl'
  }[size];

  const yearTextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px] sm:text-[13px]',
    lg: 'text-[15px] sm:text-[17px]',
    xl: 'text-[20px] sm:text-[24px]'
  }[size];

  // Try loading direct imgbb image links for q3T1Sz1H
  const imgbbUrl = 'https://i.ibb.co/q3T1Sz1H/logo.png';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {!imageError ? (
        <img
          src={imgbbUrl}
          alt="PANCHU 2026 Logo"
          className={`object-contain ${heightClasses} w-auto transition-opacity duration-300`}
          onError={(e) => {
            // Try secondary extension if first fails
            const target = e.target as HTMLImageElement;
            if (target.src.endsWith('.png')) {
              target.src = 'https://i.ibb.co/q3T1Sz1H/image.jpg';
            } else if (target.src.endsWith('.jpg')) {
              target.src = 'https://i.ibb.co/q3T1Sz1H/image.png';
            } else {
              setImageError(true);
            }
          }}
        />
      ) : (
        <div className="inline-flex flex-col items-end">
          {/* Panchu Signature Text Fallback */}
          <div className="relative inline-block">
            <span
              className={`font-['Kaushan_Script','Caveat',cursive] font-extrabold text-red-600 tracking-tight leading-none inline-block ${mainTextSizes}`}
              style={{
                fontStyle: 'italic',
                transform: 'skewX(-8deg)',
                textShadow: '0.5px 0.5px 0px #dc2626'
              }}
            >
              Panchu
            </span>
          </div>

          {/* 2026 Sub-brand label on bottom right */}
          <span className={`font-montserrat font-black text-red-600 tracking-[0.2em] -mt-1.5 sm:-mt-2 leading-none uppercase ${yearTextSizes}`}>
            2026
          </span>
        </div>
      )}
    </div>
  );
};
