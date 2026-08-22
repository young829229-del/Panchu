import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ProgressiveBanner } from './common/ProgressiveBanner';

interface HeroProps {
  image: string;
  alternateImage?: string;
  theme: 'light' | 'dark';
  gender: 'male' | 'female';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onGenderChange: (gender: 'male' | 'female') => void;
  onShopNow?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  image,
  alternateImage,
  theme,
  gender,
  onThemeChange,
  onGenderChange,
  onShopNow
}) => {
  const isDark = theme === 'dark';

  // Preload current and alternate gender live banner dynamically
  useEffect(() => {
    [image, alternateImage].forEach((url) => {
      if (url && typeof url === 'string' && url.trim().length > 0) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [image, alternateImage]);

  return (
    <section className={`relative w-full h-screen md:h-[calc(100dvh-52px)] overflow-hidden ${isDark ? 'bg-neutral-950 text-white' : 'bg-white text-black'} select-none flex flex-col items-center justify-center`}>
      {/* Top Banner Control Bar (Gender Switch + Theme Switch) */}
      <div className="absolute top-4 sm:top-6 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto max-w-7xl mx-auto">
        {/* Gender Switch (Male / Female - Icon Signs only) */}
        <div className={`flex items-center p-1 rounded-full border shadow-xl backdrop-blur-md transition-all ${
          isDark ? 'bg-neutral-900/90 border-neutral-700 text-white' : 'bg-white/90 border-stone-200 text-black'
        }`}>
          <button
            onClick={() => onGenderChange('male')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              gender === 'male'
                ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                : 'hover:opacity-75 text-stone-500'
            }`}
            title="Male"
            aria-label="Male"
            id="hero-gender-male"
          >
            {/* Male Symbol ♂ */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="14" r="5" />
              <line x1="19" y1="5" x2="13.5" y2="10.5" />
              <polyline points="14 5 19 5 19 10" />
            </svg>
          </button>
          <button
            onClick={() => onGenderChange('female')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              gender === 'female'
                ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                : 'hover:opacity-75 text-stone-500'
            }`}
            title="Female"
            aria-label="Female"
            id="hero-gender-female"
          >
            {/* Female Symbol ♀ */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="9" r="5" />
              <line x1="12" y1="14" x2="12" y2="21" />
              <line x1="9" y1="18" x2="15" y2="18" />
            </svg>
          </button>
        </div>

        {/* Light / Dark Mode Toggle (Icon Signs only) */}
        <div className={`flex items-center p-1 rounded-full border shadow-xl backdrop-blur-md transition-all ${
          isDark ? 'bg-neutral-900/90 border-neutral-700 text-white' : 'bg-white/90 border-stone-200 text-black'
        }`}>
          <button
            onClick={() => onThemeChange('light')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'hover:opacity-75 text-stone-500'
            }`}
            title="Light Mode"
            aria-label="Light Mode"
            id="hero-theme-light"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:opacity-75 text-stone-500'
            }`}
            title="Dark Mode"
            aria-label="Dark Mode"
            id="hero-theme-dark"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Banner Container */}
      <div className="w-full h-full cursor-pointer relative overflow-hidden flex items-center justify-center group" onClick={onShopNow}>
        {/* Progressive Banner Image with Low-Quality Blur Placeholder */}
        <ProgressiveBanner
          src={image}
          alt="PANCHU Campaign Banner"
          priority={true}
          theme={theme}
          gender={gender}
          objectPosition="object-[center_12%] sm:object-[center_15%] md:object-[center_18%] lg:object-[center_20%]"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-10 pointer-events-none" />
      </div>

      {/* SHOP NOW Button - Always visible, centered in middle of banner */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-4">
        <button
          onClick={onShopNow}
          className="pointer-events-auto px-8 py-3.5 sm:px-10 sm:py-4 border-2 border-white/90 bg-black/60 hover:bg-white hover:text-black text-white text-xs sm:text-sm md:text-base tracking-[0.25em] font-montserrat font-bold uppercase transition-all duration-300 shadow-2xl backdrop-blur-md hover:scale-105 cursor-pointer rounded-none"
          id="hero-shop-now-sign"
        >
          SHOP NOW
        </button>
      </div>
    </section>
  );
};
