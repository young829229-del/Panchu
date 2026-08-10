import React, { useState } from 'react';
import { Mail, Check, ArrowRight } from 'lucide-react';

interface GetDiscountSectionProps {
  theme?: 'light' | 'dark';
}

export const GetDiscountSection: React.FC<GetDiscountSectionProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSubscribed(true);
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
            <Check className="w-4 h-4" />
            <span>Success! Use code <strong>PANCHU5</strong> at checkout for 5% off.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
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
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-montserrat font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                id="btn-get-discount"
              >
                <span>GET 5% OFF</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
