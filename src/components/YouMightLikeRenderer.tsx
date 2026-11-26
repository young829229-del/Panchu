import React, { useState, useEffect } from 'react';
import { AdditionalOptionsSettings, Product } from '../types';
import { HangerRecommendations } from './HangerRecommendations';
import { ThreeDRotatingCarousel } from './ThreeDRotatingCarousel';
import { SimpleSliderRecommendations } from './SimpleSliderRecommendations';
import {
  applyGlobalFloatingSpeedCssVar,
  getCanonicalAdditionalOptionsSync,
  subscribeAdditionalOptionsSettings
} from '../services/firebaseService';

interface YouMightLikeRendererProps {
  currentProduct: Product;
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  theme?: 'light' | 'dark';
}

/**
 * Dynamically renders the active "You Might Like" layout and visual effects
 * selected in Admin > Additional Options, updating live via Firebase.
 */
export const YouMightLikeRenderer: React.FC<YouMightLikeRendererProps> = ({
  currentProduct,
  products,
  onSelectProduct,
  theme = 'light'
}) => {
  const [options, setOptions] = useState<AdditionalOptionsSettings>(() =>
    getCanonicalAdditionalOptionsSync()
  );

  useEffect(() => {
    const unsubscribe = subscribeAdditionalOptionsSettings((settings) => {
      setOptions(settings);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyGlobalFloatingSpeedCssVar(options.animationSpeed);
  }, [options.animationSpeed]);

  switch (options.youMightLikeDesign) {
    case 'design-3-simple-slider':
      return (
        <SimpleSliderRecommendations
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
          enableShadow={options.enableShadow}
          shadowIntensity={options.shadowIntensity}
          enableFloatingAnimation={options.enableFloatingAnimation}
          animationSpeed={options.animationSpeed}
        />
      );

    case 'design-2-3d-flip':
      return (
        <ThreeDRotatingCarousel
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
          enableShadow={options.enableShadow}
          shadowIntensity={options.shadowIntensity}
          enableFloatingAnimation={options.enableFloatingAnimation}
          animationSpeed={options.animationSpeed}
        />
      );

    case 'design-1-hanger':
    default:
      return (
        <HangerRecommendations
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
          enableShadow={options.enableShadow}
          shadowIntensity={options.shadowIntensity}
          enableFloatingAnimation={options.enableFloatingAnimation}
          animationSpeed={options.animationSpeed}
        />
      );
  }
};
