import React, { useEffect } from 'react';
import { ArrowLeft, Phone, Mail } from 'lucide-react';
import { PanchuLogo } from './PanchuLogo';
import { FooterSection } from './FooterSection';
import { GetDiscountSection } from './GetDiscountSection';

interface TermsPageProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack, theme = 'dark' }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
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
          <section className="space-y-3">
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
                <p>Home Door Delivery — NPR 100</p>
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

          {/* CONTACT */}
          <section className="space-y-3 pt-2">
            <h2 className="text-sm sm:text-base font-montserrat font-black text-white uppercase tracking-widest text-left border-b border-neutral-800/60 pb-2">
              CONTACT
            </h2>
            <div className="space-y-3 pt-1">
              <p>
                For questions regarding orders, products, delivery, returns, refunds, or these Terms &amp; Conditions, contact Panchu:
              </p>
              <div className="space-y-1.5 pt-2 text-white font-montserrat font-bold">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>Phone: 970-6374074</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>Email: panchuknows999@gmail.com</span>
                </p>
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
      <FooterSection theme="dark" onOpenTerms={() => window.scrollTo(0, 0)} />
    </div>
  );
};

