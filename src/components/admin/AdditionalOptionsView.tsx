import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Rotate3d,
  Sparkles,
  Layers,
  RotateCcw
} from 'lucide-react';
import {
  AdditionalOptionsSettings,
  DesignCustomizationSettings,
  YouMightLikeDesignId
} from '../../types';
import { YOU_MIGHT_LIKE_DESIGNS, YouMightLikeDesignDefinition } from '../../data/youMightLikeDesigns';
import {
  DEFAULT_DESIGN_CUSTOMIZATIONS,
  applyGlobalFloatingCssVars,
  getCanonicalAdditionalOptionsSync,
  getFloatingSpeedScale,
  subscribeAdditionalOptionsSettings,
  saveYouMightLikeDesignToFirestore,
  saveDesignCustomizationToFirestore,
  resetDesignFloatingInFirestore,
  resetDesignShadowInFirestore
} from '../../services/firebaseService';
import { NumericSliderControl } from './NumericSliderControl';

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
      <div className="relative w-full h-32 bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden flex flex-col justify-center px-3.5">
        {/* Horizontal Metal Clothing Rail */}
        <div
          className="w-full h-1.5 rounded-full mb-1"
          style={{
            background: 'linear-gradient(180deg, #9ca3af 0%, #ffffff 48%, #71717a 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
          }}
        />
        {/* 3 Miniature Hanging Garments */}
        <div className="grid grid-cols-3 gap-2 -mt-1.5">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex flex-col items-center">
              <svg viewBox="0 0 60 20" className="w-full h-3.5 overflow-visible" aria-hidden="true">
                <path
                  d="M 30 11 L 30 7 C 30 4, 26 2, 29.5 1 C 32.5 0, 34 3.5, 32.5 5.5"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path d="M 30 10 L 6 18 L 54 18 Z" fill="#1c1917" />
              </svg>
              <div
                className={`w-full h-14 rounded-b-sm border shadow-2xs flex flex-col justify-between p-1.5 ${
                  isSelected ? 'bg-white border-stone-300' : 'bg-white border-stone-200'
                }`}
              >
                <div className="w-full h-8 bg-stone-200/80 rounded-[2px]" />
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
      <div className="relative w-full h-32 bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden flex flex-col items-center justify-center px-3.5 gap-2">
        <div className="flex items-center justify-center gap-2.5">
          {/* Left angled preview slot */}
          <div
            className="w-12 h-18 bg-white border border-stone-200 rounded-md shadow-2xs p-1.5 opacity-65"
            style={{ transform: 'perspective(300px) rotateY(16deg) scale(0.92)' }}
          >
            <div className="w-full h-10 bg-stone-200 rounded-[2px]" />
            <div className="w-3/4 h-1.5 bg-stone-300 rounded-full mt-1.5" />
          </div>

          {/* Center featured 3D slot */}
          <div className="relative w-15 h-20 bg-white border border-stone-300 rounded-md shadow-sm p-1.5 flex flex-col items-center justify-between">
            <div className="w-full h-11 bg-stone-200/90 rounded-[2px] flex items-center justify-center">
              <Rotate3d className="w-4 h-4 text-stone-500" />
            </div>
            <div className="w-full space-y-1">
              <div className="w-4/5 h-1.5 bg-stone-800/70 rounded-full" />
              <div className="w-1/2 h-1.5 bg-stone-400/70 rounded-full" />
            </div>
          </div>

          {/* Right angled preview slot */}
          <div
            className="w-12 h-18 bg-white border border-stone-200 rounded-md shadow-2xs p-1.5 opacity-65"
            style={{ transform: 'perspective(300px) rotateY(-16deg) scale(0.92)' }}
          >
            <div className="w-full h-10 bg-stone-200 rounded-[2px]" />
            <div className="w-3/4 h-1.5 bg-stone-300 rounded-full mt-1.5" />
          </div>
        </div>
      </div>
    );
  }

  // Design 3 — Simple Horizontal Slider
  return (
    <div className="relative w-full h-32 bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden flex items-center justify-center px-3">
      <div className="w-5 h-5 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center shrink-0 mr-1.5 text-stone-500">
        <ChevronLeft className="w-3 h-3" />
      </div>

      <div className="grid grid-cols-3 gap-1.5 flex-1">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="bg-white border border-stone-200 rounded-sm p-1.5 space-y-1.5 shadow-2xs"
          >
            <div className="w-full h-12 bg-stone-200/80 rounded-[1px]" />
            <div className="space-y-1">
              <div className="w-4/5 h-1.5 bg-stone-800/75 rounded-full" />
              <div className="w-1/2 h-1.5 bg-stone-400/80 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="w-5 h-5 rounded-full bg-white border border-stone-200 shadow-2xs flex items-center justify-center shrink-0 ml-1.5 text-stone-500">
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
};

