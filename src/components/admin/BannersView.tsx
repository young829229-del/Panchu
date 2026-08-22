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
  FileCheck
} from 'lucide-react';
import {
  subscribeBanners,
  uploadBannerImageToStorage,
  saveBannerToFirestore,
  seedInitialBannersIfEmpty,
  APPROVED_MALE_BANNER_URL,
  APPROVED_FEMALE_BANNER_URL
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

  // Upload & Save loading states
  const [isUploadingMale, setIsUploadingMale] = useState<boolean>(false);
  const [isUploadingFemale, setIsUploadingFemale] = useState<boolean>(false);
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
    }, 4000);
  };

  // Handle direct file upload to Firebase Storage & Firestore
  const handleFileUpload = async (file: File, gender: 'male' | 'female') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (JPG, PNG, WEBP, AVIF).');
      return;
    }

    if (gender === 'male') setIsUploadingMale(true);
    else setIsUploadingFemale(true);

    try {
      await uploadBannerImageToStorage(file, gender);
      showToast('success', `${gender === 'male' ? 'Male' : 'Female'} banner successfully uploaded to Firebase Storage and synced live!`);
    } catch (err: any) {
      console.error('Banner upload error:', err);
      showToast('error', err?.message || 'Failed to upload banner to Firebase Storage.');
    } finally {
      if (gender === 'male') setIsUploadingMale(false);
      else setIsUploadingFemale(false);
    }
  };

  // Reset to default approved banner
  const handleResetToDefault = async (gender: 'male' | 'female') => {
    const defaultUrl = gender === 'male' ? APPROVED_MALE_BANNER_URL : APPROVED_FEMALE_BANNER_URL;

    if (gender === 'male') setIsUploadingMale(true);
    else setIsUploadingFemale(true);

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
      showToast('error', 'Failed to reset banner.');
    } finally {
      if (gender === 'male') setIsUploadingMale(false);
      else setIsUploadingFemale(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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

          {/* Direct File Upload Dropzone / Button */}
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
              onClick={() => maleFileInputRef.current?.click()}
              className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center ${
                isDraggingMale
                  ? 'border-stone-900 bg-stone-100'
                  : 'border-stone-300 hover:border-stone-900 bg-stone-50/70 hover:bg-stone-100/80'
              } ${isUploadingMale ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {isUploadingMale ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-stone-800" />
                  <span className="text-xs font-semibold text-stone-900">Uploading original image to Firebase Storage...</span>
                  <span className="text-[10px] text-stone-500">Updating Firestore & storefront live</span>
                </>
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

          {/* Direct File Upload Dropzone / Button */}
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
              onClick={() => femaleFileInputRef.current?.click()}
              className={`w-full py-4 px-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center ${
                isDraggingFemale
                  ? 'border-pink-600 bg-pink-50/50'
                  : 'border-stone-300 hover:border-pink-600 bg-stone-50/70 hover:bg-stone-100/80'
              } ${isUploadingFemale ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {isUploadingFemale ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-pink-600" />
                  <span className="text-xs font-semibold text-stone-900">Uploading original image to Firebase Storage...</span>
                  <span className="text-[10px] text-stone-500">Updating Firestore & storefront live</span>
                </>
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

      {/* Architecture Info Card */}
      <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">Direct Firebase Storage Architecture</p>
          <p>
            When you select an image, it is uploaded in its original uncompressed resolution to Firebase Storage (<code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/</code>) and the live secure download URL is stored in Firestore (<code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/male</code> or <code className="font-mono text-stone-800 bg-stone-200/80 px-1 py-0.5 rounded">banners/female</code>). Storefront visitors and all connected devices receive and display the newly uploaded picture in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};
