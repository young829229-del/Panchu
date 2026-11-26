import React, { useState, useEffect } from 'react';
import { AdditionalOptionsSettings, Product } from '../types';
import { HangerRecommendations } from './HangerRecommendations';
import { ThreeDRotatingCarousel } from './ThreeDRotatingCarousel';
import { SimpleSliderRecommendations } from './SimpleSliderRecommendations';
import {
  applyGlobalFloatingCssVars,
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
 * Dynamically renders the active "You Might Like" layout and its own independent
 * customization settings selected in Admin > Additional Options, updating live via Firebase.
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

  const activeConfig = options.perDesign[options.youMightLikeDesign];

  useEffect(() => {
    applyGlobalFloatingCssVars(activeConfig.animationSpeed, activeConfig.floatingIntensity);
  }, [activeConfig.animationSpeed, activeConfig.floatingIntensity]);

  switch (options.youMightLikeDesign) {
    case 'design-3-simple-slider':
      return (
        <SimpleSliderRecommendations
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
          maxVisibleProducts={activeConfig.maxVisibleProducts}
          enableShadow={activeConfig.enableShadow}
          shadowIntensity={activeConfig.shadowIntensity}
          enableFloatingAnimation={activeConfig.enableFloatingAnimation}
          animationSpeed={activeConfig.animationSpeed}
          floatingIntensity={activeConfig.floatingIntensity}
          cardGap={activeConfig.cardGap}
          cardWidth={activeConfig.cardWidth}
        />
      );

    case 'design-2-3d-flip':
      return (
        <ThreeDRotatingCarousel
          currentProduct={currentProduct}
          products={products}
          onSelectProduct={onSelectProduct}
          theme={theme}
          maxVisibleProducts={activeConfig.maxVisibleProducts}
          enableShadow={activeConfig.enableShadow}
          shadowIntensity={activeConfig.shadowIntensity}
          enableFloatingAnimation={activeConfig.enableFloatingAnimation}
          animationSpeed={activeConfig.animationSpeed}
          floatingIntensity={activeConfig.floatingIntensity}
          rotationAngle={activeConfig.rotationAngle}
          sideScale={activeConfig.sideScale}
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
          maxVisibleProducts={activeConfig.maxVisibleProducts}
          enableShadow={activeConfig.enableShadow}
          shadowIntensity={activeConfig.shadowIntensity}
          enableFloatingAnimation={activeConfig.enableFloatingAnimation}
          animationSpeed={activeConfig.animationSpeed}
          floatingIntensity={activeConfig.floatingIntensity}
          cardGap={activeConfig.cardGap}
          rackSway={activeConfig.rackSway}
        />
      );
  }
};
