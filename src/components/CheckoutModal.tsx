import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, CheckCircle2, Lock, ArrowRight, Wallet, Smartphone, Upload, Image as ImageIcon, Check, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onClearCart
}) => {
  if (!isOpen) return null;

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'khalti' | 'esewa'>('khalti');
  const [paymentId, setPaymentId] = useState<string>('9800000000');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: 'Customer',
    phone: '9800000000',
    address: 'Kathmandu, Ward 4',
    city: 'Kathmandu',
    country: 'Nepal'
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      onClearCart();
    }, 1200);
  };

  const paymentLabels = {
    khalti: 'Khalti Wallet',
    esewa: 'eSewa Pay'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white border border-stone-200 shadow-2xl p-6 md:p-10 text-stone-900 my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10 stroke-1" />
              </div>

              <div>
                <span className="text-xs font-mono tracking-[0.3em] text-stone-500 uppercase">CONFIRMATION #PANCHU-2026-ORDER</span>
                <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-black uppercase mt-1">
                  ORDER PLACED SUCCESSFULLY
                </h2>
                <p className="mt-3 text-xs md:text-sm font-sans text-stone-600 max-w-md mx-auto">
                  Thank you for your order from PANCHU™. Order details and payment confirmation have been recorded.
                </p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 max-w-md mx-auto text-left space-y-1.5">
                <div className="font-bold text-black border-b border-stone-200 pb-1 mb-2">ORDER DETAILS</div>
                <div>RECIPIENT: {formData.name}</div>
                <div>PHONE: {formData.phone}</div>
                <div>ADDRESS: {formData.address}, {formData.city}, {formData.country}</div>
                <div>PAYMENT METHOD: {paymentLabels[paymentMethod]} ({paymentId})</div>
                <div>PAYMENT SCREENSHOT: {screenshotFile ? screenshotFile.name : 'Attached'}</div>
                <div>SHIPPING: EXPRESS PRIORITY COURIER (INCLUDED)</div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3.5 bg-black text-white text-xs font-mono tracking-widest uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                BACK TO CATALOG
              </button>
            </motion.div>
          ) : (
            <div>
              <div className="border-b border-stone-200 pb-4 mb-6">
                <div className="text-xs font-mono tracking-[0.25em] text-stone-500 uppercase">PANCHU™ CHECKOUT</div>
                <h2 className="text-xl md:text-2xl font-extrabold font-sans text-black uppercase mt-1">
                  EXPRESS ORDER CHECKOUT
                </h2>
              </div>

              {/* Items Summary */}
              <div className="mb-6 p-4 bg-stone-50 border border-stone-200">
                <div className="text-xs font-mono font-bold text-black uppercase mb-2">ORDER SUMMARY</div>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-stone-700 truncate max-w-[240px]">
                        {item.quantity}x {item.product.name} ({item.size})
                      </span>
                      <span className="font-bold text-black">
                        {item.product.priceDisplay ? `Price ${item.product.priceDisplay}` : `$${(item.product.price * item.quantity).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm font-mono font-bold text-black border-t border-stone-200 pt-2 mt-2">
                  <span>TOTAL DUE</span>
                  <span>{subtotal > 0 ? `$${subtotal.toFixed(2)} USD` : 'Price ××'}</span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-stone-600 uppercase mb-1">
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-stone-600 uppercase mb-1">
                      PHONE NUMBER
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 98XXXXXXXX"
                      className="w-full px-3 py-2 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-stone-600 uppercase mb-1">
                    SHIPPING ADDRESS
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-stone-600 uppercase mb-1">
                      CITY
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-stone-600 uppercase mb-1">
                      COUNTRY
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* SELECT PAYMENT METHOD: KHALTI AND ESEWA ONLY */}
                <div className="pt-2">
                  <label className="block text-[11px] font-mono tracking-wider font-bold text-black uppercase mb-2 flex items-center justify-between">
                    <span>SELECT PAYMENT METHOD</span>
                    <span className="text-[10px] text-stone-400 font-normal">INSTANT & SECURE</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Khalti */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('khalti')}
                      className={`p-3.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'khalti'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-600'
                          : 'border-stone-300 bg-white hover:border-stone-400 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Wallet className="w-4 h-4 text-purple-700" />
                        <span className="text-[9px] font-mono font-bold bg-purple-700 text-white px-1.5 py-0.5 rounded-sm uppercase">KHALTI</span>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold">Khalti Wallet</div>
                    </button>

                    {/* eSewa */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('esewa')}
                      className={`p-3.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'esewa'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600'
                          : 'border-stone-300 bg-white hover:border-stone-400 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-sm uppercase">ESEWA</span>
                      </div>
                      <div className="mt-2 text-xs font-mono font-bold">eSewa Pay</div>
                    </button>
                  </div>

                  {/* Registered Merchant Payment Number & QR Code */}
                  <div className="mt-3 p-3.5 bg-stone-100 border border-stone-300 space-y-3">
                    {/* Payment Number (Fixed / Read-only) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-black uppercase">
                          REGISTERED PAYMENT NUMBER
                        </span>
                        <span className="text-[9px] font-mono text-stone-500 uppercase flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5 text-black" /> FIXED
                        </span>
                      </div>
                      <div className="px-3 py-2 bg-white border border-stone-300 font-mono text-xs font-bold text-black flex items-center justify-between">
                        <span>+977 980-3183456</span>
                        <span className="text-[9px] text-stone-500 font-normal uppercase">OFFICIAL</span>
                      </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div>
                      <span className="block text-[10px] font-mono tracking-wider font-bold text-black uppercase mb-1">
                        PAYMENT QR CODE
                      </span>
                      <div className="h-28 border border-dashed border-stone-400 bg-white flex flex-col items-center justify-center p-2 text-center">
                        <QrCode className="w-6 h-6 text-stone-400 mb-1" />
                        <span className="text-xs font-mono font-bold text-stone-700 uppercase">not done</span>
                        <span className="text-[9px] font-mono text-stone-400 uppercase mt-0.5">(Official QR code coming soon)</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Input */}
                  <div className="mt-3 p-3 bg-stone-50 border border-stone-200">
                    <label className="block text-[10px] font-mono tracking-wider text-stone-600 uppercase mb-1">
                      YOUR {paymentMethod === 'khalti' ? 'KHALTI MOBILE / WALLET NUMBER' : 'ESEWA ID / REGISTERED MOBILE'}
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentId}
                      onChange={e => setPaymentId(e.target.value)}
                      placeholder="e.g. 98XXXXXXXX"
                      className="w-full px-3 py-2 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* PAYMENT SCREENSHOT UPLOAD */}
                <div className="pt-2">
                  <label className="block text-[11px] font-mono tracking-wider font-bold text-black uppercase mb-1.5 flex items-center justify-between">
                    <span>PAYMENT SCREENSHOT (SS)</span>
                    <span className="text-[10px] text-stone-500 font-normal">ATTACH PROOF</span>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    id="payment-ss-upload"
                    className="hidden"
                  />

                  <label
                    htmlFor="payment-ss-upload"
                    className={`flex items-center gap-3 p-3 border border-dashed transition-all cursor-pointer ${
                      screenshotFile 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                        : 'border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {screenshotPreview ? (
                      <div className="w-10 h-10 border border-emerald-400 overflow-hidden rounded bg-black flex-shrink-0">
                        <img src={screenshotPreview} alt="SS Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-2 bg-stone-200 text-stone-700 rounded-full flex-shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 text-xs font-mono">
                      {screenshotFile ? (
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 truncate">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{screenshotFile.name}</span>
                        </div>
                      ) : (
                        <span className="text-stone-600">Click or tap to attach payment screenshot (SS)</span>
                      )}
                      <span className="block text-[10px] text-stone-400 mt-0.5">JPG, PNG, WEBP allowed</span>
                    </div>

                    <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-black text-white hover:bg-neutral-800 transition-colors flex-shrink-0">
                      {screenshotFile ? 'CHANGE SS' : 'ATTACH SS'}
                    </span>
                  </label>
                </div>

                <div className="p-3 bg-stone-100 border border-stone-200 flex items-center justify-between text-xs font-mono text-stone-700">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-black" />
                    <span>DIRECT WALLET TRANSFER ENCRYPTED</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-black text-white text-xs font-mono font-bold tracking-[0.25em] uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>PROCESSING PAYMENT...</span>
                  ) : (
                    <>
                      <span>PAY VIA {paymentMethod.toUpperCase()} ({subtotal > 0 ? `$${subtotal.toFixed(2)}` : 'Price ××'})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
