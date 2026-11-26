import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Rotate3d
} from 'lucide-react';
import { YouMightLikeDesignId } from '../../types';
import { YOU_MIGHT_LIKE_DESIGNS, YouMightLikeDesignDefinition } from '../../data/youMightLikeDesigns';
import {
  getCanonicalAdditionalOptionsSync,
  subscribeAdditionalOptionsSettings,
  saveYouMightLikeDesignToFirestore
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
  const [selectedDesign, setSelectedDesign] = useState<YouMightLikeDesignId>(
    () => getCanonicalAdditionalOptionsSync().youMightLikeDesign
  );
  const [savingDesignId, setSavingDesignId] = useState<YouMightLikeDesignId | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAdditionalOptionsSettings((liveSettings) => {
      setSelectedDesign(liveSettings.youMightLikeDesign);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectDesign = async (design: YouMightLikeDesignDefinition) => {
    if (savingDesignId) return;
    if (selectedDesign === design.id) return;

    const previousDesign = selectedDesign;
    setSelectedDesign(design.id);
    setSavingDesignId(design.id);
    setStatusMessage(null);

    try {
      await saveYouMightLikeDesignToFirestore(design.id, adminEmail);
      setStatusMessage({
        type: 'success',
        text: `${design.title} is now active on the storefront and saved in Firebase.`
      });
    } catch (err: any) {
      setSelectedDesign(previousDesign);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save design selection in Firebase. Please try again.'
      });
    } finally {
      setSavingDesignId(null);
    }
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

      {/* Live Save Status Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-sans flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
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
    </div>
  );
};
