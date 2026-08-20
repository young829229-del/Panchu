import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Shield,
  X
} from 'lucide-react';
import { Order } from '../../types';

interface AdminTopHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  adminName: string;
  adminEmail: string;
  onSignOut: () => void;
  recentOrders: Order[];
  onSelectOrder?: (order: Order) => void;
}

export const AdminTopHeader: React.FC<AdminTopHeaderProps> = ({
  searchQuery,
  onSearchChange,
  adminName,
  adminEmail,
  onSignOut,
  recentOrders,
  onSelectOrder
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingCount = recentOrders.filter(o => o.status === 'Pending').length;
  const displayName = adminName || 'PANCHU Admin';

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <div className="relative flex items-center bg-[#faf9f8] hover:bg-[#f5f3f2] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ff4d4f]/20 rounded-2xl px-3.5 py-2.5 border border-stone-200/60 transition-all">
          <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search orders, customers, phone numbers..."
            className="w-full bg-transparent text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
        
        {/* Notifications Icon Button */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-[#faf9f8] hover:bg-stone-100 border border-stone-200/60 flex items-center justify-center text-stone-600 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff4d4f] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-900 font-sans">Order Notifications</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  {pendingCount} Pending
                </span>
              </div>

              <div className="py-2 max-h-64 overflow-y-auto divide-y divide-stone-50">
                {recentOrders.slice(0, 6).map((ord) => (
                  <div
                    key={ord.id || ord.orderId}
                    onClick={() => {
                      if (onSelectOrder) onSelectOrder(ord);
                      setShowNotifications(false);
                    }}
                    className="py-2.5 px-2 hover:bg-stone-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-stone-900">{ord.orderId}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {ord.createdAt?.toDate ? ord.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 truncate mt-0.5">{ord.customerName}</p>
                    <div className="flex justify-between items-center mt-1 text-[11px]">
                      <span className="text-stone-500">{ord.items?.length || 1} item(s)</span>
                      <span className="font-semibold text-stone-900">Rs {ord.total?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}

                {recentOrders.length === 0 && (
                  <div className="py-6 text-center text-xs text-stone-400">
                    No orders recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Section */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-3 rounded-full hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200/60"
          >
            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#ff4d4f] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <span className="hidden md:inline-block text-xs font-medium text-stone-800 font-sans truncate max-w-[130px]">
              {displayName}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-stone-100">
                <p className="text-xs font-bold text-stone-900 truncate">{displayName}</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">{adminEmail || 'admin@panchu.com'}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Authenticated Admin</span>
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
