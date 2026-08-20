import React, { useState } from 'react';
import { Tag, Plus, Check, Copy, Percent, Sparkles, Trash2 } from 'lucide-react';

interface PromoOffer {
  id: string;
  code: string;
  discount: string;
  description: string;
  active: boolean;
  validUntil: string;
}

export const OffersView: React.FC = () => {
  const [offers, setOffers] = useState<PromoOffer[]>([
    {
      id: '1',
      code: 'FIRST10',
      discount: '10% OFF',
      description: 'Applicable on first order across all oversized collections',
      active: true,
      validUntil: '31 Dec 2026'
    },
    {
      id: '2',
      code: 'FREESHIP',
      discount: 'FREE DELIVERY',
      description: 'Free doorstep delivery in Kathmandu Valley on orders over Rs 3,000',
      active: true,
      validUntil: 'Ongoing'
    },
    {
      id: '3',
      code: 'SUMMER20',
      discount: '20% OFF',
      description: 'Limited seasonal drop discount on 2+ heavy jersey items',
      active: false,
      validUntil: 'Expired'
    }
  ]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = (id: string) => {
    setOffers(offers.map(o => o.id === id ? { ...o, active: !o.active } : o));
  };

  const handleAddOffer = () => {
    const code = prompt('Enter promo code (e.g. PANCHU15):');
    if (!code) return;
    const discount = prompt('Enter discount description (e.g. 15% OFF):') || '10% OFF';
    const newOffer: PromoOffer = {
      id: Date.now().toString(),
      code: code.trim().toUpperCase(),
      discount,
      description: 'Promotional discount code for store customers',
      active: true,
      validUntil: '31 Dec 2026'
    };
    setOffers([newOffer, ...offers]);
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight">
            Store Offers & Promo Codes
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Manage customer discount codes, checkout vouchers, and seasonal promotional banners.
          </p>
        </div>

        <button
          onClick={handleAddOffer}
          className="px-4 py-2 rounded-2xl bg-[#ff4d4f] hover:bg-[#e04345] text-white text-xs font-semibold font-sans flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Promo Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={`p-5 rounded-2xl border transition-all ${
              offer.active ? 'bg-white border-stone-200/80 shadow-2xs' : 'bg-[#faf9f8] border-stone-100 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono tracking-wider text-[#ff4d4f] bg-[#fff1f0] px-2.5 py-1 rounded-xl">
                {offer.code}
              </span>

              <button
                onClick={() => handleToggleActive(offer.id)}
                className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                  offer.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {offer.active ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="mt-3">
              <span className="text-base font-bold text-stone-900 font-sans">{offer.discount}</span>
              <p className="text-xs text-stone-500 font-sans mt-1 leading-relaxed">
                {offer.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-sans">
              <span>Valid: {offer.validUntil}</span>
              <button
                onClick={() => handleCopy(offer.code)}
                className="text-stone-700 hover:text-[#ff4d4f] flex items-center gap-1 font-medium cursor-pointer"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
