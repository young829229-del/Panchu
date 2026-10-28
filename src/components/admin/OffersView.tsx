import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Check,
  Copy,
  Percent,
  Sparkles,
  Trash2,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PromoCode, PromoSettings } from '../../types';
import {
  subscribePromoSettings,
  getCanonicalPromoSettingsSync,
  savePromoCodeToFirestore,
  deletePromoCodeFromFirestore,
  toggleCartPromoEnabledInFirestore,
  DEFAULT_PROMO_SETTINGS
} from '../../services/firebaseService';

export const OffersView: React.FC = () => {
  const [promoSettings, setPromoSettings] = useState<PromoSettings>(() => getCanonicalPromoSettingsSync());
  const [isTogglingCartPromo, setIsTogglingCartPromo] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State for New / Edit Promo Code
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    description: string;
    validUntil: string;
    minOrderAmount: number;
    active: boolean;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    description: '',
    validUntil: '31 Dec 2026',
    minOrderAmount: 0,
    active: true
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<string>('');

  // Subscribe to real-time Promo Settings from Firestore
  useEffect(() => {
    const unsubscribe = subscribePromoSettings((liveSettings) => {
      setPromoSettings(liveSettings);
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleCartVisibility = async () => {
    const nextState = !promoSettings.cartPromoEnabled;
    setIsTogglingCartPromo(true);
    try {
      await toggleCartPromoEnabledInFirestore(nextState);
      setStatusNotice(nextState ? 'Checkout promo input enabled for customers' : 'Checkout promo input hidden from customers');
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err: any) {
      console.error('Toggle cart promo error:', err);
      alert('Failed to update promo visibility: ' + (err?.message || err));
    } finally {
      setIsTogglingCartPromo(false);
    }
  };

  const handleToggleCodeActive = async (promo: PromoCode) => {
    try {
      const updated: PromoCode = {
        ...promo,
        active: !promo.active,
        updatedAt: new Date().toISOString()
      };
      await savePromoCodeToFirestore(updated);
      setStatusNotice(`Code "${promo.code}" ${updated.active ? 'activated' : 'deactivated'}`);
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err: any) {
      console.error('Toggle code active error:', err);
      alert('Failed to update promo code: ' + (err?.message || err));
    }
  };

  const handleDeleteCode = async (promo: PromoCode) => {
    const confirmed = window.confirm(`Are you sure you want to delete promo code "${promo.code}"? Customers will no longer be able to use it.`);
    if (!confirmed) return;

    try {
      await deletePromoCodeFromFirestore(promo.id);
      setStatusNotice(`Deleted code "${promo.code}"`);
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err: any) {
      console.error('Delete promo error:', err);
      alert('Failed to delete promo code: ' + (err?.message || err));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      description: 'Promotional discount on store orders',
      validUntil: '31 Dec 2026',
      minOrderAmount: 0,
      active: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: PromoCode) => {
    setEditingId(promo.id);
    setFormData({
      code: promo.code,
      discountType: promo.discountType || 'percentage',
      discountValue: promo.discountValue || 10,
      description: promo.description || '',
      validUntil: promo.validUntil || 'Ongoing',
      minOrderAmount: promo.minOrderAmount || 0,
      active: promo.active !== false
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Please enter a valid promo code.');
      return;
    }

    if (formData.discountValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsSaving(true);
    try {
      const displayDiscount = formData.discountType === 'percentage'
        ? `${formData.discountValue}% OFF`
        : `Rs ${formData.discountValue.toLocaleString()} OFF`;

      const promoToSave: PromoCode = {
        id: editingId || `promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        code: cleanCode,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        discount: displayDiscount,
        description: formData.description.trim() || 'Store promotional discount',
        validUntil: formData.validUntil.trim() || 'Ongoing',
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        active: formData.active,
        updatedAt: new Date().toISOString()
      };

      await savePromoCodeToFirestore(promoToSave);
      setIsModalOpen(false);
      setStatusNotice(`Saved promo code "${cleanCode}" successfully.`);
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err: any) {
      console.error('Save promo error:', err);
      setFormError(err?.message || 'Failed to save promo code. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const offers = promoSettings.codes || [];

  return (
    <div className="space-y-6 pt-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight flex items-center gap-2">
            <span>Store Offers & Promo Codes</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              {offers.length} {offers.length === 1 ? 'code' : 'codes'}
            </span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Manage customer discount codes, discount amounts, and control promo input visibility in checkout.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-[#ff4d4f] hover:bg-[#e04345] text-white text-xs font-semibold font-sans flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          id="admin-new-promo-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Promo Code</span>
        </button>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-sans text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Checkout Promo Visibility Toggle Card */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            promoSettings.cartPromoEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
          }`}>
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-sans text-stone-900">
                Checkout Promo Code Input
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                promoSettings.cartPromoEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200 text-stone-700'
              }`}>
                {promoSettings.cartPromoEnabled ? 'Active in Checkout' : 'Hidden from Checkout'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-0.5 leading-relaxed">
              When ON, customers see the promo code input & apply button during checkout. When OFF, the section is completely hidden.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            disabled={isTogglingCartPromo}
            onClick={handleToggleCartVisibility}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
              promoSettings.cartPromoEnabled ? 'bg-emerald-500' : 'bg-stone-300'
            }`}
            role="switch"
            aria-checked={promoSettings.cartPromoEnabled}
            id="toggle-cart-promo-switch"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                promoSettings.cartPromoEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-mono font-bold text-stone-700">
            {promoSettings.cartPromoEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-sans text-stone-400 bg-white rounded-2xl border border-stone-200">
            No promo codes created yet. Click "New Promo Code" above to create your first discount code.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                offer.active
                  ? 'bg-white border-stone-200/80 shadow-2xs'
                  : 'bg-[#faf9f8] border-stone-200/60 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono tracking-wider text-[#ff4d4f] bg-[#fff1f0] px-2.5 py-1 rounded-xl border border-[#ff4d4f]/20">
                      {offer.code}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 font-semibold">
                      {offer.discountType === 'fixed' ? 'Fixed (Rs)' : 'Percentage (%)'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleCodeActive(offer)}
                    className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                      offer.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-200 text-stone-600 border border-stone-300 hover:bg-stone-300'
                    }`}
                    title={offer.active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {offer.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-stone-900 font-sans">{offer.discount}</span>
                    {offer.minOrderAmount && offer.minOrderAmount > 0 && (
                      <span className="text-[11px] font-mono text-stone-400">
                        (Min Rs {offer.minOrderAmount.toLocaleString()})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 font-sans mt-1 leading-relaxed">
                    {offer.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-sans">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>Valid: {offer.validUntil}</span>
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleCopy(offer.code)}
                    className="text-stone-600 hover:text-[#ff4d4f] flex items-center gap-1 font-medium cursor-pointer transition-colors text-[11px]"
                    title="Copy code"
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

                  <button
                    onClick={() => handleOpenEditModal(offer)}
                    className="text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium cursor-pointer transition-colors text-[11px]"
                    title="Edit promo code"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCode(offer)}
                    className="text-stone-400 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                    title="Delete promo code"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Promo Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 border border-stone-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#ff4d4f]" />
                <h3 className="text-sm font-bold font-sans text-stone-900">
                  {editingId ? 'Edit Promo Code' : 'Create New Promo Code'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              {/* Promo Code Name */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Promo Code (e.g. PANCHU15, SUMMER20) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono font-bold text-sm text-stone-900 uppercase focus:outline-none focus:border-stone-900 bg-stone-50"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-sans text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50 cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    {formData.discountType === 'percentage' ? 'Percentage Value (%) *' : 'Discount in NPR (Rs) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? 100 : 50000}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    placeholder={formData.discountType === 'percentage' ? '15' : '200'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono font-bold text-sm text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Applicable across all oversized items"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-sans text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50"
                />
              </div>

              {/* Validity & Min Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Valid Until
                  </label>
                  <input
                    type="text"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    placeholder="e.g. 31 Dec 2026 or Ongoing"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-sans text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Min Order Amount (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-xs text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50"
                  />
                </div>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="promo-active-check"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-[#ff4d4f] rounded border-stone-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="promo-active-check" className="text-xs font-medium text-stone-700 cursor-pointer select-none">
                  Enable this code immediately for customers
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-sans font-medium text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-sans font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Update Code' : 'Create Code'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
