import React, { useState } from 'react';
import { CartItem, OrderItem } from '../types';
import { X, CheckCircle2, MessageCircle, ArrowRight, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createFirestoreOrder } from '../services/firebaseService';
import { getSavedCheckoutDetails, saveCustomerDetailsFromCheckout } from '../services/customerStorage';
import { auth } from '../firebase';

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

  const savedDetails = getSavedCheckoutDetails();

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdOrderNum, setCreatedOrderNum] = useState<string>('');
  const [createdOrderMessage, setCreatedOrderMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    name: savedDetails?.name || '',
    phone: savedDetails?.phone || '',
    location: savedDetails?.location || '',
    address: savedDetails?.address || '',
    deliveryOption: 'inside_door' // 'inside_door' = 120, 'outside_office' = 150, 'outside_door' = 180
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = formData.deliveryOption === 'inside_door' 
    ? 120 
    : formData.deliveryOption === 'outside_door' 
      ? 180 
      : 150;
  const totalAmount = subtotal + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Generate unique order number e.g. #282
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const orderNum = `#${randomDigits}`;

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

      const completeShippingAddress = `${formData.address.trim()}, ${formData.location.trim()}`;

      // Save customer guest details for easy checkout next time
      saveCustomerDetailsFromCheckout({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        address: formData.address.trim()
      });

      // 1. Create order in Firestore & reduce size-specific stock atomically
      const result = await createFirestoreOrder({
        orderId: orderNum,
        userId: auth.currentUser?.uid || null,
        customerName: formData.name.trim(),
        phone: formData.phone.trim(),
        shippingAddress: completeShippingAddress,
        address: formData.address.trim(),
        location: formData.location.trim(),
        deliveryOption: formData.deliveryOption,
        items: orderItems,
        subtotal: subtotal,
        deliveryFee: deliveryCharge,
        totalAmount: totalAmount,
        total: totalAmount,
        paymentMethod: 'Cash on Delivery (COD)',
        paymentScreenshotUrl: null,
        orderStatus: 'Pending'
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to submit order. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 2. Delivery region string
      const deliveryLocationLabel = formData.deliveryOption === 'inside_door'
        ? 'Inside Valley (NPR 120)'
        : formData.deliveryOption === 'outside_door'
          ? 'Outside Valley - Home Door Delivery (NPR 180)'
          : 'Outside Valley - Standard Office Delivery (NPR 150)';

      // 3. Customer details string (Without email)
      const customerDetailsText = `• Customer Details\n\nName - ${formData.name.trim()}\nPhone - ${formData.phone.trim()}\nLocation - ${formData.location.trim()} (${deliveryLocationLabel})\nAddress - ${formData.address.trim()}`;

      // 4. Order items string
      const orderItemsDetails = items.map(item => {
        const itemPrice = item.product.price > 0 
          ? (item.product.price * item.quantity)
          : (item.product.priceDisplay ? item.product.priceDisplay : 0);
        return `Product - ${item.product.name}\nSize - ${item.size}\nQuantity - ${item.quantity}\nPrice - NPR ${itemPrice}`;
      }).join('\n\n');

      // 5. Complete WhatsApp order message format matching user template
      const fullMessage = `🛍️ PANCHU — NEW ORDER\n\nOrder #: ${orderNum}\n\n${customerDetailsText}\n\n• Order Details\n\n${orderItemsDetails}\n\nSubtotal - NPR ${subtotal}\nDelivery Charge - NPR ${deliveryCharge}\nTotal - NPR ${totalAmount}`;

      setCreatedOrderNum(orderNum);
      setCreatedOrderMessage(fullMessage);

      // Destination store WhatsApp number: 970-6374074 -> 9706374074
      const storeWhatsAppNumber = '9706374074';
      const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(fullMessage)}`;

      // 6. Open WhatsApp directly
      window.open(whatsappUrl, '_blank');

      setIsSuccess(true);
      onClearCart();
    } catch (err: any) {
      console.error('Checkout submit error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenWhatsApp = () => {
    if (createdOrderMessage) {
      const storeWhatsAppNumber = '9706374074';
      const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(createdOrderMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-white border border-stone-200 shadow-2xl p-6 md:p-8 text-stone-900 my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            id="checkout-modal-close"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6 space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10 stroke-2" />
              </div>

              <div>
                <span className="text-xs font-mono tracking-[0.25em] text-emerald-700 font-bold uppercase">
                  ORDER {createdOrderNum} SAVED IN FIRESTORE
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-black uppercase mt-1">
                  WHATSAPP ORDER OPENED
                </h2>
                <p className="mt-2 text-xs md:text-sm font-sans text-stone-600 max-w-md mx-auto">
                  Your order has been recorded in the database and forwarded to WhatsApp line <span className="font-bold text-black">+970 6374074</span>.
                </p>
              </div>

              {/* Message Preview */}
              <div className="p-4 bg-stone-50 border border-stone-200 text-xs font-mono text-stone-800 text-left whitespace-pre-line max-h-56 overflow-y-auto rounded shadow-inner">
                {createdOrderMessage}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={handleReopenWhatsApp}
                  className="px-6 py-3.5 bg-emerald-600 text-white text-xs font-mono tracking-wider font-bold uppercase hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>RE-OPEN WHATSAPP ORDER</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-3.5 bg-black text-white text-xs font-mono tracking-widest uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  BACK TO CATALOG
                </button>
              </div>
            </motion.div>
          ) : (
            <div>
              <div className="border-b border-stone-200 pb-4 mb-5">
                <div className="text-xs font-mono tracking-[0.25em] text-stone-500 uppercase">PANCHU CHECKOUT</div>
                <h2 className="text-xl md:text-2xl font-extrabold font-sans text-black uppercase mt-1">
                  ORDER DETAILS
                </h2>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2 rounded">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Items Summary */}
              <div className="mb-5 p-4 bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
                  <span className="text-xs font-mono font-bold text-black uppercase flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-stone-600" /> ORDER SUMMARY
                  </span>
                  <span className="text-[11px] font-mono font-bold text-stone-500">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} ITEMS
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-stone-700 truncate max-w-[240px]">
                        {item.quantity}x {item.product.name} ({item.size})
                      </span>
                      <span className="font-bold text-black">
                        {item.product.price > 0 
                          ? `NPR ${item.product.price * item.quantity}` 
                          : (item.product.priceDisplay ? `NPR ${item.product.priceDisplay}` : 'NPR 0')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 pt-2.5 mt-2 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-stone-600">
                    <span>SUBTOTAL</span>
                    <span className="font-bold text-black">NPR {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>DELIVERY CHARGE</span>
                    <span className="font-bold text-stone-800">NPR {deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-mono font-bold text-black border-t border-stone-200 pt-2">
                    <span>TOTAL DUE</span>
                    <span className="text-emerald-700">
                      NPR {totalAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                    DELIVERY REGION <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.deliveryOption}
                    onChange={e => setFormData({ ...formData, deliveryOption: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/50 cursor-pointer"
                  >
                    <option value="inside_door">Inside Valley (Home Door Delivery) — NPR 120</option>
                    <option value="outside_office">Outside Valley (Standard Office Delivery) — NPR 150</option>
                    <option value="outside_door">Outside Valley (Home Door Delivery) — NPR 180</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                      FULL NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ram Bahadur"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                      PHONE NUMBER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9800000000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                    LOCATION / CITY <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider font-bold text-stone-700 uppercase mb-1">
                    FULL SHIPPING ADDRESS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward 4, New Baneshwor"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-300 text-xs font-mono focus:border-black focus:outline-none bg-stone-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/70 text-white text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:shadow-emerald-600/30"
                  id="confirm-whatsapp-order-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                      <span>PROCESSING ORDER...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4.5 h-4.5 fill-white" />
                      <span>CONFIRM ORDER ON WHATSAPP</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
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


