import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, size: string, quantity: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl z-10 text-stone-900 border-l border-stone-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-black" />
              <h2 className="text-base font-bold font-mono tracking-widest uppercase text-black">
                SHOPPING BAG ({items.reduce((acc, item) => acc + item.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-black hover:bg-stone-200 transition-colors cursor-pointer"
              id="cart-drawer-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-20 text-stone-400 space-y-4">
                <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-stone-300" />
                <p className="text-xs font-mono tracking-widest uppercase text-stone-500">YOUR BAG IS CURRENTLY EMPTY.</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-black text-black text-xs font-mono tracking-widest uppercase hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  DISCOVER PARADISE
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.size}-${idx}`}
                  className="flex gap-4 p-4 border border-stone-200 bg-stone-50 relative group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover border border-stone-300"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold font-sans text-black uppercase pr-2 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.size)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        SIZE: <span className="font-bold text-black">{item.size}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-black mt-1">
                        {item.product.priceDisplay ? `Price ${item.product.priceDisplay}` : `NPR ${item.product.price * item.quantity}`}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center border border-stone-300 bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.size, item.quantity - 1)}
                          className="p-1 hover:bg-stone-100 text-stone-600 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold text-black">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.size, item.quantity + 1)}
                          className="p-1 hover:bg-stone-100 text-stone-600 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-stone-50 space-y-4">
              <div className="space-y-1.5 text-xs font-mono text-stone-600">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span className="font-bold text-black">{subtotal > 0 ? `NPR ${subtotal}` : 'Price ××'}</span>
                </div>
                <div className="flex justify-between text-sm text-black font-bold pt-2 border-t border-stone-200">
                  <span>ESTIMATED TOTAL</span>
                  <span>NPR {subtotal}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full py-4 bg-black text-white text-xs font-mono font-bold tracking-[0.25em] uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                id="cart-drawer-checkout-btn"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
