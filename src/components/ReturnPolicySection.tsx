import React from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface ReturnPolicySectionProps {
  theme?: 'light' | 'dark';
}

export const ReturnPolicySection: React.FC<ReturnPolicySectionProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';

  return (
    <section className={`w-full py-16 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
      isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-stone-200 text-stone-900'
    }`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <div className="text-[10px] font-mono tracking-[0.3em] text-red-600 font-bold uppercase flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>PANCHU GUIDELINES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans uppercase tracking-tight">
            RETURN & EXCHANGE POLICY
          </h2>
          <div className="w-12 h-0.5 bg-red-600 mx-auto" />
        </div>

        <div className={`p-6 sm:p-8 border rounded-none shadow-sm space-y-6 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-stone-50 border-stone-200'
        }`}>
          {/* Main Statement */}
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-mono font-bold leading-relaxed">
              We do not accept returned packages.
            </p>
          </div>

          <p className="text-xs sm:text-sm font-sans leading-relaxed text-stone-700 dark:text-neutral-300">
            If you contact us within <strong>24 hours</strong> of receiving your order, we may provide an exchange for another product requested by the customer, subject to availability.
          </p>

          {/* Eligibility Requirements */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>THE PRODUCT BEING EXCHANGED MUST BE:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Completely new</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Unused</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Unworn</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Undamaged</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 sm:col-span-2 bg-white dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>In its original condition with tags intact</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-mono">
            <strong>Ineligibility Note:</strong> Products that have been used, worn, washed, damaged, or otherwise altered are not eligible for exchange.
          </div>
        </div>

      </div>
    </section>
  );
};
