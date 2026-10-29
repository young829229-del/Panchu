import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Save,
  Check,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ContactSettings, SocialLinksSettings, SocialActiveSettings, SocialsAndContactSettings } from '../../types';
import {
  subscribeSocialsAndContactSettings,
  updateSocialsAndContactSettings,
  saveContactDetailsToFirestore,
  saveSocialLinkToFirestore,
  saveSocialActiveToFirestore,
  setWhatsAppOrderRedirectToFirestore,
  getCanonicalSocialsAndContactSync,
  cleanWhatsAppDigits
} from '../../services/firebaseService';

// Exact SVGs matching storefront design
const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001a2.895 2.895 0 0 1 3.182-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.44 6.391 6.391 0 0 0 1.079 8.28 6.331 6.331 0 0 0 8.825-.632A6.388 6.388 0 0 0 15.8 15V8.12a8.217 8.217 0 0 0 4.789 1.523v-3.47a4.79 4.79 0 0 1-1.000-.487z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YouTubeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface SocialPlatformDef {
  key: keyof SocialLinksSettings;
  name: string;
  placeholder: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  {
    key: 'instagram',
    name: 'Instagram',
    placeholder: 'https://instagram.com/panchu_official3',
    description: 'Direct link to official Instagram profile or drop announcements.',
    icon: InstagramIcon,
    iconColor: 'text-[#e1306c]'
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    placeholder: 'https://www.tiktok.com/@panchu.vs',
    description: 'Official TikTok showcase channel and styling videos.',
    icon: TikTokIcon,
    iconColor: 'text-stone-900'
  },
  {
    key: 'facebook',
    name: 'Facebook',
    placeholder: 'https://facebook.com/panchu.official',
    description: 'Facebook community page for customer support and collections.',
    icon: FacebookIcon,
    iconColor: 'text-[#1877f2]'
  },
  {
    key: 'youtube',
    name: 'YouTube',
    placeholder: 'https://youtube.com/@panchu',
    description: 'YouTube channel for campaign films, drop previews, and BTS.',
    icon: YouTubeIcon,
    iconColor: 'text-[#ff0000]'
  }
];

