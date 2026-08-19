import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import { PanchuLogo } from './PanchuLogo';
import { AuthCloudBackground } from './AuthCloudBackground';
import {
  registerCustomer,
  loginCustomer,
  getActiveCustomer,
  updateCustomerProfile,
  logoutCustomer,
  ActiveCustomerSession
} from '../services/customerStorage';

interface CustomerAccountPageProps {
  onBackToStore: () => void;
  currentUser?: any;
  onCustomerSessionChange?: (session: ActiveCustomerSession | null) => void;
  theme?: 'light' | 'dark';
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  onBackToStore,
  onCustomerSessionChange
}) => {
  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Active Session State
  const [activeSession, setActiveSession] = useState<ActiveCustomerSession | null>(() => getActiveCustomer());

  // Sign In / Sign Up Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit Mode for Logged-In User
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state with active session
  useEffect(() => {
    const session = getActiveCustomer();
    setActiveSession(session);
    if (session) {
      setEditPhone(session.phone || '');
      setEditLocation(session.location || '');
      setEditAddress(session.address || '');
    }
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setPhone('');
    setLocation('');
    setAddress('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter your username and password.');
      return;
    }

    setLoading(true);
    const result = loginCustomer(username, password);
    setLoading(false);

    if (result.success && result.customer) {
      setActiveSession(result.customer);
      setEditPhone(result.customer.phone || '');
      setEditLocation(result.customer.location || '');
      setEditAddress(result.customer.address || '');
      if (onCustomerSessionChange) onCustomerSessionChange(result.customer);
      resetForm();
    } else {
      setErrorMsg(result.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter a username and password.');
      return;
    }

    setLoading(true);
    const result = registerCustomer({
      username,
      password,
      phone,
      location,
      address
    });
    setLoading(false);

    if (result.success && result.customer) {
      setActiveSession(result.customer);
      setEditPhone(result.customer.phone || '');
      setEditLocation(result.customer.location || '');
      setEditAddress(result.customer.address || '');
      if (onCustomerSessionChange) onCustomerSessionChange(result.customer);
      resetForm();
    } else {
      setErrorMsg(result.error || 'Failed to create account.');
    }
  };

  const handleUpdateDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    setLoading(true);
    const result = updateCustomerProfile(activeSession.username, {
      phone: editPhone,
      location: editLocation,
      address: editAddress
    });
    setLoading(false);

    if (result.success && result.customer) {
      setActiveSession(result.customer);
      if (onCustomerSessionChange) onCustomerSessionChange(result.customer);
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
    }
  };

  const handleSignOut = () => {
    logoutCustomer();
    setActiveSession(null);
    if (onCustomerSessionChange) onCustomerSessionChange(null);
    resetForm();
  };

  return (
    <AuthCloudBackground>
      {/* Top Left Brand Logo */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onBackToStore}
          className="hover:opacity-85 transition-opacity cursor-pointer flex items-center"
          aria-label="Panchu Home"
        >
          <PanchuLogo size="sm" />
        </button>
      </div>

      {/* Top Right Back to Store Button */}
      <button
        onClick={onBackToStore}
        className="fixed top-6 right-6 z-50 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-black border border-white shadow-sm text-xs font-sans font-medium flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Store</span>
      </button>

      {/* ----------------- CENTERED LOGIN CARD (MATCHING REFERENCE DESIGN) ----------------- */}
      <div className="relative z-10 w-full max-w-[400px] rounded-[32px] p-7 sm:p-9 bg-white/85 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(220,38,38,0.08),0_10px_30px_rgba(0,0,0,0.04)] transition-all">
        
        {/* ----------------- LOGGED IN CUSTOMER VIEW (SAVED LOCATION & NUMBERS) ----------------- */}
        {activeSession ? (
          <div className="space-y-4">
            {/* Top Red Initials Badge */}
            <div className="flex justify-center mb-1">
              <div className="w-14 h-14 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center text-red-600">
                <span className="text-xl font-bold font-sans">
                  {activeSession.username ? activeSession.username[0].toUpperCase() : 'P'}
                </span>
              </div>
            </div>

            {/* Profile Identity */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold font-sans text-stone-900 tracking-tight">
                {activeSession.username}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Panchu Member</span>
              </div>
            </div>

            {/* Saved Location & Phone Management */}
            <form onSubmit={handleUpdateDetails} className="space-y-2.5 pt-2">
              <div className="text-left">
                <label className="text-[11px] font-medium text-stone-500 font-sans px-1">
                  Saved Phone Number (For WhatsApp Orders)
                </label>
                <div className="mt-1 relative flex items-center bg-[#f1f3f5] rounded-xl px-3.5 py-2.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. 9801234567"
                    className="w-full bg-transparent text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="text-[11px] font-medium text-stone-500 font-sans px-1">
                  Saved Delivery City / Area
                </label>
                <div className="mt-1 relative flex items-center bg-[#f1f3f5] rounded-xl px-3.5 py-2.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. Kathmandu / Lalitpur / Pokhara"
                    className="w-full bg-transparent text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="text-[11px] font-medium text-stone-500 font-sans px-1">
                  Saved Street Address / Landmark
                </label>
                <div className="mt-1 relative flex items-center bg-[#f1f3f5] rounded-xl px-3.5 py-2.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="e.g. New Road, near Gate"
                    className="w-full bg-transparent text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Save Details Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  isSavedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-black text-white'
                }`}
              >
                {isSavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved for Later Checkout!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Location & Phone</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-stone-400 font-sans text-center">
              Your location and phone number are automatically pre-filled when you place orders.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onBackToStore}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer active:scale-98"
              >
                Continue Shopping
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-600 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* ----------------- USERNAME & PASSWORD AUTHENTICATION ----------------- */
          <div className="space-y-4">
            {/* Top Emblem: `→]` (Exact Recreation of Reference) */}
            <div className="flex justify-center mb-1">
              <div className="w-14 h-14 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center text-stone-900">
                <svg
                  className="w-5 h-5 translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 16 14 12 10 8" />
                  <line x1="14" y1="12" x2="4" y2="12" />
                </svg>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5 mb-2">
              <h2 className="text-xl font-bold font-sans text-stone-900 tracking-tight">
                {mode === 'signin' ? 'Sign in to Panchu' : 'Create your account'}
              </h2>
              <p className="text-xs text-stone-500 font-sans leading-relaxed px-2">
                {mode === 'signin'
                  ? 'Sign in with your username and password'
                  : 'Enter a username & password to save your location and number'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-sans text-center rounded-xl flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-sans text-center rounded-xl flex items-center justify-center gap-1.5 animate-fadeIn">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ----------------- SIGN IN / SIGN UP FORMS ----------------- */}
            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-2.5 pt-1">
              
              {/* Username Input */}
              <div className="relative flex items-center bg-[#f1f3f5] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                <UserIcon className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="w-full bg-transparent text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center bg-[#f1f3f5] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-transparent text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none pr-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Optional Phone & Location inputs during Sign Up */}
              {mode === 'signup' && (
                <>
                  {/* Phone Number */}
                  <div className="relative flex items-center bg-[#f1f3f5] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                    <Phone className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number (Optional)"
                      className="w-full bg-transparent text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                    />
                  </div>

                  {/* City / Area Location */}
                  <div className="relative flex items-center bg-[#f1f3f5] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location / City (e.g. Kathmandu)"
                      className="w-full bg-transparent text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                    />
                  </div>

                  {/* Street Address */}
                  <div className="relative flex items-center bg-[#f1f3f5] rounded-xl px-4 py-3.5 border border-transparent focus-within:border-red-400 focus-within:bg-white transition-all">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street Address / Landmark"
                      className="w-full bg-transparent text-sm font-sans text-stone-800 placeholder-stone-400 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#18181b] hover:bg-black text-white text-sm font-medium transition-all rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{mode === 'signin' ? 'Get Started' : 'Create Account'}</span>
              </button>
            </form>

            {/* Bottom Mode Switcher */}
            <div className="text-center text-xs text-stone-500 font-sans pt-2">
              {mode === 'signin' ? (
                <p>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="font-semibold text-stone-900 hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="font-semibold text-stone-900 hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthCloudBackground>
  );
};
