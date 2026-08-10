import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqSectionProps {
  theme?: 'light' | 'dark';
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-delivery',
    question: 'How long does delivery take?',
    answer: 'Standard delivery typically takes 1 to 3 business days for orders within the Kathmandu Valley and 3 to 5 business days for orders outside the valley.'
  },
  {
    id: 'faq-order',
    question: 'How can I place an order?',
    answer: 'Placing an order is simple: Browse our products → Select your size → Click Add to Cart → Proceed to Checkout → Submit your order to confirm directly via WhatsApp.'
  },
  {
    id: 'faq-contact',
    question: 'How can I contact PANCHU?',
    answer: 'You can contact PANCHU instantly through our official WhatsApp support channel during checkout or by clicking our direct contact links.'
  },
  {
    id: 'faq-exchange',
    question: 'Can I exchange my order?',
    answer: 'Yes! If you contact us within 24 hours of receiving your order, we may provide an exchange for another available product.'
  },
  {
    id: 'faq-return',
    question: 'Can I return my order?',
    answer: 'We do not accept returned packages. However, eligible items can be exchanged within 24 hours of receipt subject to product availability.'
  },
  {
    id: 'faq-condition',
    question: 'What condition must an exchange product be in?',
    answer: 'The product being exchanged must be completely new, unused, unworn, undamaged, and in its original condition with all original tags attached.'
  }
];

export const FaqSection: React.FC<FaqSectionProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [openId, setOpenId] = useState<string | null>('faq-delivery');

  const toggleFaq = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
      isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
    }`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-[10px] font-mono tracking-[0.3em] text-red-600 font-bold uppercase flex items-center justify-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span>CUSTOMER SUPPORT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans uppercase tracking-tight">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className={`text-xs font-mono max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-stone-500'}`}>
            Everything you need to know about ordering, delivery, and exchange guidelines.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className={`border transition-all duration-200 ${
                  isDark 
                    ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700' 
                    : 'bg-white border-stone-200 hover:border-stone-400'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className="text-xs sm:text-sm font-bold font-sans uppercase tracking-wide">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-red-600 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-4 sm:p-5 pt-0 text-xs sm:text-sm font-sans leading-relaxed border-t border-dashed ${
                        isDark ? 'border-neutral-800 text-neutral-300' : 'border-stone-200 text-stone-600'
                      }`}>
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
