import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';
import { Order } from '../../types';

interface OrderSummaryViewProps {
  orders: Order[];
  onBackToAll: () => void;
}

export const OrderSummaryView: React.FC<OrderSummaryViewProps> = ({ orders, onBackToAll }) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const completedOrders = orders.filter(
    (o) => o.status === 'Delivered' || o.status === 'Collected' || o.status === 'Shipped'
  ).length;

  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  const deliveryOrders = orders.filter(
    (o) => !o.deliveryOption || o.deliveryOption.includes('door') || o.deliveryOption.includes('road')
  ).length;
  const collectionOrders = totalOrders - deliveryOrders;

  // Calculate items popularity
  const itemCounts: Record<string, { name: string; qty: number; revenue: number; image?: string }> = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!itemCounts[item.productId]) {
        itemCounts[item.productId] = {
          name: item.productName,
          qty: 0,
          revenue: 0,
          image: item.image
        };
      }
      itemCounts[item.productId].qty += item.quantity || 1;
      itemCounts[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight">
            Order Performance Summary
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Real-time analytics and revenue metrics from your live Firebase database.
          </p>
        </div>

        <button
          onClick={onBackToAll}
          className="text-xs text-[#ff4d4f] font-semibold hover:underline cursor-pointer"
        >
          ← Back to All Orders
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#faf9f8] border border-stone-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-sans font-medium">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 font-sans mt-1">
            Rs {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">
            Across {totalOrders} orders
          </span>
        </div>

        <div className="bg-[#faf9f8] border border-stone-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-sans font-medium">Avg Order Value</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 font-sans mt-1">
            Rs {avgOrderValue.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-500 font-medium mt-1 inline-block">
            Per transaction
          </span>
        </div>

        <div className="bg-[#faf9f8] border border-stone-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-sans font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#faad14]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 font-sans mt-1">
            {completedOrders}
          </div>
          <span className="text-[10px] text-stone-500 font-medium mt-1 inline-block">
            {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% completion
          </span>
        </div>

        <div className="bg-[#faf9f8] border border-stone-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[11px] font-sans font-medium">Cancelled</span>
            <XCircle className="w-4 h-4 text-[#ff4d4f]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#ff4d4f] font-sans mt-1">
            {cancelledOrders}
          </div>
          <span className="text-[10px] text-stone-500 font-medium mt-1 inline-block">
            {totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0}% rate
          </span>
        </div>
      </div>

      {/* Grid: Type Distribution & Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Types */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-900 font-sans uppercase tracking-wider mb-4">
            Fulfillment Breakdown
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Delivery (Door / Road)</span>
                <span className="text-[#ff4d4f] font-bold">{deliveryOrders} ({totalOrders > 0 ? Math.round((deliveryOrders / totalOrders) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#ff4d4f] h-full rounded-full transition-all"
                  style={{ width: `${totalOrders > 0 ? (deliveryOrders / totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Collection / Pickup</span>
                <span className="text-stone-800 font-bold">{collectionOrders} ({totalOrders > 0 ? Math.round((collectionOrders / totalOrders) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-stone-800 h-full rounded-full transition-all"
                  style={{ width: `${totalOrders > 0 ? (collectionOrders / totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Pending Action</span>
                <span className="text-amber-600 font-bold">{pendingOrders}</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Ordered Items */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-stone-900 font-sans uppercase tracking-wider mb-3">
            Top Ordered Items
          </h3>

          <div className="divide-y divide-stone-50">
            {topItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-medium text-stone-800 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-stone-900">{item.qty} pcs</span>
                  <span className="block text-[10px] text-stone-400 font-mono">Rs {item.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}

            {topItems.length === 0 && (
              <div className="py-6 text-center text-xs text-stone-400 font-sans">
                No item sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
