import React, { useState, useEffect, useRef } from 'react';
import { CartItem, OrderItem, PaymentSettings, PromoCode, PromoSettings } from '../types';
import {
  X,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  ShoppingBag,
  Loader2,
  AlertCircle,
  CreditCard,
  QrCode,
  Upload,
  Check,
  Tag,
  Truck,
  Building2,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createFirestoreOrder,
  subscribePaymentSettings,
  getCanonicalPaymentSettingsSync,
  uploadPaymentScreenshot,
  validatePromoCodeAgainstFirestore,
  subscribeSocialsAndContactSettings,
  getCanonicalSocialsAndContactSync,
  cleanWhatsAppDigits
} from '../services/firebaseService';
import { OrderReceiptData, SocialsAndContactSettings } from '../types';
import { getSavedCheckoutDetails, saveCustomerDetailsFromCheckout } from '../services/customerStorage';
import { auth } from '../firebase';
import { OrderSuccessReceipt } from './OrderSuccessReceipt';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onClearCart: () => void;
  appliedPromo?: PromoCode | null;
  discountAmount?: number;
  promoSettings?: PromoSettings;
  onClearPromo?: () => void;
  onApplyPromo?: (promo: PromoCode) => void;
  theme?: 'light' | 'dark';
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onClearCart,
  appliedPromo = null,
  discountAmount = 0,
  promoSettings,
  onClearPromo,
  onApplyPromo,
  theme = 'light'
}) => {
  const savedDetails = getSavedCheckoutDetails();

  // Payment settings state synced with Firebase
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => getCanonicalPaymentSettingsSync());
  
  // Selected Payment Method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Cash on Delivery (COD)');

  // Promo Code Input State inside Checkout
  const [promoInput, setPromoInput] = useState<string>('');
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string>('');
  const [promoSuccess, setPromoSuccess] = useState<string>('');

  // Screenshot Upload State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdOrderNum, setCreatedOrderNum] = useState<string>('');
  const [createdOrderMessage, setCreatedOrderMessage] = useState<string>('');
  const [confirmedReceiptData, setConfirmedReceiptData] = useState<OrderReceiptData | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // Restore latest order receipt from current session if modal reopens after order
  useEffect(() => {
    if (isOpen && items.length === 0 && !confirmedReceiptData) {
      try {
        const stored = sessionStorage.getItem('panchu_last_order_receipt');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.orderId) {
            setConfirmedReceiptData(parsed);
            setIsSuccess(true);
          }
        }
      } catch (e) {
        // non-blocking
      }
    }
  }, [isOpen, items.length, confirmedReceiptData]);

  const [formData, setFormData] = useState({
    name: savedDetails?.name || '',
    phone: savedDetails?.phone || '',
    address: savedDetails?.address || savedDetails?.location || '',
    deliveryOption: 'inside_door' // 'inside_door' = 120, 'outside_office' = 150, 'outside_door' = 180
  });

  // Socials & Contact settings (includes whatsappOrderRedirect toggle and store WhatsApp number)
  const [socialsAndContact, setSocialsAndContact] = useState<SocialsAndContactSettings>(() => getCanonicalSocialsAndContactSync());

  // Subscribe to live Payment Settings
  useEffect(() => {
    const unsubscribe = subscribePaymentSettings((liveSettings) => {
      setPaymentSettings(liveSettings);
      // Ensure selected method is valid
      const methods = liveSettings.paymentMethods || [];
      if (methods.length > 0 && !methods.includes(selectedPaymentMethod)) {
        setSelectedPaymentMethod(methods[0]);
      }
    });
    return () => unsubscribe();
  }, [selectedPaymentMethod]);

  // Subscribe to live Socials & Contact settings
  useEffect(() => {
    const unsubscribe = subscribeSocialsAndContactSettings((liveSettings) => {
      setSocialsAndContact(liveSettings);
    });
    return () => unsubscribe();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = formData.deliveryOption === 'inside_door' 
    ? 120 
    : formData.deliveryOption === 'outside_door' 
      ? 180 
      : 150;
  const isPromoEligible = Boolean(appliedPromo && (promoSettings?.cartPromoEnabled !== false) && discountAmount > 0);
  const effectiveDiscount = isPromoEligible ? Math.min(subtotal, Math.max(0, discountAmount)) : 0;
  const totalAmount = Math.max(0, subtotal - effectiveDiscount) + deliveryCharge;

  // Available methods from settings or default fallback
  const availableMethods = paymentSettings.paymentMethods && paymentSettings.paymentMethods.length > 0
    ? paymentSettings.paymentMethods
    : ['Cash on Delivery (COD)', 'eSewa', 'Bank Transfer'];

  // Resolve method-specific QR image and toggle state
  const getActiveQrForSelectedMethod = () => {
    if (selectedPaymentMethod === 'eSewa') {
      if (paymentSettings.esewaQrEnabled && paymentSettings.esewaQrImageUrl) {
        return { imageUrl: paymentSettings.esewaQrImageUrl, label: 'eSewa QR' };
      }
    } else if (selectedPaymentMethod === 'Bank Transfer') {
      if (paymentSettings.bankQrEnabled && paymentSettings.bankQrImageUrl) {
        return { imageUrl: paymentSettings.bankQrImageUrl, label: 'Bank Transfer QR' };
      }
    } else if (selectedPaymentMethod === 'Cash on Delivery (COD)') {
      if (paymentSettings.codQrEnabled && paymentSettings.codQrImageUrl) {
        return { imageUrl: paymentSettings.codQrImageUrl, label: 'COD QR' };
      }
    }
    // Backward compatibility fallback for legacy global QR if method-specific not set
    if (
      paymentSettings.qrEnabled &&
      paymentSettings.qrImageUrl &&
      selectedPaymentMethod !== 'Cash on Delivery (COD)'
    ) {
      return { imageUrl: paymentSettings.qrImageUrl, label: `${selectedPaymentMethod} QR` };
    }
    return null;
  };

  const activeQrInfo = getActiveQrForSelectedMethod();

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  };

  // Reset promo messages when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPromoError('');
      setPromoSuccess('');
      setPromoInput('');
    }
  }, [isOpen]);

  const handleApplyPromoCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    const clean = promoInput.trim().toUpperCase();
    if (!clean) {
      setPromoError('Please enter a promo code.');
      return;
    }

    if (subtotal <= 0) {
      setPromoError('Your shopping bag is empty.');
      return;
    }

    setIsValidatingPromo(true);
    try {
      const result = await validatePromoCodeAgainstFirestore(clean, subtotal);
      if (!result.valid || !result.promoCode) {
        setPromoError(result.error || `Promo code "${clean}" is invalid or expired.`);
      } else {
        if (onApplyPromo) {
          onApplyPromo(result.promoCode);
        }
        setPromoSuccess(`Promo code "${result.promoCode.code}" applied! (${result.promoCode.discount})`);
        setPromoInput('');
      }
    } catch (err: any) {
      console.warn('Checkout promo validation exception:', err);
      setPromoError('Failed to validate promo code. Please try again.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemoveAppliedPromo = () => {
    if (onClearPromo) onClearPromo();
    setPromoError('');
    setPromoSuccess('');
    setPromoInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Generate unique order number e.g. #282
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const orderNum = `#${randomDigits}`;

      // Upload payment screenshot if provided and enabled
      let uploadedScreenshotUrl: string | null = null;
      if (paymentSettings.screenshotEnabled && screenshotFile) {
        setIsUploadingScreenshot(true);
        try {
          uploadedScreenshotUrl = await uploadPaymentScreenshot(screenshotFile, orderNum.replace('#', ''));
        } catch (uploadErr) {
          console.warn('Screenshot upload fallback notice:', uploadErr);
        } finally {
          setIsUploadingScreenshot(false);
        }
      }

      // Map cart items to standard OrderItem format
      const orderItems: OrderItem[] = items.map(item => ({
        productId: item.product.id || (item.product as any).productId || '',
        productName: item.product.name,
        name: item.product.name,
        image: item.product.image || '',
        productImage: item.product.image || '',
        size: item.size,
        selectedSize: item.size,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      const completeShippingAddress = formData.address.trim();

      // Delivery region string
      const deliveryLocationLabel = formData.deliveryOption === 'inside_door'
        ? 'Inside Valley (NPR 120)'
        : formData.deliveryOption === 'outside_door'
          ? 'Outside Valley - Home Door Delivery (NPR 180)'
          : 'Outside Valley - Standard Office Delivery (NPR 150)';

      // Save customer guest details for easy checkout next time
      saveCustomerDetailsFromCheckout({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: deliveryLocationLabel,
        address: formData.address.trim()
      });

      // Secure promo code re-validation against database records
      let finalDiscount = 0;
      let finalPromoCode: string | null = null;

      if (appliedPromo) {
        const promoValidation = await validatePromoCodeAgainstFirestore(appliedPromo.code, subtotal);
        if (!promoValidation.valid || !promoValidation.promoCode) {
          setErrorMessage(promoValidation.error || 'The applied promo code is no longer valid. Please check your cart.');
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          return;
        }
        finalDiscount = promoValidation.discountAmount;
        finalPromoCode = promoValidation.promoCode.code;
      }

      const calculatedFinalTotal = Math.max(0, subtotal - finalDiscount) + deliveryCharge;

      // 1. Create order in Firestore & reduce size-specific stock atomically
      const result = await createFirestoreOrder({
        orderId: orderNum,
        userId: auth.currentUser?.uid || null,
        customerName: formData.name.trim(),
        phone: formData.phone.trim(),
        shippingAddress: completeShippingAddress,
        address: formData.address.trim(),
        location: deliveryLocationLabel,
        deliveryOption: formData.deliveryOption,
        items: orderItems,
        subtotal: subtotal,
        promoCode: finalPromoCode,
        discountAmount: finalDiscount,
        deliveryFee: deliveryCharge,
        totalAmount: calculatedFinalTotal,
        total: calculatedFinalTotal,
        paymentMethod: selectedPaymentMethod,
        paymentScreenshotUrl: uploadedScreenshotUrl,
        orderStatus: 'Pending'
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to submit order. Please try again.');
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      // 3. Customer details string (Without email and separate location field)
      const customerDetailsText = `• Customer Details\n\nName - ${formData.name.trim()}\nPhone - ${formData.phone.trim()}\nDelivery Region - ${deliveryLocationLabel}\nAddress - ${formData.address.trim()}`;

      // 4. Order items string
      const orderItemsDetails = items.map(item => {
        const itemPrice = item.product.price > 0 
          ? (item.product.price * item.quantity)
          : (item.product.priceDisplay ? item.product.priceDisplay : 0);
        return `Product - ${item.product.name}\nSize - ${item.size}\nQuantity - ${item.quantity}\nPrice - NPR ${itemPrice}`;
      }).join('\n\n');

      // 5. Complete WhatsApp order message format including selected payment method and promo discount
      const promoText = finalPromoCode && finalDiscount > 0
        ? `Promo Code - ${finalPromoCode} (-NPR ${finalDiscount})\n`
        : '';

      const fullMessage = `🛍️ PANCHU — NEW ORDER\n\nOrder #: ${orderNum}\n\n${customerDetailsText}\n\n• Order Details\n\n${orderItemsDetails}\n\n• Payment Details\n\nPayment Method - ${selectedPaymentMethod}${uploadedScreenshotUrl ? '\nPayment Slip - Attached with order' : ''}\n\nSubtotal - NPR ${subtotal}\n${promoText}Delivery Charge - NPR ${deliveryCharge}\nTotal - NPR ${calculatedFinalTotal}`;

      setCreatedOrderNum(orderNum);
      setCreatedOrderMessage(fullMessage);

      // 6. WhatsApp Order Redirection handling based on admin setting
      const isWhatsAppRedirectOn = socialsAndContact.whatsappOrderRedirect !== false;

      if (isWhatsAppRedirectOn) {
        // Destination store WhatsApp number from Contact Settings (cleaned to pure international digits)
        const rawStoreNumber = socialsAndContact.contact?.whatsappNumber || '9706374074';
        const storeWhatsAppNumber = cleanWhatsAppDigits(rawStoreNumber);
        const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(fullMessage)}`;

        // Open WhatsApp directly
        try {
          window.open(whatsappUrl, '_blank');
        } catch (e) {
          console.warn('Could not auto-open WhatsApp:', e);
        }
      }

      // 7. Store confirmed receipt data for premium success page & digital receipt
      const receipt: OrderReceiptData = {
        orderId: orderNum,
        orderDocId: result.orderId || orderNum,
        customerName: formData.name.trim(),
        phone: formData.phone.trim(),
        shippingAddress: completeShippingAddress,
        deliveryOption: formData.deliveryOption,
        deliveryLocationLabel: deliveryLocationLabel,
        items: orderItems,
        subtotal: subtotal,
        promoCode: finalPromoCode,
        discountAmount: finalDiscount,
        deliveryFee: deliveryCharge,
        totalAmount: calculatedFinalTotal,
        paymentMethod: selectedPaymentMethod,
        paymentScreenshotUrl: uploadedScreenshotUrl || null,
        orderStatus: 'Pending',
        createdAt: new Date().toISOString(),
        createdOrderMessage: fullMessage
      };

      setConfirmedReceiptData(receipt);
      try {
        sessionStorage.setItem('panchu_last_order_receipt', JSON.stringify(receipt));
      } catch (e) {
        // non-blocking
      }

      setIsSuccess(true);
      if (onClearPromo) onClearPromo();
      onClearCart();
    } catch (err: any) {
      console.error('Checkout submit error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setConfirmedReceiptData(null);
      try {
        sessionStorage.removeItem('panchu_last_order_receipt');
      } catch (e) {
        // non-blocking
      }
    }
    onClose();
  };

  const handleReopenWhatsApp = () => {
    if (createdOrderMessage) {
      const storeWhatsAppNumber = '9706374074';
      const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(createdOrderMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  if (isSuccess && confirmedReceiptData) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-white min-h-screen text-black"
        >
          <OrderSuccessReceipt
            orderData={confirmedReceiptData}
            onContinueShopping={handleClose}
            theme={theme}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`fixed inset-0 z-50 overflow-y-auto flex flex-col min-h-screen ${
          theme === 'dark' ? 'bg-[#09090b] text-stone-100' : 'bg-white text-stone-900'
        }`}
      >
        {/* Top Header - Full Width Sticky */}
        <header
          className={`sticky top-0 z-30 px-4 sm:px-8 py-3.5 sm:py-4 backdrop-blur-md border-b flex items-center justify-between no-print ${
            theme === 'dark' ? 'bg-[#0d0d0d]/95 border-stone-800' : 'bg-white/95 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`p-1.5 -ml-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'text-stone-300 hover:text-white hover:bg-stone-800'
                  : 'text-stone-700 hover:text-black hover:bg-stone-100'
              }`}
              id="checkout-page-back"
              title="Back to store"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-mono text-xs font-bold tracking-wider uppercase">
                BACK
              </span>
            </button>
            <h1
              className={`text-lg sm:text-xl font-black font-sans uppercase tracking-tight flex items-center gap-2.5 ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            >
              <span>CHECKOUT</span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                  theme === 'dark'
                    ? 'bg-stone-800 text-stone-300 border-stone-700'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {items.reduce((acc, i) => acc + i.quantity, 0)}{' '}
                {items.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </h1>
          </div>

          <button
            onClick={onClose}
            className={`p-2 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'text-stone-300 hover:bg-stone-800 hover:text-white'
                : 'text-stone-700 hover:bg-black hover:text-white'
            }`}
            id="checkout-modal-close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Full Page Content Container */}
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SECTION 01: DELIVERY & CONTACT DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-mono font-bold text-black tracking-wider uppercase flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-black text-white font-mono">01</span>
                    <span>DELIVERY & CONTACT DETAILS</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 uppercase">* Required</span>
                </div>

                {/* 1. Full Name & 2. Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                      FULL NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                      PHONE NUMBER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/40 transition-colors"
                    />
                  </div>
                </div>

                {/* 3. SELECT DELIVERY REGION * */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-2">
                    SELECT DELIVERY REGION <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'inside_door',
                        title: 'Inside Valley',
                        subtitle: 'Home Door Delivery',
                        fee: 120
                      },
                      {
                        id: 'outside_office',
                        title: 'Outside Valley',
                        subtitle: 'Standard Office Pickup',
                        fee: 150
                      },
                      {
                        id: 'outside_door',
                        title: 'Outside Valley',
                        subtitle: 'Home Door Delivery',
                        fee: 180
                      }
                    ].map(opt => {
                      const isSelected = formData.deliveryOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, deliveryOption: opt.id })}
                          className={`p-3 border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-black bg-stone-900 text-white shadow-xs'
                              : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-mono font-bold uppercase">{opt.title}</div>
                              <div className={`text-[10px] font-sans mt-0.5 line-clamp-1 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                {opt.subtitle}
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                          </div>
                          <div className="mt-2 pt-2 border-t border-stone-200/40 flex justify-between items-center text-[11px] font-mono">
                            <span className={isSelected ? 'text-stone-400 text-[10px]' : 'text-stone-500 text-[10px]'}>FEE:</span>
                            <span className="font-bold">NPR {opt.fee}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. FULL SHIPPING ADDRESS * (Immediately below delivery region cards) */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                    FULL SHIPPING ADDRESS <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter your exact location, tole, street, house number, and nearby landmark"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/40 transition-colors resize-y"
                  />
                </div>
              </div>

              {/* SECTION 02: ORDER SUMMARY & PROMO CODE (UP, BEFORE PAYMENT) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-mono font-bold text-black tracking-wider uppercase flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-black text-white font-mono">02</span>
                    <span>ORDER SUMMARY & PROMO CODE</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-stone-500">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} ITEMS
                  </span>
                </div>

                <div className="p-4 bg-stone-50/90 border border-stone-200 space-y-4">
                  {/* Cart Items List with Thumbnail Images */}
                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-stone-200/60">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 pt-2 first:pt-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-10 h-12 object-cover border border-stone-300 shrink-0 bg-white"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-12 border border-stone-300 bg-stone-100 flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-4 h-4 text-stone-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold font-sans text-black uppercase truncate">
                              {item.product.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 mt-0.5">
                              <span>SIZE: <strong className="text-black">{item.size}</strong></span>
                              <span>·</span>
                              <span>QTY: <strong className="text-black">{item.quantity}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-mono font-bold text-black shrink-0 text-right">
                          {item.product.price > 0 
                            ? `NPR ${(item.product.price * item.quantity).toLocaleString()}` 
                            : (item.product.priceDisplay ? `NPR ${item.product.priceDisplay}` : 'NPR 0')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PROMO CODE SECTION IN CHECKOUT */}
                  {promoSettings?.cartPromoEnabled !== false && (
                    <div className="pt-3 border-t border-stone-200">
                      {appliedPromo ? (
                        <div className="p-3 bg-white border border-emerald-300 flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2.5 py-1 bg-black text-white font-mono text-xs font-bold tracking-wider shrink-0 flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-emerald-400" />
                              {appliedPromo.code}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-mono font-bold text-emerald-700 block truncate">
                                {appliedPromo.discount} APPLIED
                              </span>
                              <span className="text-[10px] text-stone-500 font-sans block truncate">
                                Instant Discount: NPR {effectiveDiscount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveAppliedPromo}
                            className="px-2.5 py-1 text-[11px] font-mono text-stone-400 hover:text-red-600 border border-stone-200 hover:border-red-200 transition-colors cursor-pointer shrink-0"
                            title="Remove promo code"
                            id="checkout-remove-promo-btn"
                          >
                            REMOVE
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-stone-700 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-black" />
                              <span>PROMO CODE / COUPON</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoInput}
                              onChange={(e) => {
                                setPromoInput(e.target.value.toUpperCase());
                                if (promoError) setPromoError('');
                                if (promoSuccess) setPromoSuccess('');
                              }}
                              placeholder="ENTER PROMO CODE (e.g. PARADISE10)"
                              className="flex-1 px-3 py-2 border border-stone-300 font-mono text-xs text-black placeholder:text-stone-400 uppercase bg-white focus:outline-none focus:border-black transition-colors"
                              id="checkout-promo-input"
                            />
                            <button
                              type="button"
                              onClick={handleApplyPromoCode}
                              disabled={isValidatingPromo || !promoInput.trim()}
                              className="px-4 py-2 bg-black text-white text-xs font-mono font-bold tracking-wider uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center min-w-[78px]"
                              id="checkout-promo-apply-btn"
                            >
                              {isValidatingPromo ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'APPLY'
                              )}
                            </button>
                          </div>

                          {promoError && (
                            <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-sans pt-0.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{promoError}</span>
                            </div>
                          )}

                          {promoSuccess && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-sans pt-0.5">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>{promoSuccess}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Totals Breakdown */}
                  <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-stone-600">
                      <span>BAG SUBTOTAL</span>
                      <span className="font-bold text-black">NPR {subtotal.toLocaleString()}</span>
                    </div>

                    {isPromoEligible && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          PROMO DISCOUNT ({appliedPromo?.code})
                        </span>
                        <span>- NPR {effectiveDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-600">
                      <span>DELIVERY CHARGE</span>
                      <span className="font-bold text-stone-800">NPR {deliveryCharge}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-mono font-bold text-black border-t border-stone-200 pt-2.5">
                      <span>FINAL TOTAL DUE</span>
                      <span className="text-base text-emerald-700">
                        NPR {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 03: PAYMENT METHOD (LAST, AT THE BOTTOM) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-mono font-bold text-black tracking-wider uppercase flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-black text-white font-mono">03</span>
                    <span>PAYMENT METHOD</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 uppercase">Select 1 option</span>
                </div>

                {/* Available Payment Method Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {availableMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method;
                    const isCod = method.includes('COD') || method.includes('Cash');
                    const isEsewa = method.toLowerCase().includes('esewa');
                    const isBank = method.toLowerCase().includes('bank');

                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={`p-3.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-black bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {isCod ? (
                            <Truck className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-600'}`} />
                          ) : isEsewa ? (
                            <Wallet className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-stone-600'}`} />
                          ) : (
                            <Building2 className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-stone-600'}`} />
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <span className="text-xs font-mono font-bold line-clamp-1">
                          {method}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* QR CODE SECTION (Only rendered when selected method's QR is ON - Collapsed with NO gap when OFF) */}
                {activeQrInfo ? (
                  <div className="p-4 bg-stone-50 border border-stone-200 text-center space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-stone-800 uppercase">
                      <QrCode className="w-4 h-4 text-stone-600" />
                      <span>SCAN {activeQrInfo.label.toUpperCase()} TO PAY</span>
                    </div>

                    <div className="w-44 h-44 bg-white p-2.5 border border-stone-300 mx-auto shadow-xs flex items-center justify-center">
                      <img
                        src={activeQrInfo.imageUrl}
                        alt={`${selectedPaymentMethod} QR`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <p className="text-[11px] font-mono text-stone-500 max-w-sm mx-auto">
                      Scan using {selectedPaymentMethod === 'Cash on Delivery (COD)' ? 'your payment app' : selectedPaymentMethod} to complete payment of <strong className="text-stone-900">NPR {totalAmount.toLocaleString()}</strong>.
                    </p>
                  </div>
                ) : null}

                {/* PAYMENT SCREENSHOT UPLOAD SECTION (Only rendered when Screenshot Upload is ON in admin - Collapsed with NO gap when OFF) */}
                {paymentSettings.screenshotEnabled ? (
                  <div className="p-3.5 bg-stone-50 border border-stone-200 space-y-2">
                    <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase">
                      PAYMENT SCREENSHOT / SLIP (OPTIONAL)
                    </label>
                    <p className="text-[11px] font-mono text-stone-500">
                      Attach your payment confirmation slip for faster verification.
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      ref={screenshotInputRef}
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />

                    {screenshotPreview ? (
                      <div className="flex items-center gap-3 bg-white p-2.5 border border-stone-300">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Preview"
                          className="w-12 h-12 object-cover border border-stone-200"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono font-medium text-stone-800 truncate block">
                            {screenshotFile?.name || 'Payment screenshot'}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold block">
                            Ready to attach with order
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveScreenshot}
                          className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove Screenshot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="w-full py-2.5 border border-dashed border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-stone-500" />
                        <span>UPLOAD PAYMENT CONFIRMATION SCREENSHOT</span>
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Primary Order Confirmation CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 text-white text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg ${
                      socialsAndContact.whatsappOrderRedirect !== false
                        ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/70 hover:shadow-emerald-600/30'
                        : 'bg-stone-900 hover:bg-black disabled:bg-stone-800 hover:shadow-stone-900/30'
                    }`}
                    id="confirm-whatsapp-order-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                        <span>{isUploadingScreenshot ? 'UPLOADING SCREENSHOT...' : 'PROCESSING ORDER...'}</span>
                      </>
                    ) : socialsAndContact.whatsappOrderRedirect !== false ? (
                      <>
                        <MessageCircle className="w-4.5 h-4.5 fill-white" />
                        <span>CONFIRM ORDER ON WHATSAPP · NPR {totalAmount.toLocaleString()}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        <Check className="w-4.5 h-4.5 text-white" />
                        <span>CONFIRM ORDER · NPR {totalAmount.toLocaleString()}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] font-mono text-stone-400 text-center mt-2">
                    {socialsAndContact.whatsappOrderRedirect !== false
                      ? `Direct instant order forwarding to Panchu WhatsApp team ${socialsAndContact.contact?.whatsappNumber || '+970 6374074'}`
                      : 'Orders are confirmed directly and verified by the Panchu team'}
                  </p>
                </div>
              </div>
            </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
