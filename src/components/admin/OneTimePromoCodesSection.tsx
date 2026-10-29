import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Check,
  Copy,
  Sliders,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Settings2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { OneTimePromoCode, OneTimePromoSettings } from '../../types';
import {
  subscribeOneTimePromoCodes,
  subscribeOneTimePromoSettings,
  saveOneTimePromoSettings,
  disableOneTimePromoCode,
  createManualOneTimePromoCode,
  DEFAULT_ONE_TIME_PROMO_SETTINGS
} from '../../services/firebaseService';

export const OneTimePromoCodesSection: React.FC = () => {
  const [codes, setCodes] = useState<OneTimePromoCode[]>([]);
  const [settings, setSettings] = useState<OneTimePromoSettings>(DEFAULT_ONE_TIME_PROMO_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unused' | 'redeemed' | 'expired' | 'disabled'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Settings Editor State
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const [settingsFormData, setSettingsFormData] = useState<OneTimePromoSettings>(DEFAULT_ONE_TIME_PROMO_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string>('');

  // Manual Generate Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<{
    customerEmail: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: string;
    expiresInDays: string;
  }>({
    customerEmail: '',
    discountType: 'percentage',
    discountValue: 5,
    minOrderAmount: 0,
    maxDiscountAmount: '',
    expiresInDays: ''
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  // Selected Detail Modal
  const [selectedDetailCode, setSelectedDetailCode] = useState<OneTimePromoCode | null>(null);

  // Action status message
  const [actionNotice, setActionNotice] = useState<string>('');

  // Subscribe to real-time one-time promo codes and settings
  useEffect(() => {
    setIsLoading(true);
    const unsubCodes = subscribeOneTimePromoCodes((list) => {
      setCodes(list);
      setIsLoading(false);
    });
    const unsubSettings = subscribeOneTimePromoSettings((s) => {
      setSettings(s);
      setSettingsFormData(s);
    });
    return () => {
      unsubCodes();
      unsubSettings();
    };
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || c.code.toLowerCase().includes(q) || (c.customerEmail && c.customerEmail.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [codes, searchQuery, statusFilter]);

  // Metrics
  const totalCount = codes.length;
  const unusedCount = codes.filter((c) => c.status === 'unused').length;
  const redeemedCount = codes.filter((c) => c.status === 'redeemed').length;
  const expiredDisabledCount = codes.filter((c) => c.status === 'expired' || c.status === 'disabled').length;

  // Pagination slice
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage) || 1;
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCodes.slice(start, start + itemsPerPage);
  }, [filteredCodes, currentPage]);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveMsg('');
    try {
      await saveOneTimePromoSettings(settingsFormData);
      setSettingsSaveMsg('One-time promo settings saved successfully.');
      setIsEditingSettings(false);
      setTimeout(() => setSettingsSaveMsg(''), 3000);
    } catch (err: any) {
      console.error('Save one-time promo settings error:', err);
      alert('Failed to save settings: ' + (err?.message || err));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Disable Code
  const handleDisableCode = async (c: OneTimePromoCode) => {
    const confirmed = window.confirm(
      `Are you sure you want to disable promo code "${c.code}" for ${c.customerEmail || 'this customer'}? They will no longer be able to use it at checkout.`
    );
    if (!confirmed) return;

    try {
      await disableOneTimePromoCode(c.code);
      setActionNotice(`Code "${c.code}" has been disabled.`);
      if (selectedDetailCode && selectedDetailCode.code === c.code) {
        setSelectedDetailCode({ ...selectedDetailCode, status: 'disabled' });
      }
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err: any) {
      console.error('Disable code error:', err);
      alert('Failed to disable code: ' + (err?.message || err));
    }
  };

  // Handle Manual Code Generation
  const handleCreateManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (createForm.discountValue <= 0) {
      setCreateError('Discount value must be greater than zero.');
      return;
    }

    if (createForm.discountType === 'percentage' && createForm.discountValue > 100) {
      setCreateError('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsGenerating(true);
    try {
      const created = await createManualOneTimePromoCode({
        customerEmail: createForm.customerEmail.trim(),
        discountType: createForm.discountType,
        discountValue: Number(createForm.discountValue),
        minOrderAmount: Number(createForm.minOrderAmount) || 0,
        maxDiscountAmount: createForm.maxDiscountAmount ? Number(createForm.maxDiscountAmount) : null,
        expiresInDays: createForm.expiresInDays ? Number(createForm.expiresInDays) : null
      });

      setIsCreateModalOpen(false);
      setActionNotice(`Created one-time code "${created.code}"!`);
      setCreateForm({
        customerEmail: '',
        discountType: 'percentage',
        discountValue: 5,
        minOrderAmount: 0,
        maxDiscountAmount: '',
        expiresInDays: ''
      });
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err: any) {
      console.error('Manual code creation error:', err);
      setCreateError(err?.message || 'Failed to create code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateTime = (timestamp: any): string => {
    if (!timestamp) return '—';
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      return String(timestamp);
    }
    return String(timestamp);
  };

  return (
    <div className="pt-8 border-t border-stone-200/80 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-sans text-stone-900">
              One-Time Promo Codes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-50 text-[#ff4d4f]">
              {totalCount} Total Issued
            </span>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Single-use promo codes generated automatically for new newsletter subscribers with PNXM prefix and atomic redemption at checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium font-sans flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-stone-500" />
            <span>{isEditingSettings ? 'Close Settings' : 'Configure Welcome Discount'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-medium font-sans flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Custom Code</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 font-sans flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Settings Configuration Area */}
      {isEditingSettings && (
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#ff4d4f]" />
              <h3 className="text-xs font-bold font-sans text-stone-900 uppercase tracking-wide">
                Default Newsletter Welcome Discount Settings
              </h3>
            </div>
            <span className="text-[11px] text-stone-400">Stored live in Firestore</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Program Enabled */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Program Status
                </label>
                <select
                  value={settingsFormData.enabled ? 'enabled' : 'disabled'}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, enabled: e.target.value === 'enabled' })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-900 focus:outline-none focus:border-[#ff4d4f] cursor-pointer"
                >
                  <option value="enabled">Enabled (Issues Code on Signup)</option>
                  <option value="disabled">Disabled (No code issued)</option>
                </select>
              </div>

              {/* Discount Type */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Discount Type
                </label>
                <select
                  value={settingsFormData.discountType}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-900 focus:outline-none focus:border-[#ff4d4f] cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed NPR Amount (Rs)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  {settingsFormData.discountType === 'percentage' ? 'Percentage Value (%)' : 'Amount in NPR (Rs)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={settingsFormData.discountType === 'percentage' ? 100 : 10000}
                  required
                  value={settingsFormData.discountValue}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, discountValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#ff4d4f]"
                />
              </div>

              {/* Minimum Order Amount */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Min Order Amount (NPR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settingsFormData.minOrderAmount}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, minOrderAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#ff4d4f]"
                  placeholder="0 (No minimum)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Max discount cap for percentage */}
              {settingsFormData.discountType === 'percentage' && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Max Discount Cap in NPR (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settingsFormData.maxDiscountAmount || ''}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, maxDiscountAmount: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 500 (Leave empty for no limit)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#ff4d4f]"
                  />
                </div>
              )}

              {/* Expiration Days */}
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Validity Period in Days (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settingsFormData.expiresInDays || ''}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, expiresInDays: e.target.value ? Number(e.target.value) : null })}
                  placeholder="e.g. 30 (Leave empty for ongoing/no expiry)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-[#ff4d4f]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditingSettings(false)}
                className="px-4 py-2 text-xs font-sans text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-sans font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Welcome Discount Terms</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Total Codes Generated</span>
          <span className="text-lg font-bold font-mono text-stone-900 mt-0.5 block">{totalCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Available / Unused</span>
          <span className="text-lg font-bold font-mono text-emerald-600 mt-0.5 block">{unusedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Redeemed in Checkout</span>
          <span className="text-lg font-bold font-mono text-blue-600 mt-0.5 block">{redeemedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Disabled or Expired</span>
          <span className="text-lg font-bold font-mono text-stone-500 mt-0.5 block">{expiredDisabledCount}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by promo code (e.g. PNXM...) or customer email..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#ff4d4f]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-700 focus:outline-none focus:border-[#ff4d4f] cursor-pointer"
        >
          <option value="all">Filter Status: All ({codes.length})</option>
          <option value="unused">Filter: Unused ({unusedCount})</option>
          <option value="redeemed">Filter: Redeemed ({redeemedCount})</option>
          <option value="disabled">Filter: Disabled</option>
          <option value="expired">Filter: Expired</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#ff4d4f]" />
            <p className="text-xs font-sans">Loading one-time codes from Cloud Firestore...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Tag className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs font-sans font-medium text-stone-700">No one-time codes found</p>
            <p className="text-[11px] font-sans text-stone-400">
              {searchQuery ? 'Try adjusting your search query.' : 'Codes automatically generated when visitors subscribe to the newsletter will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/60 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Promo Code</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4">Redemption Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#ff4d4f]" />
                        <span className="font-mono font-bold tracking-wider text-stone-900 text-xs">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(c.code)}
                          className="text-stone-300 hover:text-stone-600"
                          title="Copy promo code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedCode === c.code && (
                          <span className="text-[10px] text-emerald-600 font-sans">Copied</span>
                        )}
                      </div>
                    </td>

                    {/* Customer Email */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-stone-800">{c.customerEmail || '—'}</span>
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-stone-800">
                        {c.discount || (c.discountType === 'fixed' ? `Rs ${c.discountValue}` : `${c.discountValue}%`)}
                      </span>
                      {c.minOrderAmount && c.minOrderAmount > 0 ? (
                        <span className="text-[10px] text-stone-400 block">
                          Min NPR {c.minOrderAmount.toLocaleString()}
                        </span>
                      ) : null}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.status === 'redeemed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                          Redeemed
                        </span>
                      ) : c.status === 'disabled' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500">
                          Disabled
                        </span>
                      ) : c.status === 'expired' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Unused
                        </span>
                      )}
                    </td>

                    {/* Generated Date */}
                    <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                      {formatDateTime(c.createdAt)}
                    </td>

                    {/* Redemption Details */}
                    <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                      {c.status === 'redeemed' ? (
                        <div>
                          <span className="font-mono text-stone-800 text-[11px] block font-semibold">
                            Order: {c.redeemedOrderId || 'Verified'}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {formatDateTime(c.redeemedAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Pending order</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailCode(c)}
                        className="text-[11px] text-stone-600 hover:text-stone-900 font-medium cursor-pointer underline"
                      >
                        Inspect
                      </button>

                      {c.status === 'unused' && (
                        <button
                          type="button"
                          onClick={() => handleDisableCode(c)}
                          className="text-[11px] text-red-500 hover:text-red-700 font-medium cursor-pointer"
                          title="Disable code"
                        >
                          Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 bg-stone-50/50 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
            <span>
              Page <strong className="font-mono text-stone-800">{currentPage}</strong> of <strong className="font-mono text-stone-800">{totalPages}</strong> ({filteredCodes.length} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL INSPECTION DRAWER/MODAL */}
      {selectedDetailCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#ff4d4f]" />
                <h3 className="text-sm font-bold font-sans text-stone-900">
                  Promo Code Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailCode(null)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-sans">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <span className="text-stone-500 font-sans">Code:</span>
                <span className="font-mono text-base font-bold text-stone-900 tracking-wider">
                  {selectedDetailCode.code}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Customer:</span>
                <span className="font-medium text-stone-900">{selectedDetailCode.customerEmail || '—'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Discount Terms:</span>
                <span className="font-mono font-bold text-stone-900">{selectedDetailCode.discount}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Current Lifecycle:</span>
                <span className="font-semibold uppercase tracking-wider text-[11px] text-stone-800">
                  {selectedDetailCode.status}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Issued On:</span>
                <span className="text-stone-700">{formatDateTime(selectedDetailCode.createdAt)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Expires:</span>
                <span className="text-stone-700">{selectedDetailCode.expiresAt || 'No expiration (Ongoing)'}</span>
              </div>

              {selectedDetailCode.status === 'redeemed' && (
                <>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Redeemed In Order:</span>
                    <span className="font-mono font-bold text-stone-900">{selectedDetailCode.redeemedOrderId || 'Verified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Redeemed At:</span>
                    <span className="text-stone-700">{formatDateTime(selectedDetailCode.redeemedAt)}</span>
                  </div>
                </>
              )}

              {selectedDetailCode.status === 'disabled' && selectedDetailCode.disabledAt && (
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Disabled At:</span>
                  <span className="text-stone-700">{formatDateTime(selectedDetailCode.disabledAt)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-stone-100">
              {selectedDetailCode.status === 'unused' ? (
                <button
                  type="button"
                  onClick={() => handleDisableCode(selectedDetailCode)}
                  className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                >
                  Disable This Code
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedDetailCode(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CODE ISSUE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff4d4f]" />
                <h3 className="text-sm font-bold font-sans text-stone-900">
                  Issue Custom One-Time Code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManualCode} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  value={createForm.customerEmail}
                  onChange={(e) => setCreateForm({ ...createForm, customerEmail: e.target.value })}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-sans text-stone-900 bg-stone-50 focus:outline-none focus:border-[#ff4d4f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={createForm.discountType}
                    onChange={(e) => setCreateForm({ ...createForm, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-sans text-stone-900 bg-stone-50 focus:outline-none focus:border-[#ff4d4f] cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed NPR (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={createForm.discountType === 'percentage' ? 100 : 10000}
                    required
                    value={createForm.discountValue}
                    onChange={(e) => setCreateForm({ ...createForm, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono font-bold text-xs text-stone-900 bg-stone-50 focus:outline-none focus:border-[#ff4d4f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.minOrderAmount}
                    onChange={(e) => setCreateForm({ ...createForm, minOrderAmount: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-xs text-stone-900 bg-stone-50 focus:outline-none focus:border-[#ff4d4f]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 font-sans block mb-1">
                    Expires In (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.expiresInDays}
                    onChange={(e) => setCreateForm({ ...createForm, expiresInDays: e.target.value })}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-xs text-stone-900 bg-stone-50 focus:outline-none focus:border-[#ff4d4f]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-[#ff4d4f] hover:bg-[#e04345] text-white text-xs font-sans font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PNXM Code...</span>
                    </>
                  ) : (
                    <span>Generate & Issue Code</span>
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
