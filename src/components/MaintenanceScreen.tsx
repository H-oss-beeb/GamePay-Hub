import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Send, ShieldCheck, RefreshCw } from 'lucide-react';
import type { Page } from '../App';

interface MaintenanceScreenProps {
  message?: string;
  telegramLink?: string;
  onAdminClick?: () => void;
}

export default function MaintenanceScreen({
  message = 'الموقع يخضع لعملية صيانة وتحديث دورية، سنعود للعمل قريباً!',
  telegramLink = 'https://t.me/gamepay_support',
  onAdminClick,
}: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Glows */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Admin Bypass Trigger (discreet for admins) */}
      {onAdminClick && (
        <button
          onClick={onAdminClick}
          className="absolute top-5 left-5 text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-amber-500/30"
          title="دخول الإدارة"
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>بوابة الإدارة</span>
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg bg-[#0d121f]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center relative z-10 space-y-6"
      >
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)]"
            >
              <span className="text-4xl sm:text-5xl select-none">🛠️</span>
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg border-2 border-[#0d121f]">
              <Wrench className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Brand & Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide font-mono">
            <span>GAMEPAY SYSTEM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            الموقع في وضع الصيانة المؤقتة
          </h1>
        </div>

        {/* Custom Message Container */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
          <p className="text-amber-200/90">
            {message || 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!'}
          </p>
        </div>

        {/* Action Buttons: Telegram Support & Refresh */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {telegramLink && (
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>تواصل مع الدعم الفني</span>
            </a>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700/80 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>إعادة المحاولة</span>
          </button>
        </div>

        {/* Status indicator footer */}
        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Status: Under Scheduled Maintenance</span>
        </div>
      </motion.div>
    </div>
  );
}
