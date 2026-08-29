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
  X,
  Layers,
  Check
} from 'lucide-react';
import { PaymentSettings } from '../../types';
import {
  subscribePaymentSettings,
  updatePaymentSettings,
  uploadPaymentQrImage,
  getCanonicalPaymentSettingsSync
} from '../../services/firebaseService';

interface PaymentMethodDef {
  id: string;
  name: string;
  description: string;
  qrEnabledKey: 'esewaQrEnabled' | 'bankQrEnabled' | 'codQrEnabled';
  qrImageKey: 'esewaQrImageUrl' | 'bankQrImageUrl' | 'codQrImageUrl';
  badgeColor: string;
}

const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: 'eSewa',
    name: 'eSewa',
    description: 'Digital wallet payment via eSewa ID or QR.',
    qrEnabledKey: 'esewaQrEnabled',
    qrImageKey: 'esewaQrImageUrl',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'Bank Transfer',
    name: 'Bank Transfer',
    description: 'Direct bank deposit / Fonepay account transfer.',
    qrEnabledKey: 'bankQrEnabled',
    qrImageKey: 'bankQrImageUrl',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'Cash on Delivery (COD)',
    name: 'Cash on Delivery (COD)',
    description: 'Pay with physical cash upon package doorstep delivery.',
    qrEnabledKey: 'codQrEnabled',
    qrImageKey: 'codQrImageUrl',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200'
  }
];

