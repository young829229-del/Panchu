import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, CheckCircle2, MessageCircle, ArrowRight, ShoppingBag } from 'lucide-react';
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
  const [createdOrderNum, setCreatedOrderNum] = useState<string>('');
  const [createdOrderMessage, setCreatedOrderMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    address: '',
    deliveryOption: 'inside' // 'inside' = NPR 100, 'outside' = NPR 150
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = formData.deliveryOption === 'inside' ? 100 : 150;
  const totalAmount = subtotal + deliveryCharge;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate unique order number e.g. #282
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const orderNum = `#${randomDigits}`;

    // Delivery region string
    const deliveryLocationLabel = formData.deliveryOption === 'inside' ? 'Inside Valley (NPR 100)' : 'Outside Valley (NPR 150)';

    // Customer details string
    const customerDetailsText = `- Name: ${formData.name.trim()}\n- Phone: ${formData.phone.trim()}\n- Location: ${formData.location.trim()} (${deliveryLocationLabel})\n- Address: ${formData.address.trim()}`;

    // Order items string
    const orderItemsDetails = items.map(item => {
      const itemPrice = item.product.price > 0 
        ? `NPR ${item.product.price * item.quantity}` 
        : (item.product.priceDisplay ? `NPR ${item.product.priceDisplay}` : 'NPR 0');
      return `- Product: ${item.product.name}\n- Size: ${item.size}\n- Quantity: ${item.quantity}\n- Price: ${itemPrice}`;
    }).join('\n\n');

    // Total string
    const formattedTotal = subtotal > 0 
      ? `NPR ${totalAmount}` 
      : (items[0]?.product.priceDisplay ? `NPR ${items[0].product.priceDisplay}` : 'NPR 0');

    // Complete WhatsApp order message format
    const fullMessage = `🛍️ PANCHU — NEW ORDER\n\nOrder #: ${orderNum}\n\nCustomer Details\n\n${customerDetailsText}\n\nOrder Details\n\n${orderItemsDetails}\n\nSubtotal: NPR ${subtotal}\nDelivery Charge: NPR ${deliveryCharge}\nTotal: ${formattedTotal}`;

    setCreatedOrderNum(orderNum);
    setCreatedOrderMessage(fullMessage);

    // Destination store WhatsApp number: 970-6374074 -> 9706374074
    const storeWhatsAppNumber = '9706374074';
    const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(fullMessage)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    setIsSuccess(true);
    onClearCart();
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
                  ORDER {createdOrderNum} GENERATED
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-black uppercase mt-1">
                  WHATSAPP ORDER OPENED
                </h2>
                <p className="mt-2 text-xs md:text-sm font-sans text-stone-600 max-w-md mx-auto">
                  Your order message has been sent to WhatsApp line <span className="font-bold text-black">+970 6374074</span>.
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
                <div className="text-xs font-mono tracking-[0.25em] text-stone-500 uppercase">PANCHU™ CHECKOUT</div>
                <h2 className="text-xl md:text-2xl font-extrabold font-sans text-black uppercase mt-1">
                  WHATSAPP ORDER DETAILS
                </h2>
              </div>

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
                    <option value="inside">Inside Valley (Kathmandu / Lalitpur / Bhaktapur) — NPR 100</option>
                    <option value="outside">Outside Valley (Standard Shipping) — NPR 150</option>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      FULL ADDRESS <span className="text-red-500">*</span>
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
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:shadow-emerald-600/30"
                  id="confirm-whatsapp-order-btn"
                >
                  <MessageCircle className="w-4.5 h-4.5 fill-white" />
                  <span>CONFIRM ORDER ON WHATSAPP</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
