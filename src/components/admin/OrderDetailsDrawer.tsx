import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Phone,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  MessageCircle,
  Mail,
  CreditCard,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface OrderDetailsDrawerProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  order,
  onClose,
  onUpdateStatus
}) => {
  const [screenshotModalOpen, setScreenshotModalOpen] = useState<boolean>(false);

  if (!order) return null;

  const cleanPhone = order.phone.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`}`;

  const formattedDate = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : 'Recent';

  const paymentMethod = order.paymentMethod || 'Cash on Delivery (COD)';
  const isEsewa = paymentMethod.toLowerCase().includes('esewa');
  const isBank = paymentMethod.toLowerCase().includes('bank');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-100 p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-stone-100 pb-4 pr-8">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold font-sans text-stone-900">{order.orderId}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff1f0] text-[#ff4d4f]">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-sans mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Placed on {formattedDate}
          </p>
        </div>

        {/* Customer & Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#faf9f8] p-4.5 rounded-2xl border border-stone-100">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block mb-1">
              Customer Details
            </span>
            <h3 className="text-sm font-bold text-stone-900 font-sans">{order.customerName}</h3>
            
            <div className="flex items-center gap-3 mt-1 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-stone-400" />
                {order.phone}
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block mb-1">
                Selected Payment
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border ${
                  isEsewa
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isBank
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-stone-100 text-stone-800 border-stone-200'
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>{paymentMethod}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block mb-1">
              Delivery Address
            </span>
            <p className="text-xs font-semibold text-stone-800 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#ff4d4f] shrink-0 mt-0.5" />
              <span>{order.location || 'Kathmandu, Nepal'}</span>
            </p>
            <p className="text-xs text-stone-600 font-sans mt-1 pl-5">
              {order.address}
            </p>
            <p className="text-[11px] text-stone-400 font-sans mt-2 pl-5">
              Delivery Mode: <strong className="text-stone-700">{order.deliveryOption || 'Standard Doorstep'}</strong>
            </p>
          </div>
        </div>

        {/* Payment Confirmation Screenshot Preview (if provided) */}
        {order.paymentScreenshotUrl && (
          <div className="p-4.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-sans text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#ff4d4f]" />
                <span>Customer Payment Slip / Screenshot</span>
              </span>
              <button
                type="button"
                onClick={() => setScreenshotModalOpen(true)}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Size</span>
              </button>
            </div>

            <div
              onClick={() => setScreenshotModalOpen(true)}
              className="relative w-full max-w-xs h-40 bg-stone-50 rounded-xl border border-stone-200 overflow-hidden cursor-pointer group"
            >
              <img
                src={order.paymentScreenshotUrl}
                alt="Payment Slip"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Click to Expand</span>
              </div>
            </div>
          </div>
        )}

        {/* Ordered Items List */}
        <div>
          <h4 className="text-xs font-bold text-stone-900 font-sans uppercase tracking-wider mb-3">
            Ordered Items ({order.items?.length || 0})
          </h4>

          <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl overflow-hidden">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}

                  <div className="truncate">
                    <h5 className="text-xs font-bold text-stone-900 truncate font-sans">{item.productName || item.name}</h5>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-mono">
                      <span>Size: <strong className="text-[#ff4d4f]">{item.size || item.selectedSize || 'M'}</strong></span>
                      <span>•</span>
                      <span>Qty: <strong>{item.quantity}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-stone-900 font-sans">
                    Rs {(item.subtotal || (item.price * item.quantity)).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-stone-400 font-mono">
                    Rs {item.price} each
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Totals */}
        <div className="bg-[#faf9f8] p-4.5 rounded-2xl border border-stone-100 space-y-2 text-xs font-sans">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>Rs {order.subtotal?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span>Rs {order.deliveryFee?.toLocaleString() || '0'}</span>
          </div>
          <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-sm text-stone-900">
            <span>Total Payable</span>
            <span className="text-[#ff4d4f]">Rs {(order.totalAmount || order.total || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Status Update Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 font-sans">Change Status:</span>
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(order.id || order.orderId, e.target.value as OrderStatus)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-sans font-semibold bg-white cursor-pointer focus:outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Collected">Collected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Full Image Preview Modal for Screenshot */}
        {screenshotModalOpen && order.paymentScreenshotUrl && (
          <div
            onClick={() => setScreenshotModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 max-w-lg w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-sans text-stone-900">Customer Payment Screenshot</h3>
                <button
                  onClick={() => setScreenshotModalOpen(false)}
                  className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-stone-50 p-2 rounded-2xl border border-stone-200 flex items-center justify-center max-h-[70vh] overflow-auto">
                <img
                  src={order.paymentScreenshotUrl}
                  alt="Customer Payment Slip Full"
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setScreenshotModalOpen(false)}
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
