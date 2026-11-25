import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PanchuLogo } from './PanchuLogo';
import { FooterSection } from './FooterSection';
import {
  OrderTrackingRecord,
  subscribeOrderTracking
} from '../services/firebaseService';

interface OrderTrackingPageProps {
  onBack: () => void;
  initialOrderId?: string;
  theme?: 'light' | 'dark';
  onOpenTerms?: (section?: string) => void;
  onOpenContact?: () => void;
  onOpenPrivacy?: () => void;
}

const ORDER_STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'] as const;

function getInitialOrderId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('id') || params.get('orderId') || '';
    if (qId.trim()) return qId.trim().toUpperCase();

    const hash = window.location.hash;
    if (hash.startsWith('#/track/')) {
      return decodeURIComponent(hash.replace('#/track/', '').trim()).toUpperCase();
    }
  } catch {
    // ignore
  }
  return '';
}

function getRecentSessionOrderId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem('panchu_last_order_receipt');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.orderId && typeof parsed.orderId === 'string') {
        return parsed.orderId.trim().toUpperCase();
      }
    }
  } catch {
    // ignore
  }
  return '';
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  onBack,
  initialOrderId = '',
  theme = 'light',
  onOpenTerms,
  onOpenContact,
  onOpenPrivacy
}) => {
  const isDark = theme === 'dark';
  const [recentOrderId] = useState<string>(() => getRecentSessionOrderId());
  const [inputOrderId, setInputOrderId] = useState<string>(() => initialOrderId || getInitialOrderId() || '');
  const [activeQueryId, setActiveQueryId] = useState<string>(() => initialOrderId || getInitialOrderId() || '');
  const [orderRecord, setOrderRecord] = useState<OrderTrackingRecord | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialOrderId || getInitialOrderId()));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!activeQueryId) {
      setOrderRecord(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const unsubscribe = subscribeOrderTracking(activeQueryId, (record, exists) => {
      setIsLoading(false);
      setHasSearched(true);
      if (exists && record) {
        setOrderRecord(record);
        setErrorMsg('');
      } else {
        setOrderRecord(null);
        setErrorMsg(`No order found with ID "${activeQueryId}". Please double-check your Order ID (e.g. PANCHU-483921).`);
      }
    });

    return () => unsubscribe();
  }, [activeQueryId]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputOrderId.trim().toUpperCase().replace(/^#/, '');
    if (!cleaned) {
      setErrorMsg('Please enter your Order ID (e.g. PANCHU-483921).');
      return;
    }
    const normalized = /^\d{6}$/.test(cleaned) ? `PANCHU-${cleaned}` : cleaned;
    setInputOrderId(normalized);
    setActiveQueryId(normalized);
  };

  const handleQuickTrackRecent = () => {
    if (!recentOrderId) return;
    setInputOrderId(recentOrderId);
    setActiveQueryId(recentOrderId);
  };

  const formatTimestamp = (ts: any): string => {
    if (!ts) return 'Just now';
    try {
      const date = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      if (isNaN(date.getTime())) return 'Recent';
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  const currentStatus = orderRecord?.orderStatus || orderRecord?.status || 'Pending';
  const isCancelled = currentStatus === 'Cancelled';
  const normalizedStepStatus = currentStatus === 'Collected' ? 'Delivered' : currentStatus;
  const activeStepIndex = ORDER_STEPS.indexOf(normalizedStepStatus as any);

  return (
    <div
      className={`w-full min-h-screen flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-neutral-950 text-white' : 'bg-white text-stone-900'
      }`}
    >
      <div>
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-40 w-full border-b px-4 sm:px-8 py-4 backdrop-blur-md ${
            isDark ? 'bg-neutral-950/95 border-neutral-800' : 'bg-white/95 border-stone-200'
          }`}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-2 text-xs font-montserrat font-bold tracking-widest uppercase py-2 px-3 sm:px-4 border transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-700 text-white hover:bg-white hover:text-black'
                  : 'border-stone-300 text-black hover:bg-black hover:text-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO SHOP</span>
            </button>

            <PanchuLogo size="md" />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-5 py-12 sm:py-16 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-red-600 font-bold block">
              LIVE ORDER STATUS
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-montserrat uppercase tracking-tight">
              TRACK YOUR ORDER
            </h1>
            <p className={`text-xs sm:text-sm font-sans ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
              Enter your unique Order ID (e.g. PANCHU-483921) to view real-time processing and delivery updates.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrackSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div
                className={`flex-1 flex items-center px-4 py-3 border ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 focus-within:border-white'
                    : 'bg-stone-50 border-stone-300 focus-within:border-black'
                }`}
              >
                <Search className="w-4 h-4 text-stone-400 mr-3 shrink-0" />
                <input
                  type="text"
                  value={inputOrderId}
                  onChange={(e) => setInputOrderId(e.target.value.toUpperCase())}
                  placeholder="Enter Order ID (e.g. PANCHU-483921)"
                  className="w-full bg-transparent text-sm font-mono uppercase tracking-wider focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-7 py-3 text-xs font-montserrat font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                {isLoading ? 'TRACKING...' : 'TRACK ORDER'}
              </button>
            </div>

            {recentOrderId && recentOrderId !== activeQueryId && (
              <div className="flex items-center justify-center gap-2 text-xs pt-1">
                <span className={isDark ? 'text-neutral-400' : 'text-stone-500'}>Recent order:</span>
                <button
                  type="button"
                  onClick={handleQuickTrackRecent}
                  className="font-mono font-bold text-red-600 hover:underline cursor-pointer"
                >
                  {recentOrderId}
                </button>
              </div>
            )}
          </form>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600" />
              <p className={`text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
                Looking up {activeQueryId}...
              </p>
            </div>
          )}

          {/* Not Found / Error */}
          {!isLoading && hasSearched && errorMsg && !orderRecord && (
            <div
              className={`p-5 border text-xs font-sans flex items-start gap-3 ${
                isDark
                  ? 'bg-red-950/30 border-red-900/60 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Order Result Card */}
          {!isLoading && orderRecord && (
            <div
              className={`border p-6 space-y-6 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200 shadow-xs'
              }`}
            >
              {/* Header */}
              <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-neutral-800' : 'border-stone-200'}`}>
                <div>
                  <span className={`text-[10px] font-mono uppercase tracking-widest block ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
                    Order ID
                  </span>
                  <h2 className="text-xl font-bold font-mono tracking-wider mt-0.5">
                    {orderRecord.orderId}
                  </h2>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                      isCancelled
                        ? 'bg-red-100 text-red-700'
                        : currentStatus === 'Delivered' || currentStatus === 'Collected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isCancelled ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : currentStatus === 'Shipped' ? (
                      <Truck className="w-3.5 h-3.5" />
                    ) : currentStatus === 'Delivered' || currentStatus === 'Collected' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{currentStatus}</span>
                  </span>
                  <p className={`text-[11px] font-sans mt-1 ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
                    Placed {formatTimestamp(orderRecord.createdAt)}
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              {!isCancelled && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {ORDER_STEPS.map((step, idx) => {
                    const completed = activeStepIndex >= idx;
                    return (
                      <div key={step} className="space-y-2 text-center">
                        <div
                          className={`h-1.5 w-full transition-colors ${
                            completed
                              ? 'bg-emerald-600'
                              : isDark
                              ? 'bg-neutral-800'
                              : 'bg-stone-200'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider block ${
                            completed
                              ? isDark
                                ? 'text-white font-bold'
                                : 'text-black font-bold'
                              : isDark
                              ? 'text-neutral-500'
                              : 'text-stone-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Order Metadata */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-xs ${isDark ? 'bg-neutral-950 border border-neutral-800' : 'bg-stone-50 border border-stone-100'}`}>
                <div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
                    Delivery Region
                  </span>
                  <span className="font-semibold mt-0.5 block">
                    {orderRecord.location || 'Standard Delivery'}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
                    Payment Method
                  </span>
                  <span className="font-semibold mt-0.5 block">
                    {orderRecord.paymentMethod || 'Cash on Delivery (COD)'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Ordered Items ({orderRecord.items.length})
                </h3>
                <div className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-stone-100'}`}>
                  {orderRecord.items.map((item, idx) => (
                    <div key={`${item.productId || idx}-${item.size}`} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image || item.productImage ? (
                          <img
                            src={item.image || item.productImage}
                            alt={item.productName || item.name}
                            className="w-12 h-14 object-contain bg-white border border-stone-200 p-0.5 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-14 bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase truncate">
                            {item.productName || item.name}
                          </p>
                          <p className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
                            Size: {item.size || item.selectedSize || 'M'} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-bold font-mono shrink-0">
                        NPR {(item.subtotal || item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className={`pt-4 border-t flex items-center justify-between text-sm font-bold ${isDark ? 'border-neutral-800' : 'border-stone-200'}`}>
                <span>Order Total</span>
                <span className="font-mono">NPR {orderRecord.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </main>
      </div>

      <FooterSection
        theme={theme}
        onOpenTerms={onOpenTerms}
        onOpenContact={onOpenContact}
        onOpenPrivacy={onOpenPrivacy}
      />
    </div>
  );
};
