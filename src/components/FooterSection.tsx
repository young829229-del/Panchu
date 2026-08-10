import React, { useState } from 'react';
import { X, Shield, FileText, Lock, RefreshCw, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PanchuLogo } from './PanchuLogo';

interface FooterSectionProps {
  theme?: 'light' | 'dark';
}

type ModalType = 'legal' | 'terms' | 'privacy' | 'returns' | 'contact' | null;

export const FooterSection: React.FC<FooterSectionProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [activeModal, setActiveModal] = useState<ModalType>(null);

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
              © 2026 PANCHU™. ALL RIGHTS RESERVED.
            </p>
          </div>

          {/* Legal / Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-montserrat font-semibold uppercase tracking-widest">
            <button
              onClick={() => setActiveModal('legal')}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Legal
            </button>
            <button
              onClick={() => setActiveModal('terms')}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setActiveModal('privacy')}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal('returns')}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Return & Exchange
            </button>
            <button
              onClick={() => setActiveModal('contact')}
              className={`hover:text-red-600 transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400' : 'text-stone-600'
              }`}
            >
              Contact
            </button>
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
                  <h3 className="text-xl font-bold font-sans uppercase">PANCHU™ LEGAL STATEMENT</h3>
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
