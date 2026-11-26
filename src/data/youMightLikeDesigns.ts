import { YouMightLikeDesignId } from '../types';

export interface YouMightLikeDesignDefinition {
  id: YouMightLikeDesignId;
  designNumber: number;
  title: string;
  shortName: string;
  description: string;
  implementationState: 'ready' | 'prepared';
  statusLabel: string;
}

/**
 * Extensible registry of "You Might Like" section presentation designs.
 * Adding Design 4+ later only requires registering its entry here and mapping
 * its renderer component in YouMightLikeRenderer.tsx.
 */
export const YOU_MIGHT_LIKE_DESIGNS: readonly YouMightLikeDesignDefinition[] = [
  {
    id: 'design-1-hanger',
    designNumber: 1,
    title: 'Design 1 — Hanger Style',
    shortName: 'Hanger Style',
    description:
      'Horizontal brushed-steel clothing rail with individual contoured hangers, smooth swipe/drag browsing, and Panchu logo click transition.',
    implementationState: 'ready',
    statusLabel: 'Live Implementation'
  },
  {
    id: 'design-2-3d-flip',
    designNumber: 2,
    title: 'Design 2 — 3D Rotating Carousel',
    shortName: '3D Rotating Carousel',
    description:
      'Interactive 3D rotating floating product carousel with centered focus, angled side garments, touch/mouse 3D rotation, and Panchu logo click transition.',
    implementationState: 'ready',
    statusLabel: 'Live Implementation'
  },
  {
    id: 'design-3-simple-slider',
    designNumber: 3,
    title: 'Design 3 — Simple Horizontal Slider',
    shortName: 'Simple Horizontal Slider',
    description:
      'Clean, minimal horizontal product carousel showing real Firebase product photography, titles, prices, and smooth swipe navigation.',
    implementationState: 'ready',
    statusLabel: 'Live Implementation'
  }
];
