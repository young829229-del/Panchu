import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { subscribeProducts } from '../services/firebaseService';

/**
 * Fetches active products directly from the existing Firebase `products` collection,
 * deduplicates entries, ensures valid images, and excludes the currently viewed product.
 */
export function useRecommendedProducts(
  currentProduct: Product,
  propProducts?: Product[]
): Product[] {
  const [liveFirebaseProducts, setLiveFirebaseProducts] = useState<Product[]>([]);
  const [hasFirebaseLoaded, setHasFirebaseLoaded] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeProducts((fetched) => {
      setLiveFirebaseProducts(fetched);
      setHasFirebaseLoaded(true);
    }, false);

    return () => unsubscribe();
  }, []);

  return useMemo(() => {
    const source =
      hasFirebaseLoaded && liveFirebaseProducts.length > 0
        ? liveFirebaseProducts
        : propProducts && propProducts.length > 0
          ? propProducts
          : liveFirebaseProducts;

    const currentId = (currentProduct.id || '').trim();
    const currentAltId = (currentProduct.productId || '').trim();
    const seenIds = new Set<string>();
    const filtered: Product[] = [];

    for (const item of source) {
      if (!item || item.active === false) continue;

      const itemId = (item.id || '').trim();
      const itemAltId = (item.productId || '').trim();

      if (
        (currentId && (itemId === currentId || itemAltId === currentId)) ||
        (currentAltId && (itemId === currentAltId || itemAltId === currentAltId))
      ) {
        continue;
      }

      if (!item.image || typeof item.image !== 'string' || item.image.trim().length === 0) {
        continue;
      }

      const canonicalKey = (itemId || itemAltId).toLowerCase();
      if (!canonicalKey || seenIds.has(canonicalKey)) {
        continue;
      }

      seenIds.add(canonicalKey);
      filtered.push(item);
    }

    return filtered.sort((a, b) => {
      const aMatch = a.gender === currentProduct.gender ? 2 : a.gender === 'unisex' ? 1 : 0;
      const bMatch = b.gender === currentProduct.gender ? 2 : b.gender === 'unisex' ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      const aFeat = a.bestSelling || a.featured ? 1 : 0;
      const bFeat = b.bestSelling || b.featured ? 1 : 0;
      return bFeat - aFeat;
    });
  }, [hasFirebaseLoaded, liveFirebaseProducts, propProducts, currentProduct]);
}
