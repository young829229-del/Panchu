import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Clock,
  MoreVertical,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  Eye,
  MessageCircle,
  Truck,
  PackageCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

export type OrderSubTab = 'all' | 'summary' | 'completed' | 'cancelled';

interface OrderHistoryTableProps {
  orders: Order[];
  searchQuery: string;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onOpenEmailModal?: (order: Order, type: 'confirmation' | 'shipped' | 'delivered' | 'cancelled') => void;
  onSelectOrder: (order: Order) => void;
  currentSubTab: OrderSubTab;
  onChangeSubTab: (tab: OrderSubTab) => void;
}

// Avatars palette for customer names if they don't have an image
const AVATAR_COLORS = [
  'bg-stone-100 text-stone-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-purple-100 text-purple-800'
];

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  orders,
  searchQuery,
  onUpdateStatus,
  onOpenEmailModal,
  onSelectOrder,
  currentSubTab,
  onChangeSubTab
}) => {
  // Sorting state
  const [sortField, setSortField] = useState<'id' | 'time' | 'total'>('time');
  const [sortAsc, setSortAsc] = useState(false);

  // Date Range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Active floating dropdown
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close action popup when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuOrderId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter orders by subtab, search, and date range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Subtab filter
      if (currentSubTab === 'completed') {
        if (order.status !== 'Delivered' && order.status !== 'Collected' && order.status !== 'Shipped') {
          return false;
        }
      } else if (currentSubTab === 'cancelled') {
        if (order.status !== 'Cancelled') {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (order.orderId || '').toLowerCase().includes(q);
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (order.phone || '').toLowerCase().includes(q);
        const matchesLocation = (order.location || '').toLowerCase().includes(q);
        const matchesAddress = (order.address || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesLocation && !matchesAddress) {
          return false;
        }
      }

      // Date Range filter
      if (startDate || endDate) {
        let orderTime: Date | null = null;
        if (order.createdAt?.toDate) {
          orderTime = order.createdAt.toDate();
        } else if (order.createdAt?.seconds) {
          orderTime = new Date(order.createdAt.seconds * 1000);
        } else if (order.createdAt) {
          orderTime = new Date(order.createdAt);
        }

        if (orderTime) {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (orderTime < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (orderTime > end) return false;
          }
        }
      }

      return true;
    });
  }, [orders, currentSubTab, searchQuery, startDate, endDate]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      if (sortField === 'id') {
        const idA = a.orderId || '';
        const idB = b.orderId || '';
        return sortAsc ? idA.localeCompare(idB) : idB.localeCompare(idA);
      }
      if (sortField === 'total') {
        return sortAsc ? a.total - b.total : b.total - a.total;
      }
      // sort by time
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return sortAsc ? timeA - timeB : timeB - timeA;
    });
  }, [filteredOrders, sortField, sortAsc]);

  const toggleSort = (field: 'id' | 'time' | 'total') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Helper to format order date nicely
  const formatOrderDate = (order: Order): string => {
    let orderDate: Date | null = null;
    if (order.createdAt?.toDate) {
      orderDate = order.createdAt.toDate();
    } else if (order.createdAt?.seconds) {
      orderDate = new Date(order.createdAt.seconds * 1000);
    } else if (order.createdAt) {
      orderDate = new Date(order.createdAt);
    }

    if (!orderDate) return 'Recent';

    return orderDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Delivered</span>
          </div>
        );
      case 'Collected':
        return (
          <div className="flex items-center gap-1.5 text-xs text-stone-800 font-medium font-sans">
            <span className="w-2 h-2 rounded-full bg-stone-900" />
            <span>Completed</span>
          </div>
        );
      case 'Cancelled':
        return (
          <div className="flex items-center gap-1.5 text-xs text-[#ff4d4f] font-medium font-sans">
            <span className="w-2 h-2 rounded-full bg-[#ff4d4f]" />
            <span>Cancelled</span>
          </div>
        );
      case 'Shipped':
        return (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium font-sans">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Shipped</span>
          </div>
        );
      case 'Confirmed':
        return (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium font-sans">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Confirmed</span>
          </div>
        );
      case 'Pending':
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium font-sans">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending</span>
          </div>
        );
    }
  };

  const handleWhatsAppCustomer = (order: Order) => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`;
    const text = encodeURIComponent(
      `Hello ${order.customerName},\nThis is PANCHU regarding your order ${order.orderId}.\nHow can we help you today?`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
    setActiveMenuOrderId(null);
  };

  const handleRefundOrCancel = async (order: Order) => {
    if (window.confirm(`Are you sure you want to mark order ${order.orderId} as Cancelled / Refunded in Firebase?`)) {
      await onUpdateStatus(order.id || order.orderId, 'Cancelled');
      setActiveMenuOrderId(null);
    }
  };

  const handleMarkShipped = async (order: Order) => {
    await onUpdateStatus(order.id || order.orderId, 'Shipped');
    setActiveMenuOrderId(null);
  };

  const handleMarkDelivered = async (order: Order) => {
    await onUpdateStatus(order.id || order.orderId, 'Delivered');
    setActiveMenuOrderId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Section with Heading, Tabs, and Date Pickers */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight">
            Orders
          </h1>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-6 mt-3">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'summary', label: 'Sales Summary' },
              { id: 'completed', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => {
              const isActive = currentSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeSubTab(tab.id as OrderSubTab)}
                  type="button"
                  className={`text-xs sm:text-sm font-sans font-medium transition-all pb-1.5 relative cursor-pointer ${
                    isActive
                      ? 'text-[#ff4d4f] font-semibold'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4d4f] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Pickers */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {/* Start Date */}
          <div className="flex items-center gap-2 bg-[#faf9f8] hover:bg-[#f5f3f2] border border-stone-200/70 rounded-2xl px-3 py-2 text-xs font-sans text-stone-700 shadow-2xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-stone-700 focus:outline-none cursor-pointer"
              title="Start Date"
            />
          </div>

          <span className="text-xs font-medium text-stone-400 font-sans">To</span>

          {/* End Date */}
          <div className="flex items-center gap-2 bg-[#faf9f8] hover:bg-[#f5f3f2] border border-stone-200/70 rounded-2xl px-3 py-2 text-xs font-sans text-stone-700 shadow-2xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-stone-700 focus:outline-none cursor-pointer"
              title="End Date"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-[#ff4d4f] font-medium hover:underline px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-[760px] inline-block w-full align-middle">
          
          {/* Table Header Row */}
          <div className="grid grid-cols-[90px_1.5fr_1.3fr_1fr_1fr_1fr_60px] gap-3 px-4 py-3 text-[11px] font-sans font-medium text-stone-400 border-b border-stone-100">
            <button
              onClick={() => toggleSort('id')}
              className="flex items-center gap-1 text-left hover:text-stone-700 cursor-pointer"
            >
              <span>Order ID</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${sortField === 'id' && sortAsc ? 'rotate-180 text-stone-700' : ''}`} />
            </button>

            <div>Customer</div>

            <button
              onClick={() => toggleSort('time')}
              className="flex items-center gap-1 text-left hover:text-stone-700 cursor-pointer"
            >
              <span>Date & Time</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${sortField === 'time' && sortAsc ? 'rotate-180 text-stone-700' : ''}`} />
            </button>

            <div>Delivery / Location</div>
            <div>Status</div>

            <button
              onClick={() => toggleSort('total')}
              className="flex items-center gap-1 text-left hover:text-stone-700 cursor-pointer"
            >
              <span>Total</span>
              <ArrowUpDown className="w-2.5 h-2.5" />
            </button>

            <div className="text-right">Action</div>
          </div>

          {/* Table Body / Rows */}
          {sortedOrders.length === 0 ? (
            <div className="py-16 text-center text-xs font-sans text-stone-400 bg-[#faf9f8] rounded-2xl my-4">
              No orders found matching your search or date criteria.
            </div>
          ) : (
            <div className="divide-y divide-stone-50/80 my-1">
              {sortedOrders.map((order, index) => {
                const orderKey = order.id || order.orderId;
                const isMenuOpen = activeMenuOrderId === orderKey;
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const firstInitial = (order.customerName || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={orderKey}
                    className={`grid grid-cols-[90px_1.5fr_1.3fr_1fr_1fr_1fr_60px] gap-3 items-center px-4 py-3.5 rounded-2xl hover:bg-[#faf9f8] transition-colors relative ${
                      isMenuOpen ? 'bg-[#faf9f8]' : 'bg-white'
                    }`}
                  >
                    {/* ID */}
                    <div className="text-xs font-semibold text-stone-900 font-mono">
                      {order.orderId}
                    </div>

                    {/* Customer Name + Avatar */}
                    <div
                      onClick={() => onSelectOrder(order)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                    >
                      <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                        {firstInitial}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-stone-800 font-sans truncate block group-hover:text-[#ff4d4f] transition-colors">
                          {order.customerName}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          {order.phone}
                        </span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-sans">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{formatOrderDate(order)}</span>
                    </div>

                    {/* Location / Mode */}
                    <div className="text-xs text-stone-700 font-sans truncate">
                      <span className="block truncate">{order.location || 'Kathmandu'}</span>
                      <span className="text-[10px] text-stone-400 block font-mono">
                        {order.items?.length || 1} item(s)
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Total */}
                    <div className="text-xs font-bold text-stone-900 font-sans">
                      Rs {order.total?.toLocaleString() || '0'}
                    </div>

                    {/* Action 3-dots Menu Button */}
                    <div className="text-right relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuOrderId(isMenuOpen ? null : orderKey);
                        }}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center hover:bg-stone-200/60 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer ${
                          isMenuOpen ? 'bg-stone-200/60 text-stone-900' : ''
                        }`}
                        aria-label="Order actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Floating Action Menu popup */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-8 w-40 bg-white rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-stone-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-left"
                        >
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectOrder(order);
                              setActiveMenuOrderId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-sans text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-400" />
                            <span>View Details</span>
                          </button>

                          {/* WhatsApp Customer */}
                          <button
                            type="button"
                            onClick={() => handleWhatsAppCustomer(order)}
                            className="w-full px-3.5 py-2 text-xs font-sans text-stone-700 hover:text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>WhatsApp</span>
                          </button>

                          <div className="border-t border-stone-100 my-1" />

                          {/* Mark Shipped */}
                          {order.status !== 'Delivered' && (
                            <button
                              type="button"
                              onClick={() => handleMarkShipped(order)}
                              className="w-full px-3.5 py-2 text-[11px] font-sans text-stone-600 hover:bg-stone-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Truck className="w-3 h-3 text-blue-500" />
                              <span>Mark Shipped</span>
                            </button>
                          )}

                          {/* Mark Delivered */}
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(order)}
                            className="w-full px-3.5 py-2 text-[11px] font-sans text-stone-600 hover:bg-stone-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Mark Delivered</span>
                          </button>

                          {/* Refund / Cancel */}
                          <button
                            type="button"
                            onClick={() => handleRefundOrCancel(order)}
                            className="w-full px-3.5 py-2 text-[11px] font-sans text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-red-500" />
                            <span>Cancel / Refund</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
