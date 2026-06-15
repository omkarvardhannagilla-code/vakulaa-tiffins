'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { VakulaaLogo } from '@/components/shared/Logo';
import { useAuthStore } from '@/lib/store';
import { validatePhone, normalizePhone, validateEmail } from '@/lib/utils';

type Step = 'details' | 'otp' | 'location';

export default function AuthPage() {
  const router = useRouter();
  const { session, setSession } = useAuthStore();

  // If already logged in, redirect
  useEffect(() => {
    if (session) router.replace('/menu');
  }, [session, router]);

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null); // for development mode
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ── Step 1: Send OTP ─────────────────────────────────────────────
  async function handleSendOTP() {
    if (!name.trim()) { toast.error('Please enter your full name'); return; }
    const cleaned = normalizePhone(phone);
    if (!validatePhone(cleaned)) { toast.error('Enter a valid 10-digit Indian mobile number'); return; }
    if (!validateEmail(email)) { toast.error('Enter a valid email address'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: cleaned, email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      toast.success(data.message || 'OTP sent successfully!');
      if (data.devOtp) setDevOtp(data.devOtp); // dev mode convenience
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 2: Verify OTP ───────────────────────────────────────────
  async function handleVerifyOTP() {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter the 6-digit OTP'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      setSession(data.session);
      toast.success(`Welcome, ${data.session.user.name}! 🎉`);
      setStep('location');
    } catch (err: any) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  }

  // OTP input handling
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      // Auto-verify when all filled
      setTimeout(handleVerifyOTP, 100);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerifyOTP();
  }

  // ── Step 3: Location ─────────────────────────────────────────────
  // Both options open the map-based address picker on the menu page.
  function handleLocationDetect() {
    router.push('/menu?setAddress=1&detect=1');
  }

  function handleManualAddress() {
    router.push('/menu?setAddress=1');
  }

  // ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-mist rounded-full opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-mist rounded-full opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-forest/3" />
      </div>

      {/* Hero banner */}
      <div
        className="relative bg-brand-forest text-white py-10 px-6 text-center overflow-hidden kolam-pattern"
        style={{ minHeight: 220 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-brand-forest/90 to-brand-forest" />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="flex justify-center mb-4"
          >
            <VakulaaLogo size={60} textColor="white" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-brand-gold font-sans text-sm tracking-widest uppercase mt-2"
          >
            Authentic South Indian Tiffins · Hyderabad
          </motion.p>
        </div>

        {/* Steam particles on logo */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="relative h-8">
            <div className="steam-particle" />
            <div className="steam-particle" />
            <div className="steam-particle" />
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <motion.div
          layout
          className="w-full max-w-md bg-white rounded-2xl shadow-card p-8"
        >
          <AnimatePresence mode="wait">
            {/* ── Step 1: Name + Phone ─────────────────────────────── */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-display text-brand-forest mb-1">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Sign in to order fresh tiffins 🌿
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      className="vakulaa-input"
                      placeholder="e.g. Ravi Kumar"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="flex">
                      <span className="flex items-center px-3 bg-brand-mist border border-r-0 border-gray-300 rounded-l-xl text-sm font-medium text-brand-forest">
                        🇮🇳 +91
                      </span>
                      <input
                        className="vakulaa-input rounded-l-none border-l-0"
                        style={{ borderRadius: '0 12px 12px 0' }}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        inputMode="numeric"
                        maxLength={10}
                        onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">For delivery updates &amp; the driver to reach you</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      className="vakulaa-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      inputMode="email"
                      onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    />
                    <p className="text-xs text-gray-400 mt-1">We'll send your OTP code here</p>
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="w-full mt-6 bg-brand-forest text-white rounded-xl py-3.5 font-semibold text-sm tracking-wide hover:bg-brand-leaf transition-colors flex items-center justify-center gap-2 disabled:opacity-60 btn-plate"
                >
                  {isLoading ? <div className="spinner" /> : null}
                  {isLoading ? 'Sending OTP...' : 'Get OTP →'}
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                  We'll email you a one-time password to verify your account
                </p>
              </motion.div>
            )}

            {/* ── Step 2: OTP ──────────────────────────────────────── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep('details')}
                  className="text-brand-leaf text-sm font-medium mb-4 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  ← Back
                </button>

                <h2 className="text-2xl font-display text-brand-forest mb-1">
                  Enter OTP
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Sent to {email}
                </p>

                {devOtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm">
                    <span className="text-amber-700 font-medium">🔧 Dev mode OTP: </span>
                    <span className="font-bold text-amber-900 tracking-widest">{devOtp}</span>
                  </div>
                )}

                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      className={`otp-input ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      inputMode="numeric"
                      maxLength={1}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.join('').length < 6}
                  className="w-full bg-brand-forest text-white rounded-xl py-3.5 font-semibold text-sm tracking-wide hover:bg-brand-leaf transition-colors flex items-center justify-center gap-2 disabled:opacity-50 btn-plate"
                >
                  {isLoading ? <div className="spinner" /> : null}
                  {isLoading ? 'Verifying...' : 'Verify & Continue →'}
                </button>

                <div className="text-center mt-4">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend in <span className="font-semibold text-brand-forest">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOTP}
                      className="text-sm text-brand-leaf font-semibold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Location ──────────────────────────────────── */}
            {step === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="text-center"
              >
                <div className="text-5xl mb-4">📍</div>
                <h2 className="text-2xl font-display text-brand-forest mb-2">
                  Share your location
                </h2>
                <p className="text-sm text-gray-500 mb-8">
                  We need your delivery address to estimate delivery time and drop off your tiffin
                </p>

                <button
                  onClick={handleLocationDetect}
                  className="w-full bg-brand-forest text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-brand-leaf transition-colors mb-3 btn-plate"
                >
                  📍 Detect My Location
                </button>
                <button
                  onClick={handleManualAddress}
                  className="w-full border-2 border-brand-forest text-brand-forest rounded-xl py-3.5 font-semibold text-sm hover:bg-brand-mist transition-colors"
                >
                  ✍️ Enter Address Manually
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-400 relative z-10">
        RS.5 for parcel · No Sambar · We Undertake Catering
      </div>
    </div>
  );
}