export const AdditionalOptionsView: React.FC<AdditionalOptionsViewProps> = ({
  adminEmail
}) => {
  const [options, setOptions] = useState<AdditionalOptionsSettings>(() =>
    getCanonicalAdditionalOptionsSync()
  );
  const [savingDesignId, setSavingDesignId] = useState<YouMightLikeDesignId | null>(null);
  const [savingFieldKey, setSavingFieldKey] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleAccordionSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const pendingFieldKeyRef = useRef<string | null>(null);
  const debounceTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = subscribeAdditionalOptionsSettings((liveSettings) => {
      // Avoid stomping live local drag state if a numeric slider is mid-debounce
      if (pendingFieldKeyRef.current) return;
      setOptions(liveSettings);
    });
    return () => {
      unsubscribe();
      Object.keys(debounceTimersRef.current).forEach((key) => {
        window.clearTimeout(debounceTimersRef.current[key]);
      });
      debounceTimersRef.current = {};
    };
  }, []);

  const clearTimersForDesign = (designId: YouMightLikeDesignId) => {
    const prefix = `${designId}:`;
    Object.keys(debounceTimersRef.current).forEach((key) => {
      if (key.startsWith(prefix)) {
        window.clearTimeout(debounceTimersRef.current[key]);
        delete debounceTimersRef.current[key];
      }
    });
    if (pendingFieldKeyRef.current?.startsWith(prefix)) {
      pendingFieldKeyRef.current = null;
    }
  };

  /**
   * Clicking any design card automatically activates it, opens its independent
   * customization panel underneath, and saves the selection in Firebase.
   */
  const handleCardSelect = async (design: YouMightLikeDesignDefinition) => {
    if (options.youMightLikeDesign === design.id) return;
    if (savingDesignId) return;

    const previousOptions = options;
    const nextDesignConfig = options.perDesign[design.id];

    // Optimistically apply active design + its saved CSS vars immediately
    setOptions((prev) => ({
      ...prev,
      youMightLikeDesign: design.id,
      enableShadow: nextDesignConfig.enableShadow,
      shadowIntensity: nextDesignConfig.shadowIntensity,
      enableFloatingAnimation: nextDesignConfig.enableFloatingAnimation,
      animationSpeed: nextDesignConfig.animationSpeed
    }));
    applyGlobalFloatingCssVars(
      nextDesignConfig.animationSpeed,
      nextDesignConfig.floatingIntensity
    );

    setSavingDesignId(design.id);
    setErrorMessage(null);

    try {
      const saved = await saveYouMightLikeDesignToFirestore(design.id, adminEmail);
      setOptions(saved);
    } catch (err: any) {
      setOptions(previousOptions);
      const prevCfg = previousOptions.perDesign[previousOptions.youMightLikeDesign];
      applyGlobalFloatingCssVars(prevCfg.animationSpeed, prevCfg.floatingIntensity);
      setErrorMessage(
        err?.message || 'Failed to save design selection in Firebase. Please try again.'
      );
    } finally {
      setSavingDesignId(null);
    }
  };

  const updateLocalDesignField = <K extends keyof DesignCustomizationSettings>(
    designId: YouMightLikeDesignId,
    field: K,
    value: DesignCustomizationSettings[K]
  ) => {
    setOptions((prev) => {
      const updatedDesignCfg: DesignCustomizationSettings = {
        ...prev.perDesign[designId],
        [field]: value
      };
      const isActive = prev.youMightLikeDesign === designId;

      if (isActive && (field === 'animationSpeed' || field === 'floatingIntensity')) {
        applyGlobalFloatingCssVars(
          updatedDesignCfg.animationSpeed,
          updatedDesignCfg.floatingIntensity
        );
      }

      return {
        ...prev,
        perDesign: {
          ...prev.perDesign,
          [designId]: updatedDesignCfg
        },
        ...(isActive
          ? {
              enableShadow: updatedDesignCfg.enableShadow,
              shadowIntensity: updatedDesignCfg.shadowIntensity,
              enableFloatingAnimation: updatedDesignCfg.enableFloatingAnimation,
              animationSpeed: updatedDesignCfg.animationSpeed
            }
          : {})
      };
    });
  };

  const persistDesignPatch = async (
    designId: YouMightLikeDesignId,
    fieldKey: string,
    patch: Partial<DesignCustomizationSettings>
  ) => {
    const fullKey = `${designId}:${fieldKey}`;
    setSavingFieldKey(fullKey);
    setErrorMessage(null);

    try {
      const saved = await saveDesignCustomizationToFirestore(designId, patch, adminEmail);
      if (!pendingFieldKeyRef.current) {
        setOptions(saved);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to update customization settings in Firebase. Please try again.'
      );
    } finally {
      setSavingFieldKey((prev) => (prev === fullKey ? null : prev));
    }
  };

  const handleToggleDesignBoolean = async (
    designId: YouMightLikeDesignId,
    field: 'enableShadow' | 'enableFloatingAnimation' | 'rackSway'
  ) => {
    const fullKey = `${designId}:${field}`;
    if (savingFieldKey === fullKey || resettingKey?.startsWith(`${designId}:`)) return;

    const currentValue = options.perDesign[designId][field];
    const nextValue = !currentValue;

    updateLocalDesignField(designId, field, nextValue);
    await persistDesignPatch(designId, field, { [field]: nextValue });
  };

  const handleLiveNumericChange = <K extends keyof DesignCustomizationSettings>(
    designId: YouMightLikeDesignId,
    field: K,
    nextValue: number
  ) => {
    const fullKey = `${designId}:${String(field)}`;
    pendingFieldKeyRef.current = fullKey;
    updateLocalDesignField(
      designId,
      field,
      nextValue as DesignCustomizationSettings[K]
    );

    if (debounceTimersRef.current[fullKey]) {
      window.clearTimeout(debounceTimersRef.current[fullKey]);
    }
    debounceTimersRef.current[fullKey] = window.setTimeout(() => {
      delete debounceTimersRef.current[fullKey];
      if (pendingFieldKeyRef.current === fullKey) {
        pendingFieldKeyRef.current = null;
      }
      persistDesignPatch(designId, String(field), { [field]: nextValue });
    }, 200);
  };

  const handleCommitNumericChange = <K extends keyof DesignCustomizationSettings>(
    designId: YouMightLikeDesignId,
    field: K,
    finalValue: number
  ) => {
    const fullKey = `${designId}:${String(field)}`;
    if (debounceTimersRef.current[fullKey]) {
      window.clearTimeout(debounceTimersRef.current[fullKey]);
      delete debounceTimersRef.current[fullKey];
    }
    if (pendingFieldKeyRef.current === fullKey) {
      pendingFieldKeyRef.current = null;
    }

    updateLocalDesignField(
      designId,
      field,
      finalValue as DesignCustomizationSettings[K]
    );
    persistDesignPatch(designId, String(field), { [field]: finalValue });
  };

  const handleResetFloating = async (
    e: React.MouseEvent,
    designId: YouMightLikeDesignId
  ) => {
    e.stopPropagation();
    const key = `${designId}:floating`;
    if (resettingKey === key) return;

    clearTimersForDesign(designId);

    const previousOptions = options;
    const defaults = DEFAULT_DESIGN_CUSTOMIZATIONS[designId];

    setOptions((prev) => {
      const updatedCfg: DesignCustomizationSettings = {
        ...prev.perDesign[designId],
        enableFloatingAnimation: defaults.enableFloatingAnimation,
        animationSpeed: defaults.animationSpeed,
        floatingIntensity: defaults.floatingIntensity
      };
      const isActive = prev.youMightLikeDesign === designId;
      if (isActive) {
        applyGlobalFloatingCssVars(updatedCfg.animationSpeed, updatedCfg.floatingIntensity);
      }
      return {
        ...prev,
        perDesign: {
          ...prev.perDesign,
          [designId]: updatedCfg
        },
        ...(isActive
          ? {
              enableFloatingAnimation: updatedCfg.enableFloatingAnimation,
              animationSpeed: updatedCfg.animationSpeed
            }
          : {})
      };
    });

    setResettingKey(key);
    setErrorMessage(null);

    try {
      const saved = await resetDesignFloatingInFirestore(designId, adminEmail);
      setOptions(saved);
    } catch (err: any) {
      setOptions(previousOptions);
      const prevActive = previousOptions.perDesign[previousOptions.youMightLikeDesign];
      applyGlobalFloatingCssVars(prevActive.animationSpeed, prevActive.floatingIntensity);
      setErrorMessage(
        err?.message || 'Failed to reset floating animation settings in Firebase. Please try again.'
      );
    } finally {
      setResettingKey(null);
    }
  };

  const handleResetShadow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const designId: YouMightLikeDesignId = 'design-2-3d-flip';
    const key = `${designId}:shadow`;
    if (resettingKey === key) return;

    clearTimersForDesign(designId);

    const previousOptions = options;
    const defaults = DEFAULT_DESIGN_CUSTOMIZATIONS[designId];

    setOptions((prev) => {
      const updatedCfg: DesignCustomizationSettings = {
        ...prev.perDesign[designId],
        enableShadow: defaults.enableShadow,
        shadowIntensity: defaults.shadowIntensity
      };
      const isActive = prev.youMightLikeDesign === designId;
      return {
        ...prev,
        perDesign: {
          ...prev.perDesign,
          [designId]: updatedCfg
        },
        ...(isActive
          ? {
              enableShadow: updatedCfg.enableShadow,
              shadowIntensity: updatedCfg.shadowIntensity
            }
          : {})
      };
    });

    setResettingKey(key);
    setErrorMessage(null);

    try {
      const saved = await resetDesignShadowInFirestore(adminEmail);
      setOptions(saved);
    } catch (err: any) {
      setOptions(previousOptions);
      setErrorMessage(
        err?.message || 'Failed to reset shadow settings in Firebase. Please try again.'
      );
    } finally {
      setResettingKey(null);
    }
  };

  const activeDefinition =
    YOU_MIGHT_LIKE_DESIGNS.find((d) => d.id === options.youMightLikeDesign) ||
    YOU_MIGHT_LIKE_DESIGNS[0];

  return (
    <div className="space-y-5 pt-2 pb-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
          Additional Options
        </h1>

        <div className="flex items-center gap-2 text-xs font-sans text-stone-600 bg-white border border-stone-200/80 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="text-stone-400">Active:</span>
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

      {/* Design Manager Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-4">
        <div className="pb-3 border-b border-stone-100">
          <h2 className="text-sm font-bold font-sans text-stone-900">
            You Might Like — Design Settings
          </h2>
        </div>

        {/* Stacked Design Cards */}
        <div className="space-y-3.5">
          {YOU_MIGHT_LIKE_DESIGNS.map((design) => {
            const isSelected = options.youMightLikeDesign === design.id;
            const isSavingThis = savingDesignId === design.id;
            const isResettingFloating = resettingKey === `${design.id}:floating`;
            const isResettingShadow = resettingKey === `${design.id}:shadow`;
            const cfg = options.perDesign[design.id] || DEFAULT_DESIGN_CUSTOMIZATIONS[design.id];

            const layoutKey = `${design.id}:layout`;
            const effectsKey = `${design.id}:effects`;
            const isLayoutExpanded = Boolean(expandedSections[layoutKey]);
            const isEffectsExpanded = Boolean(expandedSections[effectsKey]);

            return (
              <div
                key={design.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-[#ff4d4f] bg-[#fffaf9] shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/40'
                }`}
              >
                {/* Clickable Design Card Header Row */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => handleCardSelect(design)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardSelect(design);
                    }
                  }}
                  className={`flex flex-col md:flex-row md:items-center gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d4f]/40 ${
                    isSelected ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {/* Visual Preview */}
                  <div className="w-full md:w-56 shrink-0">
                    <DesignVisualPreview designId={design.id} isSelected={isSelected} />
                  </div>

                  {/* Title & Selected Indicator */}
                  <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold font-sans text-stone-900 truncate">
                      {design.title}
                    </h3>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff4d4f]/10 text-[#e04345] text-[11px] font-semibold font-sans">
                          <Check className="w-3 h-3" />
                          Selected
                        </span>
                      )}

                      {!isSelected && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center border bg-white border-stone-300 text-stone-400"
                          aria-hidden="true"
                        >
                          {isSavingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 opacity-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Collapsible Design Setting Sections (Directly inside the selected design card) */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-[#ff4d4f]/20 space-y-2.5">
                    {/* Accordion 1: Layout Settings */}
                    <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden">
                      <button
                        type="button"
                        aria-expanded={isLayoutExpanded}
                        onClick={() => toggleAccordionSection(layoutKey)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50/70 transition-colors cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm font-bold font-sans text-stone-900">
                          Layout Settings
                        </span>
                        <ChevronUp
                          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                            isLayoutExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isLayoutExpanded && (
                        <div className="px-4 pb-4 pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          {/* Design 1 — Hanger Style */}
                          {design.id === 'design-1-hanger' && (
                            <>
                              <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-3.5">
                                <NumericSliderControl
                                  id={`${design.id}-card-gap`}
                                  label="Product Spacing"
                                  unit="px"
                                  value={cfg.cardGap}
                                  min={8}
                                  max={48}
                                  step={1}
                                  minLabel="8px"
                                  maxLabel="48px"
                                  saving={savingFieldKey === `${design.id}:cardGap`}
                                  onLiveChange={(val) =>
                                    handleLiveNumericChange(design.id, 'cardGap', val)
                                  }
                                  onCommit={(val) =>
                                    handleCommitNumericChange(design.id, 'cardGap', val)
                                  }
                                />
                              </div>

                              <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-3.5">
                                <label
                                  htmlFor={`${design.id}-rack-sway`}
                                  className="flex items-center justify-between gap-4 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-semibold font-sans text-stone-800">
                                      Enable Rack Sway on Hover
                                    </span>
                                    {savingFieldKey === `${design.id}:rackSway` && (
                                      <Loader2 className="w-3 h-3 animate-spin text-stone-400" />
                                    )}
                                  </div>
                                  <div className="shrink-0">
                                    <input
                                      id={`${design.id}-rack-sway`}
                                      type="checkbox"
                                      checked={cfg.rackSway}
                                      disabled={savingFieldKey === `${design.id}:rackSway`}
                                      onChange={() =>
                                        handleToggleDesignBoolean(design.id, 'rackSway')
                                      }
                                      className="sr-only"
                                    />
                                    <span
                                      aria-hidden="true"
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        cfg.rackSway ? 'bg-[#ff4d4f]' : 'bg-stone-300'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                          cfg.rackSway ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                      />
                                    </span>
                                  </div>
                                </label>
                              </div>
                            </>
                          )}

                          {/* Design 2 — 3D Rotating Carousel */}
                          {design.id === 'design-2-3d-flip' && (
                            <>
                              <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-3.5">
                                <NumericSliderControl
                                  id={`${design.id}-rotation-angle`}
                                  label="3D Rotation Angle"
                                  unit="°"
                                  value={cfg.rotationAngle}
                                  min={10}
                                  max={55}
                                  step={1}
                                  minLabel="10°"
                                  maxLabel="55°"
                                  saving={savingFieldKey === `${design.id}:rotationAngle`}
                                  onLiveChange={(val) =>
                                    handleLiveNumericChange(design.id, 'rotationAngle', val)
                                  }
                                  onCommit={(val) =>
                                    handleCommitNumericChange(design.id, 'rotationAngle', val)
                                  }
                                />
                              </div>

                              <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-3.5">
                                <NumericSliderControl
                                  id={`${design.id}-side-scale`}
                                  label="Side Card Scale"
                                  unit="%"
                                  value={cfg.sideScale}
                                  min={55}
                                  max={95}
                                  step={1}
                                  minLabel="55%"
                                  maxLabel="95%"
                                  saving={savingFieldKey === `${design.id}:sideScale`}
                                  onLiveChange={(val) =>
                                    handleLiveNumericChange(design.id, 'sideScale', val)
                                  }
                                  onCommit={(val) =>
                                    handleCommitNumericChange(design.id, 'sideScale', val)
                                  }
                                />
                              </div>
                            </>
                          )}

                          {/* Design 3 — Simple Horizontal Slider */}
                          {design.id === 'design-3-simple-slider' && (
                            <>
                              <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-3.5">
                                <NumericSliderControl
                                  id={`${design.id}-slider-gap`}
                                  label="Card Spacing"
                                  unit="px"
                                  value={cfg.cardGap}
                                  min={8}
                                  max={48}
                                  step={1}
                                  minLabel="8px"
                                  maxLabel="48px"
                                  saving={savingFieldKey === `${design.id}:cardGap`}
                                  onLiveChange={(val) =>
                                    handleLiveNumericChange(design.id, 'cardGap', val)
                                  }
                                  onCommit={(val) =>
                                    handleCommitNumericChange(design.id, 'cardGap', val)
                                  }
                                />
                              </div>

                              <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-3.5">
                                <NumericSliderControl
                                  id={`${design.id}-card-width`}
                                  label="Desktop Card Width"
                                  unit="px"
                                  value={cfg.cardWidth}
                                  min={140}
                                  max={320}
                                  step={2}
                                  minLabel="140px"
                                  maxLabel="320px"
                                  saving={savingFieldKey === `${design.id}:cardWidth`}
                                  onLiveChange={(val) =>
                                    handleLiveNumericChange(design.id, 'cardWidth', val)
                                  }
                                  onCommit={(val) =>
                                    handleCommitNumericChange(design.id, 'cardWidth', val)
                                  }
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Accordion 2: Animation & Effects */}
                    <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden">
                      <button
                        type="button"
                        aria-expanded={isEffectsExpanded}
                        onClick={() => toggleAccordionSection(effectsKey)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50/70 transition-colors cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm font-bold font-sans text-stone-900">
                          Animation &amp; Effects
                        </span>
                        <ChevronUp
                          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                            isEffectsExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isEffectsExpanded && (
                        <div
                          className={`px-4 pb-4 pt-3 border-t border-stone-100 grid grid-cols-1 gap-4 items-start ${
                            design.id === 'design-2-3d-flip' ? 'lg:grid-cols-2' : ''
                          }`}
                        >
                          {/* Floating Animation Control Block (All 3 Designs) */}
                          <div
                            className={`rounded-xl border p-3.5 space-y-3.5 transition-colors ${
                              cfg.enableFloatingAnimation
                                ? 'border-[#ff4d4f]/40 bg-[#fffaf9]'
                                : 'border-stone-200 bg-white'
                            }`}
                          >
                            <label
                              htmlFor={`${design.id}-toggle-floating`}
                              className="flex items-center justify-between gap-4 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Sparkles
                                  className={`w-4 h-4 shrink-0 ${
                                    cfg.enableFloatingAnimation
                                      ? 'text-[#ff4d4f]'
                                      : 'text-stone-400'
                                  }`}
                                />
                                <span className="text-xs sm:text-sm font-bold font-sans text-stone-900">
                                  Floating Animation
                                </span>
                                {savingFieldKey === `${design.id}:enableFloatingAnimation` && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                                )}
                              </div>

                              <div className="shrink-0">
                                <input
                                  id={`${design.id}-toggle-floating`}
                                  type="checkbox"
                                  checked={cfg.enableFloatingAnimation}
                                  disabled={
                                    savingFieldKey === `${design.id}:enableFloatingAnimation`
                                  }
                                  onChange={() =>
                                    handleToggleDesignBoolean(
                                      design.id,
                                      'enableFloatingAnimation'
                                    )
                                  }
                                  className="sr-only"
                                />
                                <span
                                  aria-hidden="true"
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    cfg.enableFloatingAnimation ? 'bg-[#ff4d4f]' : 'bg-stone-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                      cfg.enableFloatingAnimation
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                                  />
                                </span>
                              </div>
                            </label>

                            {/* Reveal Floating Animation Controls ONLY when ON */}
                            {cfg.enableFloatingAnimation && (
                              <div className="pt-3 border-t border-stone-200/70 space-y-3.5">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <NumericSliderControl
                                      id={`${design.id}-animation-speed`}
                                      label="Animation Speed"
                                      helperText={`Cycle ~${(
                                        4.3 * getFloatingSpeedScale(cfg.animationSpeed)
                                      ).toFixed(1)}s`}
                                      unit="%"
                                      value={cfg.animationSpeed}
                                      min={0}
                                      max={100}
                                      step={1}
                                      minLabel="0%"
                                      maxLabel="100%"
                                      saving={savingFieldKey === `${design.id}:animationSpeed`}
                                      onLiveChange={(val) =>
                                        handleLiveNumericChange(design.id, 'animationSpeed', val)
                                      }
                                      onCommit={(val) =>
                                        handleCommitNumericChange(design.id, 'animationSpeed', val)
                                      }
                                    />
                                  </div>

                                  <div
                                    className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 shrink-0 flex items-center justify-center overflow-visible mt-1"
                                    title="Live floating preview"
                                  >
                                    <div
                                      className="w-4 h-4 rounded-xs border border-stone-300 bg-white shadow-2xs panchu-floating-item"
                                      style={
                                        {
                                          '--panchu-float-base-duration': '4.3s',
                                          '--panchu-float-speed-scale': String(
                                            getFloatingSpeedScale(cfg.animationSpeed)
                                          ),
                                          '--panchu-float-amplitude': `${Math.min(
                                            10,
                                            Math.max(2, Math.round(cfg.floatingIntensity * 0.6))
                                          )}px`
                                        } as React.CSSProperties
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-stone-200/70">
                                  <NumericSliderControl
                                    id={`${design.id}-floating-intensity`}
                                    label="Floating Intensity"
                                    unit="px"
                                    value={cfg.floatingIntensity}
                                    min={1}
                                    max={20}
                                    step={1}
                                    minLabel="1px"
                                    maxLabel="20px"
                                    saving={savingFieldKey === `${design.id}:floatingIntensity`}
                                    onLiveChange={(val) =>
                                      handleLiveNumericChange(design.id, 'floatingIntensity', val)
                                    }
                                    onCommit={(val) =>
                                      handleCommitNumericChange(design.id, 'floatingIntensity', val)
                                    }
                                  />
                                </div>

                                <div className="pt-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => handleResetFloating(e, design.id)}
                                    disabled={isResettingFloating}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold font-sans text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {isResettingFloating ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-stone-500" />
                                    ) : (
                                      <RotateCcw className="w-3 h-3 text-stone-600" />
                                    )}
                                    <span>Reset</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Shadow Setting Control Block (Exclusive to Design 2) */}
                          {design.id === 'design-2-3d-flip' && (
                            <div
                              className={`rounded-xl border p-3.5 space-y-3.5 transition-colors ${
                                cfg.enableShadow
                                  ? 'border-[#ff4d4f]/40 bg-[#fffaf9]'
                                  : 'border-stone-200 bg-white'
                              }`}
                            >
                              <label
                                htmlFor={`${design.id}-toggle-shadow`}
                                className="flex items-center justify-between gap-4 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Layers
                                    className={`w-4 h-4 shrink-0 ${
                                      cfg.enableShadow ? 'text-[#ff4d4f]' : 'text-stone-400'
                                    }`}
                                  />
                                  <span className="text-xs sm:text-sm font-bold font-sans text-stone-900">
                                    Shadow Setting
                                  </span>
                                  {savingFieldKey === `${design.id}:enableShadow` && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                                  )}
                                </div>

                                <div className="shrink-0">
                                  <input
                                    id={`${design.id}-toggle-shadow`}
                                    type="checkbox"
                                    checked={cfg.enableShadow}
                                    disabled={savingFieldKey === `${design.id}:enableShadow`}
                                    onChange={() =>
                                      handleToggleDesignBoolean(design.id, 'enableShadow')
                                    }
                                    className="sr-only"
                                  />
                                  <span
                                    aria-hidden="true"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                      cfg.enableShadow ? 'bg-[#ff4d4f]' : 'bg-stone-300'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                        cfg.enableShadow ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </span>
                                </div>
                              </label>

                              {/* Reveal Shadow Customization Controls ONLY when ON */}
                              {cfg.enableShadow && (
                                <div className="pt-3 border-t border-stone-200/70 space-y-3.5">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <NumericSliderControl
                                        id={`${design.id}-shadow-intensity`}
                                        label="Shadow Intensity & Blur"
                                        helperText={`Blur ~${Math.round(
                                          10 + (cfg.shadowIntensity / 100) * 38
                                        )}px`}
                                        unit="%"
                                        value={cfg.shadowIntensity}
                                        min={0}
                                        max={100}
                                        step={1}
                                        minLabel="0%"
                                        maxLabel="100%"
                                        saving={savingFieldKey === `${design.id}:shadowIntensity`}
                                        onLiveChange={(val) =>
                                          handleLiveNumericChange(
                                            design.id,
                                            'shadowIntensity',
                                            val
                                          )
                                        }
                                        onCommit={(val) =>
                                          handleCommitNumericChange(
                                            design.id,
                                            'shadowIntensity',
                                            val
                                          )
                                        }
                                      />
                                    </div>

                                    <div
                                      className="w-10 h-11 rounded-lg bg-stone-50 border border-stone-200 shrink-0 flex flex-col items-center justify-center gap-1 mt-1"
                                      title="Live shadow preview underneath product image"
                                    >
                                      <div className="w-4 h-4 rounded-xs bg-white border border-stone-300" />
                                      <div
                                        className="w-5 h-1.5 rounded-full"
                                        style={{
                                          opacity:
                                            cfg.shadowIntensity > 0
                                              ? Math.min(
                                                  1,
                                                  0.25 + (cfg.shadowIntensity / 100) * 0.75
                                                )
                                              : 0,
                                          filter: `blur(${Math.round(
                                            1 + (cfg.shadowIntensity / 100) * 3
                                          )}px)`,
                                          background: 'rgba(0, 0, 0, 0.65)'
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="pt-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={handleResetShadow}
                                      disabled={isResettingShadow}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold font-sans text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      {isResettingShadow ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-stone-500" />
                                      ) : (
                                        <RotateCcw className="w-3 h-3 text-stone-600" />
                                      )}
                                      <span>Reset</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
