import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Smartphone,
  Monitor,
  Info,
  FileCheck,
  XCircle
} from 'lucide-react';
import {
  subscribeBanners,
  uploadBannerImageToStorage,
  saveBannerToFirestore,
  seedInitialBannersIfEmpty,
  APPROVED_MALE_BANNER_URL,
  APPROVED_FEMALE_BANNER_URL,
  BannerUploadProgress
} from '../../services/firebaseService';
import { BannerDoc } from '../../types';
import { ProgressiveBanner } from '../common/ProgressiveBanner';

export interface BannersViewProps {
  uploadBannerHandler?: (
    file: File,
    gender: 'male' | 'female',
    onProgress?: (progress: BannerUploadProgress) => void
  ) => Promise<string>;
}

export const BannersView: React.FC<BannersViewProps> = ({ uploadBannerHandler }) => {
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

  // Upload & Progress states
  const [maleProgress, setMaleProgress] = useState<BannerUploadProgress | null>(null);
  const [femaleProgress, setFemaleProgress] = useState<BannerUploadProgress | null>(null);
  const [maleError, setMaleError] = useState<{ message: string; details?: string } | null>(null);
  const [femaleError, setFemaleError] = useState<{ message: string; details?: string } | null>(null);

  const [isDraggingMale, setIsDraggingMale] = useState<boolean>(false);
  const [isDraggingFemale, setIsDraggingFemale] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const maleFileInputRef = useRef<HTMLInputElement>(null);
  const femaleFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ensure initial banner documents exist in Firestore
    seedInitialBannersIfEmpty().catch(console.warn);

    const unsubscribe = subscribeBanners((data) => {
      setBanners(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  // Handle direct file upload to Firebase Storage & Firestore with live progress and structured error capturing
  const handleFileUpload = async (file: File, gender: 'male' | 'female') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (JPG, PNG, WEBP, AVIF).');
      return;
    }

    if (gender === 'male') {
      setMaleError(null);
      setMaleProgress({
        stage: 'checking',
        percent: 0,
        message: 'Initializing upload pipeline...'
      });
    } else {
      setFemaleError(null);
      setFemaleProgress({
        stage: 'checking',
        percent: 0,
        message: 'Initializing upload pipeline...'
      });
    }

    const runner = uploadBannerHandler || uploadBannerImageToStorage;

    try {
      await runner(file, gender, (progress) => {
        if (gender === 'male') {
          setMaleProgress(progress);
        } else {
          setFemaleProgress(progress);
        }
      });
      showToast('success', `${gender === 'male' ? 'Male' : 'Female'} banner successfully uploaded to Firebase Storage and synced live!`);
    } catch (err: any) {
      console.error('[Banner Upload Error Caught in BannersView]', {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        fullError: err
      });
      const errorMessage = err?.message || 'Failed to upload banner to Firebase Storage.';
      if (gender === 'male') {
        setMaleError({ message: errorMessage });
      } else {
        setFemaleError({ message: errorMessage });
      }
      showToast('error', errorMessage);
    } finally {
      if (gender === 'male') {
        setTimeout(() => setMaleProgress(null), 1500);
      } else {
        setTimeout(() => setFemaleProgress(null), 1500);
      }
    }
  };

  // Reset to default approved banner
  const handleResetToDefault = async (gender: 'male' | 'female') => {
    const defaultUrl = gender === 'male' ? APPROVED_MALE_BANNER_URL : APPROVED_FEMALE_BANNER_URL;

    if (gender === 'male') {
      setMaleError(null);
      setMaleProgress({ stage: 'saving-firestore', percent: 50, message: 'Resetting to default banner...' });
    } else {
      setFemaleError(null);
      setFemaleProgress({ stage: 'saving-firestore', percent: 50, message: 'Resetting to default banner...' });
    }

    try {
      await saveBannerToFirestore(
        gender,
        defaultUrl,
        'default_approved_banner.jpg',
        undefined,
        undefined,
        `${gender === 'male' ? 'Male' : 'Female'} Hero Campaign Banner`
      );
      showToast('success', `Reset ${gender === 'male' ? 'Male' : 'Female'} banner to default approved campaign image.`);
    } catch (err: any) {
      console.error('Error resetting banner:', err);
      const errMsg = err?.message || 'Failed to reset banner.';
      if (gender === 'male') setMaleError({ message: errMsg });
      else setFemaleError({ message: errMsg });
      showToast('error', errMsg);
    } finally {
      if (gender === 'male') setMaleProgress(null);
      else setFemaleProgress(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isUploadingMale = !!maleProgress;
  const isUploadingFemale = !!femaleProgress;

  return (
    <div className="space-y-6 pt-2 max-w-6xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 flex items-center gap-2.5">
            <span>Hero Campaign Banners</span>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Firebase Storage Synced
            </span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Upload original high-definition banner images directly to Firebase Storage with instant storefront synchronization.
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
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium transition-all shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 shrink-0 text-blue-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
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
              className="text-[11px] text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
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
              <ProgressiveBanner
                src={banners.male || APPROVED_MALE_BANNER_URL}
                alt="Male Hero Banner Live Preview"
                gender="male"
                priority={false}
                objectPosition="object-[center_18%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none z-10" />

              {/* Shop Now Overlay Demo Tag */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="px-4 py-1.5 border border-white/90 bg-black/60 text-white text-[10px] tracking-[0.2em] font-montserrat font-bold uppercase shadow-lg">
                  SHOP NOW
                </div>
              </div>

              {/* Direct Open Link on Hover */}
              <a
                href={banners.male || APPROVED_MALE_BANNER_URL}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black text-[10px] flex items-center gap-1 z-20"
                title="View Full Resolution Image"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Active File Info */}
          {banners.maleDoc?.fileName && (
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
              <div className="flex items-center gap-2 truncate">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-medium">{banners.maleDoc.fileName}</span>
              </div>
              {banners.maleDoc.fileSize && (
                <span className="text-stone-400 font-mono shrink-0 ml-2">
                  {formatFileSize(banners.maleDoc.fileSize)}
                </span>
              )}
            </div>
          )}

          {/* Error Alert Box if any */}
          {maleError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-xs text-red-900 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Upload Error</span>
                </div>
                <button
                  onClick={() => setMaleError(null)}
                  className="text-red-400 hover:text-red-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-red-800 font-mono break-words pl-6">
                {maleError.message}
              </p>
            </div>
          )}

          {/* Direct File Upload Dropzone / Button with Real-time Progress */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <input
              type="file"
              ref={maleFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'male');
                  e.target.value = '';
                }
              }}
            />
            
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingMale(true);
              }}
              onDragLeave={() => setIsDraggingMale(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingMale(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0], 'male');
                }
              }}
              onClick={() => {
                if (!isUploadingMale) maleFileInputRef.current?.click();
              }}
              className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                isDraggingMale
                  ? 'border-stone-900 bg-stone-100'
                  : 'border-stone-300 hover:border-stone-900 bg-stone-50/70 hover:bg-stone-100/80'
              } ${isUploadingMale ? 'pointer-events-none bg-stone-50 border-stone-400' : ''}`}
            >
              {maleProgress ? (
                <div className="w-full space-y-2 py-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-900">
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-900" />
                    <span>{maleProgress.message}</span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, maleProgress.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono px-1">
                    <span>Stage: {maleProgress.stage}</span>
                    <span>{maleProgress.percent}%</span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-stone-700" />
                  <span className="text-xs font-semibold text-stone-900">Select or Drag & Drop Male Banner Picture</span>
                  <span className="text-[10px] text-stone-500">High-resolution JPG, PNG, WEBP — Original quality preserved</span>
                </>
              )}
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
              className="text-[11px] text-stone-500 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
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
              <ProgressiveBanner
                src={banners.female || APPROVED_FEMALE_BANNER_URL}
                alt="Female Hero Banner Live Preview"
                gender="female"
                priority={false}
                objectPosition="object-[center_18%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none z-10" />

              {/* Shop Now Overlay Demo Tag */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="px-4 py-1.5 border border-white/90 bg-black/60 text-white text-[10px] tracking-[0.2em] font-montserrat font-bold uppercase shadow-lg">
                  SHOP NOW
                </div>
              </div>

              {/* Direct Open Link on Hover */}
              <a
                href={banners.female || APPROVED_FEMALE_BANNER_URL}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black text-[10px] flex items-center gap-1 z-20"
                title="View Full Resolution Image"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Active File Info */}
          {banners.femaleDoc?.fileName && (
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
              <div className="flex items-center gap-2 truncate">
                <FileCheck className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span className="truncate font-medium">{banners.femaleDoc.fileName}</span>
              </div>
              {banners.femaleDoc.fileSize && (
                <span className="text-stone-400 font-mono shrink-0 ml-2">
                  {formatFileSize(banners.femaleDoc.fileSize)}
                </span>
              )}
            </div>
          )}

          {/* Error Alert Box if any */}
          {femaleError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-xs text-red-900 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Upload Error</span>
                </div>
                <button
                  onClick={() => setFemaleError(null)}
                  className="text-red-400 hover:text-red-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-red-800 font-mono break-words pl-6">
                {femaleError.message}
              </p>
            </div>
          )}

          {/* Direct File Upload Dropzone / Button with Real-time Progress */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <input
              type="file"
              ref={femaleFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'female');
                  e.target.value = '';
                }
              }}
            />
            
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFemale(true);
              }}
              onDragLeave={() => setIsDraggingFemale(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFemale(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0], 'female');
                }
              }}
              onClick={() => {
                if (!isUploadingFemale) femaleFileInputRef.current?.click();
              }}
              className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                isDraggingFemale
                  ? 'border-pink-600 bg-pink-50/50'
                  : 'border-stone-300 hover:border-pink-600 bg-stone-50/70 hover:bg-stone-100/80'
              } ${isUploadingFemale ? 'pointer-events-none bg-stone-50 border-pink-300' : ''}`}
            >
              {femaleProgress ? (
                <div className="w-full space-y-2 py-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-900">
                    <RefreshCw className="w-4 h-4 animate-spin text-pink-600" />
                    <span>{femaleProgress.message}</span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, femaleProgress.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono px-1">
                    <span>Stage: {femaleProgress.stage}</span>
                    <span>{femaleProgress.percent}%</span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-stone-700" />
                  <span className="text-xs font-semibold text-stone-900">Select or Drag & Drop Female Banner Picture</span>
                  <span className="text-[10px] text-stone-500">High-resolution JPG, PNG, WEBP — Original quality preserved</span>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Architecture & Diagnostic Info Card */}
      <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">Direct Firebase Storage Architecture & Diagnostics</p>
          <p>
            When you select an image, it is uploaded in its original uncompressed resolution to Firebase Storage (<code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/</code>) using resumable chunk streams with a 45s safety timeout. The verified download URL is saved in Firestore (<code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/male</code> or <code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/female</code>), syncing the storefront in real-time across all visitor browsers and devices.
          </p>
        </div>
      </div>
    </div>
  );
};
