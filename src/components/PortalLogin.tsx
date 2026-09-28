import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import type { Page } from '../App';

export default function PortalLogin({ onNavigate, setAdminRole }: { onNavigate: (page: Page) => void, setAdminRole?: (role: 'MASTER' | 'PARTNER') => void }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      const savedMasterPin = localStorage.getItem('gamepay_admin_pin') || '911164@';
      const savedSubPin = localStorage.getItem('gamepay_subadmin_pin') || '@112255';
      if (pin === savedMasterPin || pin === '911164@' || pin === '911164') {
        sessionStorage.setItem('gamepay_admin_authenticated', 'MASTER');
        if (setAdminRole) setAdminRole('MASTER');
        onNavigate('ADMIN');
      } else if (pin === savedSubPin || pin === '@112255' || pin === '654321') {
        sessionStorage.setItem('gamepay_admin_authenticated', 'PARTNER');
        if (setAdminRole) setAdminRole('PARTNER');
        onNavigate('ADMIN');
      } else {
        setError('رمز الدخول للإدارة غير صحيح');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] opacity-80 blur-[150px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] opacity-80 blur-[150px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)' }} />
      </div>

      <button 
        onClick={() => onNavigate('STORE')}
        className="absolute top-6 right-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-20"
      >
        <ArrowRight className="w-5 h-5" />
        العودة للرئيسية
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)] mb-4">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">بوابة الإدارة المركزية</h2>
          <p className="text-slate-400 text-sm">أدخل الرمز السري للوصول إلى لوحة التحكم (Master / Partner)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#ff6b00] mb-2">رمز الأمان (PIN / Passphrase)</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="أدخل الرمز السري..."
                className="w-full bg-[#080b11] border border-[#ff6b00]/20 text-white pl-12 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all text-left font-mono tracking-wide"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-lg text-center">
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading || !pin}
            className="w-full bg-gradient-to-r from-[#ff6b00] to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,107,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'دخول آمن'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
