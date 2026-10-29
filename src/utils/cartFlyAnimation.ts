/**
 * Premium flying product thumbnail animation for Add to Cart.
 * Smoothly animates a clone of the added product toward the navbar cart icon,
 * then triggers a subtle haptic-like scale bounce on arrival.
 */

export interface CartFlyOptions {
  imageUrl?: string;
  sourceElement?: HTMLElement | null;
  targetElementId?: string;
}

let lastFlyTime = 0;
const FLY_COOLDOWN_MS = 250;

/**
 * Triggers a bounce/scale effect on the cart button element.
 */
export function triggerCartBounce(cartEl: HTMLElement): void {
  if (!cartEl || typeof cartEl.animate !== 'function') return;

  try {
    cartEl.animate(
      [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.28) rotate(-6deg)' },
        { transform: 'scale(0.92) rotate(4deg)' },
        { transform: 'scale(1.08) rotate(-2deg)' },
        { transform: 'scale(1) rotate(0deg)' }
      ],
      {
        duration: 420,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
  } catch (err) {
    // Graceful fallback if Web Animations API fails
    console.debug('Cart bounce note:', err);
  }
}

/**
 * Executes the flying product thumbnail animation.
 * Purely visual — does not delay, block, or throw errors.
 */
export function triggerCartFlyAnimation(options: CartFlyOptions): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Rate limiting to prevent duplicate overlapping animations on rapid taps
  const now = Date.now();
  if (now - lastFlyTime < FLY_COOLDOWN_MS) {
    return;
  }
  lastFlyTime = now;

  const targetId = options.targetElementId || 'nav-cart-trigger';
  const targetEl = document.getElementById(targetId);

  // If user has prefers-reduced-motion enabled, skip flight and gently pulse cart
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReducedMotion) {
    if (targetEl) triggerCartBounce(targetEl);
    return;
  }

  // If navbar or cart button is not currently rendered or available, exit gracefully
  if (!targetEl) return;
  const targetRect = targetEl.getBoundingClientRect();
  if (targetRect.width === 0 && targetRect.height === 0) return;

  // Resolve starting position: strictly from the clicked Add to Cart button's getBoundingClientRect()
  let sourceRect: DOMRect | null = null;

  if (options.sourceElement) {
    const r = options.sourceElement.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      sourceRect = r;
    }
  }

  // Fallback: look for the active Add to Cart button on the page if sourceElement wasn't passed directly
  if (!sourceRect) {
    const fallbackBtn = (
      document.getElementById('detail-add-to-cart-btn') ||
      document.getElementById('add-to-cart-top-btn') ||
      document.querySelector('button[id*="add-to-cart"]')
    ) as HTMLElement | null;

    if (fallbackBtn) {
      const r = fallbackBtn.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        sourceRect = r;
      }
    }
  }

  // If no button is found, exit safely without error
  if (!sourceRect) return;

  // Dimension setup for thumbnail centered on the button
  const initialWidth = 56;
  const initialHeight = 64;
  const finalSize = 22;

  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;

  const destX = targetRect.left + targetRect.width / 2;
  const destY = targetRect.top + targetRect.height / 2;

  const startLeft = startX - initialWidth / 2;
  const startTop = startY - initialHeight / 2;

  const destLeft = destX - finalSize / 2;
  const destTop = destY - finalSize / 2;

  const deltaX = destLeft - startLeft;
  const deltaY = destTop - startTop;

  // Parabolic upward arc apex (pulls up higher in mid-air)
  const arcLift = Math.min(-45, deltaY * 0.25 - 25);

  // Create floating thumbnail container
  const flyingEl = document.createElement('div');
  flyingEl.setAttribute('aria-hidden', 'true');
  flyingEl.style.position = 'fixed';
  flyingEl.style.left = '0px';
  flyingEl.style.top = '0px';
  flyingEl.style.width = `${initialWidth}px`;
  flyingEl.style.height = `${initialHeight}px`;
  flyingEl.style.zIndex = '99999';
  flyingEl.style.pointerEvents = 'none';
  flyingEl.style.willChange = 'transform, opacity';
  flyingEl.style.borderRadius = '8px';
  flyingEl.style.overflow = 'hidden';
  const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
  flyingEl.style.backgroundColor = isDark ? '#171717' : '#ffffff';
  flyingEl.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.2)';
  flyingEl.style.border = isDark ? '1.5px solid rgba(255, 255, 255, 0.25)' : '1.5px solid rgba(255, 255, 255, 0.9)';

  // Product Image or Fallback
  if (options.imageUrl && typeof options.imageUrl === 'string' && options.imageUrl.trim().length > 0) {
    const imgEl = document.createElement('img');
    imgEl.src = options.imageUrl;
    imgEl.alt = '';
    imgEl.referrerPolicy = 'no-referrer';
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover';
    imgEl.style.display = 'block';
    flyingEl.appendChild(imgEl);
  } else {
    // Fallback minimal badge
    flyingEl.style.display = 'flex';
    flyingEl.style.alignItems = 'center';
    flyingEl.style.justifyContent = 'center';
    flyingEl.style.backgroundColor = '#111111';
    flyingEl.style.color = '#ffffff';
    flyingEl.innerText = 'P';
  }

  document.body.appendChild(flyingEl);

  // Web Animations API Keyframes with curved flight path and gradual shrinking
  const keyframes: Keyframe[] = [
    {
      transform: `translate3d(${startLeft}px, ${startTop}px, 0) scale(1) rotate(0deg)`,
      opacity: 1,
      offset: 0
    },
    {
      transform: `translate3d(${startLeft + deltaX * 0.28}px, ${startTop + deltaY * 0.14 + arcLift}px, 0) scale(0.92) rotate(-5deg)`,
      opacity: 1,
      offset: 0.25
    },
    {
      transform: `translate3d(${startLeft + deltaX * 0.68}px, ${startTop + deltaY * 0.56 + arcLift * 0.45}px, 0) scale(0.62) rotate(4deg)`,
      opacity: 0.95,
      offset: 0.65
    },
    {
      transform: `translate3d(${destLeft}px, ${destTop}px, 0) scale(0.2) rotate(10deg)`,
      opacity: 0.5,
      offset: 0.92
    },
    {
      transform: `translate3d(${destLeft}px, ${destTop}px, 0) scale(0.02) rotate(12deg)`,
      opacity: 0,
      offset: 1
    }
  ];

  try {
    const animation = flyingEl.animate(keyframes, {
      duration: 720,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards'
    });

    const cleanup = () => {
      if (flyingEl.parentNode) {
        flyingEl.parentNode.removeChild(flyingEl);
      }
    };

    animation.onfinish = () => {
      cleanup();
      triggerCartBounce(targetEl);
    };

    animation.oncancel = cleanup;
  } catch (err) {
    // Fallback cleanup if animation fails
    if (flyingEl.parentNode) {
      flyingEl.parentNode.removeChild(flyingEl);
    }
    triggerCartBounce(targetEl);
  }
}
