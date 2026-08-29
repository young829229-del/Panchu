import React from 'react';
import {
  ShoppingBag,
  Tag,
  Package,
  Boxes,
  Image as ImageIcon,
  Settings,
  CreditCard
} from 'lucide-react';
import { PanchuLogo } from '../PanchuLogo';

export type AdminTab = 'orders' | 'order_history' | 'offers' | 'products' | 'stock' | 'banners' | 'messages' | 'payments' | 'settings' | 'summary';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingCount: number;
  productsCount: number;
  onBackToStore?: () => void;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  productsCount,
  onBackToStore,
  onCloseMobile
}) => {
  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-[#ff4d4f] text-white'
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: productsCount > 0 ? productsCount : undefined
    },
    {
      id: 'banners',
      label: 'Banners & Hero',
      icon: ImageIcon
    },
    {
      id: 'stock',
      label: 'Stock & Inventory',
      icon: Boxes
    },
    {
      id: 'offers',
      label: 'Offers & Coupons',
      icon: Tag
    },
    {
      id: 'payments',
      label: 'Payment Settings',
      icon: CreditCard
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between p-6 border-r border-stone-100 bg-white">
      <div>
        {/* Brand Logo with Panchu Logo */}
        <div className="flex items-center justify-between mb-8 px-2">
          <button
            onClick={onBackToStore}
            type="button"
            className="flex flex-col items-start gap-1 cursor-pointer text-left group"
            title="Back to Storefront"
          >
            <PanchuLogo size="md" className="group-hover:opacity-85 transition-opacity" />
            <span className="text-[9px] font-montserrat font-bold uppercase tracking-[0.2em] text-stone-400">
              Admin Portal
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'orders' && (activeTab === 'order_history' || activeTab === 'summary'));

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                type="button"
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-sans font-medium transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#fff1f0] text-[#e04f4f] font-semibold shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                {/* Active left indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#ff4d4f] rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive ? 'text-[#ff4d4f]' : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Back to Store Quick Action */}
      <div className="pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onBackToStore}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-sans font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer"
        >
          <span>View Live Store</span>
          <span className="text-stone-400">→</span>
        </button>
      </div>
    </aside>
  );
};
