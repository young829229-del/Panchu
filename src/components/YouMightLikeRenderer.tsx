import React, { useState, useEffect } from 'react';
import { Product, YouMightLikeDesignId } from '../types';
import { HangerRecommendations } from './HangerRecommendations';
import { ThreeDRotatingCarousel } from './ThreeDRotatingCarousel';
import { SimpleSliderRecommendations } from './SimpleSliderRecommendations';
import {
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
 * Dynamically renders the active "You Might Like" layout selected in Admin > Additional Options.
 * Defaults safely to Design 1 (Hanger Style) and updates live whenever Firebase changes without redeployment.
 */
export const YouMightLikeRenderer: React.FC<YouMightLikeRendererProps> = ({
  currentProduct,
  products,
  onSelectProduct,
  theme = 'light'
}) => {
  const [activeDesign, setActiveDesign] = useState<YouMightLikeDesignId>(
    () => getCanonicalAdditionalOptionsSync().youMightLikeDesign
  );

  useEffect(() => {
    const unsubscribe = subscribeAdditionalOptionsSettings((settings) => {
      setActiveDesign(settings.youMightLikeDesign);
    });
    return () => unsubscribe();
  }, []);

  switch (activeDesign) {
    case 'design-3-simple-slider':
      return (
        <SimpleSliderRecommendations
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
        />
      );

    case 'design-2-3d-flip':
      return (
        <ThreeDRotatingCarousel
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
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
        />
      );
  }
};
