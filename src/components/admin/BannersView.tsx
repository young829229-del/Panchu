import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Smartphone,
  Monitor,
  Check,
  Info
} from 'lucide-react';
import {
  subscribeBanners,
  saveBannerToFirestore,
  uploadBannerImageToStorage,
  seedInitialBannersIfEmpty,
  APPROVED_MALE_BANNER_URL,
  APPROVED_FEMALE_BANNER_URL,
  resolveBannerUrl
} from '../../services/firebaseService';
import { BannerDoc } from '../../types';

export const BannersView: React.FC = () => {
  const [banners, setBanners] = useState<{
    male: string;
    female: string;
    maleDoc?: BannerDoc;
    femaleDoc?: BannerDoc;
  }>({
    male: APPROVED_MALE_BANNER_URL,
    female: APPROVED_FEMALE_BANNER_URL
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [activePreviewDevice, setActivePreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Input states for manual URL editing
  const [maleInputUrl, setMaleInputUrl] = useState<string>('');
  const [femaleInputUrl, setFemaleInputUrl] = useState<string>('');

  // Upload & Save loading states
  const [isUploadingMale, setIsUploadingMale] = useState<boolean>(false);
  const [isUploadingFemale, setIsUploadingFemale] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const maleFileInputRef = useRef<HTMLInputElement>(null);
  const femaleFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ensure initial banner documents exist in Firestore
    seedInitialBannersIfEmpty().catch(console.warn);

    const unsubscribe = subscribeBanners((data) => {
      setBanners(data);
      if (!maleInputUrl) setMaleInputUrl(data.maleDoc?.originalUrl || data.male || '');
      if (!femaleInputUrl) setFemaleInputUrl(data.femaleDoc?.originalUrl || data.female || '');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Handle file upload to Firebase Storage
  const handleFileUpload = async (file: File, gender: 'male' | 'female') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (JPG, PNG, WEBP, AVIF).');
      return;
    }

    if (gender === 'male') setIsUploadingMale(true);
    else setIsUploadingFemale(true);

    try {
      const downloadUrl = await uploadBannerImageToStorage(file, gender);
      if (gender === 'male') {
        setMaleInputUrl(downloadUrl);
      } else {
        setFemaleInputUrl(downloadUrl);
      }
      showToast('success', `${gender === 'male' ? 'Male' : 'Female'} banner successfully uploaded to Firebase Storage and updated live!`);
    } catch (err: any) {
      console.error('Banner upload error:', err);
      showToast('error', err?.message || 'Failed to upload banner to Firebase Storage.');
    } finally {
      if (gender === 'male') setIsUploadingMale(false);
      else setIsUploadingFemale(false);
    }
  };

  // Handle URL Save to Firestore
  const handleSaveUrl = async (gender: 'male' | 'female') => {
    const inputUrl = gender === 'male' ? maleInputUrl : femaleInputUrl;
    if (!inputUrl || !inputUrl.trim()) {
      showToast('error', 'Please enter a valid image URL.');
      return;
    }

    if (gender === 'male') setIsUploadingMale(true);
    else setIsUploadingFemale(true);

    try {
      const resolved = resolveBannerUrl(inputUrl);
      await saveBannerToFirestore(gender, resolved, inputUrl.trim());
      showToast('success', `${gender === 'male' ? 'Male' : 'Female'} banner updated live in Firestore!`);
    } catch (err: any) {
      console.error('Error saving banner URL:', err);
      showToast('error', err?.message || 'Failed to save banner URL to Firestore.');
    } finally {
      if (gender === 'male') setIsUploadingMale(false);
      else setIsUploadingFemale(false);
    }
  };

  // Reset to default approved banner
  const handleResetToDefault = async (gender: 'male' | 'female') => {
    const defaultUrl = gender === 'male' ? APPROVED_MALE_BANNER_URL : APPROVED_FEMALE_BANNER_URL;
    const defaultOriginal = gender === 'male' ? 'https://ibb.co/PvZVj2fS' : 'https://ibb.co/sdJW2VRT';

    if (gender === 'male') setIsUploadingMale(true);
    else setIsUploadingFemale(true);

    try {
      await saveBannerToFirestore(gender, defaultUrl, defaultOriginal);
      if (gender === 'male') setMaleInputUrl(defaultOriginal);
      else setFemaleInputUrl(defaultOriginal);
      showToast('success', `Reset ${gender === 'male' ? 'Male' : 'Female'} banner to approved default image!`);
    } catch (err: any) {
      console.error('Error resetting banner:', err);
      showToast('error', 'Failed to reset banner.');
    } finally {
      if (gender === 'male') setIsUploadingMale(false);
      else setIsUploadingFemale(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 max-w-6xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 flex items-center gap-2.5">
            <span>Hero Campaign Banners</span>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Firebase Synced
            </span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Manage the primary homepage hero banners for Male and Female store modes with real-time Firebase synchronization.
          </p>
        </div>

        {/* Device Preview Toggle */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl self-start sm:self-auto border border-stone-200">
          <button
            type="button"
            onClick={() => setActivePreviewDevice('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activePreviewDevice === 'desktop'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Aspect</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePreviewDevice('mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activePreviewDevice === 'mobile'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Aspect</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-medium transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />}
          {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
          {statusMessage.type === 'info' && <Info className="w-4 h-4 shrink-0 text-blue-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid of Male and Female Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= MALE BANNER CARD ================= */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                ♂
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase">Male Campaign Banner</h3>
                <span className="text-[10px] text-stone-400 font-mono">Firestore: banners/male</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleResetToDefault('male')}
              disabled={isUploadingMale}
              className="text-[11px] text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-50 transition-colors"
              title="Reset to approved original banner"
            >
              <RotateCcw className="w-3 h-3 text-stone-400" />
              <span>Reset Default</span>
            </button>
          </div>

          {/* Live Preview Container */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span className="font-medium">Live Storefront Preview</span>
              <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                ● Live Active
              </span>
            </div>

            <div
              className={`relative bg-stone-900 rounded-2xl overflow-hidden border border-stone-200/80 group transition-all duration-300 flex items-center justify-center ${
                activePreviewDevice === 'desktop' ? 'aspect-[16/9]' : 'aspect-[9/14] max-w-[280px] mx-auto'
              }`}
            >
              <img
                src={banners.male || APPROVED_MALE_BANNER_URL}
                alt="Male Hero Banner Live Preview"
                className="w-full h-full object-cover object-[center_18%]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

              {/* Shop Now Overlay Demo Tag */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-1.5 border border-white/90 bg-black/60 text-white text-[10px] tracking-[0.2em] font-montserrat font-bold uppercase shadow-lg">
                  SHOP NOW
                </div>
              </div>

              {/* Direct Open Link on Hover */}
              <a
                href={banners.male || APPROVED_MALE_BANNER_URL}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black text-[10px] flex items-center gap-1"
                title="View Full Resolution Image"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Upload Image to Firebase Storage */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <label className="block text-xs font-semibold text-stone-800 font-sans">
              1. Upload Banner Image (Firebase Storage)
            </label>
            <input
              type="file"
              ref={maleFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'male');
                }
              }}
            />
            <button
              type="button"
              onClick={() => maleFileInputRef.current?.click()}
              disabled={isUploadingMale}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isUploadingMale ? (
                <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
              ) : (
                <Upload className="w-4 h-4 text-stone-500" />
              )}
              <span>{isUploadingMale ? 'Uploading to Firebase Storage...' : 'Upload New Male Banner (File)'}</span>
            </button>
          </div>

          {/* Or Paste Direct URL */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-800 font-sans">
              2. Or Paste Custom Image / ImgBB URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={maleInputUrl}
                onChange={(e) => setMaleInputUrl(e.target.value)}
                placeholder="https://i.ibb.co/... or https://ibb.co/..."
                className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
              />
              <button
                type="button"
                onClick={() => handleSaveUrl('male')}
                disabled={isUploadingMale}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* ================= FEMALE BANNER CARD ================= */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                ♀
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase">Female Campaign Banner</h3>
                <span className="text-[10px] text-stone-400 font-mono">Firestore: banners/female</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleResetToDefault('female')}
              disabled={isUploadingFemale}
              className="text-[11px] text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-50 transition-colors"
              title="Reset to approved original banner"
            >
              <RotateCcw className="w-3 h-3 text-stone-400" />
              <span>Reset Default</span>
            </button>
          </div>

          {/* Live Preview Container */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span className="font-medium">Live Storefront Preview</span>
              <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                ● Live Active
              </span>
            </div>

            <div
              className={`relative bg-stone-900 rounded-2xl overflow-hidden border border-stone-200/80 group transition-all duration-300 flex items-center justify-center ${
                activePreviewDevice === 'desktop' ? 'aspect-[16/9]' : 'aspect-[9/14] max-w-[280px] mx-auto'
              }`}
            >
              <img
                src={banners.female || APPROVED_FEMALE_BANNER_URL}
                alt="Female Hero Banner Live Preview"
                className="w-full h-full object-cover object-[center_18%]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

              {/* Shop Now Overlay Demo Tag */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-1.5 border border-white/90 bg-black/60 text-white text-[10px] tracking-[0.2em] font-montserrat font-bold uppercase shadow-lg">
                  SHOP NOW
                </div>
              </div>

              {/* Direct Open Link on Hover */}
              <a
                href={banners.female || APPROVED_FEMALE_BANNER_URL}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black text-[10px] flex items-center gap-1"
                title="View Full Resolution Image"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Upload Image to Firebase Storage */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <label className="block text-xs font-semibold text-stone-800 font-sans">
              1. Upload Banner Image (Firebase Storage)
            </label>
            <input
              type="file"
              ref={femaleFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'female');
                }
              }}
            />
            <button
              type="button"
              onClick={() => femaleFileInputRef.current?.click()}
              disabled={isUploadingFemale}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isUploadingFemale ? (
                <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
              ) : (
                <Upload className="w-4 h-4 text-stone-500" />
              )}
              <span>{isUploadingFemale ? 'Uploading to Firebase Storage...' : 'Upload New Female Banner (File)'}</span>
            </button>
          </div>

          {/* Or Paste Direct URL */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-800 font-sans">
              2. Or Paste Custom Image / ImgBB URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={femaleInputUrl}
                onChange={(e) => setFemaleInputUrl(e.target.value)}
                placeholder="https://i.ibb.co/... or https://ibb.co/..."
                className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
              />
              <button
                type="button"
                onClick={() => handleSaveUrl('female')}
                disabled={isUploadingFemale}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">Banner Architecture & Consistency</p>
          <p>
            The website uses a single authoritative Firestore document per gender (<code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/male</code> and <code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/female</code>). All visitor devices (mobile, tablet, desktop) and browsers listen in real-time to this single source of truth.
          </p>
        </div>
      </div>
    </div>
  );
};
