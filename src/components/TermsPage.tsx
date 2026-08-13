import React, { useEffect } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { PanchuLogo } from './PanchuLogo';
import { FooterSection } from './FooterSection';
import { GetDiscountSection } from './GetDiscountSection';

interface TermsPageProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack, theme = 'dark' }) => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#contact' || hash.includes('contact')) {
      const timer = setTimeout(() => {
        const el = document.getElementById('contact-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (hash === '#privacy' || hash.includes('privacy')) {
      const timer = setTimeout(() => {
        const el = document.getElementById('privacy-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (hash === '#returns' || hash.includes('returns')) {
      const timer = setTimeout(() => {
        const el = document.getElementById('returns-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#111114] text-neutral-200 font-inter selection:bg-red-600 selection:text-white">
      
      {/* Fixed Sticky Header bar with Panchu logo & Return Button */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-[#111114]/95 backdrop-blur-md py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Return to Shop Button */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-montserrat font-bold tracking-widest uppercase py-2 px-3 sm:px-4 border border-neutral-700 text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-xs"
            id="terms-top-return-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO SHOP</span>
          </button>

          {/* Panchu Brand Logo - Prominent and centered/right aligned */}
          <div className="flex items-center">
            <PanchuLogo size="md" />
          </div>
        </div>
      </header>

      {/* Main Container - Minimal Vertical Layout matching reference screenshot */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        
        {/* Large Centered Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-montserrat uppercase tracking-wider text-center text-white mb-12 sm:mb-16">
          TERMS &amp; CONDITIONS
        </h1>

        {/* Vertical Flowing Policy Sections */}
        <div className="space-y-10 sm:space-y-12 text-xs sm:text-sm text-neutral-300 font-inter leading-relaxed uppercase tracking-wide">
          
          {/* RETURNS & REFUNDS */}
          <section id="returns-section" className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              RETURNS &amp; REFUNDS
            </h2>
            <div className="space-y-3 pt-1 text-neutral-300">
              <p>We accept return requests within 24 hours of receiving your item.</p>
              <p>
                To be eligible for a return or refund, the product must have been received damaged or faulty and must be returned unused and in the same condition in which it was received.
              </p>
              <p>
                Customers must contact Panchu within 24 hours of receiving the order if the item arrives damaged or faulty. Clear photos or videos may be required for verification.
              </p>
              <p>
                Customers are responsible for paying their own shipping costs for returning an eligible item.
              </p>
              <p>
                Shipping costs are non-refundable. If a refund is approved, the cost of return shipping will be deducted from the refund amount.
              </p>
              <p>
                Items that have been worn, washed, altered, used, or damaged after delivery may not be eligible for a return or refund.
              </p>
            </div>
          </section>

          {/* DELIVERY & SHIPPING */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              DELIVERY &amp; SHIPPING
            </h2>
            <div className="space-y-4 pt-1">
              <div>
                <span className="block font-bold text-white tracking-wider mb-1">INSIDE VALLEY</span>
                <p>Home Door Delivery — NPR 120</p>
              </div>
              <div>
                <span className="block font-bold text-white tracking-wider mb-1">OUTSIDE VALLEY</span>
                <p>Standard Office Delivery — NPR 150</p>
                <p>Home Door Delivery — NPR 180</p>
              </div>
              <p className="text-neutral-400 normal-case pt-1 text-xs">
                Delivery charges depend on the customer&apos;s location and selected delivery method.
              </p>
            </div>
          </section>

          {/* CUSTOMS & ADDITIONAL CHARGES */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              CUSTOMS &amp; ADDITIONAL CHARGES
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                If customs duties, import charges, taxes, or other additional charges apply to an order, those charges are the responsibility of the customer.
              </p>
              <p>
                Panchu is not responsible for customs duties or additional charges imposed by relevant authorities.
              </p>
            </div>
          </section>

          {/* OVERVIEW */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              OVERVIEW
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                This website is operated by Panchu. Throughout the website, the terms &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; refer to Panchu.
              </p>
              <p>
                Panchu provides this website, including the information, products, services, tools, and other materials available through the website, subject to these Terms &amp; Conditions.
              </p>
              <p>
                By visiting our website, browsing our products, placing an order, or using our services, you agree to be bound by these Terms &amp; Conditions.
              </p>
              <p>
                These Terms apply to all visitors and users of the website, including customers and anyone who accesses or uses our services.
              </p>
              <p>
                Please read these Terms &amp; Conditions carefully before accessing or using the website. If you do not agree with these terms, please do not use the website or our services.
              </p>
              <p>
                We reserve the right to update, modify, or replace these Terms &amp; Conditions at any time. Updated terms will be posted on this page, and continued use of the website after changes are posted constitutes acceptance of the updated terms.
              </p>
            </div>
          </section>

          {/* ONLINE STORE TERMS */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              ONLINE STORE TERMS
            </h2>
            <div className="space-y-3 pt-1">
              <p>By using this website or placing an order, you agree to provide accurate and complete information when required.</p>
              <p>You agree to use the website only for lawful purposes.</p>
              <p>You must not use the website for fraudulent, illegal, unauthorized, or harmful activities.</p>
              <p>You must not attempt to interfere with the website, its security, database, functionality, or services.</p>
              <p>You must not upload or transmit viruses, malicious software, harmful code, or other content that could damage or disrupt the website.</p>
            </div>
          </section>

          {/* GENERAL CONDITIONS */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              GENERAL CONDITIONS
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                We reserve the right to refuse service or cancel an order when reasonably necessary, including in cases involving suspected fraudulent activity, incorrect information, misuse of the website, or violation of these Terms &amp; Conditions.
              </p>
              <p>
                You may not copy, reproduce, distribute, modify, or commercially use Panchu&apos;s website content, product images, designs, branding, logos, graphics, or other materials without permission.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the website or its services when necessary.
              </p>
              <p>
                We are not responsible for temporary interruptions caused by maintenance, technical issues, network problems, or circumstances outside our reasonable control.
              </p>
            </div>
          </section>

          {/* PRODUCT INFORMATION */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              PRODUCT INFORMATION
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                We make reasonable efforts to ensure that product descriptions, images, prices, and other information displayed on the website are accurate.
              </p>
              <p>
                Slight differences in product color or appearance may occur depending on the customer&apos;s device, screen settings, lighting, or photography.
              </p>
              <p>
                We reserve the right to correct errors, update product information, change prices, or modify product availability when necessary.
              </p>
            </div>
          </section>

          {/* ORDERS & PAYMENTS */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              ORDERS &amp; PAYMENTS
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                By placing an order, you confirm that the information provided during checkout is accurate and complete.
              </p>
              <p>
                Panchu reserves the right to cancel or refuse an order in certain circumstances, including suspected fraudulent activity, incorrect pricing, unavailable products, or other issues affecting the order.
              </p>
              <p>
                Customers are responsible for providing accurate contact and delivery information.
              </p>
            </div>
          </section>

          {/* LIMITATION OF RESPONSIBILITY */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              LIMITATION OF RESPONSIBILITY
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                We make reasonable efforts to keep the website available and functioning properly.
              </p>
              <p>
                However, we cannot guarantee that the website will always be uninterrupted, completely error-free, or available at all times.
              </p>
              <p>
                We are not responsible for delays or issues caused by circumstances outside our reasonable control, including delivery delays, technical problems, network interruptions, or third-party services.
              </p>
            </div>
          </section>

          {/* CHANGES TO THESE TERMS */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              CHANGES TO THESE TERMS
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                Panchu reserves the right to update or change these Terms &amp; Conditions at any time.
              </p>
              <p>Any updated version will be posted on this page.</p>
              <p>Customers are encouraged to review this page periodically for changes.</p>
            </div>
          </section>

          {/* PRIVACY POLICY */}
          <section id="privacy-section" className="space-y-3 pt-2">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              PRIVACY POLICY
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                We value your privacy. Customer details provided during order placement (Name, Phone number, and Shipping Address) are strictly used for order fulfillment and delivery communication.
              </p>
            </div>
          </section>

          {/* CONTACT */}
          <section id="contact-section" className="space-y-3 pt-2">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              CONTACT
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                For questions regarding orders, products, delivery, returns, refunds, or these Terms &amp; Conditions, contact Panchu:
              </p>
              <div className="space-y-1.5 pt-2 text-white font-montserrat font-bold">
                <a 
                  href="https://wa.me/9779706374074"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer w-fit"
                >
                  <svg className="w-4 h-4 fill-emerald-500 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>WhatsApp: +977 9706374074</span>
                </a>
                <a 
                  href="mailto:panchuknows999@gmail.com"
                  className="flex items-center gap-2 hover:text-red-400 transition-colors cursor-pointer w-fit"
                >
                  <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>Email: panchuknows999@gmail.com</span>
                </a>
              </div>

              {/* Social Channels downside of terms/contact */}
              <div className="pt-3 flex items-center gap-4">
                <span className="text-xs font-montserrat font-bold text-neutral-400 uppercase tracking-widest">Connect with Us:</span>
                <a 
                  href="https://www.tiktok.com/@panchu.vs?_r=1&_t=ZS-98na7CYayiv" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="TikTok"
                  className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001a2.895 2.895 0 0 1 3.182-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.44 6.391 6.391 0 0 0 1.079 8.28 6.331 6.331 0 0 0 8.825-.632A6.388 6.388 0 0 0 15.8 15V8.12a8.217 8.217 0 0 0 4.789 1.523v-3.47a4.79 4.79 0 0 1-1.000-.487z" />
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/panchu_official3?igsh=NmVqMDJtYnl4cDIz" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Instagram"
                  className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a 
                  href="https://wa.me/9779706374074" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="WhatsApp"
                  className="text-emerald-500 hover:text-emerald-400 transition-colors p-1"
                >
                  <svg className="w-4 h-4 fill-emerald-500 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom Return Button */}
        <div className="text-center pt-14">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 bg-white text-black hover:bg-neutral-200 text-xs font-montserrat font-extrabold tracking-widest uppercase transition-all cursor-pointer shadow-lg"
            id="terms-bottom-return-btn"
          >
            RETURN TO SHOPPING
          </button>
        </div>

      </main>

      {/* Footer / Subscription */}
      <GetDiscountSection theme="dark" />
      <FooterSection 
        theme="dark" 
        onOpenTerms={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        onOpenContact={() => {
          document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onOpenPrivacy={() => {
          document.getElementById('privacy-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />
    </div>
  );
};