export const SocialsAndContactView: React.FC = () => {
  const [settings, setSettings] = useState<SocialsAndContactSettings>(() => getCanonicalSocialsAndContactSync());
  
  // Local form state for Contact Details
  const [contactForm, setContactForm] = useState<ContactSettings>(() => settings.contact);
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local form state for Social Links
  const [socialsForm, setSocialsForm] = useState<SocialLinksSettings>(() => settings.socials);
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [socialStatus, setSocialStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // WhatsApp Order Redirect Toggle State
  const [isTogglingRedirect, setIsTogglingRedirect] = useState<boolean>(false);
  const [redirectStatus, setRedirectStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with Firestore Realtime listener
  useEffect(() => {
    const unsubscribe = subscribeSocialsAndContactSettings((live) => {
      setSettings(live);
      setContactForm(live.contact);
      setSocialsForm(live.socials);
    });
    return () => unsubscribe();
  }, []);

  // Normalize URL helper
  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // ----------------------------------------------------
  // Handler 1: Toggle WhatsApp Order Redirect
  // ----------------------------------------------------
  const handleToggleRedirect = async () => {
    const nextState = !settings.whatsappOrderRedirect;
    setIsTogglingRedirect(true);
    setRedirectStatus(null);

    try {
      await setWhatsAppOrderRedirectToFirestore(nextState);
      setSettings(prev => ({ ...prev, whatsappOrderRedirect: nextState }));
      setRedirectStatus({
        type: 'success',
        text: nextState
          ? 'WhatsApp Order Redirect is now ON.'
          : 'WhatsApp Order Redirect is now OFF.'
      });
      setTimeout(() => setRedirectStatus(null), 4000);
    } catch (err: any) {
      setRedirectStatus({
        type: 'error',
        text: err?.message || 'Failed to update WhatsApp redirect setting.'
      });
    } finally {
      setIsTogglingRedirect(false);
    }
  };

  // ----------------------------------------------------
  // Handler 2: Save Contact Information
  // ----------------------------------------------------
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    setContactStatus(null);

    if (!contactForm.phone.trim() || !contactForm.whatsappNumber.trim() || !contactForm.email.trim()) {
      setContactStatus({ type: 'error', text: 'Please fill in all required contact fields.' });
      setIsSavingContact(false);
      return;
    }

    try {
      await saveContactDetailsToFirestore({
        phone: contactForm.phone.trim(),
        whatsappNumber: contactForm.whatsappNumber.trim(),
        email: contactForm.email.trim().toLowerCase(),
        address: contactForm.address.trim()
      });

      setContactStatus({
        type: 'success',
        text: 'Contact details saved and updated live across the website!'
      });
      setTimeout(() => setContactStatus(null), 4000);
    } catch (err: any) {
      setContactStatus({
        type: 'error',
        text: err?.message || 'Failed to save contact details.'
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  // ----------------------------------------------------
  // Handler 3: Toggle Social Active Status ON/OFF
  // ----------------------------------------------------
  const handleToggleSocialActive = async (platform: keyof SocialActiveSettings) => {
    const currentState = settings.socialsActive?.[platform] !== false;
    const nextState = !currentState;
    setSavingPlatform(`active_${platform}`);
    setSocialStatus(null);

    try {
      await saveSocialActiveToFirestore(platform, nextState);
      setSettings(prev => ({
        ...prev,
        socialsActive: {
          ...prev.socialsActive,
          [platform]: nextState
        }
      }));
      setSocialStatus({
        type: 'success',
        text: `${platform.toUpperCase()} logo is now ${nextState ? 'ACTIVE (shown on website)' : 'DISABLED (hidden from website)'}.`
      });
      setTimeout(() => setSocialStatus(null), 4000);
    } catch (err: any) {
      setSocialStatus({
        type: 'error',
        text: err?.message || `Failed to update ${platform} active status.`
      });
    } finally {
      setSavingPlatform(null);
    }
  };

  // ----------------------------------------------------
  // Handler 4: Save a Single Social Link
  // ----------------------------------------------------
  const handleSaveSingleSocial = async (platform: keyof SocialLinksSettings) => {
    setSavingPlatform(platform);
    setSocialStatus(null);

    const rawUrl = socialsForm[platform] || '';
    const cleanUrl = normalizeUrl(rawUrl);

    try {
      await saveSocialLinkToFirestore(platform, cleanUrl);
      setSocialsForm(prev => ({ ...prev, [platform]: cleanUrl }));
      setSocialStatus({
        type: 'success',
        text: `${platform.toUpperCase()} link updated successfully!`
      });
      setTimeout(() => setSocialStatus(null), 4000);
    } catch (err: any) {
      setSocialStatus({
        type: 'error',
        text: err?.message || `Failed to update ${platform} link.`
      });
    } finally {
      setSavingPlatform(null);
    }
  };

  // ----------------------------------------------------
  // Handler 5: Save All Social Links
  // ----------------------------------------------------
  const handleSaveAllSocials = async () => {
    setSavingPlatform('all');
    setSocialStatus(null);

    const normalizedSocials: SocialLinksSettings = {
      instagram: normalizeUrl(socialsForm.instagram || ''),
      facebook: normalizeUrl(socialsForm.facebook || ''),
      tiktok: normalizeUrl(socialsForm.tiktok || ''),
      youtube: normalizeUrl(socialsForm.youtube || '')
    };

    try {
      await updateSocialsAndContactSettings({ socials: normalizedSocials });
      setSocialsForm(normalizedSocials);
      setSocialStatus({
        type: 'success',
        text: 'All social media links updated and published live!'
      });
      setTimeout(() => setSocialStatus(null), 4000);
    } catch (err: any) {
      setSocialStatus({
        type: 'error',
        text: err?.message || 'Failed to save social links.'
      });
    } finally {
      setSavingPlatform(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pt-2 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 flex items-center gap-2.5">
          <span>Socials &amp; Contact Settings</span>
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Manage your customer support contacts, social media channels, and checkout WhatsApp order redirection.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WHATSAPP ORDER REDIRECT ON/OFF TOGGLE                          */}
      {/* ========================================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">
                WHATSAPP ORDER REDIRECT
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                  settings.whatsappOrderRedirect
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-stone-100 text-stone-600 border-stone-300'
                }`}
              >
                {settings.whatsappOrderRedirect ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans max-w-xl">
              Controls whether customers are redirected to WhatsApp after confirming their order in checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleRedirect}
            disabled={isTogglingRedirect}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer shrink-0 shadow-2xs ${
              settings.whatsappOrderRedirect
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-800 hover:bg-stone-900 text-white'
            }`}
          >
            {isTogglingRedirect ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : settings.whatsappOrderRedirect ? (
              <ToggleRight className="w-5 h-5 text-emerald-200" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-stone-400" />
            )}
            <span>
              {isTogglingRedirect
                ? 'Updating...'
                : settings.whatsappOrderRedirect
                  ? 'Switch to OFF'
                  : 'Switch to ON'}
            </span>
          </button>
        </div>

        {redirectStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-sans flex items-start gap-2 ${
              redirectStatus.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {redirectStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{redirectStatus.text}</span>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: EDIT STORE CONTACT DETAILS                                    */}
      {/* ========================================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-5">
        <div className="pb-3 border-b border-stone-100">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">
            STORE CONTACT INFORMATION
          </h2>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            These contact points appear across customer receipts, Terms &amp; Policies, and direct WhatsApp messaging.
          </p>
        </div>

        <form onSubmit={handleSaveContact} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-stone-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>Contact Phone Number</span>
              </label>
              <input
                type="text"
                required
                placeholder="+977 9706374074"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-sans focus:border-stone-900 focus:outline-none bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-stone-700 mb-1 flex items-center gap-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Store WhatsApp Number</span>
              </label>
              <input
                type="text"
                required
                placeholder="+977 9706374074"
                value={contactForm.whatsappNumber}
                onChange={(e) => setContactForm({ ...contactForm, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-sans focus:border-stone-900 focus:outline-none bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-stone-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>Contact Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="panchuknows999@gmail.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-sans focus:border-stone-900 focus:outline-none bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-stone-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span>Business Address / Location</span>
              </label>
              <input
                type="text"
                placeholder="Kathmandu, Nepal"
                value={contactForm.address}
                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-sans focus:border-stone-900 focus:outline-none bg-stone-50/50"
              />
            </div>
          </div>

          {contactStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-sans flex items-start gap-2 ${
                contactStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {contactStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              )}
              <span>{contactStatus.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSavingContact}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold font-sans flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              {isSavingContact ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Contact Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: MANAGE SOCIAL MEDIA LINKS & ON/OFF TOGGLES                      */}
      {/* ========================================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">
              SOCIAL MEDIA LINKS &amp; DISPLAY TOGGLES
            </h2>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Toggle each platform ON to display its logo on the website, or OFF to hide it completely.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAllSocials}
            disabled={savingPlatform === 'all'}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold font-sans flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
          >
            {savingPlatform === 'all' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving All...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Links</span>
              </>
            )}
          </button>
        </div>

        {socialStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-sans flex items-start gap-2 ${
              socialStatus.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {socialStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{socialStatus.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const IconComponent = platform.icon;
            const currentUrl = socialsForm[platform.key] || '';
            const isPlatformActive = settings.socialsActive?.[platform.key] !== false;
            const isSavingThis = savingPlatform === platform.key || savingPlatform === `active_${platform.key}`;

            return (
              <div
                key={platform.key}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPlatformActive
                    ? 'border-stone-200/80 bg-stone-50/40'
                    : 'border-stone-200/40 bg-stone-100/60 opacity-75'
                }`}
              >
                {/* Platform Badge & Logo */}
                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                  <div className={`p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs ${platform.iconColor}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-sans text-stone-900">{platform.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isPlatformActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {isPlatformActive ? 'SHOWN ON SITE' : 'HIDDEN'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input, Active Toggle & Action Buttons */}
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    placeholder={platform.placeholder}
                    value={currentUrl}
                    onChange={(e) =>
                      setSocialsForm({ ...socialsForm, [platform.key]: e.target.value })
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-sans focus:border-stone-900 focus:outline-none bg-white"
                  />

                  <div className="flex items-center gap-2">
                    {/* ON/OFF Active Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSocialActive(platform.key)}
                      disabled={isSavingThis}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold font-sans flex items-center gap-1 transition-all cursor-pointer ${
                        isPlatformActive
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-stone-300 text-stone-800 hover:bg-stone-400'
                      }`}
                      title={`Toggle ${platform.name} ON/OFF`}
                    >
                      {isSavingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isPlatformActive ? (
                        <ToggleRight className="w-4 h-4 text-white" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-stone-700" />
                      )}
                      <span>{isPlatformActive ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Individual Save Link Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveSingleSocial(platform.key)}
                      disabled={isSavingThis}
                      className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium font-sans flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={`Save ${platform.name} Link`}
                    >
                      {isSavingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3 text-stone-600" />
                      )}
                      <span>Save</span>
                    </button>

                    {/* Test Link Button */}
                    {currentUrl ? (
                      <a
                        href={normalizeUrl(currentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-white text-stone-700 text-xs font-medium font-sans flex items-center justify-center gap-1 transition-colors"
                        title="Test link in new tab"
                      >
                        <ExternalLink className="w-3 h-3 text-stone-500" />
                        <span>Test</span>
                      </a>
                    ) : (
                      <span className="px-3 py-2 text-stone-300 text-xs font-medium">No Link</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
