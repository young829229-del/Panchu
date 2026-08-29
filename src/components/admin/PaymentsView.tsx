import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  QrCode,
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { PaymentSettings } from '../../types';
import {
  subscribePaymentSettings,
  updatePaymentSettings,
  uploadPaymentQrImage,
  getCanonicalPaymentSettingsSync
} from '../../services/firebaseService';

const AVAILABLE_PAYMENT_METHODS = [
  {
    id: 'eSewa',
    name: 'eSewa',
    description: 'Direct digital wallet payment via eSewa ID or QR.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'Bank Transfer',
    name: 'Bank Transfer',
    description: 'Direct bank deposit / Fonepay account transfer.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'Cash on Delivery (COD)',
    name: 'Cash on Delivery (COD)',
    description: 'Pay with physical cash upon package doorstep arrival.',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-200'
  }
];

export const PaymentsView: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>(() => getCanonicalPaymentSettingsSync());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe in real-time to Firestore payment settings
  useEffect(() => {
    const unsubscribe = subscribePaymentSettings((liveSettings) => {
      setSettings(liveSettings);
    });
    return () => unsubscribe();
  }, []);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleToggleQr = async () => {
    const newQrState = !settings.qrEnabled;
    setIsSaving(true);
    try {
      await updatePaymentSettings({ qrEnabled: newQrState });
      showStatus('success', `QR code payment is now ${newQrState ? 'ENABLED' : 'DISABLED'}.`);
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to update QR setting.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleScreenshot = async () => {
    const newScreenshotState = !settings.screenshotEnabled;
    setIsSaving(true);
    try {
      await updatePaymentSettings({ screenshotEnabled: newScreenshotState });
      showStatus('success', `Payment Screenshot Upload is now ${newScreenshotState ? 'ENABLED' : 'DISABLED'}.`);
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to update screenshot setting.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMethod = async (methodId: string) => {
    const currentMethods = settings.paymentMethods || [];
    let updatedMethods: string[];

    if (currentMethods.includes(methodId)) {
      if (currentMethods.length === 1) {
        showStatus('error', 'At least one payment method must remain active.');
        return;
      }
      updatedMethods = currentMethods.filter((m) => m !== methodId);
    } else {
      updatedMethods = [...currentMethods, methodId];
    }

    setIsSaving(true);
    try {
      await updatePaymentSettings({ paymentMethods: updatedMethods });
      showStatus('success', 'Active payment methods updated.');
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to update payment methods.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQrFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    try {
      const downloadUrl = await uploadPaymentQrImage(file);
      showStatus('success', 'QR code image uploaded & synced successfully!');
    } catch (err: any) {
      console.error('QR code upload error:', err);
      showStatus('error', err?.message || 'Failed to upload QR image.');
    } finally {
      setIsUploadingQr(false);
      if (qrFileInputRef.current) qrFileInputRef.current.value = '';
    }
  };

  const handleRemoveQrImage = async () => {
    if (!window.confirm('Are you sure you want to remove the current QR code image?')) return;
    setIsSaving(true);
    try {
      await updatePaymentSettings({ qrImageUrl: null, qrEnabled: false });
      showStatus('success', 'QR code image removed.');
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to remove QR image.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#ff4d4f]" />
            <span>Payment Settings</span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Manage checkout payment methods, QR code display, and customer payment verification uploads.
          </p>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-mono self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced with Live Store</span>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-sans flex items-center gap-2.5 border transition-all animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: AVAILABLE PAYMENT METHODS */}
      <div className="bg-white border border-stone-200/70 shadow-2xs rounded-3xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold font-sans text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-500" />
            <span>Selectable Payment Methods</span>
          </h2>
          <p className="text-xs text-stone-500 font-sans mt-1">
            Choose which payment options customers can select during checkout on the website.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {AVAILABLE_PAYMENT_METHODS.map((method) => {
            const isSelected = (settings.paymentMethods || []).includes(method.id);

            return (
              <div
                key={method.id}
                onClick={() => !isSaving && handleToggleMethod(method.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#ff4d4f] bg-[#fff8f8] shadow-xs'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-xs font-bold font-sans ${
                        isSelected ? 'text-stone-900' : 'text-stone-600'
                      }`}
                    >
                      {method.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#ff4d4f] text-white' : 'border border-stone-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                    {method.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100/80 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                    {isSelected ? 'ACTIVE AT CHECKOUT' : 'DISABLED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: QR CODE CONTROLS */}
      <div className="bg-white border border-stone-200/70 shadow-2xs rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4.5 h-4.5 text-stone-700" />
              <h2 className="text-sm font-bold font-sans text-stone-900 uppercase tracking-wider">
                QR Code Control
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-1">
              Toggle QR code display in the checkout area for digital payments (eSewa & Bank Transfer).
            </p>
          </div>

          {/* Simple ON/OFF Switch */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-semibold font-sans text-stone-700">
              QR Code: <strong className={settings.qrEnabled ? 'text-emerald-600' : 'text-stone-400'}>{settings.qrEnabled ? 'ON' : 'OFF'}</strong>
            </span>
            <button
              type="button"
              onClick={handleToggleQr}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.qrEnabled ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.qrEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* QR Code Management Box */}
        <div className="p-4.5 bg-[#faf9f8] rounded-2xl border border-stone-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            {/* Image Preview Box */}
            <div className="relative w-32 h-32 bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 group">
              {settings.qrImageUrl ? (
                <>
                  <img
                    src={settings.qrImageUrl}
                    alt="Payment QR Code"
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(true)}
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-900 cursor-pointer"
                      title="View Full Size"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveQrImage}
                      className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                      title="Remove QR"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-3">
                  <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-1" />
                  <span className="text-[10px] text-stone-400 font-mono block">No QR Uploaded</span>
                </div>
              )}

              {isUploadingQr && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4f]" />
                  <span className="text-[9px] font-mono font-bold text-stone-700">Uploading...</span>
                </div>
              )}
            </div>

            {/* Upload & Controls */}
            <div className="space-y-2.5 flex-1">
              <h3 className="text-xs font-bold font-sans text-stone-900">
                {settings.qrImageUrl ? 'Manage Store QR Image' : 'Upload Store QR Code'}
              </h3>
              <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                Upload your official eSewa or Fonepay Bank Transfer QR image. When QR is toggled ON, customers can scan this QR code directly at checkout.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={qrFileInputRef}
                  onChange={handleQrFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => qrFileInputRef.current?.click()}
                  disabled={isUploadingQr || isSaving}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-medium font-sans flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{settings.qrImageUrl ? 'Change QR Image' : 'Upload QR Image'}</span>
                </button>

                {settings.qrImageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveQrImage}
                    disabled={isSaving}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-red-600 hover:bg-red-50 text-xs font-medium font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 font-mono bg-white p-3 rounded-xl border border-stone-100 flex items-center justify-between">
            <span>Customer View Behavior:</span>
            <span className="font-bold text-stone-700">
              {settings.qrEnabled
                ? settings.qrImageUrl
                  ? 'Displays QR cleanly in checkout'
                  : 'Requires QR image to be shown'
                : 'Fully collapsed (no blank gap or empty container)'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: PAYMENT SCREENSHOT UPLOAD CONTROLS */}
      <div className="bg-white border border-stone-200/70 shadow-2xs rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Upload className="w-4.5 h-4.5 text-stone-700" />
              <h2 className="text-sm font-bold font-sans text-stone-900 uppercase tracking-wider">
                Payment Screenshot Upload
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-1">
              Require or allow customers to attach their payment confirmation screenshot during checkout.
            </p>
          </div>

          {/* Simple ON/OFF Switch */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-semibold font-sans text-stone-700">
              Screenshot Upload: <strong className={settings.screenshotEnabled ? 'text-emerald-600' : 'text-stone-400'}>{settings.screenshotEnabled ? 'ON' : 'OFF'}</strong>
            </span>
            <button
              type="button"
              onClick={handleToggleScreenshot}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.screenshotEnabled ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.screenshotEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5">
            <h4 className="font-bold text-stone-800">When Screenshot Upload is ON:</h4>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Customers can upload their eSewa / Bank payment slip directly at checkout. The uploaded image is securely stored in Firebase Storage and linked to the order for admin review.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5">
            <h4 className="font-bold text-stone-800">When Screenshot Upload is OFF:</h4>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              The screenshot upload area is completely hidden and dynamically collapsed from the checkout view with no residual empty spaces or visual gaps.
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox QR Preview Modal */}
      {previewModalOpen && settings.qrImageUrl && (
        <div
          onClick={() => setPreviewModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-sm font-bold font-sans text-stone-900">Active Store QR Code</h3>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-center">
              <img
                src={settings.qrImageUrl}
                alt="Active Store QR Code"
                className="max-h-72 w-auto object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
