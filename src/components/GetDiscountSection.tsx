import React, { useState } from 'react';
import { Mail, Check, ArrowRight, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../services/firebaseService';

interface GetDiscountSectionProps {
  theme?: 'light' | 'dark';
}

export const GetDiscountSection: React.FC<GetDiscountSectionProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isExistingSubscriber, setIsExistingSubscriber] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!clean) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(clean)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await subscribeToNewsletter(clean);
      if (!result.success) {
        setError(result.error || 'Failed to subscribe. Please try again.');
      } else {
        setDiscountCode(result.promoCode);
        setIsExistingSubscriber(result.isExisting);
        setIsSubscribed(true);
      }
    } catch (err: any) {
      console.error('Newsletter submit error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`w-full py-12 px-4 sm:px-6 md:px-12 border-t transition-colors duration-300 ${
      isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-stone-100 border-stone-200 text-stone-900'
    }`}>
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bebas uppercase tracking-wider">
          GET 5% OFF YOUR FIRST ORDER
        </h2>

        <p className={`text-xs font-inter ${isDark ? 'text-neutral-400' : 'text-stone-600'}`}>
          Subscribe to receive exclusive access to drop releases, secret sales, and 5% off code.
        </p>

        {isSubscribed ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-inter text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>
              {isExistingSubscriber
                ? <>You're already subscribed! Your 5% OFF welcome code is <strong className="font-mono text-sm tracking-widest">{discountCode}</strong>. Use it at checkout!</>
                : <>Success! Your unique 5% OFF code is <strong className="font-mono text-sm tracking-widest">{discountCode}</strong>. Use it at checkout!</>
              }
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                disabled={isSubmitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your email"
                className={`flex-grow px-4 py-3 text-xs font-inter border focus:outline-none transition-all ${
                  error 
                    ? 'border-red-500 bg-red-50/10' 
                    : isDark
                      ? 'bg-neutral-900 border-neutral-700 text-white focus:border-white'
                      : 'bg-white border-stone-300 text-black focus:border-black'
                }`}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-xs font-montserrat font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                id="btn-get-discount"
              >
                <span>{isSubmitting ? 'PROCESSING...' : 'GET 5% OFF'}</span>
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-[11px] font-inter text-red-600 text-left pl-1">{error}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
};
