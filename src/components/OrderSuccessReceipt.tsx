import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Download,
  Printer,
  Compass,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  ShieldCheck,
  Package,
  CheckCircle2,
  Truck,
  ArrowRight,
  Sparkles,
  Copy,
  ChevronRight,
  X
} from 'lucide-react';
import { PanchuLogo } from './PanchuLogo';
import { OrderReceiptData, generateReceiptPdf } from '../utils/receiptPdfGenerator';

interface OrderSuccessReceiptProps {
  orderData: OrderReceiptData;
  onContinueShopping: () => void;
  theme?: 'light' | 'dark';
}

// Particle interface for subtle celebration
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

export const OrderSuccessReceipt: React.FC<OrderSuccessReceiptProps> = ({
  orderData,
  onContinueShopping,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate subtle luxury particles on mount
  useEffect(() => {
    const colors = [
      '#2563eb', // Panchu Blue
      '#3b82f6', // Light Blue
      '#18181b', // Onyx
      '#d4d4d8', // Platinum Slate
      '#e4e4e7', // Soft Zinc
      '#fbbf24'  // Subtle Warm Gold
    ];
    const generated: Particle[] = Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 360,
      y: -Math.random() * 240 - 40,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.4,
      duration: Math.random() * 1.4 + 1.2
    }));
    setParticles(generated);
  }, []);

  const handleCopyOrderNum = () => {
    navigator.clipboard.writeText(orderData.orderId);
    setCopiedOrderNum(true);
    setTimeout(() => setCopiedOrderNum(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    try {
      generateReceiptPdf(orderData);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setTimeout(() => setIsPdfGenerating(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = orderData.createdAt?.toDate
    ? orderData.createdAt.toDate().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : orderData.createdAt?.seconds
    ? new Date(orderData.createdAt.seconds * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

  const isCod = (orderData.paymentMethod || '').toLowerCase().includes('cash');
  const amountPaidNow = isCod ? 0 : orderData.totalAmount;
  const remainingAmount = isCod ? orderData.totalAmount : 0;

  const paymentStatusLabel = isCod
    ? 'Pay on Delivery (Unpaid)'
    : orderData.paymentScreenshotUrl
    ? 'Slip Uploaded • Verification Pending'
    : 'Payment Verification Pending';

  const storeWhatsAppNumber = '9706374074';
  const waOrderText = `Hi Panchu, I would like to track my order ${orderData.orderId} placed for ${orderData.customerName}.`;
  const waTrackUrl = `https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(waOrderText)}`;

  return (
    <div className="w-full flex flex-col items-center py-6 sm:py-10 px-3 sm:px-6 relative">
      
      {/* Print-specific style tag ensuring only receipt container prints */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #panchu-digital-receipt, #panchu-digital-receipt * {
            visibility: visible;
          }
          #panchu-digital-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* PART 1: ORDER SUCCESS ANIMATION & HEADER */}
      <div className="text-center space-y-4 max-w-xl mx-auto mb-8 relative no-print">
        
        {/* Subtle Particle Celebration Burst */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-0 h-0">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [1, 0.9, 0],
                scale: [0, 1.2, 0.6],
                x: p.x,
                y: p.y,
                rotate: (p.x * 2)
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: p.size > 5 ? '2px' : '50%',
                backgroundColor: p.color
              }}
            />
          ))}
        </div>

        {/* Animated Checkmark Circle */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
          {/* Subtle halo ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1.05], opacity: [0, 0.35, 0.15] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-blue-500/20 blur-md pointer-events-none"
          />

          {/* SVG Animated Outline and Checkmark */}
          <svg className="w-full h-full" viewBox="0 0 80 80">
            {/* Outer circle stroke */}
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Inner checkmark */}
            <motion.path
              d="M26 41 L35 50 L54 30"
              fill="none"
              stroke="#2563eb"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.45, ease: 'easeOut' }}
            />
          </svg>
        </div>

        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-1.5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>ORDER #{orderData.orderId.replace('#', '')} CONFIRMED</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-stone-900 dark:text-white uppercase">
            Order Confirmed!
          </h2>

          <p className="text-xs sm:text-sm font-sans text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            Your style is on its way. Thanks for shopping with Panchu.
          </p>
        </motion.div>
      </div>

      {/* PART 2: PREMIUM DIGITAL RECEIPT CARD */}
      <motion.div
        id="panchu-digital-receipt"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.4 }}
        className={`w-full max-w-2xl rounded-3xl p-5 sm:p-8 md:p-10 border transition-colors relative shadow-xl ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-stone-100 shadow-black/40'
            : 'bg-white border-stone-200/90 text-stone-900 shadow-stone-200/50'
        }`}
      >
        {/* Top Decorative Blue Accent Bar */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-t-full" />

        {/* RECEIPT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-stone-100 dark:border-neutral-800 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <PanchuLogo size="md" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40">
                OFFICIAL RECEIPT
              </span>
            </div>
            <p className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
              Direct Luxury Streetwear • Kathmandu, Nepal
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="flex items-center sm:justify-end gap-1.5">
              <span className="font-mono text-base sm:text-lg font-black tracking-wider text-stone-900 dark:text-white">
                {orderData.orderId}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNum}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors no-print cursor-pointer"
                title="Copy order number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {copiedOrderNum && (
              <span className="text-[10px] font-mono text-emerald-600 block">
                Copied to clipboard
              </span>
            )}
            <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              {formattedDate}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Check className="w-3 h-3 stroke-2" />
              <span>ORDER CONFIRMED</span>
            </span>
          </div>
        </div>

        {/* CUSTOMER & DELIVERY DETAILS */}
        <div className="py-6 border-b border-stone-100 dark:border-neutral-800">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-3">
            Customer & Delivery Information
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-neutral-800/50 border border-stone-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-stone-400">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Recipient</span>
              </div>
              <p className="font-bold text-sm text-stone-900 dark:text-white">
                {orderData.customerName}
              </p>
              <p className="text-stone-600 dark:text-stone-300 font-mono text-[11px]">
                {orderData.phone}
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-neutral-800/50 border border-stone-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-stone-400">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Delivery Destination</span>
              </div>
              <p className="font-semibold text-stone-900 dark:text-white line-clamp-2">
                {orderData.shippingAddress}
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                {orderData.deliveryLocationLabel || 'Inside Valley Delivery'}
              </p>
            </div>
          </div>
        </div>

        {/* ORDERED PRODUCTS LIST */}
        <div className="py-6 border-b border-stone-100 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Ordered Items ({orderData.items.reduce((s, i) => s + (i.quantity || 1), 0)})
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              Item Price & Subtotal
            </span>
          </div>

          <div className="space-y-3">
            {orderData.items.map((item, idx) => {
              const itemSubtotal = (item.price || 0) * (item.quantity || 1);
              const imgUrl = item.image || item.productImage;

              return (
                <div
                  key={`${item.productId || idx}-${item.size}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50/50 dark:bg-neutral-800/30 border border-stone-100 dark:border-neutral-800/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-14 rounded-xl bg-stone-200 dark:bg-neutral-800 overflow-hidden flex-shrink-0 border border-stone-200/50 dark:border-neutral-700/50">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.name || item.productName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase truncate">
                        {item.name || item.productName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        <span className="px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-neutral-700/60 text-stone-800 dark:text-stone-200 text-[10px] font-bold">
                          Size {item.size || item.selectedSize || 'M'}
                        </span>
                        <span>•</span>
                        <span>Qty: {item.quantity || 1}</span>
                        <span>•</span>
                        <span>NPR {(item.price || 0).toLocaleString()} each</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-stone-900 dark:text-white">
                      NPR {itemSubtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAYMENT SUMMARY BREAKDOWN */}
        <div className="py-6 border-b border-stone-100 dark:border-neutral-800 space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block">
            Payment & Total Calculation
          </span>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Items Subtotal</span>
              <span className="font-mono text-stone-900 dark:text-white font-medium">
                NPR {orderData.subtotal.toLocaleString()}
              </span>
            </div>

            {orderData.discountAmount && orderData.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span>Applied Promo {orderData.promoCode ? `(${orderData.promoCode})` : ''}</span>
                </span>
                <span className="font-mono font-bold">
                  - NPR {orderData.discountAmount.toLocaleString()}
                </span>
              </div>
            ) : null}

            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Delivery Charge</span>
              <span className="font-mono text-stone-900 dark:text-white font-medium">
                NPR {orderData.deliveryFee.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-neutral-800 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-black font-sans text-stone-900 dark:text-white uppercase tracking-wide">
                  Total Order Amount
                </span>
                <span className="text-[10px] text-stone-400 font-mono block">
                  All taxes & shipping fees included
                </span>
              </div>
              <span className="text-lg sm:text-xl font-mono font-black text-blue-600 dark:text-blue-400">
                NPR {orderData.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Balance Status Box */}
          <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                Payment Method:
              </span>
              <span className="font-mono font-bold text-stone-900 dark:text-white">
                {orderData.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/40 dark:border-blue-900/30">
              <span className="text-stone-600 dark:text-stone-400">Amount Paid Now:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                NPR {amountPaidNow.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-400">Remaining to Pay on Delivery:</span>
              <span className="font-mono font-bold text-stone-900 dark:text-white">
                NPR {remainingAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/40 flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Status: {paymentStatusLabel}</span>
            </div>
          </div>
        </div>

        {/* RECEIPT FOOTER */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400 font-sans">
          <p>© {new Date().getFullYear()} PANCHU Streetwear. All rights reserved.</p>
          <p className="flex items-center gap-1 text-stone-500">
            <span>Customer Service:</span>
            <strong className="text-stone-700 dark:text-stone-300 font-mono">+977 9706374074</strong>
          </p>
        </div>
      </motion.div>

      {/* PART 3: RECEIPT ACTIONS BAR */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full max-w-2xl mt-6 space-y-3 no-print"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. Download Receipt PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="p-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-black dark:hover:bg-stone-100 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isPdfGenerating ? 'Preparing...' : 'Download PDF'}</span>
          </button>

          {/* 2. Print Receipt */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          {/* 3. Track Order */}
          <button
            type="button"
            onClick={() => setIsTrackModalOpen(true)}
            className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Track Order</span>
          </button>

          {/* 4. Continue Shopping */}
          <button
            type="button"
            onClick={onContinueShopping}
            className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Continue Shop</span>
          </button>
        </div>

        {/* WhatsApp Direct Confirmation Button */}
        {orderData.createdOrderMessage && (
          <div className="pt-2">
            <a
              href={`https://wa.me/${storeWhatsAppNumber}?text=${encodeURIComponent(orderData.createdOrderMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>RE-OPEN ORDER IN WHATSAPP</span>
            </a>
          </div>
        )}
      </motion.div>

      {/* TRACK ORDER TIMELINE MODAL */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsTrackModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-sans">
                  Order Status & Tracking
                </h3>
                <p className="text-[11px] font-mono text-stone-400">
                  {orderData.orderId}
                </p>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="py-4 space-y-4">
              {[
                {
                  title: 'Order Placed & Confirmed',
                  desc: 'Order details recorded in Panchu system',
                  date: formattedDate,
                  status: 'completed'
                },
                {
                  title: 'Quality Verification & Packing',
                  desc: 'Heavyweight apparel inspected and tagged',
                  date: 'Next: In Queue',
                  status: 'current'
                },
                {
                  title: 'Handed to Delivery Courier',
                  desc: orderData.deliveryLocationLabel || 'Dispatched for doorstep delivery',
                  date: 'Estimated 24-48 hrs',
                  status: 'pending'
                },
                {
                  title: 'Delivered',
                  desc: 'Handover and final payment collection',
                  date: 'Pending Handover',
                  status: 'pending'
                }
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {/* Timeline connector line */}
                  {idx < 3 && (
                    <div
                      className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                        step.status === 'completed' ? 'bg-blue-600' : 'bg-stone-200 dark:bg-neutral-800'
                      }`}
                    />
                  )}

                  {/* Icon step */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.status === 'completed'
                        ? 'bg-blue-600 text-white'
                        : step.status === 'current'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 border-2 border-blue-600 animate-pulse'
                        : 'bg-stone-100 dark:bg-neutral-800 text-stone-400'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <Check className="w-3.5 h-3.5 stroke-2" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {step.desc}
                    </p>
                    <span className="text-[10px] font-mono text-stone-400 block pt-0.5">
                      {step.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct WhatsApp Concierge Link */}
            <div className="pt-3 border-t border-stone-100 dark:border-neutral-800 flex flex-col gap-2">
              <a
                href={waTrackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Ask Support on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setIsTrackModalOpen(false)}
                className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white text-xs font-medium cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
