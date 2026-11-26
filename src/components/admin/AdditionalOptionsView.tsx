import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Rotate3d,
  Sparkles,
  Layers
} from 'lucide-react';
import { YouMightLikeDesignId } from '../../types';
import { YOU_MIGHT_LIKE_DESIGNS, YouMightLikeDesignDefinition } from '../../data/youMightLikeDesigns';
import {
  applyGlobalFloatingSpeedCssVar,
  getCanonicalAdditionalOptionsSync,
  getFloatingSpeedScale,
  subscribeAdditionalOptionsSettings,
  saveYouMightLikeDesignToFirestore,
  saveYouMightLikeEffectsToFirestore
} from '../../services/firebaseService';

interface AdditionalOptionsViewProps {
  adminEmail?: string;
}

/**
 * Miniature Visual Preview Renderer for each "You Might Like" layout option
 */
const DesignVisualPreview: React.FC<{ designId: YouMightLikeDesignId; isSelected: boolean }> = ({
  designId,
  isSelected
}) => {
  if (designId === 'design-1-hanger') {
    return (
      <div className="relative w-full h-36 bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden flex flex-col justify-center px-4">
        {/* Horizontal Metal Clothing Rail */}
        <div
          className="w-full h-1.5 rounded-full mb-1"
          style={{
            background: 'linear-gradient(180deg, #9ca3af 0%, #ffffff 48%, #71717a 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
          }}
        />
        {/* 3 Miniature Hanging Garments */}
        <div className="grid grid-cols-3 gap-2.5 -mt-1.5">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex flex-col items-center">
              <svg viewBox="0 0 60 20" className="w-full h-4 overflow-visible" aria-hidden="true">
                <path
                  d="M 30 11 L 30 7 C 30 4, 26 2, 29.5 1 C 32.5 0, 34 3.5, 32.5 5.5"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 30 10 L 6 18 L 54 18 Z"
                  fill="#1c1917"
                />
              </svg>
              <div
                className={`w-full h-16 rounded-b-sm border shadow-xs flex flex-col justify-between p-1.5 ${
                  isSelected
                    ? 'bg-white border-stone-300'
                    : 'bg-white border-stone-200'
                }`}
              >
                <div className="w-full h-9 bg-stone-200/80 rounded-[2px]" />
                <div className="space-y-1">
                  <div className="w-4/5 h-1.5 bg-stone-800/70 rounded-full" />
                  <div className="w-1/2 h-1.5 bg-stone-400/70 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (designId === 'design-2-3d-flip') {
    return (
      <div className="relative w-full h-36 bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden flex flex-col items-center justify-center px-4 gap-2">
        <div className="flex items-center justify-center gap-3">
          {/* Left angled preview slot */}
          <div
            className="w-14 h-20 bg-white border border-stone-200 rounded-md shadow-xs p-1.5 opacity-65"
            style={{ transform: 'perspective(300px) rotateY(16deg) scale(0.92)' }}
          >
            <div className="w-full h-11 bg-stone-200 rounded-[2px]" />
            <div className="w-3/4 h-1.5 bg-stone-300 rounded-full mt-2" />
          </div>

          {/* Center featured 3D slot */}
          <div className="relative w-16 h-22 bg-white border border-stone-300 rounded-md shadow-sm p-1.5 flex flex-col items-center justify-between">
            <div className="w-full h-12 bg-stone-200/90 rounded-[2px] flex items-center justify-center">
              <Rotate3d className="w-5 h-5 text-stone-500" />
            </div>
            <div className="w-full space-y-1">
              <div className="w-4/5 h-1.5 bg-stone-800/70 rounded-full" />
              <div className="w-1/2 h-1.5 bg-stone-400/70 rounded-full" />
            </div>
          </div>

          {/* Right angled preview slot */}
          <div
            className="w-14 h-20 bg-white border border-stone-200 rounded-md shadow-xs p-1.5 opacity-65"
            style={{ transform: 'perspective(300px) rotateY(-16deg) scale(0.92)' }}
          >
            <div className="w-full h-11 bg-stone-200 rounded-[2px]" />
            <div className="w-3/4 h-1.5 bg-stone-300 rounded-full mt-2" />
          </div>
        </div>
      </div>
    );
  }

  // Design 3 — Simple Horizontal Slider
  return (
    <div className="relative w-full h-36 bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden flex items-center justify-center px-3">
      <div className="w-6 h-6 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center shrink-0 mr-2 text-stone-500">
        <ChevronLeft className="w-3.5 h-3.5" />
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="bg-white border border-stone-200 rounded-sm p-1.5 space-y-1.5 shadow-2xs"
          >
            <div className="w-full h-14 bg-stone-200/80 rounded-[1px]" />
            <div className="space-y-1">
              <div className="w-4/5 h-1.5 bg-stone-800/75 rounded-full" />
              <div className="w-1/2 h-1.5 bg-stone-400/80 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="w-6 h-6 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center shrink-0 ml-2 text-stone-500">
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

export const AdditionalOptionsView: React.FC<AdditionalOptionsViewProps> = ({
  adminEmail
}) => {
  const initialOptions = getCanonicalAdditionalOptionsSync();
  const [selectedDesign, setSelectedDesign] = useState<YouMightLikeDesignId>(
    () => initialOptions.youMightLikeDesign
  );
  const [enableShadow, setEnableShadow] = useState<boolean>(
    () => initialOptions.enableShadow
  );
  const [shadowIntensity, setShadowIntensity] = useState<number>(
    () => initialOptions.shadowIntensity
  );
  const [enableFloatingAnimation, setEnableFloatingAnimation] = useState<boolean>(
    () => initialOptions.enableFloatingAnimation
  );
  const [animationSpeed, setAnimationSpeed] = useState<number>(
    () => initialOptions.animationSpeed
  );
  const [savingDesignId, setSavingDesignId] = useState<YouMightLikeDesignId | null>(null);
  const [savingShadow, setSavingShadow] = useState<boolean>(false);
  const [savingIntensity, setSavingIntensity] = useState<boolean>(false);
  const [savingFloating, setSavingFloating] = useState<boolean>(false);
  const [savingSpeed, setSavingSpeed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDraggingSliderRef = useRef<boolean>(false);
  const sliderSaveTimerRef = useRef<number | null>(null);
  const lastSavedIntensityRef = useRef<number>(initialOptions.shadowIntensity);

  const isDraggingSpeedSliderRef = useRef<boolean>(false);
  const speedSliderSaveTimerRef = useRef<number | null>(null);
  const lastSavedSpeedRef = useRef<number>(initialOptions.animationSpeed);

  useEffect(() => {
    const unsubscribe = subscribeAdditionalOptionsSettings((liveSettings) => {
      setSelectedDesign(liveSettings.youMightLikeDesign);
      setEnableShadow(liveSettings.enableShadow);
      setEnableFloatingAnimation(liveSettings.enableFloatingAnimation);
      if (!isDraggingSliderRef.current) {
        setShadowIntensity(liveSettings.shadowIntensity);
        lastSavedIntensityRef.current = liveSettings.shadowIntensity;
      }
      if (!isDraggingSpeedSliderRef.current) {
        setAnimationSpeed(liveSettings.animationSpeed);
        lastSavedSpeedRef.current = liveSettings.animationSpeed;
      }
    });
    return () => {
      unsubscribe();
      if (sliderSaveTimerRef.current !== null) {
        window.clearTimeout(sliderSaveTimerRef.current);
      }
      if (speedSliderSaveTimerRef.current !== null) {
        window.clearTimeout(speedSliderSaveTimerRef.current);
      }
    };
  }, []);

  const handleSelectDesign = async (design: YouMightLikeDesignDefinition) => {
    if (savingDesignId) return;
    if (selectedDesign === design.id) return;

    const previousDesign = selectedDesign;
    setSelectedDesign(design.id);
    setSavingDesignId(design.id);
    setErrorMessage(null);

    try {
      await saveYouMightLikeDesignToFirestore(design.id, adminEmail);
    } catch (err: any) {
      setSelectedDesign(previousDesign);
      setErrorMessage(
        err?.message || 'Failed to save design selection in Firebase. Please try again.'
      );
    } finally {
      setSavingDesignId(null);
    }
  };

  const handleToggleShadow = async () => {
    if (savingShadow) return;
    const prevValue = enableShadow;
    const nextValue = !prevValue;

    setEnableShadow(nextValue);
    setSavingShadow(true);
    setErrorMessage(null);

    try {
      await saveYouMightLikeEffectsToFirestore({ enableShadow: nextValue }, adminEmail);
    } catch (err: any) {
      setEnableShadow(prevValue);
      setErrorMessage(
        err?.message || 'Failed to save shadow setting in Firebase. Please try again.'
      );
    } finally {
      setSavingShadow(false);
    }
  };

  const persistShadowIntensity = async (value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    if (clamped === lastSavedIntensityRef.current) return;

    const previousSaved = lastSavedIntensityRef.current;
    setSavingIntensity(true);
    setErrorMessage(null);

    try {
      await saveYouMightLikeEffectsToFirestore({ shadowIntensity: clamped }, adminEmail);
      lastSavedIntensityRef.current = clamped;
    } catch (err: any) {
      setShadowIntensity(previousSaved);
      setErrorMessage(
        err?.message || 'Failed to save shadow intensity in Firebase. Please try again.'
      );
    } finally {
      setSavingIntensity(false);
    }
  };

  const handleShadowIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Math.max(0, Math.min(100, Math.round(Number(e.target.value))));
    isDraggingSliderRef.current = true;
    setShadowIntensity(nextValue);

    if (sliderSaveTimerRef.current !== null) {
      window.clearTimeout(sliderSaveTimerRef.current);
    }
    sliderSaveTimerRef.current = window.setTimeout(() => {
      persistShadowIntensity(nextValue);
    }, 180);
  };

  const handleShadowIntensityCommit = () => {
    isDraggingSliderRef.current = false;
    if (sliderSaveTimerRef.current !== null) {
      window.clearTimeout(sliderSaveTimerRef.current);
      sliderSaveTimerRef.current = null;
    }
    persistShadowIntensity(shadowIntensity);
  };

  const handleToggleFloatingAnimation = async () => {
    if (savingFloating) return;
    const prevValue = enableFloatingAnimation;
    const nextValue = !prevValue;

    setEnableFloatingAnimation(nextValue);
    setSavingFloating(true);
    setErrorMessage(null);

    try {
      await saveYouMightLikeEffectsToFirestore(
        { enableFloatingAnimation: nextValue },
        adminEmail
      );
    } catch (err: any) {
      setEnableFloatingAnimation(prevValue);
      setErrorMessage(
        err?.message ||
          'Failed to save floating animation setting in Firebase. Please try again.'
      );
    } finally {
      setSavingFloating(false);
    }
  };

  const persistAnimationSpeed = async (value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    if (clamped === lastSavedSpeedRef.current) return;

    const previousSaved = lastSavedSpeedRef.current;
    setSavingSpeed(true);
    setErrorMessage(null);

    try {
      await saveYouMightLikeEffectsToFirestore({ animationSpeed: clamped }, adminEmail);
      lastSavedSpeedRef.current = clamped;
    } catch (err: any) {
      setAnimationSpeed(previousSaved);
      applyGlobalFloatingSpeedCssVar(previousSaved);
      setErrorMessage(
        err?.message || 'Failed to save animation speed in Firebase. Please try again.'
      );
    } finally {
      setSavingSpeed(false);
    }
  };

  const handleAnimationSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Math.max(0, Math.min(100, Math.round(Number(e.target.value))));
    isDraggingSpeedSliderRef.current = true;
    setAnimationSpeed(nextValue);
    applyGlobalFloatingSpeedCssVar(nextValue);

    if (speedSliderSaveTimerRef.current !== null) {
      window.clearTimeout(speedSliderSaveTimerRef.current);
    }
    speedSliderSaveTimerRef.current = window.setTimeout(() => {
      persistAnimationSpeed(nextValue);
    }, 180);
  };

  const handleAnimationSpeedCommit = () => {
    isDraggingSpeedSliderRef.current = false;
    if (speedSliderSaveTimerRef.current !== null) {
      window.clearTimeout(speedSliderSaveTimerRef.current);
      speedSliderSaveTimerRef.current = null;
    }
    persistAnimationSpeed(animationSpeed);
  };

  const activeDefinition =
    YOU_MIGHT_LIKE_DESIGNS.find((d) => d.id === selectedDesign) || YOU_MIGHT_LIKE_DESIGNS[0];

  return (
    <div className="space-y-6 pt-2 pb-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
            Additional Options
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Select the presentation design displayed in the "You Might Like" section on product detail pages.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-stone-600 bg-white border border-stone-200/80 rounded-xl px-3.5 py-2 self-start sm:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff4d4f] shrink-0" />
          <span className="text-stone-400">Active Design:</span>
          <span className="font-semibold text-stone-900">{activeDefinition.title}</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl border text-xs font-sans flex items-center gap-2.5 bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Storefront Target Info Strip */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold font-sans text-stone-900">
              You Might Like Section — Design Manager
            </h2>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Changes apply immediately to all product pages via Firebase without requiring redeployment.
            </p>
          </div>
          <span className="text-[11px] font-sans text-stone-500 whitespace-nowrap">
            {YOU_MIGHT_LIKE_DESIGNS.length} Designs Available
          </span>
        </div>

        {/* Design Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {YOU_MIGHT_LIKE_DESIGNS.map((design) => {
            const isSelected = selectedDesign === design.id;
            const isSavingThis = savingDesignId === design.id;

            return (
              <div
                key={design.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all ${
                  isSelected
                    ? 'border-[#ff4d4f] bg-[#fffaf9] shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Header: Design Identifier & Active Indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-sans text-stone-500 block">
                        Option 0{design.designNumber}
                      </span>
                      <h3 className="text-sm font-bold font-sans text-stone-900">
                        {design.title}
                      </h3>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-[#ff4d4f] border-[#ff4d4f] text-white'
                          : 'bg-white border-stone-300 text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <DesignVisualPreview designId={design.id} isSelected={isSelected} />
                </div>

                {/* Selection Control */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
                  <span
                    className={`text-xs font-sans font-medium ${
                      isSelected ? 'text-[#e04345]' : 'text-stone-400'
                    }`}
                  >
                    {isSelected ? 'Active on Storefront' : 'Inactive'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectDesign(design)}
                    disabled={isSelected || Boolean(savingDesignId)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#ff4d4f] text-white cursor-default'
                        : 'bg-stone-900 hover:bg-black text-white cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    {isSavingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select Design</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animation & Effects Settings Subsection */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-4">
        <div className="pb-3.5 border-b border-stone-100">
          <h2 className="text-sm font-bold font-sans text-stone-900">
            Animation &amp; Effects Settings
          </h2>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Independently control shadows and floating motion across the You Might Like section.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Control 1: Shadow Effect (Toggle + Real-Time Intensity/Blur Slider) */}
          <div
            className={`rounded-2xl border p-4 space-y-4 transition-colors ${
              enableShadow
                ? 'border-[#ff4d4f]/50 bg-[#fffaf9]'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <label
              htmlFor="toggle-enable-shadow"
              className="flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    enableShadow
                      ? 'bg-[#ff4d4f]/10 border-[#ff4d4f]/20 text-[#ff4d4f]'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-sans text-stone-900">
                      Enable Shadow
                    </span>
                    {savingShadow && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                    )}
                  </div>
                  <p className="text-xs font-sans text-stone-500 mt-0.5 leading-relaxed">
                    Display a soft, realistic shadow behind or beneath recommended products.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <input
                  id="toggle-enable-shadow"
                  type="checkbox"
                  checked={enableShadow}
                  disabled={savingShadow}
                  onChange={handleToggleShadow}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableShadow ? 'bg-[#ff4d4f]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      enableShadow ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
              </div>
            </label>

            {/* Real-Time Shadow Intensity & Blur Radius Slider */}
            <div
              className={`pt-3.5 border-t border-stone-200/70 space-y-3 transition-opacity ${
                enableShadow ? 'opacity-100' : 'opacity-45'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="slider-shadow-intensity"
                  className="text-xs font-semibold font-sans text-stone-700 flex items-center gap-2"
                >
                  <span>Shadow Intensity &amp; Blur Radius</span>
                  {savingIntensity && (
                    <Loader2 className="w-3 h-3 animate-spin text-stone-400" />
                  )}
                </label>
                <span className="text-xs font-mono font-semibold text-stone-700 tabular-nums">
                  {shadowIntensity}% · {Math.round(10 + (shadowIntensity / 100) * 38)}px
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <input
                  id="slider-shadow-intensity"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={shadowIntensity}
                  disabled={!enableShadow}
                  onChange={handleShadowIntensityChange}
                  onMouseUp={handleShadowIntensityCommit}
                  onTouchEnd={handleShadowIntensityCommit}
                  onBlur={handleShadowIntensityCommit}
                  onKeyUp={handleShadowIntensityCommit}
                  aria-label="Shadow intensity and blur radius"
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d4f] disabled:cursor-not-allowed"
                />

                {/* Live Real-Time Shadow Preview Box */}
                <div
                  className="w-11 h-11 rounded-lg bg-white border border-stone-200 shrink-0 flex items-center justify-center transition-all duration-75"
                  title="Live shadow preview"
                  style={{
                    boxShadow:
                      enableShadow && shadowIntensity > 0
                        ? `0 ${Math.round(4 + (shadowIntensity / 100) * 10)}px ${Math.round(
                            6 + (shadowIntensity / 100) * 22
                          )}px ${Math.round(-2 - (shadowIntensity / 100) * 4)}px rgba(0, 0, 0, ${(
                            0.1 +
                            (shadowIntensity / 100) * 0.28
                          ).toFixed(3)})`
                        : 'none'
                  }}
                >
                  <div className="w-5 h-5 rounded-xs bg-stone-200/80" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-sans text-stone-400">
                <span>Subtle (0%)</span>
                <span>Balanced (50%)</span>
                <span>Deep Blur (100%)</span>
              </div>
            </div>
          </div>

          {/* Control 2: Floating Animation (Toggle + Real-Time Animation Speed Slider) */}
          <div
            className={`rounded-2xl border p-4 space-y-4 transition-colors ${
              enableFloatingAnimation
                ? 'border-[#ff4d4f]/50 bg-[#fffaf9]'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <label
              htmlFor="toggle-enable-floating"
              className="flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    enableFloatingAnimation
                      ? 'bg-[#ff4d4f]/10 border-[#ff4d4f]/20 text-[#ff4d4f]'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-sans text-stone-900">
                      Enable Floating Animation
                    </span>
                    {savingFloating && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                    )}
                  </div>
                  <p className="text-xs font-sans text-stone-500 mt-0.5 leading-relaxed">
                    Gently float center, left, and right products up and down independently.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <input
                  id="toggle-enable-floating"
                  type="checkbox"
                  checked={enableFloatingAnimation}
                  disabled={savingFloating}
                  onChange={handleToggleFloatingAnimation}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableFloatingAnimation ? 'bg-[#ff4d4f]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      enableFloatingAnimation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
              </div>
            </label>

            {/* Real-Time Animation Speed Slider */}
            <div
              className={`pt-3.5 border-t border-stone-200/70 space-y-3 transition-opacity ${
                enableFloatingAnimation ? 'opacity-100' : 'opacity-45'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="slider-animation-speed"
                  className="text-xs font-semibold font-sans text-stone-700 flex items-center gap-2"
                >
                  <span>Animation Speed</span>
                  {savingSpeed && (
                    <Loader2 className="w-3 h-3 animate-spin text-stone-400" />
                  )}
                </label>
                <span className="text-xs font-mono font-semibold text-stone-700 tabular-nums">
                  {animationSpeed}% · {(4.3 * getFloatingSpeedScale(animationSpeed)).toFixed(1)}s cycle
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <input
                  id="slider-animation-speed"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={animationSpeed}
                  disabled={!enableFloatingAnimation}
                  onChange={handleAnimationSpeedChange}
                  onMouseUp={handleAnimationSpeedCommit}
                  onTouchEnd={handleAnimationSpeedCommit}
                  onBlur={handleAnimationSpeedCommit}
                  onKeyUp={handleAnimationSpeedCommit}
                  aria-label="Floating animation speed"
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d4f] disabled:cursor-not-allowed"
                />

                {/* Live Real-Time Floating Speed Preview Box */}
                <div
                  className="w-11 h-11 rounded-lg bg-stone-50 border border-stone-200 shrink-0 flex items-center justify-center overflow-visible"
                  title="Live floating speed preview"
                >
                  <div
                    className={`w-5 h-5 rounded-xs border border-stone-300 bg-white shadow-2xs ${
                      enableFloatingAnimation ? 'panchu-floating-item' : ''
                    }`}
                    style={
                      enableFloatingAnimation
                        ? ({
                            '--panchu-float-base-duration': '4.3s',
                            '--panchu-float-speed-scale': String(getFloatingSpeedScale(animationSpeed))
                          } as React.CSSProperties)
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-sans text-stone-400">
                <span>Slow (0%)</span>
                <span>Balanced (50%)</span>
                <span>Fast (100%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
