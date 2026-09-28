import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Lock, Bell, Smartphone, Check, KeyRound } from 'lucide-react';
import { User } from 'firebase/auth';

interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  user: User | null;
}

export default function AccountSecurityModal({
  isOpen,
  onClose,
  onBack,
  user
}: AccountSecurityModalProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleModalClose = () => {
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleModalClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0c101d] border border-slate-800 rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden text-right"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">إعدادات الحساب والأمان</h3>
              <p className="text-[11px] text-slate-400">حماية البيانات وربط الجلسات</p>
            </div>
          </div>
          <button 
            onClick={handleModalClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 bg-[#070a13] space-y-4">
          
          {/* User Details */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
              {user?.displayName ? user.displayName[0] : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm truncate">{user?.displayName || 'حساب العميل'}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">VIP</span>
              </div>
              <span className="text-xs text-slate-400 font-mono block truncate">{user?.email || 'غير مسجل (زائر)'}</span>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">المصادقة الثنائية (2FA)</span>
                  <span className="text-[11px] text-slate-400">تأكيد عمليات الشراء الكبيرة عبر رسائل SMS / Auth</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
              />
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">إشعارات تسجيل الدخول والعمليات</span>
                  <span className="text-[11px] text-slate-400">تنبيه فوري عند الشراء أو تسجيل الدخول من جهاز جديد</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={loginAlerts}
                onChange={(e) => setLoginAlerts(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-white block">جلسات الدخول النشطة</span>
                  <span className="text-[11px] text-slate-400">الجلسة الحالية: متصفح الويب (العراق - بغداد)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                نشط الآن
              </span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">تم حفظ تفضيلات الأمان بنجاح</span>
              </>
            ) : (
              <span>حفظ التغييرات</span>
            )}
          </button>

        </div>
      </motion.div>
    </div>
  );
}