export const PaymentsView: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>(() => getCanonicalPaymentSettingsSync());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadingMethodId, setUploadingMethodId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  // Explicit static file input refs per payment method
  const esewaInputRef = useRef<HTMLInputElement | null>(null);
  const bankInputRef = useRef<HTMLInputElement | null>(null);
  const codInputRef = useRef<HTMLInputElement | null>(null);

  const getMethodInputRef = (methodId: string) => {
    if (methodId === 'eSewa') return esewaInputRef;
    if (methodId === 'Bank Transfer') return bankInputRef;
    return codInputRef;
  };

  // Real-time subscription to Firestore payment settings
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

  // Toggle active status of a payment method at checkout
  const handleToggleMethodActive = async (methodId: string) => {
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
      showStatus('success', `${methodId} checkout status updated.`);
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to update payment method.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle QR code display ON/OFF for a specific method
  const handleToggleMethodQr = async (method: PaymentMethodDef) => {
    const currentState = Boolean(settings[method.qrEnabledKey]);
    const newState = !currentState;
    setIsSaving(true);
    try {
      await updatePaymentSettings({ [method.qrEnabledKey]: newState });
      showStatus('success', `${method.name} QR code is now ${newState ? 'ON' : 'OFF'}.`);
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to update QR setting.');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload QR image for a specific payment method
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, method: PaymentMethodDef) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMethodId(method.id);
    try {
      await uploadPaymentQrImage(file, method.id);
      showStatus('success', `${method.name} QR image uploaded & enabled!`);
    } catch (err: any) {
      console.error('QR upload error:', err);
      showStatus('error', err?.message || `Failed to upload ${method.name} QR.`);
    } finally {
      setUploadingMethodId(null);
      const inputRef = getMethodInputRef(method.id);
      if (inputRef?.current) inputRef.current.value = '';
    }
  };

  // Remove QR image for a specific payment method
  const handleRemoveMethodQr = async (method: PaymentMethodDef) => {
    if (!window.confirm(`Are you sure you want to remove the ${method.name} QR code image?`)) return;
    setIsSaving(true);
    try {
      await updatePaymentSettings({
        [method.qrImageKey]: null,
        [method.qrEnabledKey]: false
      });
      showStatus('success', `${method.name} QR code image removed.`);
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to remove QR image.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle customer screenshot upload setting
  const handleToggleScreenshot = async () => {
    const newState = !settings.screenshotEnabled;
    setIsSaving(true);
    try {
      await updatePaymentSettings({ screenshotEnabled: newState });
      showStatus('success', `Customer Screenshot Upload is now ${newState ? 'ON' : 'OFF'}.`);
    } catch (err: any) {
      showStatus('error', err?.message || 'Failed to update screenshot setting.');
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
            Manage checkout payment methods, separate QR codes, and customer payment verification uploads.
          </p>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-mono self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced with Live Store</span>
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* PAYMENT METHODS & SEPARATE QR MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-sans text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-500" />
            <span>Payment Methods & QR Codes</span>
          </h2>
          <span className="text-[11px] font-mono text-stone-400">
            {settings.paymentMethods?.length || 0} active at checkout
          </span>
        </div>

        <div className="space-y-4">
          {PAYMENT_METHODS.map((method) => {
            const isActive = (settings.paymentMethods || []).includes(method.id);
            const isQrEnabled = Boolean(settings[method.qrEnabledKey]);
            const qrImageUrl = settings[method.qrImageKey];
            const isUploadingThis = uploadingMethodId === method.id;
            const inputRef = getMethodInputRef(method.id);

            return (
              <div
                key={method.id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all ${
                  isActive ? 'border-stone-200/80 shadow-2xs' : 'border-stone-200/50 opacity-80'
                }`}
              >
                {/* Method Header & Active Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => !isSaving && handleToggleMethodActive(method.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition-colors cursor-pointer shrink-0 ${
                        isActive ? 'bg-[#ff4d4f] text-white' : 'border border-stone-300 bg-stone-50'
                      }`}
                      title={isActive ? 'Click to disable' : 'Click to activate'}
                    >
                      {isActive && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold font-sans text-stone-900">{method.name}</h3>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-200'
                          }`}
                        >
                          {isActive ? 'ACTIVE AT CHECKOUT' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-sans mt-0.5">{method.description}</p>
                    </div>
                  </div>

                  {/* QR ON/OFF Switch */}
                  <div className="flex items-center gap-3 self-start sm:self-auto bg-stone-50 px-3.5 py-2 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-stone-600" />
                      <span className="text-xs font-semibold font-sans text-stone-700">
                        QR: <strong className={isQrEnabled ? 'text-emerald-600' : 'text-stone-400'}>{isQrEnabled ? 'ON' : 'OFF'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleMethodQr(method)}
                      disabled={isSaving}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isQrEnabled ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isQrEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* QR Image Box & Upload Controls */}
                <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* QR Image Preview */}
                  <div className="relative w-24 h-24 bg-stone-50 rounded-2xl border border-stone-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 group">
                    {qrImageUrl ? (
                      <>
                        <img
                          src={qrImageUrl}
                          alt={`${method.name} QR`}
                          className="w-full h-full object-contain p-1.5"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ title: `${method.name} QR Code`, url: qrImageUrl })}
                            className="p-1 rounded-lg bg-white/90 hover:bg-white text-stone-900 cursor-pointer"
                            title="View Full Size"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMethodQr(method)}
                            className="p-1 rounded-lg bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                            title="Remove QR"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-6 h-6 text-stone-300 mx-auto mb-0.5" />
                        <span className="text-[9px] text-stone-400 font-mono block">No QR</span>
                      </div>
                    )}

                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1">
                        <Loader2 className="w-4 h-4 animate-spin text-[#ff4d4f]" />
                        <span className="text-[8px] font-mono font-bold text-stone-700">Uploading</span>
                      </div>
                    )}
                  </div>

                  {/* Upload / Replace Button */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={inputRef}
                        onChange={(e) => handleFileSelected(e, method)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => inputRef?.current?.click()}
                        disabled={isUploadingThis || isSaving}
                        className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-medium font-sans flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{qrImageUrl ? `Change ${method.name} QR` : `Upload ${method.name} QR`}</span>
                      </button>

                      {qrImageUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMethodQr(method)}
                          disabled={isSaving}
                          className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-red-600 hover:bg-red-50 text-xs font-medium font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYMENT SCREENSHOT UPLOAD SECTION */}
      <div className="bg-white border border-stone-200/80 shadow-2xs rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Upload className="w-4.5 h-4.5 text-stone-700" />
              <h2 className="text-sm font-bold font-sans text-stone-900 uppercase tracking-wider">
                Payment Screenshot Upload
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-sans">
              Allow customers to attach payment confirmation slips during checkout.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-100">
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
      </div>

      {/* Lightbox QR Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-sans text-stone-900">{previewImage.title}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-72 w-auto object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <button
              onClick={() => setPreviewImage(null)}
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
