import React, { useState } from 'react';
import { X, Shield, FileText, Lock, RefreshCw, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PanchuLogo } from './PanchuLogo';

interface FooterSectionProps {
  theme?: 'light' | 'dark';
  onOpenTerms?: (section?: string) => void;
  onOpenContact?: () => void;
  onOpenPrivacy?: () => void;
}

type ModalType = 'legal' | 'terms' | 'privacy' | 'returns' | 'contact' | null;

export const FooterSection: React.FC<FooterSectionProps> = ({ theme = 'light', onOpenTerms, onOpenContact, onOpenPrivacy }) => {
  const isDark = theme === 'dark';
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleTermsClick = (e: React.MouseEvent, section?: string) => {
    e.preventDefault();
    if (onOpenTerms) {
      onOpenTerms(section);
    } else {
      const hash = section ? `#${section}` : '';
      window.history.pushState(null, '', `/terms${hash}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenContact) {
      onOpenContact();
    } else {
      handleTermsClick(e, 'contact');
    }
  };

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenPrivacy) {
      onOpenPrivacy();
    } else {
      handleTermsClick(e, 'privacy');
    }
  };

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className={`w-full py-12 px-6 md:px-12 border-t transition-colors duration-300 ${
        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-stone-200 text-stone-900'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* PANCHU Red Logo on Left */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <PanchuLogo size="lg" />
            <p className={`text-[10px] font-inter tracking-widest ${isDark ? 'text-neutral-500' : 'text-stone-400'}`}>
              © 2026 PANCHU. ALL RIGHTS RESERVED.
            </p>
          </div>

          {/* Legal / Policy Links & Social / Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-montserrat font-semibold uppercase tracking-widest">
            <button
              onClick={handleTermsClick}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={handlePrivacyClick}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={(e) => handleTermsClick(e, 'returns')}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Return & Exchange
            </button>
            <button
              onClick={handleContactClick}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Contact
            </button>

            {/* TikTok - Icon Only */}
            <a
              href="https://www.tiktok.com/@panchu.vs?_r=1&_t=ZS-98na7CYayiv"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className={`inline-flex items-center justify-center p-1 hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001a2.895 2.895 0 0 1 3.182-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.44 6.391 6.391 0 0 0 1.079 8.28 6.331 6.331 0 0 0 8.825-.632A6.388 6.388 0 0 0 15.8 15V8.12a8.217 8.217 0 0 0 4.789 1.523v-3.47a4.79 4.79 0 0 1-1.000-.487z" />
              </svg>
            </a>

            {/* Instagram - Icon Only */}
            <a
              href="https://www.instagram.com/panchu_official3?igsh=NmVqMDJtYnl4cDIz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={`inline-flex items-center justify-center p-1 hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* WhatsApp - Icon Only */}
            <a
              href="https://wa.me/9779706374074"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={`inline-flex items-center justify-center p-1 hover:text-emerald-500 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              <svg className="w-4 h-4 fill-emerald-500 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          </div>

        </div>
      </footer>

      {/* Legal & Policy Popups */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white border border-stone-200 p-6 md:p-8 shadow-2xl text-stone-900 max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Content Routing */}
              {activeModal === 'legal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-mono text-xs uppercase font-bold">
                    <Shield className="w-4 h-4" />
                    <span>LEGAL NOTICE</span>
                  </div>
                  <h3 className="text-xl font-bold font-sans uppercase">PANCHU LEGAL STATEMENT</h3>
                  <p className="text-xs font-sans text-stone-600 leading-relaxed">
                    All graphics, product designs, branding trademarks, and content published under the PANCHU brand are protected by copyright laws. Unauthorized reproduction or commercial use is strictly prohibited.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-mono text-xs uppercase font-bold">
                    <FileText className="w-4 h-4" />
                    <span>TERMS OF SERVICE</span>
                  </div>
                  <h3 className="text-xl font-bold font-sans uppercase">TERMS & CONDITIONS</h3>
                  <div className="text-xs font-sans text-stone-600 space-y-2 leading-relaxed">
                    <p>1. Orders placed on PANCHU are processed upon WhatsApp order confirmation.</p>
                    <p>2. Prices are displayed in NPR (Nepalese Rupees) and include applicable product charges.</p>
                    <p>3. Product colors may vary slightly depending on monitor display settings.</p>
                  </div>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-mono text-xs uppercase font-bold">
                    <Lock className="w-4 h-4" />
                    <span>PRIVACY ASSURANCE</span>
                  </div>
                  <h3 className="text-xl font-bold font-sans uppercase">PRIVACY POLICY</h3>
                  <p className="text-xs font-sans text-stone-600 leading-relaxed">
                    We value your privacy. Customer details provided during order placement (Name, Phone number, and Shipping Address) are strictly used for order fulfillment and delivery communication.
                  </p>
                </div>
              )}

              {activeModal === 'returns' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-mono text-xs uppercase font-bold">
                    <RefreshCw className="w-4 h-4" />
                    <span>EXCHANGE GUIDELINES</span>
                  </div>
                  <h3 className="text-xl font-bold font-sans uppercase">RETURN & EXCHANGE POLICY</h3>
                  <div className="text-xs font-sans text-stone-600 space-y-2 leading-relaxed">
                    <p className="font-bold text-red-600">We do not accept returned packages.</p>
                    <p>If you contact us within 24 hours of receiving your order, we may provide an exchange for another product requested by the customer, subject to availability.</p>
                    <p>The product being exchanged must be: Completely new, Unused, Unworn, Undamaged, and In its original condition.</p>
                  </div>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-mono text-xs uppercase font-bold">
                    <MessageCircle className="w-4 h-4" />
                    <span>SUPPORT CHANNEL</span>
                  </div>
                  <h3 className="text-xl font-bold font-sans uppercase">CONTACT PANCHU</h3>
                  <p className="text-xs font-sans text-stone-600 leading-relaxed">
                    For order inquiries, size assistance, or 24-hour exchange requests, please connect with our team via our official WhatsApp ordering support.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
