import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Mail,
  Send,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  ExternalLink,
  Copy,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { NewsletterSubscriber } from '../../types';
import {
  subscribeNewsletterSubscribers,
  updateSubscriberStatus
} from '../../services/firebaseService';

interface CustomerDataViewProps {
  initialSearchQuery?: string;
}

export const CustomerDataView: React.FC<CustomerDataViewProps> = ({ initialSearchQuery = '' }) => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [promoFilter, setPromoFilter] = useState<'all' | 'unused' | 'redeemed' | 'disabled'>('all');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [emailSubject, setEmailSubject] = useState<string>('PANCHU — Exclusive Drop & VIP Update');
  const [emailBody, setEmailBody] = useState<string>(
    'Hello,\n\nWe are excited to share our latest oversized apparel collection with you.\n\nEnjoy early VIP access on our official store: https://panchu.store\n\nBest regards,\nPanchu Team'
  );
  const [composerRecipientField, setComposerRecipientField] = useState<'bcc' | 'to'>('bcc');
  const [composerSearch, setComposerSearch] = useState<string>('');
  const [composerFeedback, setComposerFeedback] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [copiedInfo, setCopiedInfo] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Realtime subscription to newsletter subscribers in Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeNewsletterSubscribers((list) => {
      setSubscribers(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter subscribers based on search, status, and promo status
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesSearch = !searchQuery || sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.welcomePromoCode && sub.welcomePromoCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      const codeStatus = sub.welcomePromoCodeStatus || 'unused';
      const matchesPromo = promoFilter === 'all' || codeStatus === promoFilter;

      return matchesSearch && matchesStatus && matchesPromo;
    });
  }, [subscribers, searchQuery, statusFilter, promoFilter]);

  // Eligible subscribers for announcements (Must be active and have consent)
  const eligibleSubscribers = useMemo(() => {
    return subscribers.filter((sub) => sub.status === 'active' && sub.emailConsent !== false && sub.email.includes('@'));
  }, [subscribers]);

  // Pagination slice
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage) || 1;
  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(start, start + itemsPerPage);
  }, [filteredSubscribers, currentPage]);

  // Toggle individual selection
  const handleToggleSelectEmail = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) {
      next.delete(email);
    } else {
      next.add(email);
    }
    setSelectedEmails(next);
  };

  // Select all eligible
  const handleSelectAllEligible = () => {
    const allEligible = new Set(eligibleSubscribers.map((s) => s.email));
    setSelectedEmails(allEligible);
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedEmails(new Set());
  };

  // Open Composer
  const handleOpenComposer = () => {
    // If no emails are currently selected, automatically select all eligible subscribers as a convenience
    if (selectedEmails.size === 0) {
      const allEligible = new Set(eligibleSubscribers.map((s) => s.email));
      setSelectedEmails(allEligible);
    }
    setComposerFeedback(null);
    setIsComposerOpen(true);
  };

  // Copy helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInfo(label);
    setTimeout(() => setCopiedInfo(null), 2500);
  };

  // Toggle subscriber status in Firestore
  const handleToggleSubscriberStatus = async (subscriber: NewsletterSubscriber) => {
    const newStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await updateSubscriberStatus(subscriber.id, newStatus);
    } catch (err: any) {
      console.error('Update subscriber status error:', err);
      alert('Failed to update subscriber status: ' + (err?.message || err));
    }
  };

  // Format timestamp helper
  const formatDateTime = (timestamp: any): string => {
    if (!timestamp) return '—';
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }
    } catch {
      return String(timestamp);
    }
    return String(timestamp);
  };

  // Gmail Compose Launcher with Batching support
  const handleLaunchGmail = (batchIndex: number = 0, batchSize: number = 50) => {
    setComposerFeedback(null);

    // Validate draft
    const chosenList = (Array.from(selectedEmails) as string[]).filter((em) => em && em.includes('@'));
    if (chosenList.length === 0) {
      setComposerFeedback({
        type: 'error',
        message: 'Please select at least one subscriber recipient before continuing.'
      });
      return;
    }

    if (!emailSubject.trim()) {
      setComposerFeedback({
        type: 'error',
        message: 'Please enter an announcement subject line.'
      });
      return;
    }

    if (!emailBody.trim()) {
      setComposerFeedback({
        type: 'error',
        message: 'Please enter your announcement message text.'
      });
      return;
    }

    // Determine batch slice
    const totalBatches = Math.ceil(chosenList.length / batchSize) || 1;
    const startIdx = batchIndex * batchSize;
    const batchRecipients = chosenList.slice(startIdx, startIdx + batchSize);
    const recipientString = batchRecipients.join(',');

    const encodedSubject = encodeURIComponent(emailSubject.trim());
    const encodedBody = encodeURIComponent(emailBody.trim());
    const encodedRecipients = encodeURIComponent(recipientString);

    // Construct Gmail web compose URL
    let gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
    if (composerRecipientField === 'bcc') {
      gmailUrl += `&bcc=${encodedRecipients}`;
    } else {
      gmailUrl += `&to=${encodedRecipients}`;
    }
    gmailUrl += `&su=${encodedSubject}&body=${encodedBody}`;

    // Open Gmail draft in new tab
    const opened = window.open(gmailUrl, '_blank');

    if (!opened) {
      // Browser blocked popup - offer fallback
      setComposerFeedback({
        type: 'error',
        message: 'Browser blocked opening Gmail in a new tab. Please use the fallback mailto link or copy the announcement below.'
      });
    } else {
      setComposerFeedback({
        type: 'success',
        message: totalBatches > 1
          ? `Gmail draft opened for Batch ${batchIndex + 1} of ${totalBatches} (${batchRecipients.length} recipients). Review and press Send in Gmail.`
          : `Gmail draft opened with ${batchRecipients.length} recipients prefilled. Review the draft and press Send in Gmail to send the announcement.`
      });
    }
  };

  // Fallback mailto construction
  const getMailtoUrl = (batchRecipients: string[]) => {
    const encSub = encodeURIComponent(emailSubject.trim());
    const encBody = encodeURIComponent(emailBody.trim());
    const encRec = encodeURIComponent(batchRecipients.join(','));
    if (composerRecipientField === 'bcc') {
      return `mailto:?bcc=${encRec}&subject=${encSub}&body=${encBody}`;
    }
    return `mailto:${encRec}?subject=${encSub}&body=${encBody}`;
  };

  const selectedCount = selectedEmails.size;
  const eligibleCount = eligibleSubscribers.length;
  const totalBatchCount = Math.ceil(selectedCount / 50) || 1;

  return (
    <div className="space-y-6 pt-2">
      {/* Header bar with Page Title & Send Announcement Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
              Customer Data ({subscribers.length})
            </h1>
          </div>
        </div>

        {/* Clearly visible Send Announcement button in upper-right corner */}
        <button
          onClick={handleOpenComposer}
          type="button"
          className="px-4 py-2.5 rounded-2xl bg-[#ff4d4f] hover:bg-[#e04345] text-white text-xs font-semibold font-sans flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Send Announcement</span>
        </button>
      </div>

      {/* Quick metrics banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Total Subscribers</span>
          <span className="text-lg font-bold font-mono text-stone-900 mt-0.5 block">{subscribers.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Active & Consented</span>
          <span className="text-lg font-bold font-mono text-emerald-600 mt-0.5 block">{eligibleCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Unused Welcome Codes</span>
          <span className="text-lg font-bold font-mono text-[#ff4d4f] mt-0.5 block">
            {subscribers.filter((s) => s.welcomePromoCodeStatus === 'unused' || !s.welcomePromoCodeStatus).length}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
          <span className="text-[10px] font-sans text-stone-400 uppercase tracking-wider block">Redeemed Codes</span>
          <span className="text-lg font-bold font-mono text-blue-600 mt-0.5 block">
            {subscribers.filter((s) => s.welcomePromoCodeStatus === 'redeemed').length}
          </span>
        </div>
      </div>

      {/* Search, Filter & Bulk Selection Controls */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer email or welcome promo code..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#ff4d4f]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-700 focus:outline-none focus:border-[#ff4d4f] cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="unsubscribed">Status: Unsubscribed</option>
            </select>

            <select
              value={promoFilter}
              onChange={(e) => {
                setPromoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-sans text-stone-700 focus:outline-none focus:border-[#ff4d4f] cursor-pointer"
            >
              <option value="all">Code: All</option>
              <option value="unused">Code: Unused</option>
              <option value="redeemed">Code: Redeemed</option>
              <option value="disabled">Code: Disabled</option>
            </select>
          </div>
        </div>

        {/* Selection bar */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllEligible}
              type="button"
              className="text-[#ff4d4f] font-semibold hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All Eligible ({eligibleCount})</span>
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={handleDeselectAll}
              type="button"
              disabled={selectedCount === 0}
              className="text-stone-500 hover:text-stone-800 disabled:opacity-40 cursor-pointer"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-sans">
              Selected: <strong className="font-mono text-stone-900">{selectedCount}</strong> recipient{selectedCount === 1 ? '' : 's'}
            </span>
            {selectedCount > 0 && (
              <button
                onClick={handleOpenComposer}
                type="button"
                className="px-2.5 py-1 rounded-lg bg-red-50 text-[#ff4d4f] hover:bg-red-100 font-medium text-[11px] cursor-pointer transition-colors"
              >
                Compose Announcement →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Subscribers Table */}
      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#ff4d4f]" />
            <p className="text-xs font-sans">Loading subscriber data from Cloud Firestore...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs font-sans font-medium text-stone-700">No subscribers found</p>
            <p className="text-[11px] font-sans text-stone-400">
              {searchQuery ? 'Try adjusting your search query or filter.' : 'New subscribers from the website footer will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/60 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Subscribed At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Welcome Promo Code</th>
                  <th className="py-3 px-4">Code Status</th>
                  <th className="py-3 px-4">Redemption Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedSubscribers.map((subscriber) => {
                  const isSelected = selectedEmails.has(subscriber.email);
                  const isEligible = subscriber.status === 'active' && subscriber.emailConsent !== false;
                  const codeStatus = subscriber.welcomePromoCodeStatus || 'unused';

                  return (
                    <tr
                      key={subscriber.id}
                      className={`hover:bg-stone-50/60 transition-colors ${
                        isSelected ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectEmail(subscriber.email)}
                          disabled={!isEligible}
                          title={!isEligible ? 'Subscriber is unsubscribed' : isSelected ? 'Deselect recipient' : 'Select recipient'}
                          className={`cursor-pointer ${!isEligible ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#ff4d4f]" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-300 hover:text-stone-500" />
                          )}
                        </button>
                      </td>

                      {/* Email address */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900 font-sans">{subscriber.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(subscriber.email, subscriber.email)}
                            className="text-stone-300 hover:text-stone-600 transition-colors"
                            title="Copy email address"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedInfo === subscriber.email && (
                            <span className="text-[10px] text-emerald-600 font-sans">Copied</span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {subscriber.consentSource || 'Website footer'}
                        </span>
                      </td>

                      {/* Subscribed At */}
                      <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                        {formatDateTime(subscriber.subscribedAt || subscriber.createdAt)}
                      </td>

                      {/* Subscription Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {subscriber.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                            <XCircle className="w-3 h-3" />
                            <span>Unsubscribed</span>
                          </span>
                        )}
                      </td>

                      {/* Assigned Welcome Promo Code */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {subscriber.welcomePromoCode ? (
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-[#ff4d4f]" />
                            <span className="font-mono font-bold tracking-wider text-stone-800 text-xs">
                              {subscriber.welcomePromoCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(subscriber.welcomePromoCode, subscriber.welcomePromoCode)}
                              className="text-stone-300 hover:text-stone-600"
                              title="Copy promo code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedInfo === subscriber.welcomePromoCode && (
                              <span className="text-[10px] text-emerald-600 font-sans">Copied</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      {/* Promo Code Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {codeStatus === 'redeemed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                            Redeemed
                          </span>
                        ) : codeStatus === 'disabled' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500">
                            Disabled
                          </span>
                        ) : codeStatus === 'expired' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Unused (5% OFF)
                          </span>
                        )}
                      </td>

                      {/* Redemption Details */}
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                        {codeStatus === 'redeemed' ? (
                          <div>
                            <span className="font-mono text-stone-800 text-[11px] block">
                              Order: {subscriber.welcomePromoCodeRedeemedOrderId || 'Verified'}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {formatDateTime(subscriber.welcomePromoCodeRedeemedAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Not yet used</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleSubscriberStatus(subscriber)}
                          className="text-[11px] font-medium text-stone-500 hover:text-stone-800 cursor-pointer underline"
                        >
                          {subscriber.status === 'active' ? 'Mark Unsubscribed' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 bg-stone-50/50 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
            <span>
              Page <strong className="font-mono text-stone-800">{currentPage}</strong> of <strong className="font-mono text-stone-800">{totalPages}</strong> ({filteredSubscribers.length} total)
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

      {/* FULL ANNOUNCEMENT COMPOSER MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ff4d4f] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-sans text-stone-900">
                    Send Announcement through Gmail
                  </h2>
                  <p className="text-xs text-stone-500 font-sans">
                    Compose your announcement and prefill directly into Gmail draft with chosen subscribers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Feedback Alert */}
              {composerFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-sans flex items-start gap-2.5 ${
                    composerFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      : composerFeedback.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200/80'
                        : 'bg-blue-50 text-blue-800 border border-blue-200/80'
                  }`}
                >
                  {composerFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : composerFeedback.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p>{composerFeedback.message}</p>
                  </div>
                </div>
              )}

              {/* Recipient Selection Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-sans text-stone-900 uppercase tracking-wide">
                      Selected Recipients:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#ff4d4f] text-white">
                      {selectedCount}
                    </span>
                  </div>

                  {/* Recipient Field choice: BCC vs TO */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500 font-sans">Field:</span>
                    <button
                      type="button"
                      onClick={() => setComposerRecipientField('bcc')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        composerRecipientField === 'bcc'
                          ? 'bg-[#18181b] text-white'
                          : 'bg-white border border-stone-200 text-stone-600'
                      }`}
                    >
                      BCC (Recommended for privacy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerRecipientField('to')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        composerRecipientField === 'to'
                          ? 'bg-[#18181b] text-white'
                          : 'bg-white border border-stone-200 text-stone-600'
                      }`}
                    >
                      To
                    </button>
                  </div>
                </div>

                {/* Quick actions for recipients inside composer */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllEligible}
                      className="text-[#ff4d4f] font-semibold hover:underline cursor-pointer"
                    >
                      Select All Eligible ({eligibleCount})
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <input
                    type="text"
                    value={composerSearch}
                    onChange={(e) => setComposerSearch(e.target.value)}
                    placeholder="Filter selected list..."
                    className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-sans text-stone-700 placeholder-stone-400 focus:outline-none focus:border-[#ff4d4f]"
                  />
                </div>

                {/* Recipient Chips Container */}
                <div className="max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-stone-200/60 flex flex-wrap gap-1.5">
                  {selectedCount === 0 ? (
                    <span className="text-xs text-amber-600 font-sans p-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      No recipients selected. Please select at least one subscriber.
                    </span>
                  ) : (
                    (Array.from(selectedEmails) as string[])
                      .filter((em: string) => !composerSearch || em.toLowerCase().includes(composerSearch.toLowerCase()))
                      .map((em: string) => (
                        <span
                          key={em}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-sans"
                        >
                          <span>{em}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectEmail(em)}
                            className="text-stone-400 hover:text-red-500"
                            title="Remove recipient"
                          >
                            ×
                          </button>
                        </span>
                      ))
                  )}
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-sans text-stone-700 uppercase tracking-wide">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. PANCHU — VIP Announcement & Exclusive Drop"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-sans text-stone-900 focus:outline-none focus:bg-white focus:border-[#ff4d4f]"
                />
              </div>

              {/* Message Body Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-sans text-stone-700 uppercase tracking-wide">
                  Announcement Message *
                </label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your announcement message here..."
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-sans text-stone-900 focus:outline-none focus:bg-white focus:border-[#ff4d4f]"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-stone-100/70 border border-stone-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-stone-600 text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Draft Preview</span>
                </div>
                <div className="text-[11px] font-mono text-stone-500 space-y-0.5">
                  <p><strong>Recipients ({composerRecipientField.toUpperCase()}):</strong> {selectedCount} recipient{selectedCount === 1 ? '' : 's'}</p>
                  <p><strong>Subject:</strong> {emailSubject || '—'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl text-xs font-sans text-stone-800 whitespace-pre-wrap max-h-32 overflow-y-auto border border-stone-200/50">
                  {emailBody || 'Your announcement text will appear here...'}
                </div>
              </div>

              {/* Batching Notice if > 50 recipients */}
              {selectedCount > 50 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-sans space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Large Recipient List ({selectedCount} recipients)</span>
                  </div>
                  <p className="text-[11px]">
                    To respect Gmail compose URL limits, your {selectedCount} recipients are split into {totalBatchCount} batches of up to 50 recipients.
                    Click a batch button below to launch Gmail for that specific group:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Array.from({ length: totalBatchCount }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLaunchGmail(idx, 50)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Launch Batch {idx + 1} ({idx * 50 + 1}–{Math.min((idx + 1) * 50, selectedCount)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanatory Note */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-[11px] text-stone-500 font-sans flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Send Now</strong> opens Gmail with your selected recipients and message prefilled. Review the draft and press Send in Gmail to send the announcement.
                </p>
              </div>

              {/* Fallback copy buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText((Array.from(selectedEmails) as string[]).join(', '), 'all_emails')}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-[11px] font-sans flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Selected Recipient Emails ({selectedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(`Subject: ${emailSubject}\n\n${emailBody}`, 'full_draft')}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-[11px] font-sans flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Announcement Text</span>
                </button>
                {copiedInfo && (
                  <span className="text-[11px] text-emerald-600 font-sans">
                    ✓ Copied to clipboard!
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-stone-500 font-sans text-center sm:text-left">
                {selectedCount} recipient{selectedCount === 1 ? '' : 's'} ready in {composerRecipientField.toUpperCase()}
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchGmail(0, 50)}
                  disabled={selectedCount === 0 || !emailSubject.trim() || !emailBody.trim()}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-[#ff4d4f] hover:bg-[#e04345] disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Now</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
