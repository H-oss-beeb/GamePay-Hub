import React from 'react';
import { motion } from 'framer-motion';
import { X, Bell, CheckCircle2, ShieldCheck, Flame, Zap, Clock } from 'lucide-react';

interface NotificationsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsCenterModal({
  isOpen,
  onClose
}: NotificationsCenterModalProps) {
  if (!isOpen) return null;

  const NOTIFICATIONS = [
    {
      id: 'notif_1',
      title: 'تم تحديث منظومة الدفع الهجين (Hybrid Payment)',
      desc: 'يمكنك الآن حفظ بطاقات Qi Card وبطاقات Visa المشفرة والدفع بنقرة واحدة.',
      time: 'منذ ساعتين',
      type: 'system',
      icon: '💳'
    },
    {
      id: 'notif_2',
      title: 'عرض ترويجي: خصومات إضافية على شحن ببجي موبايل',
      desc: 'باقات UC ببجي متاحة بأسعار الجملة المباشرة مع تسليم فوري في ثوانٍ.',
      time: 'اليوم، 10:30 ص',
      type: 'promo',
      icon: '🔥'
    },
    {
      id: 'notif_3',
      title: 'حالة محفظتك الرقمية: VIP',
      desc: 'حسابك مصنف بفئة VIP مع سرعة استجابة فائقة وأولوية توريد الموردين.',
      time: 'أمس',
      type: 'account',
      icon: '⭐'
    }
  ];

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0c101d] border border-slate-800 rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden text-right max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">مركز الإشعارات</h3>
              <p className="text-[11px] text-slate-400">آخر المستجدات وتحديثات النظام</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#070a13] space-y-3">
          {NOTIFICATIONS.map(item => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-base">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
